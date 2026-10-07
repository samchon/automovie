import type { IHumanSourceFaceRecipeCandidate } from "./structures/IHumanSourceFaceRecipeCandidate.ts";
import type { IHumanSourceFaceRecipeMatch } from "./structures/IHumanSourceFaceRecipeMatch.ts";

/**
 * Find the sampled recipe after its common binocular extraction-frame shift.
 * For each candidate C and published D, shift=mean(C-D) over the entire
 * original skin and residual=max norm(C-D-shift). The nonzero support is
 * visited first for bounded early rejection, without omitting any vertex
 * that could improve the best result. The producer supplies acceptance.
 */
export function recoverHumanSourceFaceRecipe(published: Float64Array, candidates: readonly IHumanSourceFaceRecipeCandidate[]): IHumanSourceFaceRecipeMatch {
  const count = published.length / 3, sum = [0, 0, 0], order: number[] = [];
  if (!Number.isSafeInteger(count) || count === 0 || published.some((value) => !Number.isFinite(value)))
    throw new Error("Source recipe recovery requires a complete finite original skin population.");
  for (let at = 0; at < published.length; at++) sum[at % 3] += published[at];
  if (sum.some((value) => !Number.isFinite(value))) throw new Error("Source recipe recovery sum is unrepresentable.");
  for (let vertex = 0; vertex < count; vertex++)
    if (published[3 * vertex] !== 0 || published[3 * vertex + 1] !== 0 || published[3 * vertex + 2] !== 0) order.push(vertex);
  order.sort((a, b) => Math.hypot(...published.subarray(3 * b, 3 * b + 3)) - Math.hypot(...published.subarray(3 * a, 3 * a + 3)));
  const support = new Set(order);
  for (let vertex = 0; vertex < count; vertex++) if (!support.has(vertex)) order.push(vertex);
  let maximumMetres = Infinity, state = "", shiftMetres = [0, 0, 0];
  for (const candidate of candidates) {
    if (candidate.field.length !== published.length || candidate.field.some((value) => !Number.isFinite(value)) ||
        candidate.sum.length !== 3 || candidate.sum.some((value) => !Number.isFinite(value)))
      throw new Error(`Source recipe candidate ${candidate.name} has an invalid complete field.`);
    const shift = candidate.sum.map((value, axis) => (value - sum[axis]) / count);
    if (shift.some((value) => !Number.isFinite(value))) throw new Error(`Source recipe candidate ${candidate.name} has an unrepresentable shift.`);
    let worst = 0;
    for (const vertex of order) {
      const residual = Math.hypot(...[0, 1, 2].map((axis) => candidate.field[3 * vertex + axis] - published[3 * vertex + axis] - shift[axis]));
      if (!Number.isFinite(residual)) throw new Error(`Source recipe candidate ${candidate.name} has an unrepresentable residual.`);
      if (residual > worst) { worst = residual; if (worst >= maximumMetres) break; }
    }
    if (worst < maximumMetres) { maximumMetres = worst; state = candidate.name; shiftMetres = shift; }
  }
  return { maximumMetres, state, shiftMetres };
}
