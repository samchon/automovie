import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanSkill } from "../skill/HumanSkill";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingSkill } from "../striking/StrikingSkill";

/**
 * The clock of a blade's attack, shared by the cut and the thrust: every
 * movement of the hand is one minimum-jerk unit (Flash and Hogan 1985) at
 * the attack's peak speed, whose duration is 1.875 times its path over that
 * speed; the setting from the entry hold to the path's start and the return
 * from the follow-through to the entry hold are slowed by the recovery
 * skill's factor (`StrikingSkill.recovery`, Vagner et al. 2023: the chamber
 * and the recovery absorb a novice's longer strike), and the clock is
 * stretched by the manner's tempo (#3549), the law's own at the neutral
 * manner. The blade turns back at once; a held pose is a guard's or the
 * author's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each phase is timed from, which skill factor slows which and how the manner stretches it.
 * @evidence contracts/development/design.md#principled-representation One function of the hand's three paths (the setting, the attack and the return), the peak speed and the follow-through.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one clock the sword's attacks read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is the manner's one mechanism, not a second scale.
 */
export namespace HumanSwordTiming {
  /**
   * The clock of an attack: its attack lasts as a minimum-jerk unit of the
   * path's length at the peak speed. `carried` is the part of that length an
   * advancing body covers: the body arrives at rest (a whole unit) while an
   * arrested point arrives at its peak (half a unit), so the two speeds peak
   * apart and the attack is timed on the greatest of their sum. `ready` and
   * `back` are the tool's ways (`travel`) from the entry hold to the path's
   * start and from the follow-through's end back to the entry hold, metres.
   */
  export const timed = (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IAttack>,
    length: number,
    speed: number,
    follow: number,
    carried: number,
    ready: number,
    back: number,
  ): IAutoMovieMotionClock => {
    const rate = (u: number): number => 30 * u * u * (1 - u) * (1 - u);
    // With no advance the point's own unit peaks at its middle; with one the
    // two speeds' sum is read over the attack, its greatest the peak.
    let peak: number = carried > 0 ? 0 : UNIT * length;
    for (let i: number = 1; carried > 0 && i <= 50; i++)
      peak = Math.max(
        peak,
        (length - carried) * rate(i / 100) + carried * rate(i / 50),
      );
    const attack: number = HumanSkill.jitter(
      context.skill,
      context.random("attack"),
      peak / speed,
    );
    const recovery: number = StrikingSkill.recovery(context.skill);
    return AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: (recovery * UNIT * ready) / speed,
        attack,
        follow: follow * attack,
        hold: 0,
        retract: (recovery * UNIT * back) / speed,
      }),
      AutoMovieMotionManner.of(context, context.params.manner),
    );
  };

  /**
   * How far a held tool goes between two hand frames, metres: the greater
   * displacement of its working point and of its end by the hand
   * (`StrikingHeld.strayed`), the chord a phase's minimum-jerk unit is timed
   * on, as the attack is timed on its chord.
   */
  export const travel = (
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    from: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    to: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
  ): number => StrikingHeld.strayed(tool, from, to, 0);

  /** A minimum-jerk unit's peak speed over its mean speed, `30/16`: the profile `30 u^2 (1 - u)^2` at its middle (Flash and Hogan 1985), so a unit of a path at a peak speed lasts this times the path over the speed. */
  export const UNIT: number = 1.875;
}
