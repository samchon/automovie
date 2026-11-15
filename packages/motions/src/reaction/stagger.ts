import {
  Vector3,
  convexHull2D,
  hingedArmSwivel,
  resolveAutoMovieCenterOfMass,
  minimumJerk,
  pointInHull,
} from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionHumanAuditContact } from "../audit/AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { walk } from "../actions/walk";
import { walkFoot } from "../actions/walkFoot";
import { walkLegClearance } from "../actions/walkLegClearance";
import { walkReach } from "../actions/walkReach";
import { walkStanceCourse } from "../actions/walkStanceCourse";
import { HumanBalance } from "../everyday/HumanBalance";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanLegChain } from "../posture/HumanLegChain";
import type { HumanQuadraticProgram as QP } from "../posture/HumanQuadraticProgram";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";
import { ReactionSource } from "./ReactionSource";

/**
 * A stagger: a blow pushes the centre of mass past the base of support and
 * recovery steps catch it.
 *
 * The centre of mass moves over the floor as an inverted pendulum of Hof's
 * leg length, 1.34 hip heights (Hof, Gazendam and Sinke 2005, J Biomech
 * 38:1), from the blow's speed along the push, its centre of pressure always
 * as near the extrapolated centre of mass `x + v / omega0`, `omega0 = sqrt(g
 * / l)`, as the bearing feet reach: on it, which holds it, or at the nearest
 * point of their outline, from which it runs on (Hof 2008, Hum Mov Sci
 * 27:112). Each recovery step chooses its time and its place within measured
 * bounds, as capture-point stepping does (Koolen et al. 2012, Int J Robot Res
 * 31:1094; Griffin et al. 2017): the weight shifts onto the stance foot over
 * both feet, the foot swings in its direction's step time and lands the sole
 * point it lands on as near the extrapolated centre of mass as its reachable
 * footstep region allows, and the body is caught once the extrapolated
 * centre of mass lies inside the base the two feet make. The region is the
 * stance foot's: within its direction's longest recovery step of where the
 * foot stood beside the stance foot, and inside the legs' own reachable set
 * from the pelvis the centre of mass carries at the landing, the trunk free
 * to tilt, the landing foot to turn out and the two legs clear of each other
 * as the tangle audit reads them (`walkStanceCourse`, `walkLegClearance`); a
 * step past it shortens toward the stance foot. The legs may cross: a
 * footstep planner's region on the stepping foot's own side of the stance
 * foot (Deits and Tedrake 2014) keeps a walking robot's legs apart, but it
 * forbids the crossover step people take in most lateral recoveries, so it
 * is not this region. Every order of the feet over up to four steps is tried,
 * the fewest steps first, so capture is monotone in the push's speed; the
 * order preferred alternates its feet forward and backward (Maki and McIlroy
 * 1997), beginning with the foot further along the push, the rear foot for a
 * push backward, and pushed sideways begins with the leg the push unloads,
 * which crosses in front of or behind the loaded one (Maki, McIlroy and
 * Perry 1996: 96% of lateral stepping responses), the loaded leg's
 * side-step being the other order. The bounds are those of younger
 * adults at the threshold of balance recovery: an 82 ms reaction and a 138
 * ms weight shift before the first step (Cyr, Moglo and Smeesters 2005),
 * steps of 238, 176 and 193 ms and up to 0.59, 0.38 and 0.42 statures
 * forward, sideways and backward (Telonio, Cyr, Moglo and Smeesters 2005),
 * read between those directions on an ellipse; the leg a sideways push
 * unloads leaves the floor 20% sooner and swings 70% longer than a forward
 * or backward step (Maki, McIlroy and Perry 1996, `LATERAL`). A foot
 * stepping forward strikes with its heel and
 * one stepping backward lands on its forefoot (Grasso, Bianchi and
 * Lacquaniti 1998). A push four steps do not catch is a fall, as people take
 * up to four recovery steps (Debelle, Maganaris and O'Brien 2021): it is
 * refused, naming the fastest push the body catches that way.
 *
 * Once caught, the other foot closes at the entry's stance width, as far
 * ahead or behind as stands the middle of the two ankles under the caught
 * point as the entry stood over its own. The extrapolated centre of mass
 * then tracks a minimum-jerk course to where the body stood over its feet,
 * its centre of pressure placed by the divergent component's tracking law
 * inside the base (Englsberger, Ott and Albu-Schaffer 2015), and the centre
 * of mass follows it, `x' = omega0 (xi - x)`, until both rest within a
 * millimetre.
 *
 * The body over its feet is one stance course (`walkStanceCourse`): the
 * pelvis's drop, each planted foot's pitch about its ball and its turn on
 * the floor, and the trunk's tilt about the hips, as one trajectory
 * optimisation, the pelvis carrying the centre of mass on its course less
 * the shift the trunk's tilt makes of it. The legs' reach, the hip's
 * extension and rotation and the ankle's range are its constraints, with the
 * feet bearing the centre of pressure and the caught extrapolated centre of
 * mass, so a backward landing carries the pelvis back over the rear foot by
 * bending the trunk against the fall, the hip strategy (Horak and Nashner
 * 1986, J Neurophysiol 55:1369), because the ranges ask for it rather than
 * by a rule. A stance whose leg leans further to its side than the ankle's
 * 25 degrees rolls onto its edge; a stepping foot first rises clear of the
 * floor by the 12.9 mm minimum toe clearance of walking (Winter 1992, Phys
 * Ther 72:45), over the share of its swing a walking foot takes to set down
 * from that height, then swings as a walking foot swings (`walkFoot.swing`)
 * to the stance it lands in, held inside its leg's ranges and as high over
 * the floor as its swing carries it (`walkReach.swing`), so it leaves and
 * joins its stances where they stand.
 *
 * Both
 * arms abduct as balance reactions, 9.4 degrees from 154 ms after the push
 * (the mean of the two arms' abduction within 200 ms of a backward release,
 * 10.7 and 8.0 degrees, at its measured onset; Weerdesteyn, Laing and
 * Robinovitch 2008, Exp Brain Res 186:571), held through the steps and let
 * down as the body settles, each let out further where it would pass into
 * the body (`HumanArmSwing.of`). The steps, the catch and the settling are
 * the body's dynamics, which no manner changes; the manner's tempo scales
 * the righting.
 *
 * The push is read where its source is as the plan begins, the causal read
 * a reaction makes (`ReactionSource`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pendulum, the centre of pressure, the step rule and its measured bounds, the further steps and their bound, the closing step, the settling, the feet, the trunk, the arms and the push's read, each with its source.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters and a plan composed of part primitives on one clock, with plant windows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing, size and count constants, the plan and the recovery the tests check against.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, contact-window, foot, gait, target, clock, balance and primitive owners; the steps scale with each body's pendulum, feet and stature.
 */
export namespace stagger {
  /** The action's name. */
  export const name: HumanActionName = "stagger";

  /** Cancel table: a stagger flows into a guard or a knockdown. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      guard: ["fromStroke", "smooth"],
      knockdown: ["anytime", "quick"],
    });

  /** A reaction interrupts whatever the body was doing, at any instant, as a reflex. */
  export const accepts: IHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blow's target and its default, the push's direction, the speed's unit and what the manner changes.
   * @evidence contracts/development/design.md#principled-representation The blow is the interface's motion-target union, the speed metres per second, checked positive and capturable when planning, and the manner the shared manner record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union and the shared manner.
   */
  export interface IParams {
    /** Where the blow comes from: the body is pushed away from it; a place ahead of the performer when absent. */
    from?: AutoMovieMotionTarget;

    /** The centre of mass's speed after the blow, m/s. */
    speed: number;

    /** How it is performed: the tempo scales the trunk's righting after the last step. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** The reaction before the first step's weight shift, at the threshold of balance recovery (Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401: 82 ms, younger adults released from a forward lean). */
  export const REACTION: AutoMovieMotionHumanTiming.Span = {
    seconds: 0.082,
    source: "Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401",
  };

  /** The weight shift onto the stance foot before a recovery step lifts off (Cyr, Moglo and Smeesters 2005: 138 ms). */
  export const TRANSFER: AutoMovieMotionHumanTiming.Span = {
    seconds: 0.138,
    source: "Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401",
  };

  /** A recovery step's swing time by its direction from the heading, seconds: the single steps at the threshold of balance recovery forward, sideways (the mean of the dominant and non-dominant sides, 184 and 167 ms) and backward (Telonio, Cyr, Moglo and Smeesters 2005, ISB XXth Congress 430). */
  export const STEP_TIME: Readonly<
    Record<"forward" | "side" | "backward", number>
  > = { forward: 0.238, side: 0.1755, backward: 0.193 };

  /**
   * A forward recovery step's landing after the push, the time a capture
   * step takes to bear (`perturb` reads it as the step's time): the
   * reaction, the weight shift and the forward swing at the threshold of
   * balance recovery (`REACTION`, `TRANSFER`, `STEP_TIME.forward`), 458 ms.
   */
  export const LANDING: AutoMovieMotionHumanTiming.Span = {
    seconds:
      AutoMovieMotionHumanTiming.seconds(REACTION) +
      AutoMovieMotionHumanTiming.seconds(TRANSFER) +
      STEP_TIME.forward,
    source:
      "Cyr, Moglo and Smeesters 2005, ISB XXth Congress 401; Telonio, Cyr, Moglo and Smeesters 2005, ISB XXth Congress 430",
  };

  /**
   * A sideways push's first step with the leg it unloads, against a forward
   * or backward step's: the time to foot-off from the push 20% shorter and
   * the swing 70% longer, on average (Maki, McIlroy and Perry 1996, J Biomech
   * 29:343, read as its abstract, https://manuscript.isc.ac/Inventory/10/450275.htm;
   * 96% of the stepping responses to lateral destabilisation swung the
   * unloaded leg, which lifts much sooner but swings a longer and more
   * complex path). The ratios, not the abstract's absolute 90 ms and 110 ms,
   * are applied to this model's own forward and backward times (the reaction
   * and the weight shift, `REACTION` and `TRANSFER`, and the mean of the
   * forward and backward swing, `STEP_TIME`): those times come from another
   * cohort and paradigm (Cyr's and Telonio's lean-and-release) than Maki's
   * platform, and the ratio carries the lateral push's effect between them
   * where a fixed difference would not. Their step-length effect, 20%
   * longer, is not applied: the measured longest steps (`STEP_LENGTH`) bound
   * a step already, and an average step's lengthening says nothing of the
   * longest.
   */
  export const LATERAL: Readonly<Record<"footOff" | "swing", number>> = {
    footOff: 0.8,
    swing: 1.7,
  };
  /** The longest recovery step by its direction from the heading, in statures: the same steps' lengths, 1.032, 0.664 (0.694 and 0.634) and 0.724 m, over the subjects' mean stature of 1.74 m (Telonio, Cyr, Moglo and Smeesters 2005). */
  export const STEP_LENGTH: Readonly<
    Record<"forward" | "side" | "backward", number>
  > = { forward: 1.032 / 1.74, side: 0.664 / 1.74, backward: 0.724 / 1.74 };

