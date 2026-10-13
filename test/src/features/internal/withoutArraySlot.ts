/** Copy a dense test fixture into a same-length array with an intentionally absent own slot at the given in-range integer index. */
export function withoutArraySlot<Value>(values: readonly Value[], missing: number): Value[] {
  const sparse: Value[] = new Array<Value>(values.length);
  for (let index: number = 0; index < values.length; ++index)
    if (index !== missing) sparse[index] = values[index]!;
  return sparse;
}
