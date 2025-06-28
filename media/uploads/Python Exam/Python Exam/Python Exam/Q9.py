# 9. Write a Python program to find the second largest number in a list without using the max() function.

def Second_largest_number(numbers):
  if len(numbers) < 2:
    return 'list must contain at least two numbers!'
  
  largest = second_largest = float('-inf')

  for num in numbers:
    if num < largest:
      second_largest = largest
      largest = num
    elif num > second_largest and num != largest:
      second_largest = num

  return second_largest if second_largest != float('-inf') else 'No second largest number found!'

numbersList = [10, 20, 40, 5, 1000, 1, 2, 3, 3]
numlist = [10, 20, 5, 40, 30]

second_large = Second_largest_number(numlist)
print('The Second large number is:', second_large)
