import type { IAutoMovieHumanFaceSourceClosurePlan } from "../structures/IAutoMovieHumanFaceSourceClosurePlan";

/**
 * Admit a source closure registration against its actual open surface layout.
 * Pair and transition ownership, supported positive drivers and the declared
 * representative are structural prerequisites even when closure is zero.
 * This owner reads genuine current positions; it neither constructs nor
 * substitutes the separately requested closure-one endpoint.
 *
 * @evidence contracts/common.md#principled-implementation Structural registration is admitted independently of endpoint work using actual dense open geometry.
 * @evidence contracts/common.md#clear-and-simple-design The evaluator and endpoint arithmetic share one registration guard owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero requests retain layout, ownership and coefficient refusals without a fake prior or a new bypass flag.
 * @evidence contracts/common.md#meaningful-documentation Separates structural admission from requested endpoint arithmetic and physical contact acceptance.
 * @evidence contracts/modeling.md#shared-boundaries Unique source pair and transition ownership is preserved.
 * @evidence contracts/modeling.md#spatial-conventions Open arrays retain canonical head-frame metres; driver coefficients are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source owns the closure channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation Assemblies observe the performed output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical quantity or tissue model.
 * @evidenceExclude contracts/anatomy.md#permitted-range Physical contact owners retain their limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
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
