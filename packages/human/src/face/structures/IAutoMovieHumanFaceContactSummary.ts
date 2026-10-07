import type { IAutoMovieHumanFaceContactResolutionSummary } from "./IAutoMovieHumanFaceContactResolutionSummary";
import type { IAutoMovieHumanFaceTonguePassageSummary } from "./IAutoMovieHumanFaceTonguePassageSummary";

/**
 * What the coupled oral contact evaluation measured and did for one document,
 * in the units a reader checks: apertures in metres along the opening
 * direction (the central lip pair and the margin chains), the central closure gain, the
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
 * @evidence contracts/common.md#principled-implementation Every value is read on the final posed geometry the render receives, after closure and contact.
 * @evidence contracts/common.md#clear-and-simple-design One record per evaluation: apertures, the central closure gain, passage and contact counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused evaluation produces no summary; no value is substituted.
 * @evidence contracts/common.md#meaningful-documentation States what each value measures and what the summary does not certify.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The summary names surfaces only to report contact counts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The summary is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The summary emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Apertures and depths are metres along the contact frame's opening direction.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The summary builds no boundary.
 * @evidence contracts/modeling.md#rendered-observation It reports the geometry the viewer and export display.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The summary carries no anatomical norm.
 * @evidenceExclude contracts/anatomy.md#permitted-range Refusals, not the summary, bound values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The summary is output, not input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactSummary {
  /** Final signed interlabial gap, metres: registered source-span representative or the legacy authored pair. */
  interlabialMetres: number;

  /** Final signed gap of each lip margin chain vertex against the opposite chain, metres, upper chain then lower; absent without a margin. */
  marginInterlabialMetres?: number[];

  /**
   * Authored native-companion pair's final projected gap, metres, when source
   * closure uses a different registered representative for interlabialMetres.
   * This retains that actual source diagnostic and does not measure full seal.
   */
  sourceNativeInterlabialMetres?: number;

  /** Signed registered interincisal gap in metres, or null when an authored absent crown removes its representative. Actual oral passage remains independently read from retained dentition and lips. */
  interincisalMetres: number | null;

  /** Nonnegative closure gain per unit closure weight that brings the central lip pair to margin contact; source-span mode evaluates it at fixed native endpoints. */
  closureRatio: number;

  /** Tongue past the incisal plane: how far and how thick over the slab, or null when it stayed behind. */
  passage: IAutoMovieHumanFaceTonguePassageSummary | null;

  /** Per soft surface, welded vertices moved back to their rest clearance and the deepest penetration found. */
  resolved: IAutoMovieHumanFaceContactResolutionSummary[];
}
