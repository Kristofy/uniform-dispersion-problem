from __future__ import annotations
from dataclasses import dataclass
import pygame
import numpy as np

pygame.init()
screen = pygame.display.set_mode((300, 300), pygame.RESIZABLE)

@dataclass
class Point:
    x: int
    y: int

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


background_colour = (255, 255, 255)

running = True


field = Field("palyak/palya1.png")

#image = pygame.image.load("palyak/palya1.png").convert()

#pixel_array = pygame.surfarray.array3d(image)


while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT: 
            running = False
    screen.fill(background_colour) 
    field.render()
    pygame.display.flip()