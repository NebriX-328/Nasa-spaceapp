document.addEventListener('DOMContentLoaded', () => {
  const preds = JSON.parse(localStorage.getItem("nebrix_predictions") || "[]");
  const scatterDiv = document.getElementById('scatterPlot');
  const lightDiv = document.getElementById('lightCurve');

  // Build scatter: orbitalPeriod vs radius
  const xs = preds.map(p => p.orbitalPeriod ?? (Math.random()*400));
  const ys = preds.map(p => p.radius ?? (Math.random()*3));
  const colors = preds.map(p => p.prediction && p.prediction.toLowerCase().includes('confirm') ? '#28c76f' : (p.prediction && p.prediction.toLowerCase().includes('candidate') ? '#ffcf33' : '#ff6b6b'));
  const sizes = preds.map(p => Math.max(6, (p.confidence||50)/6));

  if (window.Plotly && scatterDiv) {
    const trace = { x: xs, y: ys, mode:'markers', marker:{color: colors, size: sizes}, text: preds.map(p => p.name) };
    const layout = { margin:{t:20,l:40,r:20,b:40}, xaxis:{title:'Orbital Period (days)'}, yaxis:{title:'Radius (Earth radii)'}, paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)' };
    Plotly.newPlot(scatterDiv, [trace], layout, {responsive:true});
  } else if (scatterDiv) {
    scatterDiv.innerHTML = "<div class='muted small'>Plotly not loaded.</div>";
  }

  // Light curve example (simulate folded curve or use provided sample in preds)
  const n = 200;
  const phase = Array.from({length:n}, (_,i) => (i/n) - 0.5);
  const flux = phase.map(p => 1 - 0.012 * Math.exp(-Math.pow(p/0.02,2)) + (Math.random()-0.5)*0.002);
  if (window.Plotly && lightDiv) {
    const trace2 = { x: phase, y: flux, mode:'lines', line:{color:'#00ffd5'} };
    const layout2 = { margin:{t:10,b:30,l:40,r:10}, xaxis:{title:'Phase'}, yaxis:{title:'Normalized Flux'}, paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)' };
    Plotly.newPlot(lightDiv, [trace2], layout2, {responsive:true});
  } else if (lightDiv) {
    lightDiv.innerHTML = "<div class='muted small'>Plotly not loaded.</div>";
  }
});
