# Dataverse CreateMultiple & UpdateMultiple Custom Connector

This custom connector enables bulk operations on Dataverse tables using the `CreateMultiple`, `UpdateMultiple`, and `UpsertMultiple` messages. These operations are significantly more efficient than creating or updating records one at a time.

## Features

- **CreateMultiple**: Create multiple records in a single API call
- **UpdateMultiple**: Update multiple records in a single API call
- **UpsertMultiple**: Create or update multiple records in a single API call
- **Array Transformation Actions**: Convert arrays to the required Targets format
- **OAuth 2.0 Authentication**: Secure authentication using Azure AD
- **Works with any table**: Dynamic table name parameter supports all Dataverse tables

| [apiDefinition.swagger.json](apiDefinition.swagger.json) | OpenAPI definition with all operations |
| [apiProperties.json](apiProperties.json) | Connector properties with OAuth and script config |
| [script.csx](script.csx) | C# script for array transformation actions |
| [README.md](README.md) | This documentation file |

## Operations

| Operation | Description |
|-----------|-------------|
| **CreateMultiple** | Create multiple records in a Dataverse table |
| **UpdateMultiple** | Update multiple records in a Dataverse table |
| **UpsertMultiple** | Create or update multiple records |
| **FormatCreateMultipleRequest** | Transform an array into Targets format for CreateMultiple |
| **FormatUpdateMultipleRequest** | Transform an array into Targets format for UpdateMultiple |
| **FormatUpsertMultipleRequest** | Transform an array into Targets format for UpsertMultiple |

## Prerequisites

1. Access to a Power Platform environment with custom connector permissions
2. Access to a Dataverse environment
3. An Azure AD App Registration with Dynamics CRM permissions (see Setup Instructions)

## Setup Instructions

### 1. Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com) > **Azure Active Directory** > **App registrations**
2. Click **New registration**
3. Enter a name (e.g., "Dataverse Bulk Operations Connector")
4. Select **Accounts in any organizational directory** for multi-tenant support
5. Click **Register**
6. Copy the **Application (client) ID** - you'll need this later

### 2. Configure API Permissions

