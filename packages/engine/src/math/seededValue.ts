import { mixSeed } from "./mixSeed";

/**
 * Return one deterministic half-open [0, 1) sample from ordered seed parts.
 *
 * Callers must include a stable domain constant when the same identities feed
 * independent decisions such as misfire, hit, scale, or palette.
 *
 * @evidence requirements/product/prototype-quality.md#product-authored-variation-determinism Maps stable authored identities to the same bounded variation value on every replay.
 * @evidence specifications/authoring-and-authority/prototype-determinism-and-fidelity.md#spec-authoring-deterministic-input-identity Maps stable authored identities to the same bounded variation value on every replay.
 */
export const seededValue = (...values: number[]): number => {
  let state = 0x9e3779b9;
  for (const value of values) state = mixSeed(value, state);
  state = (state + 0x6d2b79f5) >>> 0;
  let output = state;
  output = Math.imul(output ^ (output >>> 15), output | 1);
  output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
  return ((output ^ (output >>> 14)) >>> 0) / 4_294_967_296;
};
