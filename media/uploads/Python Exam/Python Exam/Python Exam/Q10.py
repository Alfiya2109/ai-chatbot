# 10. Implement a class Student with encapsulated attributes for name and grades. Provide methods to set grades and calculate the average grade.

class Student:
  def __init__(self, name):
    self.__name = name
    self.__grade = []

  def addGrade(self, grade):
    if grade > 0 and grade < 100:
      self.__grade.append(grade)
    else:
      print('Invalid grade! must be between 0 to 100.')

  def calAverage(self):
    if len(self.__grade) == 0:
      return 'No grade available'
    return sum(self.__grade) / len(self.__grade)
  
  def display(self):
    print('Student Name: ', self.__name)
    print('Grade: ', self.__grade)
    print('average grade: ', self.calAverage())

student = Student('Saquib Ansari')

student.addGrade(85)
student.addGrade(90)
student.addGrade(99)
student.addGrade(98)

student.display()