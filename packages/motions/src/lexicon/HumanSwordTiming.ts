import type { IAutoMovieMotionClock, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanSword } from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingSkill } from "../striking/StrikingSkill";

/**
 * The clock of a blade's attack, shared by the cut and the thrust: its own
 * time from the path's length at the peak speed, stretched by the manner's
 * tempo (#3549) so an act that needs more time slows it, the law's own at
 * the neutral manner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the clock is timed from and how the manner stretches it.
 * @evidence contracts/development/design.md#principled-representation One function of the attack's path, speed and follow-through.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one clock the sword's attacks read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is the manner's one mechanism, not a second scale.
 */
export namespace HumanSwordTiming {
  /** The clock of an attack: its attack lasts as a minimum-jerk unit of the path's length at the peak speed. `carried` is the part of that length an advancing body covers: the body arrives at rest (a whole unit) while an arrested point arrives at its peak (half a unit), so the two speeds peak apart and the attack is timed on the greatest of their sum. */
  export const timed = (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IAttack>,
    length: number,
    speed: number,
    follow: number,
    carried: number = 0,
  ): IAutoMovieMotionClock.IClock => {
    const rate = (u: number): number => 30 * u * u * (1 - u) * (1 - u);
    let peak: number = 1.875 * length;
    for (let i: number = 1; carried > 0 && i <= 50; i++)
      peak = Math.max(
        peak,
        (length - carried) * rate(i / 100) + carried * rate(i / 50),
      );
    const attack: number = HumanSkill.jitter(
      context.skill,
      context.random("attack"),
      Math.max(0.12, peak / speed),
    );
    const recovery: number = StrikingSkill.recovery(context.skill);
    return AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: 0.3 * recovery,
        attack,
        follow: follow * attack,
        hold: 0.08,
        retract: 0.4 * recovery,
      }),
      AutoMovieMotionManner.of(context, context.params.manner),
    );
  };
}
