# 13. Write a Python program to print the sum of all even numbers from 1 to 20.

sumOfEven = 0

for num in range(1, 21):
  if num % 2 == 0:
    sumOfEven += num

print('The sum of all even numbers from the 1 to 20: ', sumOfEven)