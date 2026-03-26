// Vanilla JS equivalent of MatrixBackground.jsx
function initMatrixBackground(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let prevWidth = window.innerWidth;

  const resizeCanvas = () => {
    if (window.innerWidth !== prevWidth) {
      prevWidth = window.innerWidth;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener("resize", resizeCanvas);

  const cols = Math.floor(window.innerWidth / 20) + 1;
  const ypos = Array(cols).fill(0);

  const matrixColor = "#00E5FF";
  const fadeAlpha = 0.08;

  const buildGradient = (h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#050505");
    grad.addColorStop(1, "#000000");
    return grad;
  };

  ctx.fillStyle = buildGradient(canvas.height);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const matrix = () => {
    const w = canvas.width;
    const h = canvas.height;

    const fadeGrad = ctx.createLinearGradient(0, 0, 0, h);
    fadeGrad.addColorStop(0, `rgba(5, 5, 5, ${fadeAlpha})`);
    fadeGrad.addColorStop(1, `rgba(0, 0, 0, ${fadeAlpha})`);

    ctx.fillStyle = fadeGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = matrixColor;
    ctx.font = "12pt monospace";

    ypos.forEach((y, ind) => {
      const text = String.fromCharCode(Math.random() * 128);
      const x = ind * 20;

      ctx.fillText(text, x, y);

      if (y > h + Math.random() * 3000) {
        ypos[ind] = 0;
      } else {
        ypos[ind] = y + 20;
      }
    });
  };

  setInterval(matrix, 35);
}

// Start matrix when DOM loads
document.addEventListener("DOMContentLoaded", () => {
    initMatrixBackground("matrixCanvas");
});