  /** The trunk's righting after the last step at a neutral manner (provisional). */
  export const RIGHTING: AutoMovieMotionHumanTiming.Span = {
    pause: "beat",
    scale: 1.125,
  };

  /** The trunk's tilt, degrees, at which the shift it makes of the centre of mass is read per sine (`bending`): a tilt inside the range a recovery uses. */
  const REFERENCE: number = 10;

  /** The pendulum's length in hip heights: Hof's leg length (Hof, Gazendam and Sinke 2005). */
  export const PENDULUM: number = resolveAutoMovieCenterOfMass.PENDULUM;

  /** The most recovery steps taken (Debelle, Maganaris and O'Brien 2021, young adults after a backward slip). */
  export const STEPS: number = 4;

  /** The resolution the fastest caught push is bisected to, m/s, before it is floored to a whole centimetre per second. */
  export const RESOLUTION: number = 0.005;

  /** The band below the fastest caught push over which every speed of the `RESOLUTION` grid is verified caught, m/s: a local solve at the edge of what the legs hold can flicker, and the limit a refusal names is one every slower push on this grid is caught at. */
  export const VERIFIED: number = 0.02;

  /** The least toe clearance of walking, metres (Winter 1992, Phys Ther 72:45): a swinging foot rises this far before it travels. */
  export const CLEARANCE: number = 0.0129;

  /** A swing's lift at mid-swing, hip heights: a walking foot's (`walk.walking`). */
  export const LIFT: number = walk.walking(0).lift;

  /** Each arm's abduction as a balance reaction, degrees (Weerdesteyn, Laing and Robinovitch 2008). */
  export const ABDUCTION: number = 9.4;

  /** The arms' reaction onset after the push. */
  export const ONSET: AutoMovieMotionHumanTiming.Span = {
    seconds: 0.154,
    source: "Weerdesteyn, Laing and Robinovitch 2008, Exp Brain Res 186:571",
  };

  /** How near the centre of mass comes to rest over the middle of its base, metres. */
  export const SETTLED: number = 0.001;

  /** The divergent component's feedback gain over the righting (provisional): its error from its course decays at this many times the pendulum's own rate (Englsberger, Ott and Albu-Schaffer 2015). */
  export const TRACKING: number = 1;

  /** Knots per second of the stances' course (`walkStanceCourse`). */
  const KNOTS: number = 48;

  /** The settling's integration step, seconds. */
  const STEP: number = 0.001;

  /**
   * The pendulum's eigenfrequency `sqrt(g / l)` for a body
   * (`resolveAutoMovieCenterOfMass.frequency`, standard gravity), `l` its
   * pendulum's length (`resolveAutoMovieCenterOfMass.pendulum`).
   *
   * @param body The body.
   * @returns Radians per second.
   */
  export function omega(body: IHumanActionContext["body"]): number {
    return resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );
  }

  /**
   * One recovery step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The foot, its two placements and its swing's window.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, read by the plan and the tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the foot's placement.
   */
  export interface IStep {
    /** The stepping foot. */
    side: "left" | "right";

    /** Where it stood before the step. */
    from: HumanFoot.IPlacement;

    /** Where it lands. */
    to: HumanFoot.IPlacement;

    /** The swing's start, seconds since the action's start. */
    start: number;

    /** The landing, seconds since the action's start. */
    land: number;
  }

  /**
   * A recovery from a push: its steps and the centre of mass's course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The steps, the courses of the centre of mass, the centre of pressure and the extrapolated centre of mass along the push and the instant it settles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, read by the plan and the tests.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The courses are functions of the seconds, not tables.
   */
  export interface IRecovery {
    /** The steps, in order. */
    steps: IStep[];

    /** The extrapolated centre of mass caught by the last step, from the entry's centre of mass over the floor, world metres. */
    caught: IAutoMovieVector3;

    /** The centre of mass's travel over the floor from the entry's at a second since the action's start, world metres. */
    course: (seconds: number) => IAutoMovieVector3;

    /** The centre of pressure the pendulum stands on at a second since the action's start, on the floor, world metres. */
    pressure: (seconds: number) => IAutoMovieVector3;

    /** The extrapolated centre of mass at a second since the action's start, on the floor, world metres. */
    extrapolated: (seconds: number) => IAutoMovieVector3;

    /** When the centre of mass has come to rest, seconds since the action's start. */
    settled: number;

    /** The stances' course over the whole recovery as its steps were judged (`walkStanceCourse`), each step's course continued from the last; absent for the pendulum alone. */
    stances?: walkStanceCourse.ICourse;
  }

