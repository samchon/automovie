import { integerIndex } from "./integerIndex";
import { requiredArray } from "./requiredArray";

/*
 * Validate every index in an optional glTF reference array.
 */
export function integerIndices(
  value: unknown,
  length: number,
  path: string,
): void {
  if (value === undefined) return;
  requiredArray(value, path).forEach((entry: unknown, index: number): void =>
    integerIndex(entry, length, `${path}[${index}]`, true),
  );
}
