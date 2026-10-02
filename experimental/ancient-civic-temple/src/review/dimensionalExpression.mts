/** Pure authored dimensional grammar used by explicitEquationRows. Unicode operators
 * normalize before recursive descent: primary/square, product, then sum. Input is
 * immutable prose; unsupported syntax and nonfinite results throw. No variable,
 * unit conversion or source acquisition belongs here. */
export const dimensionalExpression = (source: string): number => {
  const input = source.replaceAll("−", "-").replaceAll("×", "*").replaceAll("÷", "/")
    .replace(/(\d|\))√/g, "$1*√");
  const tokens = input.match(/\d+(?:\.\d+)?|[()+*/−-]|√|²/g) ?? [];
  if (tokens.join("") !== input.replaceAll(/\s+/g, "")) throw new Error(`unsupported expression ${source}`);
  let i = 0;
    const take = (token: string) => tokens[i] === token && (++i > 0);
    const primary: () => number = () => {
    let value;
    if (take("-")) value = -primary();
    else if (take("√")) value = Math.sqrt(primary());
    else if (take("(")) { value = sum(); if (!take(")")) throw new Error(`unclosed expression ${source}`); }
    else if (/^\d/.test(tokens[i] ?? "")) value = Number(tokens[i++]);
    else throw new Error(`missing operand in ${source}`);
    while (take("²")) value *= value;
    return value;
  };
    const product: () => number = () => {
    let value = primary();
    while (tokens[i] === "*" || tokens[i] === "/") {
      const op = tokens[i++], next = primary();
      value = op === "*" ? value * next : value / next;
    }
    return value;
  };
    const sum: () => number = () => {
    let value = product();
    while (tokens[i] === "+" || tokens[i] === "-") {
      const op = tokens[i++], next = product();
      value = op === "+" ? value + next : value - next;
    }
    return value;
  };
  const result = sum();
  if (i !== tokens.length || !Number.isFinite(result)) throw new Error(`invalid expression ${source}`);
  return result;
};
