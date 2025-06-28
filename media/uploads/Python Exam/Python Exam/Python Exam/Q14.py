# 14. Implement a class Shape with a method to calculate the area. Create derived classes Circle and Rectangle, overriding the area calculation method.
import math

class Shape:
  def area(self):
    pass

class Circle(Shape):
  def __init__(self, rad):
    self.rad = rad

  def area(self):
    return math.pi * self.rad ** 2
  
class Rectangle(Shape):
  def __init__(self, length, width):
    self.length = length
    self.width = width

  def area(self):
    return self.length * self.width
  
circle = Circle(5)
rectangle = Rectangle(4, 6)

print('Area of the Circle is:', circle.area())
print('Area of the Rectangle is:', rectangle.area())
