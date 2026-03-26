(function(){
  // Centralized application configuration and color palette.
  // You can change these colors and it will reflect across 2D/3D renderers and Spot states.
  const colors = {
    WHITE: "#FFFFFF",
    BLACK: "#1a1a24",
    RED: "#ff003c",
    GREEN: "#00f3ff",
    BLUE: "#3333FF",
    YELLOW: "#FFFF33",
    PURPLE: "#ffffff",
    ORANGE: "#00f3ff",
    TURQUOISE: "#ff003c",
    GREY: "#AAAAAA",
    GOLD: "#FFD700"
  };

  const AppConfig = {
    colors: { ...colors },
    features: {
      enable3D: true,
      showTutorialOnLoad: true,
    },
    setColors(overrides = {}){
      Object.assign(this.colors, overrides);
      // Keep global COLORS in sync for legacy code paths (Spot, etc.)
      if (typeof window !== 'undefined') {
        window.COLORS = this.colors;
      }
      return this.colors;
    }
  };

  if (typeof window !== 'undefined') {
    window.AppConfig = AppConfig;
    // Maintain backwards compatibility: expose COLORS globally
    window.COLORS = AppConfig.colors;
  }
})();
