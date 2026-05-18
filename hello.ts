function hello(name: string = "World"): string {
  return `Hello, ${name}!`;
}

console.log(hello());
console.log(hello("TypeScript"));
