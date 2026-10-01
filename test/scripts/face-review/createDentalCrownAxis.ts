/**
 * A directed crown axis from incisal origin toward the cervical reference.
 * Crown-length preparation and registered clinical measurement share this
 * normalization. Inputs are XYZ in one metre frame, owned by their callers.
 * Their anatomical registration is separate from this vector calculation.
 * Scale the differences before normalization: an unscaled subnormal norm
 * can round below its true length and produce a nonunit direction. The length
 * is returned at Float64 precision; an unrepresentable difference or length
 * refuses rather than returning an invalid direction.
 *
 * @evidence contracts/common.md#principled-implementation Scale-first normalization preserves direction independently of rounded subnormal length. Finite positive scaled length gives a unit direction; differences or returned lengths beyond Float64 representation refuse.
 * @evidence contracts/common.md#clear-and-simple-design One normalization is shared by crown-length preparation and registered clinical measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Degenerate or unrepresentable references refuse without a substituted axis or enlarged tolerance.
 * @evidence contracts/common.md#meaningful-documentation States consumers, directed references, units, read-only ownership, subnormal reasoning and representation limits.
 * @evidence contracts/modeling.md#spatial-conventions Both references share one basis metre frame; length remains metres and direction is dimensionless.
 */
export function createDentalCrownAxis(
  incisal: readonly number[],
  cervical: readonly number[],
): { unit: number[]; length: number } {
  const vector = [0, 1, 2].map((axis) => cervical[axis] - incisal[axis]);
  const scale = Math.max(...vector.map(Math.abs));
  if (!(scale > 0) || !Number.isFinite(scale))
    throw new Error("A dental crown axis needs distinct finite reference points and a representable length.");
  const scaled = vector.map((value) => value / scale);
  const scaledLength = Math.hypot(...scaled);
  const length = scale * scaledLength;
  if (!Number.isFinite(length))
    throw new Error("A dental crown axis needs distinct finite reference points and a representable length.");
  return { unit: scaled.map((value) => value / scaledLength), length };
}
