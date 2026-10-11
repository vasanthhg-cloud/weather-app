/* Dynamic background theme + light particle effects (rain / snow / clear).
   Kept separate so app.js stays focused on data + DOM. */

(function () {
  const canvas = document.getElementById("weatherCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];
  let mode = "clear";
  let raf = null;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function makeParticle() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (mode === "rain") {
      return { x: Math.random() * w, y: Math.random() * h, len: 10 + Math.random() * 14, sp: 6 + Math.random() * 6, vx: -1.2, o: 0.25 + Math.random() * 0.3 };
    }
    if (mode === "snow") {
      return { x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.4, sp: 0.6 + Math.random() * 1.2, drift: Math.random() * Math.PI * 2, o: 0.5 + Math.random() * 0.4 };
    }
    return { x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.4, sp: 0.15 + Math.random() * 0.3, drift: Math.random() * Math.PI * 2, o: 0.2 + Math.random() * 0.4 };
  }

  function seed() {
    const count = mode === "clear" ? 40 : 140;
    particles = Array.from({ length: count }, makeParticle);
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    if (mode === "rain") {
      ctx.strokeStyle = "rgba(160, 196, 255, 0.6)";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      for (const p of particles) {
        ctx.globalAlpha = p.o;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.len);
        ctx.stroke();
        p.y += p.sp;
        p.x += p.vx;
        if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      }
    } else {
      const color = mode === "snow" ? "255,255,255" : "200,220,255";
      for (const p of particles) {
        ctx.globalAlpha = p.o;
        ctx.fillStyle = `rgba(${color},1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.drift += 0.01;
        p.y += p.sp;
        p.x += Math.sin(p.drift) * (mode === "snow" ? 0.6 : 0.25);
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
      }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    draw();
  }

  window.updateBackgroundTheme = function (weatherCode, isDay) {
    const rainy = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
    const snowy = [71,73,75,77,85,86];
    if (snowy.includes(weatherCode)) mode = "snow";
    else if (rainy.includes(weatherCode)) mode = "rain";
    else mode = "clear";
    seed();
    start();
  };

  // Start with a calm clear-sky field.
  seed();
  start();
})();
