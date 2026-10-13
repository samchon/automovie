import type { IAutoMovieHumanFaceContactResolutionSummary } from "./IAutoMovieHumanFaceContactResolutionSummary";
import type { IAutoMovieHumanFaceTonguePassageSummary } from "./IAutoMovieHumanFaceTonguePassageSummary";

/**
 * What the coupled oral contact evaluation measured and did for one document,
 * in the units a reader checks: apertures in metres along the opening
 * direction (the central lip pair and the margin chains), the central closure gain, the
 * tongue's protrusion and passage thickness when it crossed the incisal
 * plane, and per soft surface how many vertices were moved back to their
 * rest floors and the largest initial excess past a floor.
 *
 * The summary describes what the evaluator did to the geometry a render
 * used; it certifies neither visual acceptance nor an orientation-preserving,
 * intersection-free skin. The ordinary builder's success-only observer publishes no summary for a refused document; explicit construction keeps its separate admission observations.
 *
 * @evidence contracts/common.md#principled-implementation Actual final apertures, native closure diagnostic/gain, measured tongue passage and direct soft correction summaries report the evaluated document rather than its requested controls alone.
 * @evidence contracts/common.md#clear-and-simple-design Named metric outputs separate representative/native gaps, optional margin chains, absent incisal representative, no-passage state and per-surface correction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source native pair gap is not full seal, missing incisor representative is not zero, and success publication is no clinical/visual or globally embedded-skin certificate.
 * @evidence contracts/common.md#meaningful-documentation Members supply signed metre meanings, chain order, source-span distinction, optional/null states and floor-relative corrected population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This report schema runs no closure replay, passage section or contact correction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The report defines no geometry cache; the publisher delivers the actual admitted observation without a second build.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observer receives an owned summary, including optional chain arrays; this type opens no evaluator/resource handle.
 *
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

  /** Per soft surface, directly corrected posed-coordinate groups and maximum initial rest-floor excess. */
  resolved: IAutoMovieHumanFaceContactResolutionSummary[];
}
