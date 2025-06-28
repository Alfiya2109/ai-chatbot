# 18. Create your own Python module named calculator.py. Define the following four functions within it:
# addition(a, b) – Adds two numbers and returns the result.
# subtraction(a, b) – Subtracts the second number from the first and returns the result.
# multiplication(a, b) – Multiplies two numbers and returns the result.
# division(a, b) – Divides the first number by the second and returns the result.

import calculator

a = 10
b = 8

print(f'Addition of {a} and {b}:', calculator.add(a, b))
print(f'Substraction of {a} and {b}:', calculator.sub(a, b))
print(f'Multiplication of {a} and {b}:', calculator.mul(a, b))
print(f'Division of {a} and {b}:', calculator.div(a, b))