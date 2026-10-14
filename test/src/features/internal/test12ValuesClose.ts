import { nclose } from "./nclose";

/**
 * Compare resident plain records and arrays with identical own keys; every numeric component uses nclose with zero tolerance to preserve these tests' original exact-copy and boundary expectations. This comparator neither derives expected values nor normalizes quaternion signs.
 */
export function test12ValuesClose(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "number" && typeof expected === "number")
    return nclose(actual, expected, 0);
  if (actual === null || expected === null || typeof actual !== "object" || typeof expected !== "object")
    return actual === expected;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  if (Array.isArray(actual) && Array.isArray(expected) && actual.length !== expected.length) return false;
  const actualKeys: string[] = Object.keys(actual);
  const expectedKeys: string[] = Object.keys(expected);
  if (actualKeys.length !== expectedKeys.length) return false;
  const actualRecord: Record<string, unknown> = actual as Record<string, unknown>;
  const expectedRecord: Record<string, unknown> = expected as Record<string, unknown>;
  return expectedKeys.every((key: string): boolean => Object.hasOwn(actual, key) && test12ValuesClose(actualRecord[key], expectedRecord[key]));
}
