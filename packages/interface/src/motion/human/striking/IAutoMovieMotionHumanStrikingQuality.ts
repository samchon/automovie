import type { IAutoMovieRandom } from "../../../core/IAutoMovieRandom";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";

/**
 * Where a strike lands relative to its aim: the author's declared accuracy plus
 * the performer's seeded endpoint scatter.
 *
 * - `hit`: on the aim point; the weapon stops on the first surface it meets.
 * - `graze`: one weapon width beside it; the weapon glances and follows through.
 * - `miss`: clear of it by two weapon widths and 5 cm; the weapon follows
 *   through.
 * - A vector: that world offset, stopping on whatever it meets.
 *
 * The scatter is impulse variability, a normal draw with the standard deviation
 * `k D / T` of `HumanSkill.scatter` (Schmidt et al. 1979), shaped by skill: a
 * novice scatters isotropically, an expert keeps the error out of the
 * directions that decide the hit, the lateral share falling to 0.3 of the
 * along-line share on the `path` axis (minimal intervention, Todorov and Jordan
 * 2002; provisional share).
 */
export namespace IAutoMovieMotionHumanStrikingQuality {
  /** A declared accuracy. */
  export type Accuracy = "hit" | "graze" | "miss" | IAutoMovieVector3;

  /**
   * The landing offset from the aim point. Input input of
   * StrikingQuality.offset. What the offset depends on.
   */
  export type IOffsetInput = {
    /** The performer's skill. */
    skill: IAutoMovieMotionHumanSkill;
    /** The strike's scatter stream. */
    random: IAutoMovieRandom;
    /** The declared accuracy; `hit` when absent. */
    accuracy?: IAutoMovieMotionHumanStrikingQuality.Accuracy;
    /** The weapon's travel direction at contact, unit. */
    direction: IAutoMovieVector3;
    /** The weapon's half width, metres. */
    radius: number;
    /** The distance the weapon travels, metres. */
    distance: number;
    /** The delivery time, seconds. */
    seconds: number;
  };
}
