# 16. Write a Python program to use the defaultdict from the collections module to group a list of words by their starting letter.
# Example input: ["apple", "ant", "banana", "ball", "cat", "car", "dog"]
from collections import defaultdict

def groupWordsLetter(words):
  
  groupWords = defaultdict(list)

  for word in words:
    groupWords[word[0].lower()].append(word)

  for letter, wordList in groupWords.items():
    print(f'Word starting with \'{letter.upper()}\': {wordList}')

words = ["apple", "ant", "Don", "banana", "ball", "cat", "car", "dog"]

groupWordsLetter(words)