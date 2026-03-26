(function(){
  // Minimal input controller that can be expanded later.
  // For now it just offers helpers and can be wired progressively.
  class InputController {
    constructor(canvas) {
      this.canvas = canvas;
    }
    on(event, handler){
      if (!this.canvas) return;
      this.canvas.addEventListener(event, handler);
      return ()=> this.canvas.removeEventListener(event, handler);
    }
  }
  if (typeof window !== 'undefined') {
    window.InputController = InputController;
  }
})();
