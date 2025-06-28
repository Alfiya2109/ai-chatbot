# 5. Write a Python program that calculates the difference between two dates and prints the result.
from datetime import datetime

date1_ = input('Enter the first date (DD-MM-YYYY): ')
date2_ = input('Enter the second date (DD-MM-YYYY): ')

date1 = datetime.strptime(date1_, '%d-%m-%Y')
date2 = datetime.strptime(date2_, '%d-%m-%Y')

difference_between = abs(date1 - date2)
print('The difference between this dates is: ', difference_between)