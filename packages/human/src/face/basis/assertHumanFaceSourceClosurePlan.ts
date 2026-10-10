import type { IAutoMovieHumanFaceSourceClosurePlan } from "../structures/IAutoMovieHumanFaceSourceClosurePlan";

/**
 * Admit a source closure registration against its actual open surface layout.
 * Pair and transition ownership, supported positive drivers and the declared
 * representative are structural prerequisites even when closure is zero.
 * This owner reads genuine current positions; it neither constructs nor
 * substitutes the separately requested closure-one endpoint.
 *
 * @author Samchon
 */
export function assertHumanFaceSourceClosurePlan(
  plan: IAutoMovieHumanFaceSourceClosurePlan,
  open: ReadonlyMap<string, readonly number[]>,
): void {
  if (plan.generation.trim() === "" || plan.surface.trim() === "")
    throw new Error("Face source closure needs its generation and surface.");
  for (const values of open.values()) {
    if (values.length % 3 !== 0)
      throw new Error("Face source closure needs dense finite positions.");
    for (let index = 0; index < values.length; index++)
      if (!Number.isFinite(values[index]))
        throw new Error("Face source closure needs dense finite positions.");
  }
  const selected = open.get(plan.surface);
  if (!Number.isSafeInteger(plan.vertices) || plan.vertices < 3 ||
      selected === undefined || selected.length !== plan.vertices * 3)
    throw new Error("Face source closure needs its matching performed layout.");
  const valid = (vertex: number) => Number.isSafeInteger(vertex) && vertex >= 0 && vertex < plan.vertices;
  const contact = new Set<number>();
  if (plan.contactPairs.length === 0)
    throw new Error("Face source closure needs registered contact pairs.");
  for (const pair of plan.contactPairs) {
    if (pair === undefined || pair.length !== 2 || ![pair[0], pair[1]].every(valid))
      throw new Error("Face source closure names an absent contact point.");
    if (contact.has(pair[0]) || contact.has(pair[1]))
      throw new Error("Face source closure repeats contact point ownership.");
    contact.add(pair[0]);
    contact.add(pair[1]);
  }
  if (plan.representativePair.length !== 2 || !plan.contactPairs.some((pair) =>
    pair[0] === plan.representativePair[0] && pair[1] === plan.representativePair[1]))
    throw new Error("Face source closure representative must be registered.");
  const transitions = new Set<number>();
  for (const row of plan.rows) {
    if (row === undefined || !valid(row.vertex) || contact.has(row.vertex) || transitions.has(row.vertex))
      throw new Error("Face source closure has an invalid transition owner.");
    transitions.add(row.vertex);
    if (row.coefficients.length === 0)
      throw new Error("Face source closure needs nonempty driver coefficients.");
    const drivers = new Set<number>();
    for (const entry of row.coefficients) {
      if (entry === undefined || entry.length !== 2 || !contact.has(entry[0]) ||
          drivers.has(entry[0]) || !Number.isFinite(entry[1]) || entry[1] <= 0)
        throw new Error("Face source closure needs unique positive supported drivers.");
      drivers.add(entry[0]);
    }
  }
}
