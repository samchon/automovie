import { IAutoMovieFormationDesign } from "@automovie/interface";

/**
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
 * @evidence contracts/development/design.md#principled-representation Pairs the cue target with eased progress and optional previous completed layout; formationSlotPosition blends from that arrangement, or the design when absent, in local space before heading and terrain apply.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Kept beside the sampled motion state rather than inside the cue's `from` and `to` states, because a re-form belongs to the cue while both ends describe one unit in two places.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Holding progress at 1 after the cue is the sampler's documented retention rule so a re-formed unit does not snap back, not a correction aimed at any consumer.
 * @evidence contracts/development/common.md#meaningful-documentation States cue ownership, eased progress/retention and optional fromLayout's previous-completed-layout meaning; absence preserves the original design-to-target API.
 */
export interface IAutoMovieFormationReform {
  /** The arrangement the unit is in when the cue ends, in the unit's own frame. */
  layout: IAutoMovieFormationDesign["layout"];

  /** Previous completed arrangement; absent starts at the formation design. */
  fromLayout?: IAutoMovieFormationDesign["layout"];

  /**
   * Eased fraction of the way there: 0 at the cue's start, 1 at its end, and
   * held at 1 afterwards.
   */
  progress: number;
}
