/*
 * Refuse a gradient-noise coordinate that is not finite or whose finest lattice
 * coordinate leaves the noise's domain bound.
 *
 * Each lattice corner's gradient is read from the counter stream at an index
 * built from the corner's integer coordinates, and the stream holds only 2^53
 * indices, so the noise is defined on a bounded lattice. The caller names the
 * coordinate, so the refusal says which input left the domain instead of
 * letting the stream refuse an index the author never wrote.
 * Parameter name: The coordinate's parameter name, such as `x`.
 * Parameter value: The coordinate as given, in lattice units of the first octave.
 * Parameter scale: The finest octave's frequency multiple, 1 for one octave.
 * Parameter bound: The largest admitted finest lattice coordinate magnitude, cells.
 * When `value` is not finite or `|value * scale| > bound`.
 */
export function admitNoiseCoordinate(
  name: string,
  value: number,
  scale: number,
  bound: number,
): void {
  const cells: number = value * scale;
  if (!(Math.abs(cells) <= bound))
    throw new Error(
      `Gradient noise ${name} = ${value} reaches ${cells} lattice cells at its finest octave, outside the domain bound of ±${bound} cells`,
    );
}
