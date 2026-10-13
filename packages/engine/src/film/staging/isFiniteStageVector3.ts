import { isRecord } from "../../validation/isRecord";

/**
 * Whether a staged value is an object whose `x`, `y` and `z` are all finite
 * numbers.
 *
 * It checks without repairing, so the caller reports the authored value as
 * written. The value is `unknown` because `stage` is reachable in-process
 * without the transport's structural gate, so a `null` or array where a vector
 * belongs answers `false` instead of throwing a `TypeError`. Positions are in
 * metres; light directions are unitless and may have any non-zero length,
 * which this test does not judge.
 *
 * @param vector A staged position, target or direction, as authored.
 * @returns `true` only for a non-array object whose three components are finite.
 *
 * @evidence contracts/common.md#principled-implementation `isRecord` first rejects `null`, arrays and primitives, then `Number.isFinite` rejects `NaN`, both infinities and non-number values without coercion, which is exactly the set no later transform or projection can use.
 * @evidence contracts/common.md#clear-and-simple-design One predicate shared by the staging gate's position, target and light checks, so every staged vector is judged finite, and totally, by the same rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No axis or caller is special-cased, and a failing vector is reported by the caller rather than clamped or zeroed.
 * @evidence contracts/common.md#meaningful-documentation States what is tested, why the input is `unknown`, that nothing is repaired, the units of the vectors it serves, and that direction length is not judged.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One shape test and three finiteness tests in constant time, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate on one value that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads three fields and returns a boolean, allocating and retaining nothing.
 */
export const isFiniteStageVector3 = (vector: unknown): boolean =>
  isRecord(vector) &&
  Number.isFinite(vector.x) &&
  Number.isFinite(vector.y) &&
  Number.isFinite(vector.z);
