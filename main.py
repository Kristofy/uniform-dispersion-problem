from __future__ import annotations
from dataclasses import dataclass
from typing import Literal
import pygame
import numpy as np
import random
import pygame_widgets
from pygame_widgets.textbox import TextBox
from pygame_widgets.slider import Slider
import argparse

robot_type : Literal["sync", "async"] = "sync"
background_colour = (255, 255, 255)
p: float = 0
screen = None

def snap_pixels(pixels: np.ndarray, colors: list[tuple[int, int, int]]):
    """Snaps every pixel to the closest color in colors, by euclidean distance"""

    def distance(a: tuple[int, int, int], b: tuple[int, int, int]):
        return sum((a[i] - b[i]) ** 2 for i in range(3)) ** 0.5

    def closest_color(color: tuple[int, int, int]):
        return min(colors, key=lambda x: distance(x, color))

    return np.array([[closest_color(pixel) for pixel in row] for row in pixels])


@dataclass
class Point:
    x: int
    y: int

    def peak_up(self, d = 1):
        return Point(x=self.x, y=self.y - d)
    def peak_down(self, d = 1):
        return Point(x=self.x, y=self.y + d)
    def peak_right(self, d = 1):
        return Point(x=self.x + d, y=self.y)
    def peak_left(self, d = 1):
        return Point(x=self.x - d, y=self.y)
    
    def rot90(self):
        return Point(x=-self.y, y=self.x)
    def abs(self):
        return Point(abs(self.x), abs(self.y))

    def __eq__(self, other: object):
        return isinstance(other, Point) and self.x == other.x and self.y == other.y

    def __add__(self, other: Point):
        return Point(self.x + other.x, self.y + other.y)
    def __sub__(self, other: Point):
        return Point(self.x - other.x, self.y - other.y)

    def __str__(self):
        return f"({self.x}, {self.y})"

    @staticmethod
    def all_directions():
        return [Point(0, -1), Point(1, 0), Point(0, 1), Point(-1, 0)]

