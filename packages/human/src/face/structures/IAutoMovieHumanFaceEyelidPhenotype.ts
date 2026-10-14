/**
 * Coarse resting lid appearance expressed as morphology and visible lengths.
 *
 * Crease height is the superior distance from the upper margin to the source
 * crease on the source optical-support vertical, in head-frame millimetres.
 * That chart approximates the pupil vertical; cage crease/hood roles are
 * authored source conventions, not acquired clinical landmarks. The choices
 * request prototype morphology and certify neither ancestry nor histology.
 * Uncreased skin removes the source groove without collapsing its rows;
 * inset creasing combines the source groove with explicitly stated hood overlap.
 *
 * @evidence contracts/common.md#principled-implementation Named prototype crease/hood and source medial-fold choices resolve on actual registered skin/optical support, with source-row spacing constraining visible lengths and aliases receiving the same deformation.
 * @evidence contracts/common.md#clear-and-simple-design Crease class, height, hood overlap and medial-fold endpoint retain distinct meanings; bilateral ownership belongs to EyelidPhenotypes and motion to source residuals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source chart/rows are not clinical pupil landmarks, single crease cannot also author visible height/overlap, inset needs explicit overlap and duplicate raw/source-row controls refuse.
 * @evidence contracts/common.md#meaningful-documentation The comment states source optical vertical, authored morphology and no ancestry/histology certification; members give millimetres, sparse retention and endpoint meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type executes no cage deformation or source-channel expansion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Morphology values supply inputs, not a skin/cage result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The document owns optional traits; the declaration acquires no cage buffers or task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyelidPhenotype {
  /** Resting prototype crease visibility; omission retains the source groove. */
  crease?: "single" | "double" | "inset";

  /** Upper margin to crease on the source optical-support vertical, positive mm. */
  creaseHeightMm?: number;

  /** Superior hood edge's overlap below the crease, nonnegative mm; inset requires an explicit value. */
  hoodOverlapMm?: number;

  /** Retracted or prominent source medial-fold endpoint; omission retains the source identity weight. */
  epicanthalFold?: "retracted" | "prominent";
}
