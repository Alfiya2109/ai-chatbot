# 8. Write a program to convert an Array to a List and give a specific output showing that it is converted.

from array import array

arr_ = array('i', [10, 20, 30, 40, 50, 1])

arrList = list(arr_)

print('converted list: ', arrList)
print('Type: ', type(arrList))