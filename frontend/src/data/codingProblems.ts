export type LanguageId = "java" | "javascript" | "python" | "csharp" | "cpp" | "c" | "typescript" | "go";

export interface CodingTest {
  id: string;
  input: string;
  expected: string;
  label: string;
  hidden?: boolean;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  targetTime: number;
  acceptance: number;
  topic: string;
  descriptionTitle: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  example: { input: string; output: string; explanation: string };
  complexity: { time: string; space: string };
  tags: string[];
  initialTests: CodingTest[];
  returnType: "bool" | "int";
  funcName: string;
}

export function generateTemplate(lang: LanguageId, funcName: string, retType: "bool" | "int"): string {
  switch (lang) {
    case "javascript":
      return [
        "const fs = require('fs');",
        "",
        `function ${funcName}(value) {`,
        "  // Write your logic here",
        "  ",
        "}",
        "",
        "const input = fs.readFileSync(0, 'utf8').trim();",
        `console.log(${funcName}(input));`
      ].join("\n");

    case "typescript":
      return [
        "import * as fs from 'fs';",
        "",
        `function ${funcName}(value: string): ${retType === 'int' ? 'number' : 'boolean'} {`,
        "  // Write your logic here",
        "  ",
        "}",
        "",
        "const input = fs.readFileSync(0, 'utf8').trim();",
        `console.log(${funcName}(input));`
      ].join("\n");

    case "python":
      const printStmt = retType === 'bool' ? `print(str(res).lower())` : `print(str(res))`;
      return [
        "import sys",
        "",
        `def ${funcName}(value: str):`,
        "    # Write your logic here",
        "    pass",
        "",
        "value = sys.stdin.read().strip()",
        `res = ${funcName}(value)`,
        printStmt
      ].join("\n");

    case "java":
      const javaRet = retType === 'int' ? 'int' : 'boolean';
      return [
        "import java.io.*;",
        "import java.util.*;",
        "",
        "public class Main {",
        `  static ${javaRet} ${funcName}(String value) {`,
        "    // Write your logic here",
        "    return " + (retType === "int" ? "0" : "false") + ";",
        "  }",
        "  public static void main(String[] args) throws Exception {",
        "    String input = new BufferedReader(new InputStreamReader(System.in)).readLine();",
        "    if (input == null) input = \"\"; else input = input.trim();",
        `    System.out.println(${funcName}(input));`,
        "  }",
        "}"
      ].join("\n");

    case "csharp":
      const csRet = retType === 'int' ? 'int' : 'bool';
      const csCall = retType === 'bool' ? `${funcName}(input).ToString().ToLower()` : `${funcName}(input)`;
      return [
        "using System;",
        "using System.Collections.Generic;",
        "",
        "class Program {",
        `  static ${csRet} ${funcName}(string value) {`,
        "    // Write your logic here",
        "    return " + (retType === "int" ? "0" : "false") + ";",
        "  }",
        "  static void Main() {",
        "    var input = Console.In.ReadToEnd().Trim();",
        `    Console.WriteLine(${csCall});`,
        "  }",
        "}"
      ].join("\n");

    case "cpp":
      const cppRet = retType === 'int' ? 'int' : 'bool';
      const cppCall = retType === 'bool' ? `(${funcName}(input) ? "true" : "false")` : `${funcName}(input)`;
      return [
        "#include <iostream>",
        "#include <string>",
        "#include <vector>",
        "#include <unordered_map>",
        "#include <algorithm>",
        "using namespace std;",
        "",
        `${cppRet} ${funcName}(const string& value) {`,
        "  // Write your logic here",
        "  return " + (retType === "int" ? "0" : "false") + ";",
        "}",
        "",
        "int main() {",
        "  string input; getline(cin, input);",
        `  cout << ${cppCall} << endl;`,
        "}"
      ].join("\n");

    case "c":
      const cRet = retType === 'int' ? 'int' : 'bool';
      const cCall = retType === 'bool' ? `printf("%s\\n", ${funcName}(input) ? "true" : "false")`
        : `printf("%d\\n", ${funcName}(input))`;
      return [
        "#include <stdio.h>",
        "#include <string.h>",
        "#include <stdbool.h>",
        "#include <stdlib.h>",
        "",
        `${cRet} ${funcName}(const char* value) {`,
        "  // Write your logic here",
        "  return " + (retType === "int" ? "0" : "false") + ";",
        "}",
        "",
        "int main(void) {",
        "  char input[10001];",
        "  if (!fgets(input, sizeof(input), stdin)) input[0] = '\\0';",
        "  input[strcspn(input, \"\\r\\n\")] = '\\0';",
        `  ${cCall};`,
        "  return 0;",
        "}"
      ].join("\n");

    case "go":
      const goRet = retType === 'int' ? 'int' : 'bool';
      return [
        "package main",
        "",
        "import (",
        '  "bufio"',
        '  "fmt"',
        '  "os"',
        ")",
        "",
        `func ${funcName}(value string) ${goRet} {`,
        "  // Write your logic here",
        "  return " + (retType === "int" ? "0" : "false") + "",
        "}",
        "",
        "func main() {",
        "  scanner := bufio.NewScanner(os.Stdin)",
        '  input := ""',
        "  if scanner.Scan() { input = scanner.Text() }",
        `  fmt.Println(${funcName}(input))`,
        "}"
      ].join("\n");

    default:
      return "";
  }
}

