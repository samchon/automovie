import { nclose } from "./nclose";

/**
 * Compare the existing finite plain geometry records without a numeric tolerance. Numeric leaves use nclose(..., 0); array width/order/hole presence, ordered enumerable keys, null, undefined and other discrete leaves retain their meaning.
 *
 * This assertion observer accepts acyclic arrays/plain records, with linear visited-component work, depth-proportional stack and temporary key arrays. It retains no resource and does not distinguish numeric zero signs; the ray caster's explicit Object.is checks own that representation contract. It neither generates expected values nor validates meshes.
 */
export function equalGeometryTestValues(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "number" || typeof expected === "number")
    return typeof actual === "number" && typeof expected === "number" &&
      Number.isFinite(expected) && nclose(actual, expected, 0);
  if (actual === null || expected === null ||
      typeof actual !== "object" || typeof expected !== "object")
    return actual === expected;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) ||
        actual.length !== expected.length) return false;
    for (let index: number = 0; index < actual.length; index++)
      if (Object.hasOwn(actual, index) !== Object.hasOwn(expected, index) ||
          !equalGeometryTestValues(actual[index], expected[index])) return false;
    return true;
  }
  const actualKeys: string[] = Object.keys(actual);
  const expectedKeys: string[] = Object.keys(expected);
  return actualKeys.length === expectedKeys.length &&
    actualKeys.every((key: string, index: number): boolean =>
      key === expectedKeys[index] && equalGeometryTestValues(
        (actual as Record<string, unknown>)[key],
        (expected as Record<string, unknown>)[key],
      ));
}
