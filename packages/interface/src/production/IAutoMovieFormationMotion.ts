import { AutoMovieFormationCapability } from "./AutoMovieFormationCapability";
import { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import { IAutoMovieFormationMotionState } from "./IAutoMovieFormationMotionState";

/**
 * One source-authored compact formation cue.
 *
 * Capability labels do not grant this motion. The source explicitly authors
 * each cue, while arbitrary per-slot curves remain outside the public shape.
 *
 * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `IAutoMovieFormationMotion` as the portable data boundary for the motion external source basis requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `IAutoMovieFormationMotion` for the performance motion external adoption receipt system contract.
 */
export interface IAutoMovieFormationMotion {
  /**
   * Stable cue id, unique inside one shot.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `id` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `id` for the performance motion external adoption receipt system contract.
   */
  id: string;
  /**
   * Participating compiled formation id.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `formation` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `formation` for the performance motion external adoption receipt system contract.
   */
  formation: string;
  /**
   * Review-facing action expressed by this exact cue.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `action` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `action` for the performance motion external adoption receipt system contract.
   */
  action: AutoMovieFormationCapability;
  /**
   * Which of the unit figure's declared gaits its members perform here.
   *
   * A cue says where a unit goes; this says what its members are doing while
   * they go there, and it is the whole of how one group holds, then moves, then
   * holds again inside a single shot. The name is the figure's own
   * (`IAutoMovieGait.name`), so the vocabulary belongs to whoever authored the
   * recipe rather than to a fixed list: a cycle a crowd can perform is a cycle
   * a cue can call for.
   *
   * Omitted, the cue's `action` label is tried as a gait name, and the figure's
   * first declared gait performs when nothing carries that name. A named gait
   * no figure of the unit declares is refused rather than silently replaced.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `gait` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `gait` for the performance motion external adoption receipt system contract.
   */
  gait?: string;

  /**
   * The arrangement this unit is in when the cue ends.
   *
   * A unit's `layout` is a design constant: it says how the unit is arranged,
   * once, for the whole production. That is the right unit for how a crowd is
   * built and the wrong one for a crowd that re-forms -- a line becoming a
   * column, a block falling into an arc, a scatter closing into ranks. Spacing
   * alone cannot say it: opening and closing an arrangement is not changing
   * it.
   *
   * Each member travels from its place in the design's arrangement to its place
   * in this one, in the unit's own frame, on this cue's declared easing. Any
   * two arrangements re-form into one another whatever their kinds, because
   * what is blended is where a member stands and not the parameters that put it
   * there.
   *
   * Omitted, the unit keeps the arrangement it is already in, and the compiled
   * cue is byte-identical to one authored before this channel existed.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `layout` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `layout` for the performance motion external adoption receipt system contract.
   */
  layout?: IAutoMovieFormationDesign["layout"];
  /**
   * Inclusive shot-local cue start.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `start` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `start` for the performance motion external adoption receipt system contract.
   */
  start: number;
  /**
   * Exclusive shot-local cue end.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `end` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `end` for the performance motion external adoption receipt system contract.
   */
  end: number;
  /**
   * State at cue start.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `from` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `from` for the performance motion external adoption receipt system contract.
   */
  from: IAutoMovieFormationMotionState;
  /**
   * State at cue end.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `to` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `to` for the performance motion external adoption receipt system contract.
   */
  to: IAutoMovieFormationMotionState;
  /**
   * Deterministic interpolation curve.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-source-basis Exposes `easing` as the portable data boundary for the motion external source basis requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types `easing` for the performance motion external adoption receipt system contract.
   */
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "step";
}
