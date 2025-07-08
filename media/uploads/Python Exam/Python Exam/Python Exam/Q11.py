# 11. Write a Python function named square_numbers that takes a list of numbers and returns a new list with the squares of those numbers.

def square_numbers(numbers):
  return [num ** 2 for num in numbers]

numbersOfList = [10, 20, 30, 40, 60]

square = square_numbers(numbersOfList)
print('Squared numbers: ', square)