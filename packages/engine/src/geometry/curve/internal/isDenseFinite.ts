/** Test every coordinate, refusing sparse rows and nonfinite values. */
export function isDenseFinite(values: readonly number[]): boolean {
  for (let i: number = 0; i < values.length; i++)
    if (!Object.hasOwn(values, i) || !Number.isFinite(values[i])) return false;
  return true;
}
