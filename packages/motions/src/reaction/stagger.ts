import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanStagger,
  IAutoMovieMotionHumanTiming,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkStanceCourse } from "../actions/walkStanceCourse";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { HumanFoot } from "../posture/HumanFoot";
import { StrikingTarget } from "../striking/StrikingTarget";
import { ReactionSource } from "./ReactionSource";
import { StaggerFeet } from "./StaggerFeet";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import { staggerLimit } from "./staggerLimit";
import { staggerRecover } from "./staggerRecover";

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
 * floor by the minimum toe clearance of walking (`walkFoot.CLEARANCE`,
 * Killeen et al. 2017), over the share of its swing a walking foot takes to set down
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the landing time `perturb` reads and the plan; the bounds are `staggerBounds`', the recovery `staggerRecover`'s, its limit `staggerLimit`'s and its feet `StaggerFeet`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, contact-window, foot, gait, target, clock, balance and primitive owners; the steps scale with each body's pendulum, feet and stature.
 */
export namespace stagger {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "stagger";

  /** Cancel table: a stagger flows into a guard or a knockdown. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      guard: ["fromStroke", "smooth"],
      knockdown: ["anytime", "quick"],
    });

  /** A reaction interrupts whatever the body was doing, at any instant, as a reflex. */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /** A forward recovery step's landing after the push (`staggerBounds.LANDING`), the step's time `perturb` reads. */
  export const LANDING: IAutoMovieMotionHumanTiming.Span =
    staggerBounds.LANDING;

  /**
   * Plan a stagger.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the speed is not positive or the manner is out of range.
   * @throws {HumanRefusal} `parameter` on `speed` when no `STEPS` recovery steps catch the push: a fall, with the fastest push the body catches that way.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The push read causally at the plan's start; the recovery's steps and the centre of mass's course on the pendulum (`staggerRecover`); the feet, the pelvis and the trunk on one stance course under the legs' ranges (`StaggerFeet`); the arms abducted from their measured onset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, one held base and two rows: the body over its feet, and the arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push no `STEPS` steps catch is refused with the body's limit instead of shortening a step past the legs' reach; the righting is a named provisional constant.
   * @evidence contracts/development/implementation.md#efficient-algorithms One recovery search and two posture solves per plan; per posture one pelvis settling and a swing's hold, with each step's two stance ends memoised.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `staggerRecover`, `staggerLimit`, `StaggerFeet`, `HumanArmSwing` and `ReactionSource`; the push, its recovery and the trunk's shift of the centre of mass are read once per plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the recovery and its feet, released with the plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStagger.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { RIGHTING, STEPS, VERIFIED, RESOLUTION, ONSET, ABDUCTION } =
      staggerBounds;
    const p: IAutoMovieMotionHumanStagger.IParams = context.params;
    if (!(p.speed > 0)) throw new Error("A stagger's speed is positive");
    const body = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
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
    const recovery: staggerRecover.IRecovery | null = staggerRecover.recover(
      body,
      context.entry,
      push,
      p.speed,
      righting,
    );
    if (recovery === null) {
      const caught: number = staggerLimit.of(
        body,
        context.entry,
        push,
        p.speed,
      );
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
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      recovery.settled,
      [
        { name: "tipped", seconds: 0.5 * swing },
        { name: "caught", seconds: swing },
        { name: "stroke", seconds: swing },
        { name: "relax", seconds: swing },
      ],
    );
    const duration: number = clock.duration;
    const last = (): number => recovery.steps.at(-1)!.land;
    const feet: StaggerFeet = new StaggerFeet(
      body,
      context.entry,
      recovery,
      staggerKnots.bending(body, context.entry),
    );
    const legs: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const { feet: scheduled, settled, reached } = feet.solve(seconds);
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...posture.limbs,
        };
        for (const side of ["left", "right"] as const) {
          // The knee points over the foot's own heading.
          const knee: IAutoMovieVector3 = staggerKnots.kneePole(
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
            ...(scheduled[side].swing === undefined
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
          walkStanceCourse.at(feet.course(), seconds).trunk,
        );
      },
    };
    // Both arms abduct from the entry's angles as balance reactions and come
    // down as the body settles, each let out further where it would pass
    // into the body (`HumanArmSwing.of`).
    const held: Record<
      "left" | "right",
      IAutoMovieMotionHumanArmAngles.IAngles
    > = {
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
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const more: number = raised(seconds);
        const abducted = (
          side: "left" | "right",
        ): IAutoMovieMotionHumanArmAngles.IAngles => ({
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
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
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
      get contacts(): IAutoMovieMotionHumanContactWindow[] {
        const out: IAutoMovieMotionHumanContactWindow[] = [];
        for (const side of ["left", "right"] as const) {
          let from: number = 0;
          for (const step of recovery.steps) {
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
