import { AutoMovieArchetypeParameters } from "./AutoMovieArchetypeParameters";

/**
 * Read one parameter as a finite number, or zero when it is neither.
 *
 * A projection radius must answer a map no design gate judged, because the
 * production package exports its radius table to scripts outside the builder,
 * so a missing, mistyped or non-finite value must still yield a number instead
 * of poisoning a bound with `NaN`.
 *
 * Zero keeps the measurement finite but is not a dimension, and a finite
 * out-of-range value passes through unchanged, so the result is a trustworthy
 * bound only once the gate accepts the map.
 *
 * @param parameters Parameter map that may not have passed the design gate.
 * @param key Parameter name to read.
 * @returns The value when it is a finite number, otherwise zero.
 *
 * @evidence contracts/common.md#principled-implementation A `typeof` check followed by `Number.isFinite` admits exactly the finite numbers, so a missing key, a string, a boolean, `NaN` or an infinity all become zero and the arithmetic of a radius over the result stays finite.
 * @evidence contracts/common.md#clear-and-simple-design One guarded read serves every `projectionRadius` in the catalogue, the only archetype member that must answer an unjudged map with a number, while builders use the casting readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero is the documented placeholder for input the gate refuses, not a default that lets a bad recipe pass, and out-of-range values are left unclamped for the gate to refuse.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the read must neither throw nor yield `NaN`, what zero means, and that out-of-range values are not clamped.
 * @evidence contracts/performance.md#efficient-algorithms One property read and two primitive checks with no allocation, called at most three times per recipe while the radius table is filled.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The radius table already computes each recipe's radius once, so the reads under it never repeat for the same map.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The guard returns a primitive and holds nothing after it returns.
 * @author Samchon
 */
export const numberOf = (
  parameters: AutoMovieArchetypeParameters,
  key: string,
): number => {
  const value: AutoMovieArchetypeParameters[string] | undefined =
    parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};
