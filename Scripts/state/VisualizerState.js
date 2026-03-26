(function(){
  class VisualizerState {
    constructor(){
      this.is3DView = false;
      this.zoomLevel = 1;
      this.panOffset = {x:0,y:0};
      this.selectedAlgorithm = 'astar';
      this.subscribers = new Set();
    }
    set(partial){
      Object.assign(this, partial);
      this.subscribers.forEach(fn=>fn(this));
    }
    subscribe(fn){
      this.subscribers.add(fn); return ()=> this.subscribers.delete(fn);
    }
  }
  if (typeof window !== 'undefined') {
    window.VisualizerState = VisualizerState;
  }
})();
