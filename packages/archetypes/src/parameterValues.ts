/**
 * One recipe's exact parameter map, keyed by parameter name.
 *
 * The alias does not imply acceptance: `build` receives a map the design gate
 * accepted, while `plan` and `projectionRadius` may receive one the gate has not
 * judged, which is why `numberOf` exists beside the casting readers.
 *
 * @evidence contracts/common.md#principled-implementation The alias is structurally the read-only view of `IAutoMovieModelRecipe.parameters`, so the gate and materializer pass the recipe's own record without copying it while archetype members cannot mutate it.
 * @evidence contracts/common.md#clear-and-simple-design One alias names the map type that the build input and the `plan` and `projectionRadius` signatures all take, so the value union is spelled once in this package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The value union matches the three scalar kinds a recipe parameter may hold and adds no archetype-specific key or narrowing.
 * @evidence contracts/common.md#meaningful-documentation The prose states that the type says nothing about acceptance and which members receive accepted versus unjudged maps.
 * @evidenceExclude contracts/performance.md#cost-and-resources This alias is a type with no runtime code and holds no data of its own.
 * @author Samchon
 */
export type AutoMovieArchetypeParameters = Readonly<
  Record<string, number | string | boolean>
>;

/**
 * Read one parameter as the number the design gate already accepted.
 *
 * The read is an unchecked cast: it returns whatever the map holds, including
 * `undefined` for a missing key, typed as `number`. Use it only on the accepted
 * map `build` receives.
 *
 * @param parameters Parameter map the design gate accepted.
 * @param key Parameter name whose schema kind is `number`.
 * @returns The stored value, unchecked.
 *
 * @evidence contracts/common.md#principled-implementation The cast relies on the gate having checked this key's `typeof` and range before `build` runs, which the materializer guarantees by building only gate-accepted recipes.
 * @evidence contracts/common.md#clear-and-simple-design A named reader keeps builders free of repeated `as number` casts and makes the trust boundary visible at every call site, where `numberOf` marks the untrusted one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The cast is not a fallback that hides bad input; the documentation states that a map which skipped the gate passes its raw value through, including `undefined`.
 * @evidence contracts/common.md#meaningful-documentation The documentation states that the read is unchecked, what a missing key yields, and the only map it may be used on.
 * @evidence contracts/performance.md#cost-and-resources One property read with no allocation; builders call it a handful of times per generated recipe.
 * @author Samchon
 */
export const numberParameter = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => parameters[key] as number;

/**
 * Read one parameter as the string the design gate already accepted.
 *
 * Like `numberParameter`, an unchecked cast that returns `undefined` for a
 * missing key; use it only on the accepted map `build` receives.
 *
 * @param parameters Parameter map the design gate accepted.
 * @param key Parameter name whose schema kind is `string`.
 * @returns The stored value, unchecked.
 *
 * @evidence contracts/common.md#principled-implementation The cast relies on the gate having compared this key's `typeof` with the schema's `string` kind before `build` runs, as primitive-prop's `shape` is checked.
 * @evidence contracts/common.md#clear-and-simple-design A separate string reader keeps each cast's target type explicit at the call site instead of a generic reader whose type parameter would be an unchecked assertion too.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The documentation states the unchecked behavior for a map that skipped the gate, so no caller is led to treat the result as validated.
 * @evidence contracts/common.md#meaningful-documentation The documentation states that the read is unchecked, what a missing key yields, and that only the accepted build map is a valid input.
 * @evidence contracts/performance.md#cost-and-resources A single property read with no allocation, called once per primitive-prop build.
 * @author Samchon
 */
export const stringParameter = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): string => parameters[key] as string;

/**
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
 * @param parameters Parameter map that may not have passed the design gate.
 * @param key Parameter name to read.
 * @returns The value when it is a finite number, otherwise zero.
 *
 * @evidence contracts/common.md#principled-implementation A `typeof` check plus `Number.isFinite` admits exactly the finite numbers, so a missing key, a string, a boolean, `NaN` or an infinity all become zero and arithmetic over the result stays finite.
 * @evidence contracts/common.md#clear-and-simple-design One guarded read serves every `projectionRadius`, which is the only member that must answer for an unjudged map with a number.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero is a documented placeholder for an input the gate will refuse, not a default that makes a bad recipe pass; out-of-range values are left for the gate to refuse.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why the read must not throw or yield NaN, what zero means, and that out-of-range values are not clamped.
 * @evidence contracts/performance.md#cost-and-resources One property read and two primitive checks with no allocation, called a few times per recipe while the radius table is filled.
 * @author Samchon
 */
export const numberOf = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => {
  const value: number | string | boolean | undefined = parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};
