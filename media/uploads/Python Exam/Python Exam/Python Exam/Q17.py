# 17. Write a Python program to count the occurrences of each word in a given sentence and store the result in a dictionary.
# Example input: "the quick brown fox jumps over the lazy dog the dog was quick"
# Expected output: {'the': 3, 'quick': 2, 'brown': 1, 'fox': 1, 'jumps': 1, 'over': 1, 'lazy': 1, 'dog': 2, 'was': 1}

def count_the_occurrences(sentences):
  words = sentence.split()

  word_con = {}

  for word in words:
    if word in word_con:
      word_con[word] += 1

    else:
      word_con[word] = 1
  return word_con

sentence = "the quick brown fox jumps over the lazy dog the dog was quick"

result = count_the_occurrences(sentence)
print(result)