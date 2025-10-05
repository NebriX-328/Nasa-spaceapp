document.addEventListener("DOMContentLoaded", () => {
  const raw = JSON.parse(localStorage.getItem("nebrix_predictions") || "[]");
  if (!raw || raw.length === 0) {
    alert("No predictions found! Please upload a file first.");
    window.location.href = "upload.html";
    return;
  }

  let current = [...raw];
  const tbody = document.querySelector("#results-table tbody");
  const search = document.getElementById("search");
  const filterClass = document.getElementById("filter-class");
  const sortBtn = document.getElementById("sort-confidence");
  const exportBtn = document.getElementById("export-csv");
  let desc = true;

  function render(list) {
    tbody.innerHTML = "";
    list.forEach(item => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td"); tdName.textContent = item.name || "unknown"; tr.appendChild(tdName);

      const tdPred = document.createElement("td"); tdPred.textContent = item.prediction || "Candidate";
      const p = (item.prediction || "").toLowerCase();
      if (p.includes("confirm")) tdPred.classList.add("confirmed");
      else if (p.includes("candidate")) tdPred.classList.add("candidate");
      else tdPred.classList.add("false-positive");
      tr.appendChild(tdPred);

      const tdConf = document.createElement("td"); tdConf.textContent = (item.confidence != null) ? item.confidence + "%" : "N/A"; tr.appendChild(tdConf);

      tbody.appendChild(tr);
    });
  }

  render(current);

  search?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    current = raw.filter(r => (r.name||"").toLowerCase().includes(q));
    if (filterClass?.value) current = current.filter(r => r.prediction === filterClass.value);
    render(current);
  });

  filterClass?.addEventListener('change', (e) => {
    const v = e.target.value;
    current = raw.filter(r => !v || r.prediction === v);
    if (search?.value) current = current.filter(r => (r.name||"").toLowerCase().includes(search.value.toLowerCase()));
    render(current);
  });

  sortBtn?.addEventListener('click', () => {
    current.sort((a,b) => desc ? (b.confidence||0) - (a.confidence||0) : (a.confidence||0) - (b.confidence||0));
    desc = !desc;
    render(current);
  });

  exportBtn?.addEventListener('click', () => {
    const keys = ["name","prediction","confidence"];
    const csv = [keys.join(",")].concat(current.map(p => `${(p.name||"")},${(p.prediction||"")},${(p.confidence||"")}`)).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = "nebrix_results.csv"; document.body.appendChild(a); a.click(); a.remove();
  });
});
