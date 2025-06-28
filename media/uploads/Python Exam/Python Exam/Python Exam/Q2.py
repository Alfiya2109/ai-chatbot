# Write a Python program that compares two numbers and prints whether the first is greater than, equal to, or less than the second.

num1 = float(input('Enter the first number: '))
num2 = float(input('Enter the second number: '))

if num1 > num2:
  print('The first number is greater than second.')
elif num1 < num2:
  print('The first number is less than second.')
else:
  print('Both number are equal.')