  /**
   * The recovery from a push: the steps the capture-point rule places, the
   * closing step and the centre of mass's course over them.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param speed The centre of mass's speed after the blow, m/s.
   * @param righting How long the centre of pressure takes to carry the extrapolated centre of mass to rest, seconds.
   * @param kinematic Whether each landing is placed by the stance course under the legs' ranges; the pendulum alone, its landings where the region puts them, when false.
   * @returns The recovery with its judged course, or null when no order of `STEPS` steps catches it with a course that meets the legs' ranges through its closing step and settling.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the null.
   * @evidence contracts/development/implementation.md#principled-implementation Hof's pendulum with its centre of pressure as near the extrapolated centre of mass as the bearing feet reach; each step's time and place within the measured bounds and its reachable footstep region, the orders of the feet searched for the fewest steps (Koolen et al.'s N-step capture); caught once the extrapolated centre of mass is inside the two feet's base; then the closing step and the settling, the extrapolated centre of mass tracked by the centre of pressure inside the base (Englsberger, Ott and Albu-Schaffer 2015) and the centre of mass following it on `x' = omega (xi - x)`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One simulation per order of the feet, each a closed-form pendulum phase per weight shift and swing; the first order that catches is kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push no order of `STEPS` steps catches is null, never a shortened bound; every bound is measured and cited.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 30 orders of up to `STEPS` steps, a hull of the bearing outlines per phase, and the settling integrated in millisecond steps once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The entry's centre of mass and the feet's width are read once per call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains its phases and its settling in the returned course only.
   */ export function recover(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    speed: number,
    righting: number,
    kinematic: boolean = true,
  ): IRecovery | null {
    const w: number = omega(body);
    const { centre } = HumanBalance.support(body, entry.posture);
    const bend: Record<"pitch" | "roll", IAutoMovieVector3> = bending(
      body,
      entry,
    );
    // The course of the steps before the one being placed, its start.
    let checking: walkStanceCourse.ICourse | undefined;
    const flat = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.x,
      y: 0,
      z: p.z,
    });
    const root: IAutoMovieVector3 = entry.posture.root;
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const across: IAutoMovieVector3 = { x: forward.z, y: 0, z: -forward.x };
    const entered: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(entry);
    let feet: Record<"left" | "right", HumanFoot.IPlacement> = {
      ...entered,
    };
    let phases: {
      from: number;
      p: IAutoMovieVector3;
      s: IAutoMovieVector3;
      v: IAutoMovieVector3;
    }[] = [];
    let steps: IStep[] = [];
    // The centre of mass's travel from the entry's and its velocity, both
    // horizontal, and the extrapolated centre of mass they make.
    let s: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let v: IAutoMovieVector3 = Vector3.scale(flat(push), speed);
    let t: number = 0;
    const xi = (): IAutoMovieVector3 => Vector3.add(s, Vector3.scale(v, 1 / w));
    // The feet that bear the body, as one outline from the entry's centre of
    // mass.
    const bearing = (
      sides: readonly ("left" | "right")[],
    ): IAutoMovieVector3[] =>
      convexHull2D(
        sides.flatMap((side: "left" | "right"): IAutoMovieVector3[] =>
          HumanFoot.sole(body, side, feet[side]).map(
            (q: IAutoMovieVector3): IAutoMovieVector3 =>
              flat(Vector3.subtract(q, centre)),
          ),
        ),
      );
    // A span of the pendulum: the centre of pressure as near the
    // extrapolated centre of mass as the bearing feet reach (on it, which
    // holds it, or at the nearest point of their outline).
    const bear = (
      sides: readonly ("left" | "right")[],
      seconds: number,
    ): void => {
      advance(nearest(bearing(sides), xi()), seconds);
    };
    // The weight's transfer onto the stance foot before a step: a foot cannot
    // leave the floor bearing weight, nor bear it as it touches down, so the
    // centre of pressure travels from where it stands onto the stance foot's
    // outline by lift-off, loading a foot that has just landed and unloading
    // the one about to leave, over the measured weight-transfer phase (Cyr, Moglo and
    // Smeesters 2005), on a minimum-jerk course (the model's choice; no
    // source gives the trace of a reactive step's), the pendulum integrated
    // under it in `STEP`s.
    const transfer = (stance: "left" | "right", seconds: number): void => {
      // It leaves from where the centre of pressure stands, so the weight
      // reaches a foot that has just landed over this transfer, its loading,
      // and never at its touch-down.
      const p0: IAutoMovieVector3 =
        phases.at(-1)?.p ?? nearest(bearing(["left", "right"]), xi());
      const p1: IAutoMovieVector3 = nearest(bearing([stance]), p0);
      const count: number = Math.max(1, Math.round(seconds / STEP));
      for (let i: number = 0; i < count; i++)
        advance(
          Vector3.lerp(p0, p1, minimumJerk((i + 0.5) / count).s),
          seconds / count,
        );
    };
    // The pendulum over a span with its centre of pressure held.
    const advance = (p: IAutoMovieVector3, seconds: number): void => {
      phases.push({ from: t, p, s, v });
      const ch: number = Math.cosh(w * seconds);
      const sh: number = Math.sinh(w * seconds);
      const next: IAutoMovieVector3 = Vector3.add(
        Vector3.add(p, Vector3.scale(Vector3.subtract(s, p), ch)),
        Vector3.scale(v, sh / w),
      );
      v = Vector3.add(
        Vector3.scale(Vector3.subtract(s, p), w * sh),
        Vector3.scale(v, ch),
      );
      s = next;
      t += seconds;
    };
    // The pendulum's phases so far read at a second: the centre of mass's
    // travel, and the centre of pressure and the extrapolated centre of mass
    // on the floor, world metres; on a phase xi - p grows as e^(omega t).
    const phaseAt = (seconds: number) => {
      let phase = phases[0]!;
      for (const q of phases) if (q.from <= seconds) phase = q;
      return { phase, u: Math.max(0, seconds - phase.from) };
    };
    const swung = {
      course: (seconds: number): IAutoMovieVector3 => {
        const { phase, u } = phaseAt(seconds);
        return Vector3.add(
          Vector3.add(
            phase.p,
            Vector3.scale(Vector3.subtract(phase.s, phase.p), Math.cosh(w * u)),
          ),
          Vector3.scale(phase.v, Math.sinh(w * u) / w),
        );
      },
      pressure: (seconds: number): IAutoMovieVector3 =>
        flat(Vector3.add(centre, phaseAt(seconds).phase.p)),
      extrapolated: (seconds: number): IAutoMovieVector3 => {
        const { phase, u } = phaseAt(seconds);
        return flat(
          Vector3.add(
            centre,
            Vector3.add(
              phase.p,
              Vector3.scale(
                Vector3.subtract(
                  Vector3.add(phase.s, Vector3.scale(phase.v, 1 / w)),
                  phase.p,
                ),
                Math.exp(w * u),
              ),
            ),
          ),
        );
      },
    };
    // A step's measured bound in its direction from the performer's heading:
    // between the forward, sideways and backward values on an ellipse.
    const bound = (
      direction: IAutoMovieVector3,
      of: Readonly<Record<"forward" | "side" | "backward", number>>,
    ): number => {
      const length: number = Vector3.length(direction);
      if (!(length > 0)) return of.side;
      const ahead: number = Vector3.dot(direction, forward) / length;
      const aside: number = Vector3.dot(direction, across) / length;
      const along: number = ahead >= 0 ? of.forward : of.backward;
      return 1 / Math.sqrt((ahead / along) ** 2 + (aside / of.side) ** 2);
    };
    // The narrowest the feet stand, ankle to ankle across the heading, side
    // by side with their outlines touching, and a sole's length along it.
    const extent = (axis: IAutoMovieVector3): number =>
      Math.max(
        ...(["left", "right"] as const).map((side: "left" | "right"): number => {
          const along: number[] = HumanFoot.sole(body, side, entered[side]).map(
            (q: IAutoMovieVector3): number =>
              Vector3.dot(Vector3.subtract(q, entered[side].ankle), axis),
          );
          return Math.max(...along) - Math.min(...along);
        }),
      );
    const width: number = extent(across);
    const length: number = extent(forward);
    // A step: the weight shifts onto the stance foot over both feet, then the
    // foot swings in its direction's measured step time and lands the sole
    // point it lands on as near the extrapolated centre of mass as its
    // reachable footstep region allows. The region is the stance foot's:
    // within its direction's longest measured recovery step of where the foot
    // stood beside the stance foot at the entry, the stance the measured
    // steps were taken from, so a foot that steps again cannot split the legs
    // further than one step does; the legs' clearance of each other is the
    // stance course's, so a foot may cross the other. A foot
    // stepping forward strikes with its heel and one stepping backward lands
    // on its forefoot (Grasso, Bianchi and Lacquaniti 1998, J Neurophysiol
    // 80:1868), so the point runs from the heel to the ball with the step's
    // share along the foot.
    const step = (
      side: "left" | "right",
      reaction: number,
      unloaded: boolean,
    ): boolean | null => {
      const stance: "left" | "right" = side === "left" ? "right" : "left";
      if (reaction > 0) bear(["left", "right"], reaction);
      // The leg a sideways push unloads leaves the floor sooner and swings
      // longer than a forward or backward step's (`LATERAL`).
      const forth: number =
        AutoMovieMotionHumanTiming.seconds(REACTION) +
        AutoMovieMotionHumanTiming.seconds(TRANSFER);
      transfer(
        stance,
        unloaded
          ? LATERAL.footOff * forth - AutoMovieMotionHumanTiming.seconds(REACTION)
          : AutoMovieMotionHumanTiming.seconds(TRANSFER),
      );
      const from: HumanFoot.IPlacement = feet[side];
      const swing: number = unloaded
        ? (LATERAL.swing * (STEP_TIME.forward + STEP_TIME.backward)) / 2
        : bound(
            flat(Vector3.subtract(Vector3.add(centre, xi()), from.ankle)),
            STEP_TIME,
          );
      const start: number = t;
      bear([stance], swing);
      const goal: IAutoMovieVector3 = Vector3.add(centre, xi());
      const toes: IAutoMovieVector3 = flat(
        Vector3.subtract(
          HumanFoot.point(body, side, "ball", from),
          HumanFoot.point(body, side, "heel", from),
        ),
      );
      const aim: IAutoMovieVector3 = flat(
        Vector3.subtract(goal, HumanFoot.point(body, side, "sole", from)),
      );
      const share: number =
        Vector3.length(aim) > 0 && Vector3.length(toes) > 0
          ? Vector3.dot(aim, toes) /
            (Vector3.length(aim) * Vector3.length(toes))
          : 0;
      const lands: IAutoMovieVector3 = Vector3.lerp(
        HumanFoot.point(body, side, "sole", from),
        HumanFoot.point(body, side, share >= 0 ? "heel" : "ball", from),
        Math.abs(share),
      );
      const wanted: IAutoMovieVector3 = Vector3.add(
        from.ankle,
        flat(Vector3.subtract(goal, lands)),
      );
      // The region: the step's length from where the foot stood beside the
      // stance foot.
      const beside: IAutoMovieVector3 = Vector3.add(
        feet[stance].ankle,
        flat(Vector3.subtract(entered[side].ankle, entered[stance].ankle)),
      );
      const reached = (ankle: IAutoMovieVector3): IAutoMovieVector3 => {
        const travel: IAutoMovieVector3 = flat(Vector3.subtract(ankle, beside));
        const longest: number =
          bound(travel, STEP_LENGTH) * body.measure.stature;
        return Vector3.length(travel) > longest
          ? Vector3.add(
              beside,
              Vector3.scale(travel, longest / Vector3.length(travel)),
            )
          : ankle;
      };
      const ankle0: IAutoMovieVector3 = reached(wanted);
      // Then the legs' own reachable set, in one solve: the stance course up
      // to the landing and through the weight's shift onto both feet after
      // it (`knotsOf`, `walkStanceCourse`) places the landing itself, pulled
      // toward the ankle that puts its landing point on the extrapolated
      // centre of mass and held inside the region, the legs' ranges and
      // their clearance of each other, as step adaptation places a step
      // (Khadiv et al. 2016; Griffin et al. 2017). Where the legs can hold no
      // landing in the region, this order of the feet does not catch the
      // body.
      const region = (ankle: IAutoMovieVector3): number[] => {
        const travel: IAutoMovieVector3 = flat(Vector3.subtract(ankle, beside));
        return [
          Vector3.length(travel) -
            bound(travel, STEP_LENGTH) * body.measure.stature,
        ];
      };
      const placed: HumanFoot.IPlacement = {
        ankle: { ...ankle0, y: from.ankle.y },
        rotation: from.rotation,
      };
      // A landing on the stance foot's far side, or nearer it than the feet
      // stand side by side, crosses it: it lands in front of it or behind
      // it, each start at least a sole's length ahead of or behind the
      // stance foot.
      const sign: number = side === "left" ? 1 : -1;
      const crossing: boolean =
        sign * Vector3.dot(Vector3.subtract(ankle0, feet[stance].ankle), across) <
        width;
      const crossed = (way: number): HumanFoot.IPlacement => {
        const ahead: number = Vector3.dot(
          Vector3.subtract(ankle0, feet[stance].ankle),
          forward,
        );
        const shift: number =
          way > 0 ? Math.max(0, length - ahead) : Math.min(0, -length - ahead);
        return {
          ankle: {
            ...reached(Vector3.add(ankle0, Vector3.scale(forward, shift))),
            y: from.ankle.y,
          },
          rotation: from.rotation,
        };
      };
      const both: IAutoMovieVector3[] = convexHull2D(
        [
          ...HumanFoot.sole(body, stance, feet[stance]),
          ...HumanFoot.sole(body, side, placed),
        ].map(
          (q: IAutoMovieVector3): IAutoMovieVector3 =>
            flat(Vector3.subtract(q, centre)),
        ),
      );
      // The pendulum alone (`limit`'s bound) lands where the region puts it.
      if (!kinematic) {
        steps.push({ side, from, to: placed, start, land: t });
        feet[side] = placed;
        const base: IAutoMovieVector3[] = bearing(["left", "right"]);
        return base.length >= 3 && pointInHull(xi(), base);
      }
      phases.push({ from: t, p: nearest(both, xi()), s, v });
      // Each start's course: the landing placed from a start on the floor,
      // the course run on through the weight's shift onto both feet that
      // follows it.
      const solveFrom = (
        origin: HumanFoot.IPlacement,
        warm: walkStanceCourse.ICourse | undefined,
      ): { course: walkStanceCourse.ICourse; to: HumanFoot.IPlacement } => {
        const knots: IKnot[] = knotsOf(
          body,
          entry,
          bend,
          {
            ...swung,
            steps: [...steps, { side, from, to: origin, start, land: t }],
            caught: both.length >= 3 && pointInHull(xi(), both) ? t : Infinity,
            landing: {
              placement: origin,
              goal: { ...wanted, y: from.ankle.y },
              region,
            },
          },
          t + AutoMovieMotionHumanTiming.seconds(TRANSFER),
        );
        // The steps before this one are settled up to the last one's landing:
        // only the course from there on is solved again.
        const settled: number =
          warm === undefined || steps.length === 0
            ? 0
            : Math.min(
                warm.knots.length,
                Math.floor(steps.at(-1)!.land * KNOTS + 1e-9),
              );
        const course: walkStanceCourse.ICourse = sequential(
          body,
          knots,
          warm,
          settled,
        );
        const at: number = Math.min(
          course.knots.length - 1,
          Math.ceil(t * KNOTS - 1e-9),
        );
        return {
          course,
          to: {
            ankle: {
              x: origin.ankle.x + course.slide[side].x[at]!,
              y: from.ankle.y,
              z: origin.ankle.z + course.slide[side].z[at]!,
            },
            rotation: from.rotation,
          },
        };
      };
      // The starts: the aim the region allows, from the course of the steps
      // before it, or for a crossing landing a start in front of the stance
      // foot and one behind it; and, where those end short of the ranges,
      // the place beside the stance foot: a local solve from one start can
      // stop at the edge of what the legs hold, and the one that meets the
      // ranges, or comes nearer, decides. Of two crossings that both meet
      // them, the one that lands nearer its aim does.
      phases.push({ from: t, p: nearest(both, xi()), s, v });
      const off = (l: ReturnType<typeof solveFrom>): number =>
        Vector3.length(flat(Vector3.subtract(l.to.ankle, wanted)));
      const better = (
        a: ReturnType<typeof solveFrom>,
        b: ReturnType<typeof solveFrom>,
      ): ReturnType<typeof solveFrom> => {
        const met = (l: ReturnType<typeof solveFrom>): boolean =>
          l.course.unmet <= walkStanceCourse.MET;
        if (met(a) !== met(b)) return met(a) ? a : b;
        if (!met(a)) return a.course.unmet <= b.course.unmet ? a : b;
        return off(a) <= off(b) ? a : b;
      };
      let landed = crossing
        ? better(
            solveFrom(crossed(1), checking),
            solveFrom(crossed(-1), checking),
          )
        : solveFrom(placed, checking);
      if (landed.course.unmet > walkStanceCourse.MET) {
        const near = solveFrom(
          { ankle: { ...beside, y: from.ankle.y }, rotation: from.rotation },
          undefined,
        );
        if (near.course.unmet < landed.course.unmet) landed = near;
      }
      phases.pop();
      // The next step's course starts from this one.
      checking = landed.course;
      if (landed.course.unmet > walkStanceCourse.MET) return null;
      const to: HumanFoot.IPlacement = landed.to;
      steps.push({ side, from, to, start, land: t });
      feet[side] = to;
      // Caught once the extrapolated centre of mass lies inside the base the
      // two feet now make, the zero-step capture region (Koolen et al. 2012).
      const base: IAutoMovieVector3[] = bearing(["left", "right"]);
      return base.length >= 3 && pointInHull(xi(), base);
    };

    // The order of the feet is chosen with the steps: every order of up to
    // `STEPS` steps is tried, the fewest steps first and, among as many, the
    // order that alternates from the preferred foot first, and the first that
    // catches the body is taken, so forward and backward recoveries alternate
    // their feet (Maki and McIlroy 1997). Pushed forward or backward, the
    // foot further along the push steps first, the rear foot for a push
    // backward. Pushed sideways (nearer the side than the heading), the leg
    // the push unloads steps first, crossing in front of or behind the
    // loaded one: 96% of stepping responses to lateral destabilisation swing
    // the unloaded leg, which lifts much sooner but swings a longer and more
    // complex path (Maki, McIlroy and Perry 1996, J Biomech 29:343); the
    // loaded leg's side-step is the other order of as many steps.
    const ankle = (side: "left" | "right"): number =>
      (entered[side].ankle.x - root.x) * push.x +
      (entered[side].ankle.z - root.z) * push.z;
    const along: "left" | "right" =
      ankle("left") > ankle("right") ? "left" : "right";
    const sideways: boolean =
      Math.abs(Vector3.dot(push, across)) > Math.abs(Vector3.dot(push, forward));
    const first: "left" | "right" = sideways
      ? along === "left"
        ? "right"
        : "left"
      : along;
    const other = (side: "left" | "right"): "left" | "right" =>
      side === "left" ? "right" : "left";
    const orders: ("left" | "right")[][] = [];
    for (let n: number = 1; n <= STEPS; n++)
      for (let code: number = 0; code < 1 << n; code++) {
        // Bit k set: step k repeats the foot before it rather than
        // alternating; step 0 set takes the other foot first.
        const order: ("left" | "right")[] = [];
        let foot: "left" | "right" = (code & 1) === 0 ? first : other(first);
        for (let k: number = 0; k < n; k++) {
          if (k > 0 && (code & (1 << k)) === 0) foot = other(foot);
          order.push(foot);
        }
        orders.push(order);
      }
    let caught: boolean = false;
    let judging: walkStanceCourse.ICourse | undefined;
    let stepped: "left" | "right" = first;
    const taken: Map<
      string,
      {
        course: walkStanceCourse.ICourse | undefined;
        done: boolean | null;
        feet: Record<"left" | "right", HumanFoot.IPlacement>;
        phases: typeof phases;
        steps: IStep[];
        s: IAutoMovieVector3;
        v: IAutoMovieVector3;
        t: number;
      }
    > = new Map();
    // An order that catches the body closes and settles it, and its course
    // must meet the legs' ranges through both; one whose course does not
    // does not recover.
    const closed = (
      judging: walkStanceCourse.ICourse | undefined,
    ): IRecovery | null => {

      // Caught. The other foot closes to stand the body over where it is
      // caught: at the entry's stance width from the stepping foot, and as far
      // ahead or behind it as puts the middle of the two ankles where the body
      // stood over them at the entry, under the caught point.
      const anchor: "left" | "right" = stepped;
      const closer: "left" | "right" = anchor === "left" ? "right" : "left";
      const middle = (of: Record<"left" | "right", HumanFoot.IPlacement>) =>
        flat(Vector3.scale(Vector3.add(of.left.ankle, of.right.ankle), 0.5));
      const stance: number = Vector3.dot(
        Vector3.subtract(entered[closer].ankle, entered[anchor].ankle),
        across,
      );
      const caughtAt: IAutoMovieVector3 = xi();
      const under: IAutoMovieVector3 = Vector3.subtract(
        Vector3.add(centre, caughtAt),
        Vector3.subtract(flat(centre), middle(entered)),
      );
      const placed: IAutoMovieVector3 = feet[anchor].ankle;
      const closing: HumanFoot.IPlacement = {
        ankle: {
          ...Vector3.add(
            Vector3.add(placed, Vector3.scale(across, stance)),
            Vector3.scale(
              forward,
              2 * Vector3.dot(Vector3.subtract(under, flat(placed)), forward),
            ),
          ),
          y: entered[closer].ankle.y,
        },
        rotation: entered[closer].rotation,
      };
      transfer(anchor, AutoMovieMotionHumanTiming.seconds(TRANSFER));
      const start: number = t;
      bear(
        [anchor],
        bound(
          flat(Vector3.subtract(closing.ankle, feet[closer].ankle)),
          STEP_TIME,
        ),
      );
      steps.push({
        side: closer,
        from: feet[closer],
        to: closing,
        start,
        land: t,
      });
      feet[closer] = closing;

      // Then the centre of pressure carries the extrapolated centre of mass
      // over the righting to where the body stood over its feet: the
      // extrapolated centre of mass tracks a minimum-jerk course there from
      // where the catch left it, the centre of pressure placed by the
      // divergent component's tracking law, p = xi - xi_ref' / omega +
      // `TRACKING` (xi - xi_ref) (Englsberger, Ott and Albu-Schaffer 2015,
      // IEEE Trans Robot 31:355), as near that as the base holds it; xi' =
      // omega (xi - p), and the centre of mass follows, x' = omega (xi - x),
      // until both rest there.
      const rest: IAutoMovieVector3 = Vector3.subtract(
        middle(feet),
        middle(entered),
      );
      const begin: IAutoMovieVector3 = xi();
      const last: number = t;
      const base: IAutoMovieVector3[] = bearing(["left", "right"]);
      const settle: IAutoMovieVector3[] = [s];
      const drifting: IAutoMovieVector3[] = [begin];
      const pressing: IAutoMovieVector3[] = [];
      let x: IAutoMovieVector3 = s;
      let e: IAutoMovieVector3 = begin;
      const longest: number = righting + 20 / w;
      for (let i: number = 1; i * STEP <= longest; i++) {
        const reference: minimumJerk.IProfile = minimumJerk(
          ((i - 1) * STEP) / righting,
        );
        const towards: IAutoMovieVector3 = Vector3.lerp(begin, rest, reference.s);
        const p: IAutoMovieVector3 = nearest(
          base,
          Vector3.add(
            Vector3.subtract(
              e,
              Vector3.scale(
                Vector3.subtract(rest, begin),
                reference.ds / (righting * w),
              ),
            ),
            Vector3.scale(Vector3.subtract(e, towards), TRACKING),
          ),
        );
        pressing.push(p);
        // The exact step with the centre of pressure held: xi - p grows as
        // e^(omega t), and x - p is half of it plus a part that decays.
        const z: IAutoMovieVector3 = Vector3.subtract(e, p);
        const y: IAutoMovieVector3 = Vector3.subtract(x, p);
        const grow: number = Math.exp(w * STEP);
        x = Vector3.add(
          p,
          Vector3.add(
            Vector3.scale(z, grow / 2),
            Vector3.scale(Vector3.subtract(y, Vector3.scale(z, 0.5)), 1 / grow),
          ),
        );
        e = Vector3.add(p, Vector3.scale(z, grow));
        settle.push(x);
        drifting.push(e);
        if (
          i * STEP >= righting &&
          Vector3.length(Vector3.subtract(x, rest)) <= SETTLED &&
          Vector3.length(Vector3.subtract(e, rest)) <= SETTLED
        )
          break;
      }
      const settled: number = last + (settle.length - 1) * STEP;
      const recovery: IRecovery = {
        steps,
        caught: caughtAt,
        settled,
        course: (seconds: number): IAutoMovieVector3 => {
          if (seconds >= last) {
            const at: number = Math.min(
              settle.length - 1,
              (seconds - last) / STEP,
            );
            const i: number = Math.floor(at);
            return Vector3.lerp(
              settle[i]!,
              settle[Math.min(settle.length - 1, i + 1)]!,
              at - i,
            );
          }
          return swung.course(seconds);
        },
        pressure: (seconds: number): IAutoMovieVector3 => {
          if (seconds >= last)
            return flat(
              Vector3.add(
                centre,
                pressing[
                  Math.min(
                    pressing.length - 1,
                    Math.floor((seconds - last) / STEP),
                  )
                ]!,
              ),
            );
          return swung.pressure(seconds);
        },
        extrapolated: (seconds: number): IAutoMovieVector3 => {
          if (seconds >= last) {
            const at: number = Math.min(
              drifting.length - 1,
              (seconds - last) / STEP,
            );
            const i: number = Math.floor(at);
            return flat(
              Vector3.add(
                centre,
                Vector3.lerp(
                  drifting[i]!,
                  drifting[Math.min(drifting.length - 1, i + 1)]!,
                  at - i,
                ),
              ),
            );
          }
          return swung.extrapolated(seconds);
        },
      };

      if (!kinematic) return recovery;
      // The order's course, judged: the course of its catching steps
      // continued, from their last landing, over the closing step and the
      // settling, by the course's own receding horizon.
      const landed: number = steps.at(-2)!.land;
      const course: walkStanceCourse.ICourse = sequential(
        body,
        knotsOf(body, entry, bend, { ...recovery, caught: landed }, settled),
        judging,
        judging === undefined
          ? 0
          : Math.min(
              judging.knots.length,
              Math.floor(landed * KNOTS + 1e-9),
            ),
      );
      return course.unmet > walkStanceCourse.MET
        ? null
        : { ...recovery, stances: course };
    };
    for (const order of orders) {
      feet = { ...entered };
      phases = [];
      steps = [];
      s = { x: 0, y: 0, z: 0 };
      v = Vector3.scale(flat(push), speed);
      t = 0;
      for (let k: number = 0; k < order.length; k++) {
        // Orders that begin alike share their first steps: each sequence of
        // feet is stepped once, and an order that repeats it takes up its
        // state.
        const key: string = order.slice(0, k + 1).join(",");
        let known = taken.get(key);
        if (known === undefined) {
          // A step's course starts from the course of the steps before it in
          // this order, so a step's landing depends on its own steps alone.
          checking =
            k === 0
              ? undefined
              : taken.get(order.slice(0, k).join(","))?.course;
          const result: boolean | null = step(
            order[k]!,
            k === 0 ? AutoMovieMotionHumanTiming.seconds(REACTION) : 0,
            k === 0 && sideways && order[0] === first,
          );
          known = {
            course: checking,
            done: result,
            feet: { ...feet },
            phases: [...phases],
            steps: [...steps],
            s,
            v,
            t,
          };
          taken.set(key, known);
        } else {
          feet = { ...known.feet };
          phases = [...known.phases];
          steps = [...known.steps];
          s = known.s;
          v = known.v;
          t = known.t;
        }
        const done: boolean | null = known.done;
        if (done === null) break;
        if (done) {
          caught = k === order.length - 1;
          judging = known.course;
          break;
        }
      }
      if (caught) {
        stepped = order[order.length - 1]!;
        const recovery: IRecovery | null = closed(judging);
        if (recovery !== null) return recovery;
        caught = false;
      }
    }
    return null;
  }
  /**
   * The fastest push along a direction a body catches in `STEPS` recovery
   * steps, to `RESOLUTION` and then floored to a whole centimetre per second,
   * with every speed of that grid over `VERIFIED` below it caught too.
   *
   * The pendulum alone, its steps unchecked against the legs' ranges,
   * catches at least what the whole model catches, so its fastest caught
   * speed bounds the limit from above; the whole model is then bisected
   * between none and that bound. A bound the whole model catches is the
   * limit at once.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param push The push's horizontal unit direction, world.
   * @param above A speed it does not catch, m/s.
   * @returns m/s, a whole centimetre per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the bracket and the result's precision.
   * @evidence contracts/development/implementation.md#principled-implementation Capture is monotone in the speed: `recover` tries every order of the feet and lands each step as near its target as its region allows, so whatever catches a push catches a slower one along the same course (Koolen et al. 2012); the pendulum's capture is a necessary condition of the whole model's, so it bounds the bracket from above, and the whole model is bisected inside it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two bisections over `recover`: the pendulum's, then the whole model's.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limit is the whole model's, never the pendulum's bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms The pendulum's bisection costs no stance course; the whole model's runs inside its bound, read only when a push is refused.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `recover`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function limit(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    push: IAutoMovieVector3,
    above: number,
  ): number {
    // The limit is the body's in a direction from a stance: read once.
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(entry);
    const key: string = [
      push.x,
      push.z,
      ...[feet.left, feet.right].flatMap(
        (f: HumanFoot.IPlacement): number[] => [f.ankle.x, f.ankle.z],
      ),
    ]
      .map((v: number): string => v.toFixed(4))
      .join(",");
    const known: Map<string, number> | undefined = LIMITS.get(body);
    const kept: number | undefined = known?.get(key);
    if (kept !== undefined && kept < above) return kept;
    const bisect = (
      lo: number,
      hi: number,
      catches: (speed: number) => boolean,
    ): number => {
      while (hi - lo > RESOLUTION) {
        const mid: number = (lo + hi) / 2;
        if (catches(mid)) lo = mid;
        else hi = mid;
      }
      return lo;
    };
    const bound: number = bisect(
      0,
      above,
      (speed: number): boolean =>
        recover(body, entry, push, speed, 1, false) !== null,
    );
    const whole = (speed: number): boolean =>
      recover(body, entry, push, speed, 1) !== null;
    // The limit stands with its band verified: every speed of the grid over
    // `VERIFIED` below it is caught too; a refused one below it moves the
    // search under it.
    let found: number = whole(bound) ? bound : bisect(0, bound, whole);
    for (;;) {
      let refused: number = -1;
      for (let i: number = 1; i * RESOLUTION <= VERIFIED + 1e-9; i++) {
        const speed: number = found - i * RESOLUTION;
        if (speed <= 0) break;
        if (!whole(speed)) {
          refused = speed;
          break;
        }
      }
      if (refused < 0) break;
      found = bisect(0, refused, whole);
    }
    const out: number = Math.floor(found * 100) / 100;
    if (known === undefined) LIMITS.set(body, new Map([[key, out]]));
    else known.set(key, out);
    return out;
  }

  /** Each body's fastest caught push, by its direction and its stance's feet, read once (`limit`). */
  const LIMITS: WeakMap<
    IHumanActionContext["body"],
    Map<string, number>
  > = new WeakMap();
  /**
   * The centre of mass's shift per sine of the trunk's tilt about the hips,
   * on the entry's feet: the posture tilted `REFERENCE` degrees in pitch and
   * in roll (`AutoMovieMotionHumanLean.pivot`) and its centre of mass read
   * (`HumanBalance.support`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @returns The horizontal shift per sine of the pitch and of the roll, metres.
   */
  function bending(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
  ): Record<"pitch" | "roll", IAutoMovieVector3> {
    const standing: IHumanPosture = {
      ...entry.posture,
      limbs: {
        ...entry.posture.limbs,
        ...StrikingStance.legs(body, StrikingTarget.feet(entry)),
      },
    };
    const upright: IAutoMovieVector3 = HumanBalance.support(
      body,
      standing,
    ).centre;
    const sine: number = Math.sin((REFERENCE * Math.PI) / 180);
    const shift = (more: {
      pitch: number;
      roll: number;
    }): IAutoMovieVector3 => {
      const tilted: IHumanPosture = AutoMovieMotionHumanLean.pivot(
        body,
        standing,
        more,
      );
      const centre: IAutoMovieVector3 = HumanBalance.support(body, {
        ...tilted,
        root: resolveHumanPosture.lower(body, tilted).root,
      }).centre;
      return {
        x: (centre.x - upright.x) / sine,
        y: 0,
        z: (centre.z - upright.z) / sine,
      };
    };
    return {
      pitch: shift({ pitch: REFERENCE, roll: 0 }),
      roll: shift({ pitch: 0, roll: REFERENCE }),
    };
  }

  /**
   * A stance course's pelvis at an instant: the upright root carries the
   * centre of mass's travel less the shift the trunk's tilt makes of it
   * (`bending`), so the centre keeps its course whatever the trunk does, and
   * the pelvis turns toward its stances (`walkReach.pelvis`) and tilts with
   * the trunk about the hips (`walkReach.tilt`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param bend The shift per sine of the trunk's tilt.
   * @param travel The centre of mass's travel from the entry's, world metres.
   * @param feet Each foot as scheduled then.
   * @returns The upright root and the pelvis under a trunk's tilt, and the pelvis's heading.
   */
  function frame(
    body: IHumanActionContext["body"],
    entry: IHumanPosture,
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    travel: IAutoMovieVector3,
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
  ): {
    root: (trunk: walkStanceCourse.ITrunk) => IAutoMovieVector3;
    pelvis: (trunk: walkStanceCourse.ITrunk) => walkStanceCourse.IPelvis;
    yaw: number;
  } {
    const root = (trunk: walkStanceCourse.ITrunk): IAutoMovieVector3 => {
      const p: number = Math.sin((trunk.pitch * Math.PI) / 180);
      const r: number = Math.sin((trunk.roll * Math.PI) / 180);
      return {
        x: entry.root.x + travel.x - bend.pitch.x * p - bend.roll.x * r,
        y: entry.root.y,
        z: entry.root.z + travel.z - bend.pitch.z * p - bend.roll.z * r,
      };
    };
    const base: IAutoMovieVector3 = root({ pitch: 0, roll: 0 });
    const upright: walkReach.IPelvis = walkReach.pelvis(
      body,
      base,
      entry.yaw,
      entry.joints.hips ?? [0, 0, 0],
      feet,
    );
    return {
      root,
      pelvis: (trunk: walkStanceCourse.ITrunk): walkStanceCourse.IPelvis => {
        const at: IAutoMovieVector3 = root(trunk);
        const moved = (hip: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: hip.x + at.x - base.x,
          y: hip.y,
          z: hip.z + at.z - base.z,
        });
        return walkReach.tilt(
          body,
          at,
          upright.yaw,
          { left: moved(upright.hips.left), right: moved(upright.hips.right) },
          trunk,
        );
      },
      yaw: upright.yaw,
    };
  }

  /**
   * The point a leg's knee bends toward: ahead over its foot's heading from
   * where the knee rests under the root.
   *
   * @param body The body.
   * @param root The lowered root, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @param side The leg.
   * @param heading The foot's heading, degrees.
   * @returns World metres.
   */
  function kneePole(
    body: IHumanActionContext["body"],
    root: IAutoMovieVector3,
    yaw: number,
    side: "left" | "right",
    heading: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: HumanFrame.point(
          { origin: root, yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading,
      },
      { x: 0, y: 0, z: 1 },
    );
  }
  /**
   * The share of a swing a stepping foot takes to rise clear of the floor:
   * the share of a walking swing its lift takes to set down from the
   * floor's contact height (`walkFoot.swing`).
   *
   * @param body The body.
   * @returns The share.
   */
  function risingOf(body: IHumanActionContext["body"]): number {
    return (
      Math.asin(
        Math.sqrt(
          AutoMovieMotionHumanAuditContact.HEIGHT /
            (LIFT * body.measure.hipHeight),
        ),
      ) / Math.PI
    );
  }

  /**
   * A recovery's stance-course knots up to a second (`walkStanceCourse`):
   * at `KNOTS` a second, the feet standing where their last steps put them
   * and a swinging foot read at the place it left, for the pelvis's turn
   * alone, from its lift-off; the pelvis on the centre of mass's course
   * (`frame`); the feet bearing the centre of pressure, and the extrapolated
   * centre of mass once a step has caught it and both feet stand; a foot
   * that has landed free to turn out.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param bend The shift per sine of the trunk's tilt.
   * @param walk The steps, the pendulum's courses, the catching step's landing, seconds since the action's start, and the landing the course places, when one is.
   * @param until The last knot's second.
   * @returns The knots, each with its frame.
   */
  function knotsOf(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    walk: {
      steps: readonly IStep[];
      course: (seconds: number) => IAutoMovieVector3;
      pressure: (seconds: number) => IAutoMovieVector3;
      extrapolated: (seconds: number) => IAutoMovieVector3;
      caught: number;
      landing?: {
        placement: HumanFoot.IPlacement;
        goal: IAutoMovieVector3;
        region: (ankle: IAutoMovieVector3) => number[];
      };
    },
    until: number,
  ): IKnot[] {
    const entered: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(entry);
    const rising: number = risingOf(body);
    const knots: IKnot[] = [];
    for (let k: number = 0; k <= Math.ceil(until * KNOTS - 1e-9); k++) {
      const t: number = Math.min(until, k / KNOTS);
      const feet: Record<"left" | "right", walkFoot.IScheduled> = {
        left: { placement: entered.left, toes: 0 },
        right: { placement: entered.right, toes: 0 },
      };
      for (const step of walk.steps)
        if (t >= step.land - 1e-9)
          feet[step.side] = { placement: step.to, toes: 0 };
      for (const step of walk.steps)
        if (t > step.start && t < step.land - 1e-9)
          feet[step.side] = {
            placement: step.from,
            toes: 0,
            swing: {
              u: Math.max(
                0,
                ((t - step.start) / (step.land - step.start) - rising) /
                  (1 - rising),
              ),
              off: step.start,
              on: step.land,
            },
          };
      const stances: ("left" | "right")[] = (["left", "right"] as const).filter(
        (side: "left" | "right"): boolean => feet[side].swing === undefined,
      );
      const framed = frame(body, entry.posture, bend, walk.course(t), feet);
      knots.push({
        seconds: k / KNOTS,
        frame: framed,
        pelvis: framed.pelvis,
        borne: [
          walk.pressure(t),
          ...(t >= walk.caught && stances.length === 2
            ? [walk.extrapolated(t)]
            : []),
        ],
        stances: stances.map(
          (side: "left" | "right"): walkStanceCourse.IStance => ({
            side,
            placement: feet[side].placement,
            turning: walk.steps.some(
              (step: IStep): boolean =>
                step.side === side && t >= step.land - 1e-9,
            ),
            ...(walk.landing !== undefined &&
            feet[side].placement === walk.landing.placement
              ? {
                  landing: {
                    goal: walk.landing.goal,
                    region: walk.landing.region,
                  },
                }
              : {}),
          }),
        ),
      });
    }
    return knots;
  }

