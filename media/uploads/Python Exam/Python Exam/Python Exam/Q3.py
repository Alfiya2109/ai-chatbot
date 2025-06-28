# Write a Python program that finds the union, intersection, and difference of two sets.

set1 = set(map(int, input('Enter any first elements and it should seperate by space: ').split()))
set2 = set(map(int, input('Enter any second elements and it should seperate by space: ').split()))

union_set = set1.union(set2)
intersection_set = set1.intersection(set2)
difference_set = set1.difference(set2)

print('Union: ', union_set)
print('intersection', intersection_set)
print('difference', difference_set)