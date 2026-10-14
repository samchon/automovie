import { nclose } from "./nclose";

/**
 * Compare plain product records for exact copy or replay identity, using nclose with zero tolerance for finite numeric fields.
 *
 * Callers supply authored records or copy/replay pairs; this predicate supplies no expected product output. It distinguishes scalar values, ordered array slots and own enumerable string keys recursively. Prototypes, nonenumerable fields, symbols, cyclic graphs and opaque host objects are outside the plain-data contract.
 */
export function sameProductData(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "number" || typeof expected === "number")
    return (
      typeof actual === "number" &&
      typeof expected === "number" &&
      nclose(actual, expected, 0)
    );
  if (actual === null || expected === null) return actual === expected;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) return false;
    if (actual.length !== expected.length) return false;
    for (let index: number = 0; index < actual.length; ++index)
      if (
        Object.hasOwn(actual, index) !== Object.hasOwn(expected, index) ||
        !sameProductData(actual[index], expected[index])
      )
        return false;
    return true;
  }
  if (typeof actual !== "object" || typeof expected !== "object")
    return actual === expected;
  const observed: Record<string, unknown> = actual as Record<string, unknown>;
  const wanted: Record<string, unknown> = expected as Record<string, unknown>;
  const keys: string[] = Object.keys(observed);
  if (keys.length !== Object.keys(wanted).length) return false;
  for (const key of keys)
    if (!Object.hasOwn(wanted, key) || !sameProductData(observed[key], wanted[key]))
      return false;
  return true;
}