export const PROBLEMS: CodingProblem[] = [
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    targetTime: 20,
    acceptance: 58,
    topic: "Stack",
    descriptionTitle: "Build a validator for bracket sequences.",
    description: "Given a string containing only parentheses, brackets, and braces, return true when every opener closes with the correct pair in the correct order.",
    inputFormat: "one bracket string, such as ()[]{}.",
    outputFormat: "true or false.",
    constraints: ["0 <= value.length <= 10,000", "The input contains only ()[]{}."],
    example: { input: "([)]", output: "false", explanation: "The pairs are individually valid but close in the wrong nesting order." },
    complexity: { time: "O(n)", space: "O(n)" },
    tags: ["Stack", "String", "Simulation"],
    funcName: "isValid",
    returnType: "bool",
    initialTests: [
      { id: "public-1", input: "()[]{}", expected: "true", label: "Balanced mixed pairs" },
      { id: "public-2", input: "(]", expected: "false", label: "Mismatched closing pair" },
      { id: "public-3", input: "([)]", expected: "false", label: "Incorrect nesting order" }
    ]
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    targetTime: 15,
    acceptance: 63,
    topic: "Two Pointers",
    descriptionTitle: "Check if a string is a palindrome.",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.",
    inputFormat: "a single string containing alphanumeric characters and spaces/punctuation.",
    outputFormat: "true or false.",
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
    example: { input: "A man, a plan, a canal: Panama", output: "true", explanation: "amanaplanacanalpanama is a palindrome." },
    complexity: { time: "O(n)", space: "O(1)" },
    tags: ["Two Pointers", "String"],
    funcName: "isPalindrome",
    returnType: "bool",
    initialTests: [
      { id: "public-1", input: "A man, a plan, a canal: Panama", expected: "true", label: "Standard palindrome with spaces and punctuation" },
      { id: "public-2", input: "race a car", expected: "false", label: "Not a palindrome" },
      { id: "public-3", input: " ", expected: "true", label: "Empty/whitespace string" }
    ]
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating",
    difficulty: "Medium",
    targetTime: 25,
    acceptance: 41,
    topic: "Sliding Window",
    descriptionTitle: "Find the longest substring devoid of repeating characters.",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.",
    inputFormat: "a single string composed of english letters, digits, symbols or spaces.",
    outputFormat: "an integer representing the maximum length.",
    constraints: ["0 <= s.length <= 50,000"],
    example: { input: "abcabcbb", output: "3", explanation: "The answer is 'abc', with the length of 3." },
    complexity: { time: "O(n)", space: "O(k)" },
    tags: ["Sliding Window", "Hash Table", "String"],
    funcName: "lengthOfLongestSubstring",
    returnType: "int",
    initialTests: [
      { id: "public-1", input: "abcabcbb", expected: "3", label: "Standard repeating pattern" },
      { id: "public-2", input: "bbbbb", expected: "1", label: "All same characters" },
      { id: "public-3", input: "pwwkew", expected: "3", label: "Substring not subsequence" }
    ]
  },
  {
    id: "min-add-parentheses",
    title: "Minimum Add to Make Parentheses Valid",
    difficulty: "Medium",
    targetTime: 20,
    acceptance: 68,
    topic: "Stack",
    descriptionTitle: "Calculate minimum insertions for valid parentheses.",
    description: "A parentheses string is valid if and only if it is empty, written as AB (A concatenated with B), or (A) where A is a valid string. You are given a parentheses string `s`. In one move, you can insert a parenthesis at any position of the string. Return the minimum number of moves required to make `s` valid.",
    inputFormat: "a string s composed only of '(' and ')'.",
    outputFormat: "an integer representing the minimum insertions.",
    constraints: ["1 <= s.length <= 1000", "s consists only of '(' and ')'"],
    example: { input: "())", output: "1", explanation: "You can add a '(' at the beginning." },
    complexity: { time: "O(n)", space: "O(1)" },
    tags: ["Greedy", "String", "Stack"],
    funcName: "minAddToMakeValid",
    returnType: "int",
    initialTests: [
      { id: "public-1", input: "())", expected: "1", label: "One missing open" },
      { id: "public-2", input: "(((", expected: "3", label: "Three missing closes" },
      { id: "public-3", input: "()", expected: "0", label: "Already valid" }
    ]
  },
  {
    id: "longest-valid-parentheses",
    title: "Longest Valid Parentheses",
    difficulty: "Hard",
    targetTime: 35,
    acceptance: 32,
    topic: "Dynamic Programming",
    descriptionTitle: "Find the longest strictly valid substring.",
    description: "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
    inputFormat: "a string composed only of '(' and ')'.",
    outputFormat: "an integer representing the maximum length.",
    constraints: ["0 <= s.length <= 30,000", "s consists only of '(' and ')'."],
    example: { input: ")()())", output: "4", explanation: "The longest valid parentheses substring is '()()'." },
    complexity: { time: "O(n)", space: "O(1) with Two Pointers / O(n) DP" },
    tags: ["Dynamic Programming", "Stack", "String"],
    funcName: "longestValidParentheses",
    returnType: "int",
    initialTests: [
      { id: "public-1", input: "(()", expected: "2", label: "Starts with invalid extra open" },
      { id: "public-2", input: ")()())", expected: "4", label: "Standard valid middle chunk" },
      { id: "public-3", input: "", expected: "0", label: "Empty string" }
    ]
  },
  {
    id: "length-of-last-word",
    title: "Length of Last Word",
    difficulty: "Easy",
    targetTime: 10,
    acceptance: 75,
    topic: "String",
    descriptionTitle: "Find the length of the last word in a string.",
    description: "Given a string `s` consisting of words and spaces, return the length of the last word in the string. A word is a maximal substring consisting of non-space characters only.",
    inputFormat: "a string s.",
    outputFormat: "an integer representing the length of the last word.",
    constraints: ["1 <= s.length <= 10^4", "s consists of only English letters and spaces ' '.", "There will be at least one word in s."],
    example: { input: "   fly me   to   the moon  ", output: "4", explanation: "The last word is 'moon' with length 4." },
    complexity: { time: "O(n)", space: "O(1)" },
    tags: ["String"],
    funcName: "lengthOfLastWord",
    returnType: "int",
    initialTests: [
      { id: "public-1", input: "Hello World", expected: "5", label: "Standard case" },
      { id: "public-2", input: "   fly me   to   the moon  ", expected: "4", label: "Trailing spaces" },
      { id: "public-3", input: "luffy is still joyboy", expected: "6", label: "Multiple words" }
    ]
  },
  {
    id: "first-unique-character",
    title: "First Unique Character in a String",
    difficulty: "Easy",
    targetTime: 15,
    acceptance: 61,
    topic: "Hash Table",
    descriptionTitle: "Find the first non-repeating character.",
    description: "Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return -1.",
    inputFormat: "a string s composed of lowercase English letters.",
    outputFormat: "an integer representing the index.",
    constraints: ["1 <= s.length <= 10^5", "s consists of only lowercase English letters."],
    example: { input: "leetcode", output: "0", explanation: "The character 'l' at index 0 is the first character that only appears once." },
    complexity: { time: "O(n)", space: "O(1)" },
    tags: ["Hash Table", "String"],
    funcName: "firstUniqChar",
    returnType: "int",
    initialTests: [
      { id: "public-1", input: "leetcode", expected: "0", label: "First char unique" },
      { id: "public-2", input: "loveleetcode", expected: "2", label: "Middle char unique" },
      { id: "public-3", input: "aabb", expected: "-1", label: "No unique char" }
    ]
  },
  {
    id: "roman-to-integer",
    title: "Roman to Integer",
    difficulty: "Easy",
    targetTime: 20,
    acceptance: 64,
    topic: "Math",
    descriptionTitle: "Convert a Roman numeral to an integer.",
    description: "Given a roman numeral string, convert it to an integer. Roman numerals are usually written largest to smallest from left to right. However, the numeral for four is not IIII. Instead, the number four is written as IV, because the one is before the five we subtract it making four.",
    inputFormat: "a string containing a valid roman numeral.",
    outputFormat: "an integer value.",
    constraints: ["1 <= s.length <= 15", "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')."],
    example: { input: "MCMXCIV", output: "1994", explanation: "M = 1000, CM = 900, XC = 90 and IV = 4." },
    complexity: { time: "O(n)", space: "O(1)" },
    tags: ["Hash Table", "Math", "String"],
    funcName: "romanToInt",
    returnType: "int",
    initialTests: [
      { id: "public-1", input: "III", expected: "3", label: "Simple additive" },
      { id: "public-2", input: "LVIII", expected: "58", label: "Complex additive" },
      { id: "public-3", input: "MCMXCIV", expected: "1994", label: "With subtractive notation" }
    ]
  },
  {
    id: "detect-capital",
    title: "Detect Capital",
    difficulty: "Easy",
    targetTime: 10,
    acceptance: 56,
    topic: "String",
    descriptionTitle: "Check capital letter rules.",
    description: "We define the usage of capitals in a word to be right when one of the following cases holds: 1. All letters in this word are capitals, like 'USA'. 2. All letters in this word are not capitals, like 'leetcode'. 3. Only the first letter in this word is capital, like 'Google'. Given a string word, return true if the usage of capitals in it is right.",
    inputFormat: "a string composed of english letters.",
    outputFormat: "true or false.",
    constraints: ["1 <= word.length <= 100"],
    example: { input: "USA", output: "true", explanation: "All capitals is valid." },
    complexity: { time: "O(n)", space: "O(1)" },
    tags: ["String"],
    funcName: "detectCapitalUse",
    returnType: "bool",
    initialTests: [
      { id: "public-1", input: "USA", expected: "true", label: "All caps" },
      { id: "public-2", input: "leetcode", expected: "true", label: "All lower" },
      { id: "public-3", input: "FlaG", expected: "false", label: "Invalid capitalization" }
    ]
  },
  {
    id: "score-of-parentheses",
    title: "Score of Parentheses",
    difficulty: "Medium",
    targetTime: 25,
    acceptance: 68,
    topic: "Stack",
    descriptionTitle: "Calculate the score of a balanced parentheses string.",
    description: "Given a balanced parentheses string `s`, return the score of the string. The score is computed as follows: () has score 1. AB has score A + B, where A and B are balanced parentheses strings. (A) has score 2 * A, where A is a balanced parentheses string.",
    inputFormat: "a balanced parentheses string s.",
    outputFormat: "an integer score.",
    constraints: ["2 <= s.length <= 50", "s is a balanced parentheses string."],
    example: { input: "(()(()))", output: "6", explanation: "(()(())) -> (1 + 2) -> 2 * 3 = 6." },
    complexity: { time: "O(n)", space: "O(n)" },
    tags: ["Stack", "String"],
    funcName: "scoreOfParentheses",
    returnType: "int",
    initialTests: [
      { id: "public-1", input: "()", expected: "1", label: "Base case" },
      { id: "public-2", input: "(())", expected: "2", label: "Nested case" },
      { id: "public-3", input: "()()", expected: "2", label: "Concatenated case" }
    ]
  }
];
