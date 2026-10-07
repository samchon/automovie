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
 * @evidence contracts/common.md#principled-implementation Named visible distances and closed morphology choices distinguish the requested appearance from private cage coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Four independent traits per anatomical side; optional values retain their source trait.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No personal vertex, curve, patch or inferred hidden tissue is represented.
 * @evidence contracts/common.md#meaningful-documentation States the chart approximation, source qualification and distinction from clinical classification.
 * @evidence contracts/modeling.md#parameter-channels Crease height and hood overlap are absolute superior distances, independent of the source epicanthal endpoint choice.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame millimetres, +Y superior.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source lid skin owns the part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Carries no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The host conversion owns joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The coupled lid assembly observes requested morphology.
 * @evidence contracts/anatomy.md#anatomical-source Ju et al. 2024, Aesthetic Plastic Surgery 48 (PMC11588936), read full text: 301 German Caucasian volunteers, VECTRA M3 stereophotogrammetry, natural head position and forward gaze, coronal-view upper-margin to crease distance at the pupil vertical. The source chart/cage approximation and morphology expansion are authored, not that acquired clinical landmark or a population fit.
 * @evidence contracts/anatomy.md#permitted-range The conversion bounds requested lengths by the actual source rows and assembly contact; no clinical normal interval is asserted.
 * @evidence contracts/anatomy.md#parametric-authority Only named visible lengths and closed choices enter.
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