class Robot:

    counter = 0

    @property
    def secondary_direction(self):
        return self.primary_direction.rot90()
    def __init__(self, field: Field):
        self.id = Robot.counter
        Robot.counter += 1
        self.field = field
        self.position = field.start
        self.next_position = self.position
        self.is_settled = False
        self.primary_direction = None
        self.history : list[Point] = []
        self.active = True

    def move(self):
        if self.is_settled:
            return
        if self.position == self.next_position:
            return
        if not self.history or self.history[-1] != self.position:
            self.history.append(self.position)
        self.position = self.next_position
        self.next_position = self.position

    @property
    def diag(self):
        total = Point(0, 0)
        for dir in Point.all_directions():
            if self.field.is_occupied(self.position+dir):
                total = total + dir
        return self.position - total

    def pre_tick(self):
        pass

    def __str__(self):
        return f"Robot({self.position})"

    def render(self):
        cell_size = self.field.cell_size
        color = (0, 255, 0) if self.is_settled else ( (0, 0, 255) if self.active else (0, 0, 122))
        pygame.draw.circle(screen, color, (self.position.x * cell_size + cell_size // 2, self.position.y * cell_size + cell_size // 2), cell_size // 2)
        #text = my_font.render(str(self.id), True, (255, 255, 0))
        #screen.blit(text, (self.position.x * cell_size + cell_size // 2 - 10, self.position.y * cell_size - cell_size // 4 - 10))
    
class SyncRobot(Robot):
    
    def pre_tick(self):
        #self.next_position = self.position.peak_up()
        v = self.position
        if self.field.is_occupied(v.peak_up()) and \
            self.field.is_occupied(v.peak_down()) and \
            self.field.is_occupied(v.peak_left()) and \
            self.field.is_occupied(v.peak_right()):
            self.is_settled = True
            return
        elif self.primary_direction is None:
            for dir in Point.all_directions():
                d = v + dir
                if not self.field.is_occupied(d):
                    self.primary_direction = dir
                    break
                
        if(not self.field.is_occupied(v+self.primary_direction)):
            self.next_position = v + self.primary_direction
        elif (not self.field.is_occupied(v+self.secondary_direction)):
            self.next_position = v + self.secondary_direction
        else:
            if self.field.is_occupied(v.peak_up()) + \
                self.field.is_occupied(v.peak_down()) + \
                self.field.is_occupied(v.peak_left()) + \
                self.field.is_occupied(v.peak_right()) == 3:
                self.is_settled = True
            elif len(self.history) < 2 or self.history[-2] == self.diag or not self.field.is_occupied(self.diag):
                self.is_settled = True
            else:
                for dir in Point.all_directions():
                    d = v + dir
                    if not self.field.is_occupied(d) and d != self.history[-1]:
                        self.primary_direction = dir
                        self.next_position = v + self.primary_direction
                        break
    
    def __str__(self):
        return f"SyncRobot({self.position})"

class AsyncRobot(Robot):
    @property
    def diag(self):
        total = Point(0, 0)
        for dir in Point.all_directions():
            if self.field.is_wall_or_settled_robot(self.position+dir):
                total = total + dir
        return self.position - total

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def pre_tick(self):
        if random.random() > p:
            self.active = False
            return
        self.active = True
        v = self.position

        if self.field.is_wall_or_settled_robot(v.peak_up()) and \
            self.field.is_wall_or_settled_robot(v.peak_down()) and \
            self.field.is_wall_or_settled_robot(v.peak_left()) and \
            self.field.is_wall_or_settled_robot(v.peak_right()):
            self.is_settled = True
            return
        elif self.primary_direction is None:
            
            for dir in Point.all_directions():
                d = v + dir
                if self.field.is_broadcasting_robot(d):
                    return
            
            for dir in Point.all_directions():
                d = v + dir
                if not self.field.is_occupied(d):
                    self.primary_direction = dir
                    break

        # If their is a broadcasting robot in the primary direction then wait
        if self.field.is_broadcasting_robot(v+self.primary_direction):
            return
        
        # If we can go towards to primary direction then take the step
        if(not self.field.is_occupied(v+self.primary_direction)):
            self.next_position = v + self.primary_direction
            return
        
        # If their is a broadcasting robot in the secondary direction then wait
        if self.field.is_broadcasting_robot(v+self.secondary_direction):
            return
        
        # If we can go towards to secondary direction then take the step
        if (not self.field.is_occupied(v+self.secondary_direction)):
            self.next_position = v + self.secondary_direction
            return
      
        
        if self.field.is_wall_or_settled_robot(v.peak_up()) + \
            self.field.is_wall_or_settled_robot(v.peak_down()) + \
            self.field.is_wall_or_settled_robot(v.peak_left()) + \
            self.field.is_wall_or_settled_robot(v.peak_right()) == 3:
            self.is_settled = True
        elif not self.field.is_occupied(self.diag) or self.field.is_broadcasting_robot(self.diag):
            self.is_settled = True
        else:
            for dir in Point.all_directions():
                d = v + dir
                if not self.field.is_occupied(d) and d != self.history[-1]:
                    self.primary_direction = dir
                    self.next_position = v + self.primary_direction
                    break
    
    def __str__(self):
        return f"AsyncRobot({self.position})"

class Field:
    # WALL = (25)
    WALL_COLOR: tuple[int, int, int] = (0, 0, 0)
    START_COLOR: tuple[int, int, int] = (255, 0, 0)
    
    def __init__(self, path: str):
        image = pygame.image.load(path).convert()
        pixels = pygame.surfarray.array3d(image)
        pixels = snap_pixels(pixels, [Field.WALL_COLOR, Field.START_COLOR, (255, 255, 255)])
        #pad array with WALL_COLOR
        padded_pixels = np.zeros((pixels.shape[0] + 2, pixels.shape[1] + 2, 3), dtype=np.uint8)
        padded_pixels[1:-1, 1:-1] = pixels[:, :]
        padded_pixels[0, :] = Field.WALL_COLOR
        padded_pixels[:, 0] = Field.WALL_COLOR
        padded_pixels[-1, :] = Field.WALL_COLOR
        padded_pixels[:, -1] = Field.WALL_COLOR
        pixels = padded_pixels

        pixels = np.rot90(pixels, k = 1, axes=(0, 1))
        pixels = np.flip(pixels, axis=0)

        self.height, self.width, _ = pixels.shape
        # self.start : Point =        
        self.is_wall: list[list[bool]] = [[all(x == Field.WALL_COLOR) for x in y] for y in pixels]
        self.robot_matrix: list[list[Robot | None]] = [[None] * self.width for _ in range(self.height)]
        
        self.robots : list[Robot] = []

        self.start = None
        for i, row in enumerate(pixels):
            for j, pixel in enumerate(row):
                if all(pixel == Field.START_COLOR):
                    if self.start is not None:
                        raise Exception("Több kezdőpozíció is van")
                    self.start = Point(j, i)
        if self.start is None:
            raise Exception("Nem található kezdő pozíció")
    
    @property    
    def cell_size(self):
        (width, height) = screen.get_size()
        cell_width = width // self.width
        cell_height = height // self.height
        cell_size = min(cell_width, cell_height)
        return cell_size
    
    def render(self):

        for i, row in enumerate(self.is_wall):
            for j, is_wall in enumerate(row):
                if is_wall:
                    pygame.draw.rect(screen, Field.WALL_COLOR, (j * self.cell_size, i * self.cell_size, self.cell_size, self.cell_size))
        pygame.draw.rect(screen, Field.START_COLOR, (self.start.x * self.cell_size, self.start.y * self.cell_size, self.cell_size, self.cell_size))

        for robot in self.robots:  
            robot.render()

    def update_robot_matrix(self):
        self.robot_matrix = [[None] * self.width for _ in range(self.height)]
        for robot in self.robots:
            self.robot_matrix[robot.position.y][robot.position.x] = robot

    def spawn_robot(self):
        if self.robot_matrix[self.start.y][self.start.x] is None:
            if robot_type == "sync":
                self.robots.append(SyncRobot(self))
            else:
                if random.random() < p:
                    self.robots.append(AsyncRobot(self))
    
    def move_robots(self):
        for robot in self.robots:
            robot.move()
        self.update_robot_matrix()
    
    def pre_tick(self):
        for robot in self.robots:
            if robot.is_settled:
                continue
            robot.pre_tick()
    
    def post_tick(self):
        if not self.is_occupied(self.start):
            self.spawn_robot()
        self.move_robots()
        self.render()
    
    def is_occupied(self, point: Point):
        return self.robot_matrix[point.y][point.x] is not None or self.is_wall[point.y][point.x]
    
    def is_wall_or_settled_robot(self, point: Point):
        return self.is_occupied(point) and not self.is_broadcasting_robot(point)
    
    def is_broadcasting_robot(self, point: Point):
        robot = self.robot_matrix[point.y][point.x]
        return robot and not robot.is_settled

        # return  is not None and not self.robot_matrix[point.y][point.x].is_settled

    
#random.seed(1)


def main(file_path: str):

    global screen

    pygame.init()
    screen = pygame.display.set_mode((300, 300), pygame.RESIZABLE)

    pygame.font.init()
    my_font = pygame.font.SysFont('Comic Sans MS', 20)


    field = Field(file_path)

    running = True
    
    slider = Slider(screen, 50, 100, 300, 20, min=1, max=200, step=1)
    output_box = TextBox(screen, 50, 140, 100, 40, fontSize=30)
    

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT: 
                running = False

        fps = int(slider.getValue())
        output_box.setText(f"{fps}")
        screen.fill(background_colour)
       

        # Draws the slider
        pygame_widgets.update(pygame.event.get())
        
        
        field.pre_tick()
        field.post_tick()
        pygame.display.flip()
        pygame.time.Clock().tick(fps)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(add_help=True)

    parser.add_argument('file', type=str, action="store", help='The file to use as the map')
 
    parser.add_argument(
        "--async",
        "-a",
        dest="param_async",
        action="store",
        type=float,
        required=False,
        help="Run the async simulated version",
    )

    args = parser.parse_args()

    
    is_async = args.param_async is not None
    p = args.param_async
    file_path = args.file
    
    print(args)

    if is_async:
        robot_type = "async"
        

    main(file_path)
