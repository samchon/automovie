import { triangulateAutoMovieRegion, type IAutoMovieRegionTriangulation as IAutoMovieRegionTriangulationImported } from "@automovie/engine";



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
 * @evidence contracts/common.md#principled-implementation The engine admits strictly nested simple XY rings and triangulates their region; canonical source-index permutation maps every face back to resident XYZ identities and matching source winding reverses emitted orientation when needed.
 * @evidence contracts/common.md#clear-and-simple-design This adapter owns millimetre-to-metre chart conversion and native index restoration; planar admission/triangulation remain the existing engine's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No new vertex position, flattening, guessed ring radius or subject-specific boundary replaces the admitted annulus; unsupported projected winding refuses before cage mutation.
 * @evidence contracts/common.md#meaningful-documentation The prose gives projected nested-ring premises, unequal populations, read-only millimetre geometry, source-index retention and separate subdivision/normal ownership.
 * @evidence contracts/performance.md#efficient-algorithms For B total ring vertices, conversion/index mapping and output restoration are O(B plus emitted triangles); the engine's region admission/triangulation cost remains part of this operation, with no second triangulation or XYZ copy.
 * @evidence contracts/performance.md#reuse-equivalent-work One triangulation supplies both permutation and face output; changed rings/coordinates need fresh admission and no annulus result is cached by ring ids alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Projected ring arrays and permutation maps are local, and only returned indices escape; failure modifies neither host positions nor caller cage and retains no external resource.
 */
export function portraitSkinAnnulus(
  positions: readonly (readonly number[])[],
  outer: readonly number[],
  inner: readonly number[],
): number[] {
  const point: (id: number) => { x: number; y: number; } = (id: number): { x: number; y: number; }  => {
    const p: readonly number[] = positions[id];
    if (p === undefined || p.length !== 3 || !p.every(Number.isFinite))
      throw new Error(
        "A skin annulus needs finite resident XYZ boundary positions.",
      );
    return { x: p[0] / 1000, y: p[1] / 1000 };
  };
  const outerPoints: { x: number; y: number; }[] = outer.map(point),
    innerPoints: { x: number; y: number; }[] = inner.map(point);
  const triangulated: IAutoMovieRegionTriangulationImported = triangulateAutoMovieRegion({
    outer: outerPoints,
    holes: [innerPoints],
  });
  const identities: number[] = [...outer, ...inner];
  const mapped: number[] = triangulated.sourceIndices.map((index: number): number  => identities[index]);
  const reversed: boolean = mapped[0] !== outer[0];
  const innerReversed: boolean = mapped[triangulated.rings[1].start] !== inner[0];
  if (reversed === innerReversed)
    throw new Error(
      "Skin annulus boundaries must have matching projected winding.",
    );
  const indices: number[] = [];
  for (let i: number = 0; i < triangulated.triangles.length; i += 3) {
    const [a, b, c]: number[] = triangulated.triangles
      .slice(i, i + 3)
      .map((v: number): number  => mapped[v]);
    indices.push(a, reversed ? c : b, reversed ? b : c);
  }
  return indices;
}
