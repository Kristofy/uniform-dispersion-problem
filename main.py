from __future__ import annotations
from dataclasses import dataclass
import pygame
import numpy as np
import time

pygame.init()
screen = pygame.display.set_mode((300, 300), pygame.RESIZABLE)

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

"""
f v is either a hall or a corner, w is called the “diagonal”
of v, and is denoted diag(v). We observe that diagonals are
uniquely specified.
"""

class Robot:
    def __init__(self, field: Field):
        self.field = field
        self.position = field.start
        self.next_position = self.position
        self.is_settled = False
        self.primary_direction = None
        self.history : list[Point] = []

    @property
    def secondary_direction(self):
        return self.primary_direction.rot90()

    def render(self):
        cell_size = self.field.cell_size
        color = (0, 255, 0) if self.is_settled else (0, 0, 255)
        pygame.draw.circle(screen, color, (self.position.x * cell_size + cell_size // 2, self.position.y * cell_size + cell_size // 2), cell_size // 2)
    
    def move(self):
        if self.is_settled:
            self
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
            elif self.history[-2] == self.diag or not self.field.is_occupied(self.diag):
                self.is_settled = True
            else:
                for dir in Point.all_directions():
                    d = v + dir
                    if not self.field.is_occupied(d) and d != self.history[-1]:
                        self.primary_direction = dir
                        self.next_position = v + self.primary_direction
                        break
    
    def __str__(self):
        return f"Robot({self.position})"
class Field:
    # WALL = (25)
    WALL_COLOR: tuple[int, int, int] = (0, 0, 0)
    START_COLOR: tuple[int, int, int] = (255, 0, 0)
    
    def __init__(self, path: str):
        image = pygame.image.load(path).convert()
        pixels = pygame.surfarray.array3d(image)
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
        self.is_robot: list[list[bool]] = [[False] * self.width for _ in range(self.height)]
        
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

    def update_is_robot(self):
        self.is_robot = [[False] * self.width for _ in range(self.height)]
        for robot in self.robots:
            self.is_robot[robot.position.y][robot.position.x] = True

    def spawn_robot(self):
        if not self.is_robot[self.start.y][self.start.x]:
            self.robots.append(Robot(self))
    
    def move_robots(self):
        for robot in self.robots:
            robot.move()
        self.update_is_robot()
    
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
        return self.is_robot[point.y][point.x] or self.is_wall[point.y][point.x]


background_colour = (255, 255, 255)

running = True


field = Field("palyak/palya2.png")

#field.spawn_robot()

#image = pygame.image.load("palyak/palya1.png").convert()

#pixel_array = pygame.surfarray.array3d(image)

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT: 
            running = False
    screen.fill(background_colour) 
    field.pre_tick()
    field.post_tick()
    pygame.display.flip()
    time.sleep(0.1)