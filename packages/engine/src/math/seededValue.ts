import { mixSeed } from "./mixSeed";
/**
 * Return one deterministic half-open [0, 1) sample from ordered seed parts.
 *
 * Callers must include a stable domain constant when the same identities feed
 * independent decisions such as misfire, hit, scale, or palette.
 *
 * @evidence contracts/common.md#principled-implementation Ordered seed parts enter mixSeed and an unsigned 32-bit avalanche; dividing the final word by two to the power 32 guarantees a deterministic half-open unit sample.
 * @evidence contracts/common.md#clear-and-simple-design One scalar generator serves effects, combat and formation decisions, with domain constants supplied by consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed constants define the generator for every input, without fixture outputs, operating-system entropy or a mutable global random stream.
 * @evidence contracts/common.md#meaningful-documentation States ordered parts, half-open output, deterministic behavior and the caller's independent-domain separation duty.
 * @evidence contracts/performance.md#efficient-algorithms K seed parts require K constant-time folds and one final avalanche, using constant scalar state beyond the argument array.
 * @evidence contracts/performance.md#reuse-equivalent-work Parts update one rolling word in order; each call restarts from the same initial word rather than sharing stream history.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The argument array and scalar words live only for the call; no seed identities, generator instance or entropy handle remain.
 */
export const seededValue: (...values: number[]) => number = (...values: number[]): number => {
  let state: number = 0x9e3779b9;
  for (const value of values) state = mixSeed(value, state);
  state = (state + 0x6d2b79f5) >>> 0;
  let output: number = state;
  output = Math.imul(output ^ (output >>> 15), output | 1);
  output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
  return ((output ^ (output >>> 14)) >>> 0) / 4_294_967_296;
};
