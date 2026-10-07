/**
 * Overwrite one region of a per-sample vector field with a sampled fill
 * operator: each interior sample becomes the operator's combination of the
 * boundary samples, component by component.
 *
 * The operator is the biharmonic fill of the region from its two surrounding
 * vertex rings (`mpfb_generation/flatten.py`), row-major interior by
 * boundary, and each row sums to one. It is linear and acts per component,
 * so it applies alike to absolute positions in any frame and to
 * displacements. The product is summed in index order. An explicit
 * native-to-source map addresses the same original operator after active
 * compaction; retired operator support refuses.
 */
export function fillHumanSourceRegion(
  interior: Int32Array,
  boundary: Int32Array,
  operator: Float64Array,
  values: Float64Array,
  nativeToSource?: Int32Array,
): void {
  if (operator.length !== interior.length * boundary.length)
    throw new Error(
      "A fill operator does not match its interior and boundary populations.",
    );
  const map = (native: number): number => {
    const source =
      nativeToSource === undefined ? native : nativeToSource[native];
    if (
      !Number.isSafeInteger(source) ||
      source < 0 ||
      3 * source + 2 >= values.length
    )
      throw new Error(
        `Fill support ${native} is retired or outside this source field.`,
      );
    return source;
  };
  const inside = interior.map(map);
  const around = boundary.map(map);
  const k = around.length;
  for (let i = 0; i < inside.length; i++)
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let j = 0; j < k; j++)
        sum += operator[i * k + j] * values[3 * around[j] + c];
      values[3 * inside[i] + c] = sum;
    }
}
