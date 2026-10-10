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
