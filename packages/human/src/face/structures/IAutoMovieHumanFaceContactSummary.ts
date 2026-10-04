/**
 * What the coupled oral contact evaluation measured and did for one document,
 * in the units a reader checks: apertures in metres along the opening
 * direction, the closure ratio the lip closure channel was scaled by, the
 * tongue's protrusion and passage thickness when it crossed the incisal
 * plane, and per soft surface how many vertices were moved back to their
 * rest clearance and how deep the deepest one had gone.
 *
 * The summary describes what the evaluator did to the geometry a render
 * used; it certifies neither visual acceptance nor an orientation-preserving,
 * intersection-free skin. A refused document never
 * produces one, because the refusal names the deficient channel and the
 * millimetres instead.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactSummary {
  /** Final signed interlabial gap, metres: registered source-span representative or the legacy authored pair. */
  interlabialMetres: number;

  /**
   * Authored native-companion pair's final projected gap, metres, when source
   * closure uses a different registered representative for interlabialMetres.
   * This retains that actual source diagnostic and does not measure full seal.
   */
  sourceNativeInterlabialMetres?: number;

  /** Signed interincisal gap along the opening direction on the final posed geometry, metres. */
  interincisalMetres: number;

  /** Nonnegative native companion aperture ratio; source-span mode evaluates it at fixed native endpoints. */
  closureRatio: number;

  /** Tongue past the incisal plane: how far and how thick over the slab, or null when it stayed behind. */
  passage: { protrudingMetres: number; thicknessMetres: number } | null;

  /** Per soft surface, welded vertices moved back to their rest clearance and the deepest penetration found. */
  resolved: { surface: string; vertices: number; maxDepthMetres: number }[];
}
