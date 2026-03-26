import pygame
import math
from queue import PriorityQueue

# Making Window
WIDTH = 800

# Makes a Box Window
WIN = pygame.display.set_mode((WIDTH, WIDTH))

# Sets caption of Window
pygame.display.set_caption("A* Path Finding Algorithm")

# Color Constants
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 255, 0)
YELLOW = (255, 255, 0)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
PURPLE = (128, 0, 128)
ORANGE = (255, 165, 0)
GREY = (128, 128, 128)
TURQUOISE = (64, 224, 208)

# Visualization Tool that makes nodes(squares)
# 50x50 grid
class Spot:
    def __init__(self, row, col, width, total_rows):
        self.row = row
        self.col = col
        self.x = row * width
        self.y = col * width
        self.color = WHITE
        self.neighbors = []
        self.width = width
        self.total_rows = total_rows
    

# These functions check for the color and other things 
    
    # Gets position of box  
    def get_pos(self):
        return self.row, self.col

    # Red 
    def is_closed(self):
        return self.color == RED

    # Is it in the open set? = GREEN BOX
    def is_open(self):
        return self.color == GREEN

    # Is it an obstacle? = BLACK BOX
    def is_barrier(self):
        return self.color == BLACK
    
    # Start Color
    def is_start(self):
        return self.color == ORANGE

    # End Color
    def is_end(self):
        return self.color == TURQUOISE

    # Resets grid to White
    def reset(self):
        self.color = WHITE

# These functions will make the cubes the corresponding color
    
    # Set Start to ORANGE
    def make_start(self):
        self.color = ORANGE

    # Set closed to RED
    def make_closed(self):
        self.color = RED

    # Set open to GREEN
    def make_open(self):
        self.color = GREEN

    # Set barrier to black
    def make_barrier(self):
        self.color = BLACK
    
    # Set end to TURQUOISE
    def make_end(self):
        self.color = TURQUOISE

    # Set path to PURPLE
    def make_path(self):
        self.color = PURPLE
    
    # Draw cube on screen
    def draw(self, win):
        pygame.draw.rect(win, self.color,(self.x, self.y, self.width, self.width))
    

    def update_neighbor(self, grid):
        self.neighbors = []

        # Checking if the row we are at is less than the total rows plus 1
        # Checking to see if we can move DOWN a row
        if self.row < self.total_rows - 1 and not grid[self.row + 1][self.col].is_barrier(): # DOWN
            self.neighbors.append(grid[self.row + 1][self.col])

        if self.row > 0 and not grid[self.row - 1][self.col].is_barrier(): # UP
            self.neighbors.append(grid[self.row - 1][self.col])

        if self.col < self.total_rows - 1 and not grid[self.row][self.col + 1].is_barrier(): # RIGHT
            self.neighbors.append(grid[self.row][self.col + 1])

        if self.col > 0 and not grid[self.row][self.col - 1].is_barrier(): # LEFT
            self.neighbors.append(grid[self.row][self.col - 1])

    # Less than // What happens when 2 spots are compared to each other
    def __lt__(self, other):
        return False
    
# Makes Path
def reconstruct_path(came_from, current, draw):
	while current in came_from:
		current = came_from[current]
		current.make_path()
		draw()

# Heuristic Function
# Point 1 and Point 2
def h(p1, p2):

    # Calculate Distance (Manhattan)
    x1, y1 = p1
    x2, y2 = p2
    return abs(x1 - x2) + abs(y1 - y2)

def algorithm(draw, grid, start, end):
    count = 0
    open_set = PriorityQueue()
    open_set.put((0, count, start))
    came_from = {}
    g_score = {spot: float("inf") for row in grid for spot in row}
    g_score[start] = 0

    open_set_hash = {start}

    while not open_set.empty():
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()

        current = open_set.get()[2]
        open_set_hash.remove(current)

        if current == end:
            reconstruct_path(came_from, end, draw)
            end.make_end()
            return True

        for neighbor in current.neighbors:
            temp_g_score = g_score[current] + 1

            if temp_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = temp_g_score

                if neighbor not in open_set_hash:
                    count += 1
                    open_set.put((g_score[neighbor], count, neighbor))
                    open_set_hash.add(neighbor)
                    neighbor.make_open()

        draw()

        if current != start:
            current.make_closed()

    return False

# Makes the grid that holds the spots 
def make_grid(rows, width):
    grid = []
    gap = width // rows    

    # Generate Grid
    # In grid 
    for i in range(rows):
        grid.append([])
        for j in range (rows):
            spot = Spot(i, j, gap, rows)
            grid[i].append(spot)

    return grid

def draw_grid(win, rows, width):
    gap = width // rows

    # Draw Grid Lines
    for i in range(rows):
        pygame.draw.line(win, GREY, (0, i * gap), (width, i * gap))
        for j in range(rows):
            pygame.draw.line(win, GREY, (j * gap, 0), (j * gap, width))

# Draws everything
def draw(win, grid, rows, width):
    win.fill(WHITE)

    # Draw grid (all white)
    for row in grid:
        for spot in row:
            spot.draw(win)

    # Draw Grid Lines on top
    draw_grid(win, rows, width)

    #Update Display
    pygame.display.update()

# Take mouse position, and see what spot is clicked on (return) 
def get_clicked_pos(pos, rows, width):
    gap = width // rows
    y, x = pos

    row = y // gap
    col = x // gap
    return row, col

def main (win, width):
    # Number of rows 
    ROWS = 50
    grid = make_grid(ROWS, width)

    start = None
    end = None
    
    run = True

    while run: 
        # Draw Grid
        draw(win, grid, ROWS, width)
        for event in pygame.event.get():

            # If user clicks Red X on top right, it'll end the program
            if event.type == pygame.QUIT:
                run = False
            
            # If Left Mouse button [0] is clicked returns position of mouse
            if pygame.mouse.get_pressed()[0]: #Left
                pos = pygame.mouse.get_pos()
                row, col = get_clicked_pos(pos, ROWS, width)
                spot = grid[row][col]

                # If there is no start and the spot does not contain the end make the start postion
                if not start and spot != end:
                    start = spot
                    start.make_start()

                # If there is not end, and the spot does not contain a start, make the end position
                elif not end and spot != start:
                    end = spot
                    end.make_end()

                # Not clicking on start or end
                elif spot != end and spot != start:
                    spot.make_barrier()

            elif pygame.mouse.get_pressed()[2]: # Right
                pos = pygame.mouse.get_pos()
                row, col = get_clicked_pos(pos, ROWS, width)
                spot = grid[row][col]
                spot.reset()

                if spot == start:
                    start = None

                elif spot == end:
                    end = None

            # If key is press down 
            if event.type == pygame.KEYDOWN:
                
                #If key spacebar and have not started the algorithm 
                if event.key == pygame.K_SPACE and start and end:

                    # For rows in grid
                    for row in grid:

                        # For all spots in row, update the neighbors
                        for spot in row:
                            spot.update_neighbor(grid)

                    algorithm(lambda: draw(win, grid, ROWS, width), grid, start, end)
                if event.key == pygame.K_c:
                    start = None
                    end = None
                    grid = make_grid(ROWS, width)

    pygame.quit()

main(WIN, WIDTH)