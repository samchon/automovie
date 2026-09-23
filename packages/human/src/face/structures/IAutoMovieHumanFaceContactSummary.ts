/**
 * What the coupled oral contact evaluation measured and did for one document,
 * in the units a reader checks: apertures in metres along the opening
 * direction, the closure ratio the lip closure channel was scaled by, the
 * tongue's protrusion and passage thickness when it crossed the incisal
 * plane, and per soft surface how many vertices were moved back to their
 * rest clearance and how deep the deepest one had gone.
 *
 * The summary describes what the evaluator did to the geometry a render
 * used; it certifies no visual acceptance. A refused document never
 * produces one, because the refusal names the deficient channel and the
 * millimetres instead.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-contact Reports resolved vertex counts and depths beside the apertures the coupled rules were judged on.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact Carries the apertures, ratio, passage measure and resolution counts the evaluation order produces.
 */
export interface IAutoMovieHumanFaceContactSummary {
  /** Signed interlabial gap along the opening direction after closure, metres. */
  interlabialMetres: number;

  /** Signed interincisal gap along the opening direction, metres. */
  interincisalMetres: number;

  /** Ratio of the current lip aperture to the reference aperture, never negative. */
  closureRatio: number;

  /** Tongue past the incisal plane: how far and how thick over the slab, or null when it stayed behind. */
  passage: { protrudingMetres: number; thicknessMetres: number } | null;

  /** Per soft surface, welded vertices moved back to their rest clearance and the deepest penetration found. */
  resolved: { surface: string; vertices: number; maxDepthMetres: number }[];
}
