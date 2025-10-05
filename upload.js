document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const uploadBox = document.getElementById("upload-box");
  const preview = document.getElementById("preview");
  const previewWrapper = document.getElementById("preview-wrapper");
  const fileMeta = document.getElementById("upload-state");
  const browseLink = document.getElementById("browse-link");
  const submitBtn = document.getElementById("submit-btn");
  const clearBtn = document.getElementById("clear-upload");
  const progressWrap = document.getElementById("upload-progress");
  const progressBar = progressWrap ? progressWrap.querySelector(".progress-bar") : null;

  function showMessage(msg){ if (fileMeta) fileMeta.textContent = msg; }

  if (!fileInput || !uploadBox || !submitBtn) {
    console.error("upload.js: required DOM elements missing");
    return;
  }

  // open file dialog
  browseLink?.addEventListener('click', ()=> fileInput.click());
  uploadBox.addEventListener("click", () => fileInput.click());

  // keyboard accessibility
  uploadBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
  });

  // drag/drop
  uploadBox.addEventListener("dragover", (e) => { e.preventDefault(); uploadBox.classList.add("dragover"); });
  uploadBox.addEventListener("dragleave", (e) => { e.preventDefault(); uploadBox.classList.remove("dragover"); });
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault(); uploadBox.classList.remove("dragover");
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) { fileInput.files = e.dataTransfer.files; handleFile(f); }
  });

  fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));

  function renderPreview(rows) {
    preview.innerHTML = "";
    if (!rows || rows.length === 0) { preview.innerHTML = "<div class='muted'>No preview</div>"; previewWrapper.style.display = 'none'; return; }
    previewWrapper.style.display = 'block';
    // create table
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.keys(rows[0]).slice(0, 12).forEach(k => {
      const th = document.createElement('th'); th.textContent = k; headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.slice(0,10).forEach(r => {
      const tr = document.createElement('tr');
      Object.keys(rows[0]).slice(0,12).forEach(k => {
        const td = document.createElement('td'); td.textContent = (r[k] !== undefined && r[k] !== null) ? r[k] : ""; tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    preview.appendChild(table);
  }

  function parseFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve([]);
      const ext = (file.name || "").split('.').pop().toLowerCase();
      if (ext === 'json') {
        const r = new FileReader();
        r.onload = () => {
          try { const parsed = JSON.parse(r.result); resolve(Array.isArray(parsed) ? parsed : [parsed]); } catch (e) { reject(e); }
        };
        r.onerror = () => reject(new Error("Failed to read JSON"));
        r.readAsText(file);
        return;
      }
      if (ext === 'csv') {
        if (window.Papa && typeof window.Papa.parse === 'function') {
          window.Papa.parse(file, { header: true, dynamicTyping: true, skipEmptyLines:true, complete: (res)=> resolve(res.data), error:(err)=>reject(err) });
          return;
        }
        const fr = new FileReader();
        fr.onload = () => {
          const text = fr.result || "";
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length === 0) return resolve([]);
          const headers = lines[0].split(',').map(h=>h.trim());
          const data = lines.slice(1).map(line => {
            const parts = line.split(',').map(p=>p.trim());
            const obj = {}; headers.forEach((h,i)=> obj[h] = parts[i] ?? "");
            return obj;
          });
          resolve(data);
        };
        fr.onerror = () => reject(new Error("Failed to read CSV"));
        fr.readAsText(file);
        return;
      }
      reject(new Error("Unsupported file type"));
    });
  }

  async function handleFile(file) {
    showMessage(`Selected: ${file.name} (${Math.round(file.size/1024)} KB)`);
    try {
      const rows = await parseFile(file);
      renderPreview(rows);
      sessionStorage.setItem("nebrix_uploaded_data", JSON.stringify(rows));
    } catch (err) {
      console.error(err);
      showMessage("Error parsing file. Ensure valid JSON or CSV.");
    }
  }

  clearBtn?.addEventListener('click', () => {
    fileInput.value = ""; preview.innerHTML = ""; previewWrapper.style.display='none'; showMessage("Cleared");
    sessionStorage.removeItem("nebrix_uploaded_data");
  });

  submitBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) { alert("Please select a file first."); return; }

    progressWrap.style.display = 'block';
    progressBar.style.width = '0%';

    // simulate progress until backend is integrated
    let p = 0;
    const t = setInterval(()=>{ p = Math.min(85, p + Math.floor(Math.random()*8)+3); progressBar.style.width = p + '%'; }, 200);

    // simulate server processing then create predictions (or use provided fields)
    setTimeout(()=> {
      clearInterval(t);
      progressBar.style.width = '100%';
      // try to reuse uploaded rows
      let uploaded = [];
      try { uploaded = JSON.parse(sessionStorage.getItem("nebrix_uploaded_data") || "[]"); } catch(e){ uploaded=[]; }

      let predictions = [];
      if (Array.isArray(uploaded) && uploaded.length>0 && uploaded[0].prediction !== undefined) {
        predictions = uploaded.map(r => ({ name: r.name || r.id || "unknown", prediction: r.prediction || "Candidate", confidence: Number(r.confidence || Math.round(50 + Math.random()*50)), orbitalPeriod: r.orbitalPeriod, radius: r.radius }));
      } else if (Array.isArray(uploaded) && uploaded.length>0) {
        predictions = uploaded.map((r,i) => ({ name: r.name || `target-${i+1}`, prediction: i%3===0 ? "Confirmed" : (i%3===1 ? "Candidate" : "False Positive"), confidence: Math.round(50 + Math.random()*40), orbitalPeriod: r.orbitalPeriod, radius: r.radius }));
      } else {
        predictions = [
          { name: "Kepler-22b", prediction: "Confirmed", confidence:98, orbitalPeriod:289.9, radius:2.4 },
          { name: "Kepler-186f", prediction: "Candidate", confidence:76, orbitalPeriod:129.9, radius:1.1 },
          { name: "Kepler-452b", prediction: "False Positive", confidence:35, orbitalPeriod:385.0, radius:1.6 }
        ];
      }

      localStorage.setItem("nebrix_predictions", JSON.stringify(predictions));
      setTimeout(()=> window.location.href = "results.html", 300);
    }, 1100);
  });
});