/** A recovery's stance-course knot with the frame its pelvis stands in (`knotsOf`). */
  type IKnot = walkStanceCourse.IKnot & { frame: ReturnType<typeof frame> };

  /**
   * A recovery's stance course whose knees are the posture's own, solved as
   * a sequential convex problem by the shared loop (`HumanSequentialConvex`,
   * TrajOpt's outer loop, Schulman et al. 2014): at a course, each planted
   * leg's bend branch and swivel are the posture's leg fit run there
   * (`HumanLegChain.fit`, with the knee hint the posture gives it,
   * `kneePole`), and the course is evaluated with them; the convex
   * subproblem about a course holds each swivel as its first-order piece in
   * the leg's own variables (`walkStanceCourse.ISwivel`), so the subproblem
   * sees how the knee follows the course, as TrajOpt linearises a nonconvex
   * function at the iterate. The slope is a forward difference of the fit
   * with the branch held, of a step `sqrt(eps) x scale` (Nocedal and Wright
   * 2006, section 8.1): `eps` the fit's own resolution relative to its
   * swivel, the engine's swivel resolution over its sweep's step
   * (`hingedArmSwivel.RESOLUTION`, `hingedArmSwivel.STEP`), and `scale` the
   * course's trust region per variable. A difference that flips the branch
   * is taken on the other side; one that flips it on both is no slope, and
   * the subproblem keeps that variable within the step, the branch's edge
   * bounding the region there (`walkStanceCourse.optimise` runs the loop).
   * Knots a parent course settles keep the parent's swivels.
   *
   * @param body The body.
   * @param knots The knots, each with its frame.
   * @param parent The course whose first `from` knots this one keeps.
   * @param from How many first knots the parent settles.
   * @returns The course at the last iterate taken, its largest excess as `unmet`.
   */
  function sequential(
    body: IHumanActionContext["body"],
    knots: readonly IKnot[],
    parent?: walkStanceCourse.ICourse,
    from: number = 0,
  ): walkStanceCourse.ICourse {
    // The parent's swivels, kept on the knots it settles.
    const kept = (
      k: number,
      side: "left" | "right",
    ): walkStanceCourse.ISwivel | undefined =>
      parent === undefined || k >= from || k >= parent.knots.length
        ? undefined
        : parent.knots[k]!.stances.find(
            (s: walkStanceCourse.IStance): boolean => s.side === side,
          )?.swivel;
    const holding = (
      swivels: readonly (
        | Partial<Record<"left" | "right", walkStanceCourse.ISwivel>>
        | undefined
      )[],
    ): walkStanceCourse.IKnot[] =>
      knots.map(
        (knot: IKnot, k: number): walkStanceCourse.IKnot => ({
          ...knot,
          stances: knot.stances.map(
            (s: walkStanceCourse.IStance): walkStanceCourse.IStance => {
              const swivel: walkStanceCourse.ISwivel | undefined =
                swivels[k]?.[s.side] ?? kept(k, s.side);
              return swivel === undefined ? s : { ...s, swivel };
            },
          ),
        }),
      );
    const problemOf = (
      swivels: readonly (
        | Partial<Record<"left" | "right", walkStanceCourse.ISwivel>>
        | undefined
      )[],
    ): walkStanceCourse.IProblem =>
      walkStanceCourse.problem(body, holding(swivels), parent, from);

    // The problem's shape, its knots without swivels: the swivels change
    // only the readings, never the variables or the rows' order.
    const shape: walkStanceCourse.IProblem = problemOf([]);

    // The posture's fit of a planted leg at a course.
    const fitOf = (
      k: number,
      p: walkStanceCourse.IPlanted,
      x: Float64Array,
    ): HumanLegChain.ISwivel => {
      const root: IAutoMovieVector3 = knots[k]!.frame.root({
        pitch: x[shape.variables(k, p.side)[1]!]!,
        roll: x[shape.variables(k, p.side)[2]!]!,
      });
      return HumanLegChain.fit(
        body,
        p.side,
        p.pelvis,
        p.hip,
        p.ankle,
        kneePole(
          body,
          { ...root, y: root.y - p.drop },
          knots[k]!.frame.yaw,
          p.side,
          p.heading,
        ),
        p.rotation,
      );
    };
    type Fitted = (
      | Partial<Record<"left" | "right", HumanLegChain.ISwivel>>
      | undefined
    )[];
    const fits = (x: Float64Array): Fitted =>
      knots.map(
        (
          _: IKnot,
          k: number,
        ): Partial<Record<"left" | "right", HumanLegChain.ISwivel>> | undefined => {
          if (k < shape.first) return undefined;
          const out: Partial<Record<"left" | "right", HumanLegChain.ISwivel>> =
            {};
          for (const p of shape.planted(x, k)) out[p.side] = fitOf(k, p, x);
          return out;
        },
      );

    // The fits at the last course read, read once a course.
    let last: { x: Float64Array; at: Fitted } | undefined;
    const fitted = (x: Float64Array): Fitted => {
      if (last === undefined || last.x !== x) last = { x, at: fits(x) };
      return last.at;
    };

    // Each swivel's first-order piece about a course, and the variables a
    // branch's edge bounds, read once a course: a subproblem convexified again
    // at another penalty about the same course reads the same pieces.
    let known: { x: Float64Array; at: ReturnType<typeof piecesOf> } | undefined;
    const pieces = (x: Float64Array): ReturnType<typeof piecesOf> => {
      if (known === undefined || known.x !== x) known = { x, at: piecesOf(x) };
      return known.at;
    };
    const piecesOf = (
      x: Float64Array,
    ): {
      swivels: (
        | Partial<Record<"left" | "right", walkStanceCourse.ISwivel>>
        | undefined
      )[];
      edges: Map<number, number>;
    } => {
      const edges: Map<number, number> = new Map();
      const swivels = fitted(x).map(
        (
          fit: Partial<Record<"left" | "right", HumanLegChain.ISwivel>> | undefined,
          k: number,
        ): Partial<Record<"left" | "right", walkStanceCourse.ISwivel>> | undefined => {
          if (fit === undefined) return undefined;
          const out: Partial<Record<"left" | "right", walkStanceCourse.ISwivel>> =
            {};
          for (const side of ["left", "right"] as const) {
            const base: HumanLegChain.ISwivel | undefined = fit[side];
            if (base === undefined) continue;
            const indices: number[] = shape.variables(k, side);
            const slope: number[] = indices.map((i: number, v: number): number => {
              const h: number =
                Math.sqrt(hingedArmSwivel.RESOLUTION / hingedArmSwivel.STEP) *
                walkStanceCourse.SCALE[v]!;
              const read = (sign: number): HumanLegChain.ISwivel | undefined => {
                const moved: Float64Array = Float64Array.from(x);
                moved[i] = moved[i]! + sign * h;
                const p: walkStanceCourse.IPlanted | undefined = shape
                  .planted(moved, k)
                  .find(
                    (q: walkStanceCourse.IPlanted): boolean => q.side === side,
                  );
                return p === undefined ? undefined : fitOf(k, p, moved);
              };
              const turned = (a: number, b: number): number =>
                ((((a - b + 180) % 360) + 360) % 360) - 180;
              const ahead: HumanLegChain.ISwivel | undefined = read(1);
              if (ahead !== undefined && ahead.branch === base.branch)
                return turned(ahead.swivel, base.swivel) / h;
              const behind: HumanLegChain.ISwivel | undefined = read(-1);
              if (behind !== undefined && behind.branch === base.branch)
                return turned(base.swivel, behind.swivel) / h;
              edges.set(i, h);
              return 0;
            });
            out[side] = {
              ...base,
              slope,
              about: indices.map((i: number): number => x[i]!),
            };
          }
          return out;
        },
      );
      return { swivels, edges };
    };

    return walkStanceCourse.optimise(
      body,
      shape,
      (
        x: Float64Array,
        model: boolean,
      ): { problem: walkStanceCourse.IProblem; rows: QP.IRow[] } => {
        if (!model) return { problem: problemOf(fitted(x)), rows: [] };
        const { swivels, edges } = pieces(x);
        return {
          problem: problemOf(swivels),
          rows: [...edges].map(
            ([i, h]: [number, number]): QP.IRow => ({
              index: [i],
              coef: [1],
              l: -h,
              u: h,
            }),
          ),
        };
      },
    );
  }

  /** The point of a convex outline nearest a point, the point itself when inside, on the floor. */
  function nearest(
    outline: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (outline.length >= 3 && pointInHull(point, outline)) return point;
    let best: IAutoMovieVector3 = outline[0]!;
    let gap: number = Infinity;
    for (let i: number = 0; i < outline.length; i++) {
      const a: IAutoMovieVector3 = outline[i]!;
      const b: IAutoMovieVector3 = outline[(i + 1) % outline.length]!;
      const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
      const span: number = Vector3.dot(ab, ab);
      const u: number =
        span > 0
          ? Math.min(
              1,
              Math.max(0, Vector3.dot(Vector3.subtract(point, a), ab) / span),
            )
          : 0;
      const q: IAutoMovieVector3 = Vector3.add(a, Vector3.scale(ab, u));
      const d: number = Vector3.length(Vector3.subtract(point, q));
      if (d < gap) {
        gap = d;
        best = q;
      }
    }
    return best;
  }

  /**
   * Plan a stagger.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the speed is not positive or the manner is out of range.
   * @throws {HumanRefusal} `parameter` on `speed` when no `STEPS` recovery steps catch the push: a fall, with the fastest push the body catches that way.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The push read causally at the plan's start; the recovery's steps and the centre of mass's course on the pendulum; the feet, the pelvis and the trunk on one stance course under the legs' ranges, the pelvis carrying the centre of mass less the trunk's own shift of it; the swings a walk's; the arms abducted from their measured onset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, one held base and two rows: the body over its feet, and the arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push no `STEPS` steps catch is refused with the body's limit instead of shortening a step past the legs' reach; the righting and the course's weights are named provisional constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms One recovery search and two posture solves per plan; per posture one pelvis settling and a swing's hold, with each step's two stance ends memoised.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `walkReach`, `walkFoot`, `HumanBalance`, `HumanArmSwing` and `ReactionSource`; the push, its recovery, the trunk's shift of the centre of mass and the stance course are read once per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the recovery, the trunk's shift, the stance course and the memoised stance ends, released with the plan.
   */ export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    if (!(p.speed > 0)) throw new Error("A stagger's speed is positive");
    const body = context.body;
    const entry: IHumanPosture = context.entry.posture;
    const righting: number =
      AutoMovieMotionManner.of(context, p.manner).tempo *
      AutoMovieMotionHumanTiming.seconds(RIGHTING);

    // The push, read where its source is as the plan begins, the causal read
    // a reaction makes (`ReactionSource`), and the recovery it asks for; a
    // push no `STEPS` steps catch is a fall, refused with the fastest push
    // this body catches that way.
    const push: IAutoMovieVector3 = Vector3.normalize({
      ...AutoMovieMotionHumanTarget.away(
        ReactionSource.at(
          context,
          p.from,
          context.start - StrikingTarget.LOOK,
          entry,
          AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        ),
        entry.root,
        entry.yaw,
      ),
      y: 0,
    });
    const recovery: IRecovery | null = recover(
      body,
      context.entry,
      push,
      p.speed,
      righting,
    );
    if (recovery === null) {
      const caught: number = limit(body, context.entry, push, p.speed);
      throw new HumanRefusal({
        kind: "parameter",
        axis: "speed",
        value: p.speed,
        feasible: { kind: "range", minimum: 0, maximum: caught, unit: "m/s" },
        reason: `a ${p.speed} m/s push this way is a fall: no ${STEPS} recovery steps within a person's measured step times and lengths and the legs' ranges catch it; this body catches up to ${caught.toFixed(2)} m/s pushed this way, to a centimetre per second, every push over the ${VERIFIED} m/s below it verified at every ${RESOLUTION} m/s`,
        fix: `push no harder than ${caught.toFixed(2)} m/s, or play the fall`,
      });
    }
    // The first step's landing, the instant the clock names the catch by.
    const swing: number = recovery.steps[0]!.land;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      recovery.settled,
      [
        { name: "tipped", seconds: 0.5 * swing },
        { name: "caught", seconds: swing },
        { name: "stroke", seconds: swing },
        { name: "relax", seconds: swing },
      ],
    );
    const duration: number = clock.duration;
    const geometry = () => ({ recovery });
    const last = (): number => geometry().recovery.steps.at(-1)!.land;
    const bend: Record<"pitch" | "roll", IAutoMovieVector3> = bending(
      body,
      context.entry,
    );

    // The stances' course the recovery judged (`recover`, `walkStanceCourse`):
    // the pelvis's drop, each planted foot's pitch about its ball and its turn
    // on the floor, and the trunk's tilt about the hips at every knot, each
    // step's course continued from the last over the closing step and the
    // settling, so what is shown is what was judged. The pelvis carries the
    // centre of mass on its course less the shift the trunk's tilt makes of
    // it (`frame`), so the trunk bends against a fall wherever the legs need
    // the hips over a foot (Horak and Nashner 1986's hip strategy, which the
    // ranges ask for rather than a rule); the heels rise only where the feet
    // still bear the recovery's centre of pressure and its caught
    // extrapolated centre of mass; a foot that has landed may turn out. A
    // foot in the air is read at the place it left, for the pelvis's turn
    // alone, from its lift-off as `scheduled` reads it.
    const course = (): walkStanceCourse.ICourse => recovery.stances!;
    // The pelvis and the stances at a second, as the course holds them.
    const settle = (
      seconds: number,
      feet: Record<"left" | "right", walkFoot.IScheduled>,
    ): walkReach.IGround => {
      const reading: walkStanceCourse.IReading = walkStanceCourse.at(
        course(),
        seconds,
      );
      return walkReach.held(
        body,
        frame(body, entry, bend, recovery.course(seconds), feet).root(
          reading.trunk,
        ),
        entry.yaw,
        entry.joints.hips ?? [0, 0, 0],
        feet,
        reading,
      );
    };
    // The feet as they stand at a second no foot swings: each where the last
    // of its steps put it.
    const entered: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const standing = (
      seconds: number,
    ): Record<"left" | "right", walkFoot.IScheduled> => {
      const out: Record<"left" | "right", walkFoot.IScheduled> = {
        left: { placement: entered.left, toes: 0 },
        right: { placement: entered.right, toes: 0 },
      };
      for (const step of geometry().recovery.steps)
        if (seconds >= step.land - 1e-9)
          out[step.side] = { placement: step.to, toes: 0 };
      return out;
    };
    // A foot's stance as reached at a step's start or landing, when both feet
    // stand, memoised by its second.
    const ends: Map<string, walkFoot.IEnd> = new Map();
    const end = (side: "left" | "right", seconds: number): walkFoot.IEnd => {
      const key: string = `${side}:${seconds}`;
      let out: walkFoot.IEnd | undefined = ends.get(key);
      if (out === undefined) {
        out = settle(seconds, standing(seconds)).feet[side];
        ends.set(key, out);
      }
      return out;
    };
    // The feet at a second as a gait schedules them: a stance where it
    // stands, and a swing as a walking foot swings (`walkFoot.swing`) from the
    // stance it leaves to the stance it lands in, lifted as a walk lifts it.
    const rising: number = risingOf(body);
    // A step's swinging foot at a second of its swing, its path bowed
    // across its travel by `bow` metres on a bump at rest at both ends.
    const swungAt = (
      step: IStep,
      seconds: number,
      bow: number,
    ): walkFoot.IScheduled => {
      const u: number = (seconds - step.start) / (step.land - step.start);
      // The foot first rises clear of the floor, by the least toe clearance
      // of walking, over the share of the swing a walking foot takes to set
      // down from that height, then swings from there.
      const from: walkFoot.IEnd = end(step.side, step.start);
      const to: walkFoot.IEnd = end(step.side, step.land);
      const raised: walkFoot.IEnd = {
        ...from,
        ankle: { ...from.ankle, y: from.ankle.y + CLEARANCE },
      };
      const share: number = Math.max(0, (u - rising) / (1 - rising));
      const swung: walkFoot.IFoot =
        u < rising
          ? {
              placement: {
                ankle: {
                  ...from.ankle,
                  y: from.ankle.y + CLEARANCE * minimumJerk(u / rising).s,
                },
                rotation: from.rotation,
              },
              toes: from.toes,
            }
          : walkFoot.swing(body, step.side, {
              from: raised,
              velocity: { x: 0, y: 0, z: 0 },
              to,
              u: share,
              seconds: (1 - rising) * (step.land - step.start),
              lift: LIFT,
            });
      const travel: IAutoMovieVector3 = {
        x: to.ankle.x - from.ankle.x,
        y: 0,
        z: to.ankle.z - from.ankle.z,
      };
      const size: number = Vector3.length(travel);
      const normal: IAutoMovieVector3 =
        size > 1e-9
          ? { x: -travel.z / size, y: 0, z: travel.x / size }
          : HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
              { x: 0, y: 0, z: 1 },
            );
      const bump: number = 16 * share * share * (1 - share) * (1 - share);
      return {
        ...swung,
        placement: {
          ...swung.placement,
          ankle: Vector3.add(
            swung.placement.ankle,
            Vector3.scale(normal, bow * bump),
          ),
        },
        // The pelvis reads the swing from its lift-off on: a foot still
        // rising bears its claim on the hips as a stance does.
        swing: { u: share, off: step.start, on: step.land },
      };
    };
    // A swing that passes the standing leg goes around it: its path bows
    // across its travel, to whichever side asks less, by the least that
    // keeps the swinging leg clear of the standing one as the tangle audit
    // reads them (`walkLegClearance`), read at the stance course's knots
    // (`KNOTS`) through the swing and bisected to a millimetre; a swing already clear keeps its
    // path.
    const bows: Map<IStep, number> = new Map();
    const bowOf = (step: IStep): number => {
      const known: number | undefined = bows.get(step);
      if (known !== undefined) return known;
      const stance: "left" | "right" = step.side === "left" ? "right" : "left";
      const count: number = Math.ceil((step.land - step.start) * KNOTS);
      const instants = Array.from(
        { length: count - 1 },
        (_: unknown, i: number) => {
          const seconds: number =
            step.start + ((i + 1) / count) * (step.land - step.start);
          const feet: Record<"left" | "right", walkFoot.IScheduled> =
            standing(seconds);
          feet[step.side] = swungAt(step, seconds, 0);
          return { seconds, settled: settle(seconds, feet) };
        },
      );
      // Each leg as the posture's own fit poses it there (`HumanLegChain`),
      // its knee bent toward the hint the posture gives it.
      const legOf = (
        side: "left" | "right",
        settled: walkReach.IGround,
        foot: walkFoot.IEnd,
      ): walkLegClearance.ILeg => {
        const pelvis: IAutoMovieQuaternion =
          settled.pelvis ??
          resolveHumanPosture.heading({ yaw: settled.yaw, pitch: 0, roll: 0 });
        const swivel: HumanLegChain.ISwivel = HumanLegChain.fit(
          body,
          side,
          pelvis,
          settled.hips[side],
          foot.ankle,
          kneePole(
            body,
            settled.root,
            settled.yaw,
            side,
            HumanFoot.heading(foot.rotation),
          ),
          foot.rotation,
        );
        return {
          ...HumanLegChain.pose(
            body,
            side,
            pelvis,
            settled.hips[side],
            foot.ankle,
            swivel,
          )!,
          side,
          rotation: foot.rotation,
        };
      };
      // The standing leg's fit is read once a knot.
      const standingLegs: walkLegClearance.ILeg[] = instants.map(
        ({ settled }) => legOf(stance, settled, settled.feet[stance]),
      );
      const worst = (bow: number): number => {
        let out: number = 0;
        for (const [i, { seconds, settled }] of instants.entries()) {
          const reached: walkFoot.IEnd = walkReach.swing(
            body,
            step.side,
            settled,
            swungAt(step, seconds, bow),
            (seconds - step.start) / (step.land - step.start),
          );
          out = Math.max(
            out,
            walkLegClearance.excess(
              body,
              legOf(step.side, settled, reached),
              standingLegs[i]!,
            ),
          );
        }
        return out;
      };
      let bow: number = 0;
      if (worst(0) > walkLegClearance.BOUND) {
        const widest: number = 2 * Vector3.length(
          Vector3.subtract(
            HumanFoot.point(body, step.side, "toe", step.from),
            HumanFoot.point(body, step.side, "heel", step.from),
          ),
        );
        const sides = [1, -1].map((way: number) => {
          if (worst(way * widest) > walkLegClearance.BOUND)
            return { way, bow: Infinity, at: worst(way * widest) };
          let lo: number = 0;
          let hi: number = widest;
          while (hi - lo > 0.001) {
            const mid: number = (lo + hi) / 2;
            if (worst(way * mid) > walkLegClearance.BOUND) lo = mid;
            else hi = mid;
          }
          return { way, bow: hi, at: 0 };
        });
        const pick = sides.reduce((a, b) =>
          a.bow < b.bow || (a.bow === b.bow && a.at <= b.at) ? a : b,
        );
        bow = pick.way * (Number.isFinite(pick.bow) ? pick.bow : widest);
      }
      bows.set(step, bow);
      return bow;
    };
    const scheduled = (
      seconds: number,
    ): Record<"left" | "right", walkFoot.IScheduled> => {
      const out: Record<"left" | "right", walkFoot.IScheduled> =
        standing(seconds);
      for (const step of geometry().recovery.steps) {
        if (seconds <= step.start || seconds >= step.land) continue;
        out[step.side] = swungAt(step, seconds, bowOf(step));
      }
      return out;
    };
    // The share of its swing a foot is at.
    const swinging = (side: "left" | "right", seconds: number): number => {
      for (const step of geometry().recovery.steps)
        if (step.side === side && seconds > step.start && seconds < step.land)
          return (seconds - step.start) / (step.land - step.start);
      return 0;
    }; // A swinging foot is then held inside its leg's ranges under the settled
    // pelvis and off the floor (`walkReach.swing`).
    const solve = (
      seconds: number,
    ): {
      feet: Record<"left" | "right", walkFoot.IScheduled>;
      settled: walkReach.IGround;
      reached: Record<"left" | "right", walkFoot.IEnd>;
    } => {
      const feet: Record<"left" | "right", walkFoot.IScheduled> =
        scheduled(seconds);
      const settled: walkReach.IGround = settle(seconds, feet);
      const reached: Record<"left" | "right", walkFoot.IEnd> = {
        ...settled.feet,
      };
      for (const side of ["left", "right"] as const)
        if (feet[side].swing !== undefined)
          reached[side] = walkReach.swing(
            body,
            side,
            settled,
            feet[side],
            swinging(side, seconds),
          );
      return { feet, settled, reached };
    };
    const legs: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const { feet, settled, reached } = solve(seconds);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of ["left", "right"] as const) {
          // The knee points over the foot's own heading.
          const knee: IAutoMovieVector3 = kneePole(
            body,
            settled.root,
            settled.yaw,
            side,
            HumanFoot.heading(reached[side].rotation),
          );
          limbs[side === "left" ? "leftLeg" : "rightLeg"] = {
            point: reached[side].ankle,
            bend: knee,
            rotation: reached[side].rotation,
            ...(feet[side].swing === undefined
              ? { planted: true, contact: settled.contacts[side] }
              : {}),
          };
        }
        // The trunk tilts about the hips as the course bends it, so the legs
        // stay on their feet.
        return AutoMovieMotionHumanLean.pivot(
          body,
          {
            ...posture,
            root: settled.root,
            yaw: settled.yaw,
            joints: {
              ...posture.joints,
              leftToes: [reached.left.toes, 0, 0],
              rightToes: [reached.right.toes, 0, 0],
            },
            limbs,
          },
          walkStanceCourse.at(course(), seconds).trunk,
        );
      },
    };
    // Both arms abduct from the entry's angles as balance reactions and come
    // down as the body settles, each let out further where it would pass
    // into the body (`HumanArmSwing.of`).
    const held: Record<"left" | "right", AutoMovieMotionHumanArm.IAngles> = {
      left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
      right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
    };
    const onset: number = AutoMovieMotionHumanTiming.seconds(ONSET);
    const raised = (seconds: number): number => {
      const end: number = last();
      const rise: number = minimumJerk(
        Math.min(1, Math.max(0, (seconds - onset) / (swing - onset))),
      ).s;
      const fall: number = minimumJerk(
        Math.min(1, Math.max(0, (seconds - end) / (duration - end))),
      ).s;
      return ABDUCTION * Math.max(0, rise - fall);
    };
    const arms: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftArm", "rightArm"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const more: number = raised(seconds);
        const abducted = (
          side: "left" | "right",
        ): AutoMovieMotionHumanArm.IAngles => ({
          ...held[side],
          upper: [
            held[side].upper[0],
            held[side].upper[1] + more,
            held[side].upper[2],
          ],
        });
        return HumanArmSwing.of(
          body,
          AutoMovieMotionHumanArm.carry(
            body,
            posture,
            { left: abducted("left"), right: abducted("right") },
            0,
          ),
          ["left", "right"],
        );
      },
    };
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(duration, {
          root: entry.root,
          yaw: entry.yaw,
          pitch: entry.pitch,
          roll: entry.roll,
          joints: entry.joints,
          limbs: {},
        }),
      },
      clock,
      primitives: [legs, arms],
    });
    return {
      ...composed,
      get contacts(): IHumanContactWindow[] {
        const out: IHumanContactWindow[] = [];
        for (const side of ["left", "right"] as const) {
          let from: number = 0;
          for (const step of geometry().recovery.steps) {
            if (step.side !== side) continue;
            if (step.start > from)
              out.push({
                part: `${side}Foot`,
                kind: "plant",
                from: from / duration,
                to: step.start / duration,
                support: { kind: "ground" },
              });
            from = step.land;
          }
          out.push({
            part: `${side}Foot`,
            kind: "plant",
            from: Math.min(1, from / duration),
            to: 1,
            support: { kind: "ground" },
          });
        }
        return out;
      },
    };
  }
}
