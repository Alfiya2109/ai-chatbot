# 12. Create a program to determine if a given year is a leap year or not using if-else conditions.

def is_leapYr(year):
  if(year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
    return True
  else:
    return False

year = int(input('Enter a year: '))

if is_leapYr(year):
  print(f'{year} is a leap year.')
else:
  print(f'{year} is not a leap year.')