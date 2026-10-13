import { IAutoMovieFormationDesign } from "@automovie/interface";

/**
 *
 * The arrangement a unit is travelling toward, and how far along it is.
 *
 * Carried beside the sampled state rather than inside it, because `from` and
 * `to` are what an author writes and a re-form is a property of the cue rather
 * than of either end: a cue states one target arrangement, and both its ends
 * describe the same unit standing in different places. `progress` is the cue's
 * own eased progress, so a re-form bends on the curve its author declared and
 * not on a second one.
 *
 * After the cue ends, `sampleFormationMotion` keeps the reform with `progress`
 * at 1, and later cues that declare no layout carry it unchanged, so a unit
 * stays re-formed until another cue names a layout.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the cue's target layout with the cue's own eased progress, and `formationSlotPosition` blends the designed and target slot points by it in the unit's local frame before heading and terrain apply.
 * @evidence contracts/common.md#clear-and-simple-design Kept beside the sampled motion state rather than inside the cue's `from` and `to` states, because a re-form belongs to the cue while both ends describe one unit in two places.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Holding progress at 1 after the cue is the sampler's documented retention rule so a re-formed unit does not snap back, not a correction aimed at any consumer.
 * @evidence contracts/common.md#meaningful-documentation States why the reform sits beside the state, that progress follows the author's easing within 0 to 1, and that it is held at 1 after the cue ends.
 * @evidenceExclude contracts/performance.md#cost-and-resources Two fields; blending costs one extra local slot evaluation per member inside `formationSlotPosition`. Rebuilt each time motion is sampled, and the record has no identity a later sample could reuse. References the cue's layout object and holds one number; the cue list owns that layout.
 * @author Samchon
 */
export interface IAutoMovieFormationReform {
  /** The arrangement the unit is in when the cue ends, in the unit's own frame. */
  layout: IAutoMovieFormationDesign["layout"];

  /**
   * Eased fraction of the way there: 0 at the cue's start, 1 at its end, and
   * held at 1 afterwards.
   */
  progress: number;
}
