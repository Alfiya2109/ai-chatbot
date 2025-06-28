# 15. Write a program that takes two numbers as input and performs division. Use exception handling to catch and handle:

def divOfNums():
  try:
    num1 = float(input('Enter the first number: '))
    num2 = float(input('Enter the second number: '))

    result = num1 / num2

    print(f'The result of {num1} is divided by {num2}: ', result)
  except ZeroDivisionError as e:
    print('Error!', e)

divOfNums()