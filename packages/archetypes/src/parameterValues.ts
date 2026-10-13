/**
 *
 * One recipe's exact parameter map, keyed by parameter name.
 *
 * The alias does not imply acceptance: `build` receives a map the design gate
 * accepted, while `plan` and `projectionRadius` may receive one the gate has not
 * judged, which is why `numberOf` exists beside the casting readers.
 *
 * @evidence contracts/common.md#principled-implementation Restates the recipe's JSON scalar map (`IAutoMovieModelRecipe.parameters`) as a read-only record, so a reader cannot mutate a recipe it was handed.
 * @evidence contracts/common.md#clear-and-simple-design One alias shared by the readers in this file; `IAutoMovieModelArchetype.ts` spells the same record type inline in three members instead of naming it, so the shape has two spellings in this package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no field, brand or acceptance marker; whether a map was accepted is the caller's ordering fact and is not encoded in the type.
 * @evidence contracts/common.md#meaningful-documentation States that acceptance is not implied and which archetype members receive unjudged maps.
 * @evidenceExclude contracts/performance.md#cost-and-resources A type alias erases at compile time and performs no work. Names a map the recipe already owns and computes nothing that could be shared. The `Readonly` view adds no storage; the recipe that owns the map decides its lifetime.
 * @author Samchon
 */
export type AutoMovieArchetypeParameters = Readonly<
  Record<string, number | string | boolean>
>;

/**
 *
 * Read one parameter as the number the design gate already accepted.
 *
 * The read is an unchecked cast: it returns whatever the map holds, including
 * `undefined` for a missing key, typed as `number`. Use it only on the accepted
 * map `build` receives.
 *
 * @evidence contracts/common.md#principled-implementation A TypeScript assertion whose premise is the gate's admission of this key as a finite, in-bounds `number`; the premise holds for builder calls because the materializer runs after validation.
 * @evidence contracts/common.md#clear-and-simple-design A named one-line reader, so the primitive-prop and stickman builders state the accepted-value premise at each dimension read instead of repeating the cast.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Performs no runtime check, so a map that bypassed the gate would hand a string, boolean or `undefined` to geometry as a number; that is the documented ordering premise, and `numberOf` is the checked reader for pre-gate callers.
 * @evidence contracts/common.md#meaningful-documentation States that the cast is unchecked, what a missing key yields, and which caller may use it.
 * @evidenceExclude contracts/performance.md#cost-and-resources One keyed property read with no algorithm or data structure to choose. Builders read each dimension (`width`, `height`, `depth`, `radius`, `headRadius`, `limbRadius`) once per build, leaving no repeated read to share. Returns a primitive from the caller's map and keeps no reference to that map.
 * @author Samchon
 */
export const numberParameter = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => parameters[key] as number;

/**
 *
 * Read one parameter as the string the design gate already accepted.
 *
 * Like `numberParameter`, an unchecked cast for an accepted map; its only caller
 * is primitive-prop's builder reading `shape`.
 *
 * @evidence contracts/common.md#principled-implementation A TypeScript assertion premised on the gate having accepted the key as a `string`, after primitive-prop's plan refused any shape outside its dimension table.
 * @evidence contracts/common.md#clear-and-simple-design Pairs with `numberParameter`, so the builder's one discriminator read states the same accepted-map premise.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Performs no runtime check; if the gate were bypassed, a non-string or unknown `shape` would reach `shapeOf`, whose final branch builds a plane without complaint.
 * @evidence contracts/common.md#meaningful-documentation States the unchecked cast and its single caller and key.
 * @evidenceExclude contracts/performance.md#cost-and-resources A single keyed read of `shape` with no algorithm to choose. primitive-prop reads `shape` once per build and passes it straight to `shapeOf`. Returns the string already held by the caller's map and retains nothing.
 * @author Samchon
 */
export const stringParameter = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): string => parameters[key] as string;

/**
 *
 * Read one parameter as a finite number, or zero when it is neither.
 *
 * Measurement runs before geometry and outside the design gate, so a recipe
 * that never passed it must still yield a number instead of poisoning a bound
 * with `NaN`.
 *
 * Zero keeps the measurement finite but is not a dimension, and a finite
 * out-of-range value passes through unchanged, so the result is a trustworthy
 * bound only once the gate accepts the map.
 *
 * @evidence contracts/common.md#principled-implementation A `typeof` test plus `Number.isFinite` rejects strings, booleans, `undefined`, `NaN` and both infinities in one condition.
 * @evidence contracts/common.md#clear-and-simple-design The single checked reader, used only by `projectionRadius` implementations that run before the gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Substitutes zero for an absent or non-finite value; the basis is that the design gate refuses such a recipe, so the placeholder radius never reaches an accepted build.
 * @evidence contracts/common.md#meaningful-documentation States the zero result, why measurement needs a total reader, and that neither zero nor an out-of-range value is a bound before acceptance.
 * @evidenceExclude contracts/performance.md#cost-and-resources One property read and two constant-time tests, with no algorithm to choose. A radius reads at most three dimensions once per recipe, and `productionProjectionRadii` already stores the resulting radius per recipe id. Returns a number and holds no reference to the map it read.
 * @author Samchon
 */
export const numberOf = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => {
  const value = parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};
