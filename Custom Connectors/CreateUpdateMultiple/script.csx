using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class Script : ScriptBase
{
    public override async Task<HttpResponseMessage> ExecuteAsync()
    {
        // Read the request content
        var contentAsString = await this.Context.Request.Content.ReadAsStringAsync().ConfigureAwait(false);
        var contentAsJson = JObject.Parse(contentAsString);

        // Get the operation ID to determine which transformation to apply
        var operationId = this.Context.OperationId;

        // Initialize the response
        HttpResponseMessage response;

        switch (operationId)
        {
            case "FormatCreateMultipleRequest":
            case "FormatUpdateMultipleRequest":
            case "FormatUpsertMultipleRequest":
                response = TransformArrayToTargets(contentAsJson);
                break;
            default:
                // For other operations, forward the request as-is
                response = await this.Context.SendAsync(this.Context.Request, this.CancellationToken).ConfigureAwait(false);
                break;
        }

        return response;
    }

    private HttpResponseMessage TransformArrayToTargets(JObject content)
    {
        // Create the response object
        var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK);

        try
        {
            // Get the records array from the input
            JArray records;
            
            if (content.TryGetValue("records", out JToken recordsToken))
            {
                records = recordsToken as JArray ?? new JArray();
            }
            else if (content.TryGetValue("value", out JToken valueToken))
            {
                // Support for OData response format
                records = valueToken as JArray ?? new JArray();
            }
            else
            {
                // If no records array found, return error
                var errorResponse = new HttpResponseMessage(System.Net.HttpStatusCode.BadRequest);
                errorResponse.Content = CreateJsonContent(new JObject
                {
                    ["error"] = new JObject
                    {
                        ["code"] = "InvalidInput",
                        ["message"] = "Request body must contain a 'records' array property. Example: { \"records\": [{...}, {...}] }"
                    }
                }.ToString());
                return errorResponse;
            }

            // Create the Targets format
            var result = new JObject
            {
                ["Targets"] = records
            };

            response.Content = CreateJsonContent(result.ToString());
        }
        catch (Exception ex)
        {
            response = new HttpResponseMessage(System.Net.HttpStatusCode.BadRequest);
            response.Content = CreateJsonContent(new JObject
            {
                ["error"] = new JObject
                {
                    ["code"] = "TransformationError",
                    ["message"] = $"Failed to transform array: {ex.Message}"
                }
            }.ToString());
        }

        return response;
    }

    private StringContent CreateJsonContent(string content)
    {
        return new StringContent(content, System.Text.Encoding.UTF8, "application/json");
    }
}
