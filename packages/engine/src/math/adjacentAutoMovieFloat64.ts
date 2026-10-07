const bits = new DataView(new ArrayBuffer(8));

/**
 * The finite neighbouring binary64 scalar in one ordered direction.
 * Arithmetic enclosures use this after a rounded operation; no spatial epsilon
 * or physical unit is introduced. Zero neighbours are the signed smallest
 * subnormals. Stepping beyond the largest finite magnitude refuses by name.
 * The shared buffer is private and every call completes synchronously.
 * IEEE binary64 magnitude encodings are ordered integers; negative encodings
 * reverse that order. Two unsigned words carry/borrow without BigInt allocation.
 * Geometry projection intervals and numerical attachment rays share this owner.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies representable outward neighbours for conservative geometry arithmetic instead of a fixed spatial tolerance.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Refuses nonfinite enclosing arithmetic and preserves the represented binary64 coordinate boundary used by geometry checks.
 * @author Samchon
 */
export function adjacentAutoMovieFloat64(
  value: number,
  upper: boolean,
): number {
  if (!Number.isFinite(value))
    throw new Error(
      "Geometry intervals require representable finite arithmetic.",
    );
  if (value === 0) return upper ? Number.MIN_VALUE : -Number.MIN_VALUE;
  bits.setFloat64(0, value);
  const high = bits.getUint32(0),
    low = bits.getUint32(4);
  if (value > 0 === upper) {
    bits.setUint32(0, high + (low === 0xffffffff ? 1 : 0));
    bits.setUint32(4, low + 1);
  } else {
    bits.setUint32(0, high - (low === 0 ? 1 : 0));
    bits.setUint32(4, low - 1);
  }
  const result = bits.getFloat64(0);
  if (!Number.isFinite(result))
    throw new Error("Geometry intervals cannot enclose an overflowing result.");
  return result;
}
