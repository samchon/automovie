import { triangulateAutoMovieRegion } from "@automovie/engine";

/**
 * Triangulate a shared skin annulus without flattening or copying its vertices.
 * Both loops follow their enclosed surface winding and must project as strictly
 * nested simple rings. The engine's canonical-to-input permutation retains the
 * resident XYZ identities, including unequal ring populations. Reversed
 * matching winding reverses every emitted face without changing those IDs.
 *
 * Positions use construction mm and are read only. Admission finishes before
 * the caller appends returned indices, so an impossible join changes no cage.
 * Common subdivision and normal computation remain with the skin assembler.
 */
export function portraitSkinAnnulus(
  positions: readonly (readonly number[])[],
  outer: readonly number[],
  inner: readonly number[],
): number[] {
  const point = (id: number) => {
    const p = positions[id];
    if (p === undefined || p.length !== 3 || !p.every(Number.isFinite))
      throw new Error(
        "A skin annulus needs finite resident XYZ boundary positions.",
      );
    return { x: p[0] / 1000, y: p[1] / 1000 };
  };
  const outerPoints = outer.map(point),
    innerPoints = inner.map(point);
  const triangulated = triangulateAutoMovieRegion({
    outer: outerPoints,
    holes: [innerPoints],
  });
  const identities = [...outer, ...inner];
  const mapped = triangulated.sourceIndices.map((index) => identities[index]);
  const reversed = mapped[0] !== outer[0];
  const innerReversed = mapped[triangulated.rings[1].start] !== inner[0];
  if (reversed === innerReversed)
    throw new Error(
      "Skin annulus boundaries must have matching projected winding.",
    );
  const indices: number[] = [];
  for (let i = 0; i < triangulated.triangles.length; i += 3) {
    const [a, b, c] = triangulated.triangles
      .slice(i, i + 3)
      .map((v) => mapped[v]);
    indices.push(a, reversed ? c : b, reversed ? b : c);
  }
  return indices;
}
