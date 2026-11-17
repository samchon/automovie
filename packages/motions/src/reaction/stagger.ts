import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
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
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingTarget } from "../striking/StrikingTarget";
import { ReactionSource } from "./ReactionSource";
import { StaggerFeet } from "./StaggerFeet";
import { StaggerPendulum } from "./StaggerPendulum";
import { staggerBounds } from "./staggerBounds";
import { staggerContacts } from "./staggerContacts";
import { staggerKnots } from "./staggerKnots";
import { staggerLimit } from "./staggerLimit";
import { staggerRecover } from "./staggerRecover";
import { staggerShift } from "./staggerShift";

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
 * foot stood beside the stance foot; a step past it shortens toward the
 * stance foot. The legs then admit each step at its mid-swing and its
 * landing, under the pelvis the centre of mass carries there: each planted
 * leg's reach, knee flexion and thigh extension as a two-bone chain, and
 * crossed legs clear of each other as the tangle audit reads them
 * (`staggerAdmission`, `walkLegClearance`); a step they do not hold refuses
 * its order of the feet. The legs may cross, a sole's length in front of or
 * behind the stance foot: a footstep planner's region on the stepping foot's
 * own side of the stance foot (Deits and Tedrake 2014) keeps a walking
 * robot's legs apart, but it forbids the crossover step people take in most
 * lateral recoveries, so it is not this region. Every order of the feet over up to four steps is tried,
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
 * Once caught, the other foot closes at least at the entry's stance width,
 * as far ahead or behind as stands the middle of the two ankles, as the
 * entry stood over its own, under where the extrapolated centre of mass will
 * be when it lands, and the close holds only with the extrapolated centre of
 * mass then inside the two feet's base (Hof 2008). The extrapolated centre of mass
 * then tracks a minimum-jerk course to where the body stood over its feet,
 * its centre of pressure placed by the divergent component's tracking law
 * inside the base (Englsberger, Ott and Albu-Schaffer 2015), and the centre
 * of mass follows it, `x' = omega0 (xi - x)`, until both rest within a
 * millimetre.
 *
 * The body over its feet is read at each second from prepared courses
 * (`StaggerFeet`): the trunk bends about the hips against the fall, the hip
 * strategy (Horak and Nashner 1986, J Neurophysiol 55:1369), by the
 * inclination of the extrapolated centre of mass's lead over the pendulum's
 * length, bounded by the hip's extension and eased in from the measured
 * reaction (`staggerLean`, the relation provisional); the pelvis carries the
 * centre of mass's course less the shift that tilt makes of it, and is
 * lowered to the height its planted legs allow, as the walk settles its
 * pelvis (`walkReach.ground`), each heel rising about its ball where the
 * ankle runs out of room. A stepping foot
 * first rises clear of the floor by the minimum toe clearance of walking
 * (`walkFoot.CLEARANCE`, Killeen et al. 2017), over the share of its swing a
 * walking foot takes to set down from that height, then swings as a walking
 * foot swings (`walkFoot.prepareSwing`) to the stance it lands in, bowed
 * clear of the standing foot by the soles' own clearance in closed form
 * (`staggerSwingBow`) and held inside its leg's ranges and as high over the
 * floor as its swing carries it (`walkReach.swing`), so it leaves and joins
 * its stances where they stand.
 *
 * Both
 * arms abduct as balance reactions, 9.4 degrees from 154 ms after the push
 * (the mean of the two arms' abduction within 200 ms of a backward release,
 * 10.7 and 8.0 degrees, at its measured onset; Weerdesteyn, Laing and
 * Robinovitch 2008, Exp Brain Res 186:571), held through the steps and let
 * down as the body settles, each let out further where it would pass into
 * the body, read once for the plan at `KNOTS` a second as a gait reads its
 * carriage (`HumanArmSwing.carriage`) and interpolated between. The steps, the catch and the settling are
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

  /** A forward recovery step's landing after the push (`staggerBounds.LANDING`), the step's time `perturb` reads. */
  export const LANDING: AutoMovieMotionHumanTiming.Span = staggerBounds.LANDING;

  /**
   * Plan a stagger.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the speed is not positive or the manner is out of range.
   * @throws {HumanRefusal} `parameter` on `speed` when no `STEPS` recovery steps catch the push: a fall, with the fastest push the body catches that way.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The push read causally at the plan's start; the recovery's steps and the centre of mass's course on the pendulum, admitted by the legs as two-bone chains (`staggerRecover`); the feet and the pelvis read from those courses with the walk's own pelvis settling (`StaggerFeet`); the arms abducted from their measured onset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, one held base and two rows: the body over its feet, and the arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push no `STEPS` steps catch is refused with the body's limit instead of shortening a step past the legs' reach; the righting is a named provisional constant.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning steps at most 30 closed-form pendulum prefixes and admits only the prefixes of an order the pendulum catches; a refused push adds the limit's bisection of such recoveries over one prepared entry geometry. No stance course or quadratic program is solved; each pose query is one course read, one ground settling and at most two prepared swing holds.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the recovery, feet, arm and causal-target owners. While the plan is built, each sample's feet and pelvis with no balance shift are solved once and lent to the legs' writer for the arms' carriage read and the first balance pass, which show the plan there before any shift exists; the second balance pass and every pose query solve their own, shifted. Step endpoints, swing curves and bows are kept per declared step; the arms' let-out is read once per plan (`HumanArmSwing.carriage` at `KNOTS` a second, about 50 samples a second of plan, each raised to its neighbours' largest) and interpolated, so a pose query writes the arms as joint angles with no fit; between samples the clearance is the interpolated envelope's, unverified inside an interval.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds its recovery, feet and authored geometric data; refusal observations end on return or throw. Runtime loans last only through each writer call and never enter posture data, endpoint/bow caches or a solved-pose history.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const { RIGHTING, STEPS, VERIFIED, RESOLUTION, ONSET, ABDUCTION }: typeof staggerBounds =
      staggerBounds;
    const p: IParams = context.params;
    if (!(p.speed > 0)) throw new Error("A stagger's speed is positive");
    const body: IHumanActionContext["body"] = context.body;
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

    const fixed: ReturnType<typeof StaggerPendulum.prepare> = StaggerPendulum.prepare(
      body,
      context.entry,
    );
    const recovery: staggerRecover.IRecovery | null = staggerRecover.recover(
      body,
      context.entry,
      push,
      p.speed,
      righting,
      true,
      fixed,
    );
    if (recovery === null) {
      const caught: number = staggerLimit.of(
        body,
        context.entry,
        push,
        p.speed,
        fixed,
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
    const last: () => number = (): number => recovery.steps.at(-1)!.land;
    const feet: StaggerFeet = new StaggerFeet(body, context.entry, recovery, fixed.bend);
    const entryLegs: IHumanPosture["limbs"] = entry.limbs;
    const legs: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IHumanActionPlan["posture"]>[2],
      ): IHumanPosture => {
        // The root carries the plan-time residual of the displayed centre of
        // mass from the pendulum's course (`balanced`), interpolated, and the
        // pelvis is settled where that puts it, under the trunk's tilt: the
        // legs are fitted to the hips the pose shows.
        const at: number = Math.min(Math.max(0, seconds * KNOTS), Math.max(0, balanced.length - 1));
        const k: number = Math.floor(at);
        const a: IAutoMovieVector3 | undefined = balanced[k];
        const b: IAutoMovieVector3 | undefined = balanced[Math.min(balanced.length - 1, k + 1)];
        const shift: IAutoMovieVector3 =
          a === undefined || b === undefined ? { x: 0, y: 0, z: 0 } : Vector3.lerp(a, b, at - k);
        const { feet: scheduled, settled, reached, trunk, ease }: ReturnType<StaggerFeet["solve"]> =
          lent !== undefined && lent.seconds === seconds ? lent.solved : feet.solve(seconds, resolution, shift);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        for (const side of ["left", "right"] as const) {
          const key: "leftLeg" | "rightLeg" = side === "left" ? "leftLeg" : "rightLeg";

          // The knee points over the foot's own heading.
          const knee: IAutoMovieVector3 = staggerKnots.kneePole(
            body,
            settled.root,
            settled.yaw,
            side,
            HumanFoot.heading(reached[side].rotation),
          );

          // A foot that has not yet stepped leaves the entry's own leg goal
          // over the reaction, so the first pose is the entry's: the walk's
          // stance reader may stand the same foot otherwise (its heel, its
          // contact point), and the leg would jump at the cut.
          const entered: IHumanPosture["limbs"][typeof key] = entryLegs[key];
          const unstepped: boolean = !recovery.steps.some(
            (step: staggerRecover.IStep): boolean => step.side === side && step.start < seconds,
          );
          limbs[key] =
            unstepped && ease < 1 && entered?.point !== undefined && entered.rotation !== undefined
              ? {
                  point: Vector3.lerp(entered.point, reached[side].ankle, ease),
                  bend: entered.bend === undefined ? knee : Vector3.lerp(entered.bend, knee, ease),
                  rotation: Quaternion.slerp(entered.rotation, reached[side].rotation, ease),
                  planted: true,
                  contact: entered.contact ?? settled.contacts[side],
                }
              : {
                  point: reached[side].ankle,
                  bend: knee,
                  rotation: reached[side].rotation,
                  ...(scheduled[side].swing === undefined
                    ? { planted: true, contact: settled.contacts[side] }
                    : {}),
                };
        }
        // The trunk tilts about the hips against the fall (`staggerLean`),
        // so the legs stay on their feet.
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
          trunk,
        );
      },
    };
    // Both arms abduct from the entry's angles as balance reactions and come
    // down as the body settles, each let out further where it would pass
    // into the body by its plan-time carriage (`carried`).
    const held: Record<"left" | "right", AutoMovieMotionHumanArm.IAngles> = {
      left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
      right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
    };
    const onset: number = AutoMovieMotionHumanTiming.seconds(ONSET);
    const raised: (seconds: number) => number = (seconds: number): number => {
      const end: number = last();
      const rise: number = minimumJerk.share(
        Math.min(1, Math.max(0, (seconds - onset) / (swing - onset))),
      );
      const fall: number = minimumJerk.share(
        Math.min(1, Math.max(0, (seconds - end) / (duration - end))),
      );
      return ABDUCTION * Math.max(0, rise - fall);
    };
    const arms: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftArm", "rightArm"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const more: number = raised(seconds);

        // The let-out's envelope between the two samples around this second.
        const at: number = Math.min(Math.max(0, seconds * KNOTS), Math.max(0, carried.left.length - 1));
        const k: number = Math.floor(at);
        const out: (side: "left" | "right") => number = (side: "left" | "right"): number => {
          const series: number[] = carried[side];
          if (series.length === 0) return 0;
          const a: number = series[k]!;
          const b: number = series[Math.min(series.length - 1, k + 1)]!;
          return a + (b - a) * (at - k);
        };
        const abducted: (side: "left" | "right") => AutoMovieMotionHumanArm.IAngles = (
          side: "left" | "right",
        ): AutoMovieMotionHumanArm.IAngles => ({
          ...held[side],
          upper: [
            held[side].upper[0],
            held[side].upper[1] + more + out(side),
            held[side].upper[2],
          ],
        });
        return AutoMovieMotionHumanArm.carry(
          body,
          posture,
          { left: abducted("left"), right: abducted("right") },
          0,
        );
      },
    };
    // Each arm's let-out from the body (`HumanArmSwing.carriage`, the gait's
    // own clearance), read once at plan time at `KNOTS` a second against the
    // plan's own posture there (its dropped pelvis and swinging thighs), each
    // sample raised to the largest of its neighbours' so the interpolated
    // let-out holds at both samples around every second; no pose query fits
    // an arm.
    const KNOTS: number = staggerBounds.KNOTS;
    let carried: Record<"left" | "right", number[]> = { left: [], right: [] };
    let balanced: IAutoMovieVector3[] = [];
    let lent: { seconds: number; solved: ReturnType<StaggerFeet["solve"]> } | undefined;
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
    const samples: number[] = Array.from(
      { length: Math.ceil(duration * KNOTS - 1e-9) + 1 },
      (_: unknown, i: number): number => Math.min(duration, i / KNOTS),
    );

    // Each sample's feet and pelvis with no balance shift, solved once and
    // lent to the legs' writer while the plan is read there before any shift
    // exists: the arms' carriage and the first balance pass each settled
    // that same pelvis again.
    const unshifted: ReturnType<StaggerFeet["solve"]>[] = samples.map(
      (seconds: number): ReturnType<StaggerFeet["solve"]> => feet.solve(seconds),
    );
    const lend = <T>(i: number, read: () => T): T => {
      lent = balanced.length === 0 ? { seconds: samples[i]!, solved: unshifted[i]! } : undefined;
      try {
        return read();
      } finally {
        lent = undefined;
      }
    };
    const needs: Record<"left" | "right", number>[] = samples.map(
      (seconds: number, i: number): Record<"left" | "right", number> =>
        lend(i, (): Record<"left" | "right", number> =>
          HumanArmSwing.carriage(body, [seconds], composed.posture, ["left", "right"]),
        ),
    );
    const envelope: (side: "left" | "right") => number[] = (side: "left" | "right"): number[] =>
      needs.map((_: Record<"left" | "right", number>, i: number): number =>
        Math.max(
          needs[Math.max(0, i - 1)]![side],
          needs[i]![side],
          needs[Math.min(needs.length - 1, i + 1)]![side],
        ),
      );
    carried = { left: envelope("left"), right: envelope("right") };

    // The displayed centre of mass kept on the pendulum's course: at each
    // sample the residual of the displayed posture's centre of mass
    // (`HumanBalance.centre`) from the course's horizontal point is added
    // to the root, as the fixed point of the per-frame centre of mass
    // correction (Phillips and Badler 1991): the legs stand planted while
    // the rest of the body follows the root, so each step leaves the planted
    // legs' share of the residual, and the shift is the sum of that series,
    // read from the residual with no shift and the one its shift leaves
    // (`staggerShift`).
    const residuals = (): IAutoMovieVector3[] =>
      samples.map((seconds: number, i: number): IAutoMovieVector3 => {
        const shown: IAutoMovieVector3 = lend(i, (): IAutoMovieVector3 =>
          HumanBalance.centre(body, composed.posture(seconds)),
        );
        const travel: IAutoMovieVector3 = recovery.course(seconds);
        return {
          x: recovery.centre.x + travel.x - shown.x,
          y: 0,
          z: recovery.centre.z + travel.z - shown.z,
        };
      });
    const first: IAutoMovieVector3[] = residuals();
    balanced = first;
    const second: IAutoMovieVector3[] = residuals();
    balanced = first.map((e: IAutoMovieVector3, i: number): IAutoMovieVector3 => staggerShift(e, second[i]!));
    return {
      ...composed,
      get contacts(): IHumanContactWindow[] {
        return staggerContacts(recovery, duration);
      },
    };
  }
}