1. Go to **API permissions** > **Add a permission**
2. Select **Dynamics CRM**
3. Select **Delegated permissions** > `user_impersonation`
4. Click **Add permissions**
5. Click **Grant admin consent** (if you have admin rights)

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description and select expiry
4. Copy the secret value immediately (you won't be able to see it again)

### 4. Import the Connector

#### Option A: Using Power Platform CLI (paconn)

```bash
# Install the CLI if you haven't already
pip install paconn

# Login
paconn login

# Create the connector
paconn create --api-prop apiProperties.json --api-def apiDefinition.swagger.json
```

#### Option B: Using Power Automate Portal

1. Go to [Power Automate](https://make.powerautomate.com)
2. Navigate to **Data** > **Custom connectors**
3. Click **New custom connector** > **Import an OpenAPI file**
4. Upload the `apiDefinition.swagger.json` file
5. On the **General** tab, set the **Host** to any valid placeholder (e.g., `placeholder.crm.dynamics.com`) - this will be overridden dynamically
6. Add the code from `script.csx` in the **Code** section and enable the toggle
7. Create the connector

> **Note about Host configuration**: The host value in the connector definition is a placeholder. The actual host is set dynamically at runtime using the **Environment URL** connection parameter via a policy template. This allows the same connector to work with any Dataverse environment.

### 5. Configure Security Settings

On the **Security** tab, configure the following OAuth 2.0 settings:

| Setting | Value |
|---------|-------|
| **Authentication type** | OAuth 2.0 |
| **Identity Provider** | Generic OAuth 2 |
| **Client ID** | Your Azure AD Application (client) ID from Step 1 |
| **Client Secret** | Your client secret from Step 3 |
| **Authorization URL** | `https://login.microsoftonline.com/common/oauth2/authorize` |
| **Token URL** | `https://login.microsoftonline.com/common/oauth2/token` |
| **Refresh URL** | `https://login.microsoftonline.com/common/oauth2/token` |
| **Scope** | Leave empty |
| **Resource URL** | Leave empty |

> **Note**: The environment URL is passed as a dynamic parameter when creating a connection. The OAuth resource is automatically set based on the environment you specify.

After saving, copy the **Redirect URL** shown on the Security page and add it to your Azure AD App Registration:

1. Go back to your App Registration in Azure Portal
2. Navigate to **Authentication** > **Add a platform** > **Web**
3. Paste the Redirect URL from the connector
4. Click **Configure**

> **Important**: The Resource URL uses a dynamic parameter reference `@connectionParameters('environment')` which will be replaced with the actual environment URL when a connection is created. This is what enables the connector to work with any Dataverse environment.

### 6. Create a Connection

When creating a connection, you'll be prompted for:

| Parameter | Description |
|-----------|-------------|
| **Environment URL** | Your Dataverse environment URL (e.g., `orgb9a08c28.crm4.dynamics.com`) without `https://` |

The connector will:
1. Use this environment URL to request an OAuth token for that specific Dataverse instance
2. Route all API calls to the specified environment

After entering your environment URL, you'll be redirected to sign in with your Microsoft account. Users sign in with their own credentials and get access based on their Dataverse permissions.

> **Tip**: To connect to a different environment, create a new connection with the new environment URL.

## Usage Examples

### Format Array for CreateMultiple

Use this action to transform a plain array into the Targets format before calling CreateMultiple.

**Input** (your array):
```json
{
  "records": [
    { "name": "Contoso Ltd", "accountnumber": "ACC001" },
    { "name": "Fabrikam Inc", "accountnumber": "ACC002" }
  ]
}
```

**Output** (ready for CreateMultiple):
```json
{
  "Targets": [
    { "name": "Contoso Ltd", "accountnumber": "ACC001" },
    { "name": "Fabrikam Inc", "accountnumber": "ACC002" }
  ]
}
```

### Format Array for UpdateMultiple

Transform an array (including primary keys) into the Targets format for UpdateMultiple.

**Input**:
```json
{
  "records": [
    { "accountid": "00000000-0000-0000-0000-000000000001", "name": "Updated Name" },
    { "accountid": "00000000-0000-0000-0000-000000000002", "revenue": 5000000 }
  ]
}
```

**Output**:
```json
{
  "Targets": [
    { "accountid": "00000000-0000-0000-0000-000000000001", "name": "Updated Name" },
    { "accountid": "00000000-0000-0000-0000-000000000002", "revenue": 5000000 }
  ]
}
```

### CreateMultiple - Create accounts

**Table Name (Plural)**: `accounts`

**Body**:
```json
{
  "Targets": [
    {
      "name": "Contoso Ltd",
      "accountnumber": "ACC001",
      "revenue": 1000000
    },
    {
      "name": "Fabrikam Inc",
      "accountnumber": "ACC002",
      "revenue": 2000000
    }
  ]
}
```

### UpdateMultiple - Update contacts

**Table Name (Plural)**: `contacts`

**Body**:
```json
{
  "Targets": [
    {
      "contactid": "00000000-0000-0000-0000-000000000001",
      "jobtitle": "Senior Developer"
    },
    {
      "contactid": "00000000-0000-0000-0000-000000000002",
      "jobtitle": "Project Manager"
    }
  ]
}
```

### UpsertMultiple - Upsert custom entities

**Table Name (Plural)**: `cr123_customentities`

**Body**:
```json
{
  "Targets": [
    {
      "cr123_customentityid": "00000000-0000-0000-0000-000000000001",
      "cr123_name": "Updated Record"
    },
    {
      "cr123_name": "New Record (no ID = create)"
    }
  ]
}
```

## Important Notes

1. **Table Names**: Use the **plural** entity set name (e.g., `accounts`, `contacts`, `leads`). For custom tables, this is typically the logical name with an 's' (e.g., `cr123_mytables`).

2. **Primary Keys for Updates**: When using `UpdateMultiple`, each record must include the primary key column (e.g., `accountid` for accounts, `contactid` for contacts).

3. **Batch Size**: While there's no hard limit, Microsoft recommends keeping batch sizes reasonable (typically 100-1000 records) for optimal performance.

4. **Error Handling**: If any record fails, the entire operation may fail. Consider implementing retry logic in your flows.

5. **Permissions**: Ensure the user has appropriate CRUD permissions on the target tables.

## Advanced Headers

| Header | Description |
|--------|-------------|
| `Prefer: return=representation` | Returns the created/updated records in the response |
| `MSCRM.SuppressDuplicateDetection: true` | Bypasses duplicate detection rules |
| `MSCRM.BypassCustomPluginExecution: true` | Bypasses plugins (requires `prvBypassCustomPlugins` privilege) |

## Regional Endpoints

Update the organization URL based on your region:
- Americas: `yourorg.crm.dynamics.com`
- Europe: `yourorg.crm4.dynamics.com`
- Asia Pacific: `yourorg.crm5.dynamics.com`
- Australia: `yourorg.crm6.dynamics.com`
- Japan: `yourorg.crm7.dynamics.com`
- India: `yourorg.crm8.dynamics.com`
- Canada: `yourorg.crm3.dynamics.com`
- UK: `yourorg.crm11.dynamics.com`
- France: `yourorg.crm12.dynamics.com`

## Troubleshooting

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check OAuth configuration and ensure token is valid |
| 403 Forbidden | Verify user has permissions on the target table |
| 400 Bad Request | Check the request body format and column names |
| 404 Not Found | Verify the entity set name is correct (use plural form) |

### OAuth "Page can't be found" Error

If you see an error like `This login.microsoftonline.com page can't be found` with a malformed URL containing duplicate `/oauth2/authorize` paths, the connector has a corrupted OAuth configuration.

**Solution:**
1. Delete the existing connector completely
2. Create a new connector from scratch
3. On the Security tab, carefully verify these **exact values** (no trailing slashes):
   - Authorization URL: `https://login.microsoftonline.com/common/oauth2/authorize`
   - Token URL: `https://login.microsoftonline.com/common/oauth2/token`
   - Refresh URL: `https://login.microsoftonline.com/common/oauth2/token`
4. Save and update the connector
5. Try creating a connection again

## References

- [Microsoft Docs: CreateMultiple](https://docs.microsoft.com/en-us/power-apps/developer/data-platform/org-service/messages/createmultiple)
- [Microsoft Docs: UpdateMultiple](https://docs.microsoft.com/en-us/power-apps/developer/data-platform/org-service/messages/updatemultiple)
- [Microsoft Docs: Bulk Operation Messages](https://docs.microsoft.com/en-us/power-apps/developer/data-platform/bulk-operations)
