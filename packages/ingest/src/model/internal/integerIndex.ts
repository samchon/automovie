import { validNodeIndex } from "./validNodeIndex";

/** Admit an optional or required index into an already declared inventory. */
export function integerIndex(
  value: unknown,
  length: number,
  path: string,
  required: boolean = false,
): void {
  if (value === undefined && required === false) return;
  if (validNodeIndex(value, length) === false)
    throw new Error(`${path} does not resolve inside its declared inventory.`);
}
