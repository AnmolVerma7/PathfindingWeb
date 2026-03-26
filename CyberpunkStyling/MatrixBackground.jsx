import React, { useEffect, useRef } from "react";

/**
 * Canvas-based Matrix digital rain effect background.
 * Renders a falling text animation on a fixed canvas.
 */
const MatrixBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Track previous width to ignore vertical-only resizes (mobile address bar)
    let prevWidth = window.innerWidth;

    const resizeCanvas = () => {
      // Only resize if width changes (orientation change) or significant height change
      // This prevents the matrix from resetting when mobile address bar shows/hides
      if (window.innerWidth !== prevWidth) {
        prevWidth = window.innerWidth;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    // Initial size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener("resize", resizeCanvas);

    // Matrix configuration
    const cols = Math.floor(window.innerWidth / 20) + 1;
    const ypos = Array(cols).fill(0);

    const matrixColor = "#00E5FF";
    const fadeAlpha = 0.08;

    const buildGradient = (h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#050505"); // --colors-bg--300
      grad.addColorStop(1, "#000000"); // --colors-bg--500
      return grad;
    };

    // Initial paint
    ctx.fillStyle = buildGradient(canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const matrix = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Fading trail
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

    const intervalId = setInterval(matrix, 35);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default MatrixBackground;
