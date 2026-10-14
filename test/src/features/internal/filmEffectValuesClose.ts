import { nclose } from "./nclose";
import { compareCodeUnits } from "../../../../packages/engine/src/text/compareCodeUnits";

/** Compare the film tests' dense effect, camera-intent and camera-clip records while checking every finite numeric leaf with nclose at 1e-12 absolute tolerance. Array length/order and object key sets remain exact, so omitted fields, extra fields and reordered entries cannot be hidden by numeric closeness. This does not compare prototypes, object identity, cyclic graphs or unadmitted nonfinite numbers. */
export function filmEffectValuesClose(actual: unknown, expected: unknown): boolean {
  if (typeof expected === "number")
    return typeof actual === "number" && nclose(actual, expected, 1e-12);
  if (expected === null || typeof expected !== "object") return actual === expected;
  if (actual === null || typeof actual !== "object") return false;
  if (Array.isArray(actual) !== Array.isArray(expected)) return false;
  if (Array.isArray(actual) && Array.isArray(expected) && actual.length !== expected.length)
    return false;
  const actualKeys: string[] = Object.keys(actual).sort(compareCodeUnits);
  const expectedKeys: string[] = Object.keys(expected).sort(compareCodeUnits);
  if (actualKeys.length !== expectedKeys.length) return false;
  const actualRecord: Record<string, unknown> = actual as Record<string, unknown>;
  const expectedRecord: Record<string, unknown> = expected as Record<string, unknown>;
  return expectedKeys.every((key: string, index: number): boolean =>
    actualKeys[index] === key && filmEffectValuesClose(actualRecord[key], expectedRecord[key]),
  );
}
