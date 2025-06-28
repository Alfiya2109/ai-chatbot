# 19. Write a Python program that prints the factorial of a given number using a for loop.
# The factorial of a number n is the product of all positive integers less than or equal to n.
# Example Input: 5
# Example Output: Factorial of 5 is 120

# End of Paper

def factorial(n):
  result = 1
  for i in range(1, n + 1):
    result *= i
  return result

number = int(input('Enter any number: '))

print(f'Factorial of {number} is:', factorial(number))
