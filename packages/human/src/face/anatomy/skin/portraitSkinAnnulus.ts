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
 *
 * @evidence contracts/common.md#principled-implementation The ring between an outer loop and an inner loop is triangulated by the engine's region triangulator in the XY projection, and the canonical-to-input permutation maps the result back to resident vertex identities, so no vertex is copied and unequal ring populations are supported; a mismatch between the two loops' windings is refused.
 * @evidence contracts/common.md#clear-and-simple-design It adapts the engine triangulator to resident identities and adds only the winding reconciliation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission finishes before any index is returned, so an impossible join changes no cage.
 * @evidence contracts/common.md#meaningful-documentation States the nesting requirement, that positions are read only and that subdivision and normals stay with the assembler.
 * @evidence contracts/modeling.md#emitted-geometry An annulus of outer and inner vertex counts n and m needs exactly n + m triangles; the triangulator emits no interior vertices, so the population is fixed by the two loops.
 * @evidence contracts/modeling.md#spatial-conventions Construction millimetres in, metres for the engine triangulator; the single division by 1000 is the named conversion and only the projection to XY enters the triangulation (depth stays on the resident vertices).
 * @evidence contracts/modeling.md#shared-boundaries Both loops are the resident boundaries of the surrounding skin and of the inserted part, and the triangles are built from their identities, so the join has no gap by construction; it fails when the loops are not strictly nested simple rings in projection.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping portraitSkinAnnulus is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels portraitSkinAnnulus defines and consumes no parameter channel.
 * @evidenceExclude contracts/anatomy.md#anatomical-source portraitSkinAnnulus carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range portraitSkinAnnulus admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority portraitSkinAnnulus defines no input through which a caller shapes a human form.
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
