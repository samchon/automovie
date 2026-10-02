import { dimensionalExpression } from "./dimensionalExpression.mjs";
/** Extract metre-valued equations from one immutable authored H2. Exact claims
 * use 1e-6 m; approximate claims admit half the last printed decimal plus that
 * tolerance. Unsupported expressions stay outside this grammar. The prose
 * census aggregates these rows without changing their order or input text. */
export const explicitEquationRows = (id: string, body: string) => {
  const rows = [];
  const exact = /([\d√(][\d.()+−×*\/√²]*[+−×*\/√²][\d.()+−×*\/√²]*)\s*(=|≈)\s*(\d+(?:\.\d+)?)m/g;
  for (const match of body.matchAll(exact)) {
    const [, expression, relation, stated] = match;
    try {
      const calculated = dimensionalExpression(expression);
      // Approximate statements carry two or three printed decimal places.
      const places = (stated.split(".")[1] ?? "").length;
      const tolerance = relation === "≈" ? 0.5 * 10 ** -places + 1e-6 : 1e-6;
      rows.push({ id, expression, relation, stated: Number(stated), calculated, tolerance,
        pass: Math.abs(calculated - Number(stated)) <= tolerance });
    } catch {
      // A number next to a variable or unit is outside this explicit grammar.
    }
  }
  return rows;
};
