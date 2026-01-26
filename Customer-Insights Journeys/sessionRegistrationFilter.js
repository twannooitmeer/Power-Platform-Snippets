() => {
    const sessions = document.querySelectorAll(".eventSession");
    const originalMap = new Map();
    const setup = {
        convertTo24Hour: true, 
        preventDoubleBooking: true
    };

    if(!convertTo24Hour && !preventDoubleBooking) return;

    if(setup.convertTo24Hour){
        // Helper functions
        const toISO = d => { const [m, day, y] = d.split("/"); return `${y}-${m.padStart(2,"0")}-${day.padStart(2,"0")}`; };
        //function to convert 12 hour time to 24 hour time, if the format (12:00 AM) is not matched, returns the original string as default
        const to24 = t => {
            const m = t.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
            if (!m) return t;
            let [ , h, min, mer ] = m; h = +h; min = +min;
            if (mer.toUpperCase() === "PM" && h !== 12) h += 12;
            if (mer.toUpperCase() === "AM" && h === 12) h = 0;
            return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
        };
        
        // Datum/tijd omzetten en originele waarden opslaan
        document.querySelectorAll("div.eventSessionDescription p").forEach(p => {
            const spans = p.querySelectorAll("span.msdynmkt_personalization");
            if (spans.length === 3) {
                const [dateSpan, startSpan, endSpan] = spans;
                const parent = p.closest(".eventSession");
                //create key value pair in map with the parent session element as key and date and time as value
                originalMap.set(parent, { date: dateSpan.textContent.trim(), time: startSpan.textContent.trim() });
            
                const [m, d, y] = dateSpan.textContent.trim().split("/");
                const dateObj = new Date(y, m-1, d);
                const weekday = dateObj.toLocaleDateString('nl-NL',{weekday:'long'});
                const monthName = dateObj.toLocaleDateString('nl-NL',{month:'long'});
                dateSpan.textContent = `${weekday.charAt(0).toUpperCase()+weekday.slice(1)} ${d} ${monthName} ${y} van ${to24(startSpan.textContent)} tot ${to24(endSpan.textContent)}`;
            
                [startSpan,endSpan].forEach(span=>{
                    if(span.previousSibling?.nodeType===3 && span.previousSibling.textContent.trim()==='-') span.previousSibling.remove();
                    if(span.nextSibling?.nodeType===3 && span.nextSibling.textContent.trim()==='-') span.nextSibling.remove();
                    span.remove();
                });
            }
        });
    }
    if(setup.preventDoubleBooking){
        // Dubbele boeking voorkomen
        const enforceNoDoubleBooking = () => {
            const selected = new Map();
            sessions.forEach(s => {
                const cb = s.querySelector("input[type='checkbox']");
                const o = originalMap.get(s);
                if (cb?.checked && o) {
                    selected.set(`${toISO(o.date)} ${o.time}`, true);
                    selected.set(cb.getAttribute("title"), true);
                }
            });
    
            sessions.forEach(s => {
                const cb = s.querySelector("input[type='checkbox']");
                const o = originalMap.get(s);
                const title = s.querySelector("h3, .eventSessionTitle, strong");
                if (!cb || !o) return;
                const keyDate = `${toISO(o.date)} ${o.time}`;
                const keyTitle = cb.getAttribute("title");
        
            if (!cb.checked && (selected.has(keyDate) || selected.has(keyTitle))) {
                cb.disabled = true;
                Object.assign(s.style, { opacity:"0.6", pointerEvents:"none", background:"#F0F2F5" });
                if (title) title.style.setProperty("font-weight","normal","important");
            } else if (cb.disabled) {
                cb.disabled = false;
                Object.assign(s.style, { opacity:"1", pointerEvents:"auto", background:"" });
                if (title) title.style.setProperty("font-weight","bold","important");
            }
            });
        };
        sessions.forEach(s => s.querySelector("input[type='checkbox']")?.addEventListener("change", enforceNoDoubleBooking));
    }
}

const sessions = document.querySelectorAll(".eventSession");
  const enforceNoDoubleBooking = () => {
    const selected = new Map();
    sessions.forEach(s => {
      const cb = s.querySelector("input[type='checkbox']");
      const o = originalMap.get(s);
      if (cb?.checked && o) {
        selected.set(`${toISO(o.date)} ${o.time}`, true);
        selected.set(cb.getAttribute("title"), true);
      }
    });
 
    sessions.forEach(s => {
      const cb = s.querySelector("input[type='checkbox']");

      const title = s.querySelector("h3, .eventSessionTitle, strong");
      if (!cb ) return;

      const keyTitle = cb.getAttribute("title"); 
 
      if (!cb.checked && selected.has(keyTitle)){
        cb.disabled = true;
        Object.assign(s.style, { opacity:"0.6", pointerEvents:"none", background:"#F0F2F5" });
        if (title) title.style.setProperty("font-weight","normal","important");
      } else if (cb.disabled) {
        cb.disabled = false;
        Object.assign(s.style, { opacity:"1", pointerEvents:"auto", background:"" });
        if (title) title.style.setProperty("font-weight","bold","important");
      }
    });
  };
