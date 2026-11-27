import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieMotionHumanSword,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanSkill } from "../../skill/internal/HumanSkill";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingSkill } from "../../striking/internal/StrikingSkill";

/*
 * The clock of a blade's attack, shared by the cut and the thrust: every
 * movement of the hand is one minimum-jerk unit (Flash and Hogan 1985) at the
 * attack's peak speed, whose duration is 1.875 times its path over that speed;
 * the setting from the entry hold to the path's start and the return from the
 * follow-through to the entry hold are slowed by the recovery skill's factor
 * (`StrikingSkill.recovery`, Vagner et al. 2023: the chamber and the recovery
 * absorb a novice's longer strike), and the clock is stretched by the manner's
 * tempo, the law's own at the neutral manner. The blade turns back at once; a
 * held pose is a guard's or the author's.
 */
export namespace HumanSwordTiming {
  /*
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
    const attack: number = HumanSkill.jitter(
      context.skill,
      context.random("attack"),
      HumanSwordTiming.peak(length, carried) / speed,
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
      AutoMovieMotionManner(context, context.params.manner),
    );
  };

  /*
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

  /*
   * How far the arm travels as it sets from the entry hold to the path's start,
   * metres: the greater of the tool's travel (`travel`) and the elbow's, read
   * once on the two fitted arms, the entry's as it stands and the start's on
   * the entry's body with its elbow hinted from the landing's carried with the
   * hand, so a setting that swings the elbow from the hold's arm to the
   * landing's takes as long as the arm needs.
   */
  export const setting = (
    context: Pick<IAutoMovieMotionHumanActionContext, SettingContext>,
    tool: IAutoMovieMotionHumanStrikingHeld.ITool,
    entered: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    start: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    landed: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
    posture: IAutoMovieMotionHumanPosture,
  ): number => {
    const side: AutoMovieHumanSide = tool.side;
    const elbows: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}LowerArm`]);
    const goalAt: ReturnType<typeof StrikingHeld.prepareGoal> =
      StrikingHeld.prepareGoal(context, tool, 0);
    const elbowOf = (
      on: IAutoMovieMotionHumanPosture,
      frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame,
      bend: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      poseBones(
        context.body,
        resolveHumanPosture(context.body, {
          ...on,
          limbs: { ...on.limbs, [`${side}Arm`]: goalAt(frame, bend) },
        }),
        undefined,
        elbows,
      ).get(`${side}LowerArm`)!.worldPosition;
    const landedElbow: IAutoMovieVector3 = elbowOf(
      posture,
      landed,
      AutoMovieMotionHumanBend.hang(context.body, posture, side),
    );
    const startElbow: IAutoMovieVector3 = elbowOf(
      context.entry.posture,
      start,
      AutoMovieEngineVector3.add(landedElbow, AutoMovieEngineVector3.subtract(start.point, landed.point)),
    );
    return Math.max(
      travel(tool, entered, start),
      AutoMovieEngineVector3.distance(
        poseBones(context.body, context.entry.pose, undefined, elbows).get(
          `${side}LowerArm`,
        )!.worldPosition,
        startElbow,
      ),
    );
  };

  /*
   * An attack's peak speed over its peak speed per metre, metres: with no
   * advance the point's own minimum-jerk unit peaks at its middle, `UNIT` times
   * the path; with one, the arrested point's unit (arriving at its peak) and
   * the advancing body's (arriving at rest) peak apart, and the greatest of
   * their sum `(length - carried) 30 u² (1 - u)² + carried 30 v² (1 - v)²`,
   * read at fifty steps of the body's unit, is the peak.
   * Parameter length: The path's length, metres.
   * Parameter carried: The part of it an advancing body covers, metres.
   * Returns: The attack's duration times its peak speed, metres.
   */
  export const peak = (length: number, carried: number): number => {
    const rate = (u: number): number => 30 * u * u * (1 - u) * (1 - u);
    let most: number = carried > 0 ? 0 : UNIT * length;
    for (let i: number = 1; carried > 0 && i <= 50; i++)
      most = Math.max(
        most,
        (length - carried) * rate(i / 100) + carried * rate(i / 50),
      );
    return most;
  };

  /*
   * A minimum-jerk unit's peak speed over its mean speed, `30/16`: the profile
   * `30 u^2 (1 - u)^2` at its middle (Flash and Hogan 1985), so a unit of a
   * path at a peak speed lasts this times the path over the speed.
   */
  export const UNIT: number = 1.875;
}

/*
 * The alternatives of `SettingContext`'s site.
 */
type SettingContext = "body" | "entry";
