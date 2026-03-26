# PathfindingWeb (Pathfinding Algorithm Visualizer)

![DoubleAlgo](https://github.com/AnmolVerma7/Pathfinding-Visualizer/assets/90490916/70b2c8cc-bf5c-479e-ba4e-6d2cf8bba627)

A visualizer for pathfinding algorithms! This repository contains two versions of the visualizer:
1. **Web Version**: A modern, interactive web-based visualizer built with HTML, CSS, and JavaScript.
2. **Python Version**: The original version built with Python and Pygame.

---

## 🌐 Web Version

The new Web Version provides a sleek, responsive, and interactive experience directly in your browser. 

### Features
- Visualization of various pathfinding algorithms
- Interactive grid: draw walls, move start/end nodes
- Control over animation speed
- Clean, responsive design

### Usage
Simply open the hosted GitHub Pages link, or clone the repository and open `index.html` in your favorite web browser!

---

## 🐍 Python Version (Legacy)

The original Python version provides a visual implementation of A* and Dijkstra's algorithms using Pygame on a 50x50 grid. You can find the source code in the `PythonVersion/` directory.

### Installation
To run this script, you'll need Python and Pygame. You can install Pygame via pip:
```bash
pip install pygame
```

### Usage
Navigate to the `PythonVersion` folder and run the script:
```bash
cd PythonVersion
python PathfindingVisualizer.py
```

### Controls
- **Left Mouse Click**: Set the start point, end point, and draw obstacles.
- **Right Mouse Click**: Remove nodes or obstacles.
- **Spacebar**: Start the algorithm.
- **C**: Clear the grid.
- **A**: A* Pathfinding Algorithm
- **B**: Dijkstras Pathfinding Algorithm
