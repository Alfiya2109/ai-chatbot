# 6. Create a Python class Car with attributes make, model, and year. Instantiate an object and print its attributes.

class Car:
  def __init__(self, make, model, year):
    self.make = make
    self.model = model
    self.year = year

  def display(self):
    print('Car make: ', self.make)
    print('Car model: ', self.model)
    print('Car year: ', self.year)

Saquib_Car = Car('Burgman', 'Red', 2025)

Saquib_Car.display()
