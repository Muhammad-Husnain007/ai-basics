const { calculateDiscount } = require("./app");

test("subtracts a 10 percent discount from 100", () => {
  expect(calculateDiscount(100, 10)).toBe(90);
});

test("subtracts a 25 percent discount from 200", () => {
  expect(calculateDiscount(200, 25)).toBe(150);
});
