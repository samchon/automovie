import { Quaternion, Vector3 } from "@automovie/engine";
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
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";

/**
 * A stagger: a blow pushes the centre of mass past the base of support and
 * one unplanned step catches it.
 *
 * The step follows the extrapolated centre of mass (Hof, Gazendam and Sinke
 * 2005, J Biomech 38:1): a body moving at `v` over a pendulum of length `l`
 * stays balanced only if the base reaches `x + v / omega0`, `omega0 =
 * sqrt(g / l)`, so the stepping foot lands that far along the push from the
 * centre of mass plus the foot's own half length as margin, and the root
 * travels there and settles. The pendulum length is the hip height, a
 * standing body's centre-of-mass height to a few centimetres (Winter,
 * Biomechanics and Motor Control of Human Movement, ch. 4). The stepping foot
 * is the one whose step crosses least: the foot on the push's side, or the
 * rear foot for a push backward. The step lands at 0.35 s, inside the 0.3 to
 * 0.4 s reactive-step times of perturbation studies (Maki and McIlroy 1997,
 * Phys Ther 77:488), and the body settles by 0.8 s.
 *
 * A push whose capture step would exceed one leg length cannot be caught in
 * one step; the law rejects it, naming the knockdown instead.
 *
 * The action is rows over the stance it was entered in: one clock with the
 * `tipped` and `caught` instants, a sway whose hips are thrown along the push
 * ahead of the stepping foot and slow uniformly to rest over the middle of
 * the feet as the step lands, while the body above them tips with the push
 * and rights itself, the two legs on their feet and the two arms held as the
 * entry left them. Without a blow's source the push comes from a place ahead
 * of the performer, so the body staggers backward. The step's time is a
 * reflex and no manner changes it; the manner's tempo scales the time the
 * body takes to right itself after the step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the capture rule with its sources, the stepping foot, the timing, the refusal and how the action is composed.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters and a plan composed of part primitives on one clock, with plant windows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing and size constants, the plan and the capture distance the tests check against.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, contact-window, foot, target, clock and primitive types; the step scales with each body's hip height and foot.
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

    /** How it is performed: the tempo scales the righting after the step. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** The capture step's landing, a measured reactive-step time. */
  export const LANDING: AutoMovieMotionHumanTiming.Span = {
    seconds: 0.35,
    source: "Maki and McIlroy 1997, Phys Ther 77:488",
  };

  /** The righting after the step at a neutral manner (provisional). */
  export const RIGHTING: AutoMovieMotionHumanTiming.Span = {
    pause: "beat",
    scale: 1.125,
  };

  /** The trunk's tip with the push (provisional). */
  export const TIP: AutoMovieMotionHumanRange.Amount = {
    level: "light",
    scale: 0.9,
  };

  /** The stepping foot's clearance, as a share of the stature (provisional). */
  export const CLEARANCE: number = 0.02;

  /**
   * The capture step's length from the centre of mass: the extrapolated
   * centre of mass's lead `v / sqrt(g / l)` plus a margin.
   *
   * @param speed The centre of mass's speed, m/s.
   * @param height The pendulum length, metres.
   * @param margin The margin beyond the extrapolated centre, metres.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the formula and every unit.
   * @evidence contracts/development/implementation.md#principled-implementation Hof's extrapolated centre of mass for an inverted pendulum, g = 9.81 m/s².
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function capture(
    speed: number,
    height: number,
    margin: number,
  ): number {
    return speed / Math.sqrt(9.81 / height) + margin;
  }

  /**
   * Plan a stagger.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the speed is not positive, the capture step exceeds one leg, or the manner is out of range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The capture step lands at the extrapolated centre of mass plus half a foot along the push; the hips slow uniformly to rest over the middle of the feet as the step lands, and the trunk tips and rights itself on the clock's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, one held base and three rows; the push is read once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An uncapturable push throws and names the knockdown instead of shortening the step; the tip angle and the clearance are named provisional constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The push, the stepping foot and the landing are computed once per plan and dropped on settle.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one cached geometry, cleared by settle and released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    if (!(p.speed > 0)) throw new Error("A stagger's speed is positive");
    const body = context.body;
    const m = body.measure;
    const reach: number = capture(p.speed, m.hipHeight, m.footLength / 2);
    if (reach > m.thigh + m.shank)
      throw new Error(
        `A ${p.speed} m/s push needs a ${reach.toFixed(2)} m step, beyond one leg; use a knockdown`,
      );
    const entry: IHumanPosture = context.entry.posture;
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);

    // The tip and the step are the body's reflex; only the righting after
    // the step follows the manner's tempo.
    const landing: number = AutoMovieMotionHumanTiming.seconds(LANDING);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.of(
        landing + AutoMovieMotionHumanTiming.seconds(RIGHTING),
        [
          { name: "tipped", seconds: 0.5 * landing },
          { name: "caught", seconds: landing },
          { name: "stroke", seconds: landing },
          { name: "relax", seconds: landing },
        ],
      ),
      AutoMovieMotionManner.of(context, p.manner),
      { holds: [], fixed: [AutoMovieMotionClock.START, "tipped"] },
    );
    const duration: number = clock.duration;
    const landed: number = clock.at("caught");
    const START: string = AutoMovieMotionClock.START;
    const END: string = AutoMovieMotionClock.END;

    // The push, the stepping foot and where it lands, read once per run.
    let built:
      | {
          push: IAutoMovieVector3;
          local: IAutoMovieVector3;
          stepper: "left" | "right";
          landing: IAutoMovieVector3;
          travel: number;
        }
      | undefined;
    const geometry = () => {
      if (built !== undefined) return built;
      const push: IAutoMovieVector3 = AutoMovieMotionHumanTarget.away(
        AutoMovieMotionHumanTarget.resolve(
          context,
          p.from,
          context.start - StrikingTarget.LOOK,
          entry,
          AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        ),
        entry.root,
        entry.yaw,
      );
      const along = (side: "left" | "right"): number =>
        Vector3.dot(Vector3.subtract(feet[side].ankle, entry.root), push);
      const stepper: "left" | "right" =
        along("left") > along("right") ? "left" : "right";
      const landing: IAutoMovieVector3 = Vector3.add(
        feet[stepper].ankle,
        Vector3.scale(push, Math.max(0, reach - along(stepper))),
      );
      // The hips end over the middle of the two ankles, where both legs
      // lean alike and each ankle needs the least of its range.
      const hips: IAutoMovieVector3 = Vector3.add(
        entry.root,
        Quaternion.rotateVector(
          resolveHumanPosture.heading(entry),
          body.rest.get("hips")!,
        ),
      );
      const centre: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(landing, feet[stepper === "left" ? "right" : "left"].ankle),
        0.5,
      );
      built = {
        push,
        local: HumanFrame.local(
          { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
          push,
        ),
        stepper,
        landing,
        travel: Math.max(
          0,
          Vector3.dot(Vector3.subtract(centre, hips), { ...push, y: 0 }),
        ),
      };
      return built;
    };

    // The feet at a second: the stepping foot travels to its landing on a
    // low arc and the other stays.
    const placed = (
      seconds: number,
    ): Record<"left" | "right", HumanFoot.IPlacement> => {
      const { stepper, landing } = geometry();
      const s: number = clock.progress(START, "caught", seconds);
      const moved: HumanFoot.IPlacement = {
        ankle: {
          ...Vector3.lerp(feet[stepper].ankle, landing, s),
          y:
            feet[stepper].ankle.y +
            (seconds < landed ? CLEARANCE * m.stature * 4 * s * (1 - s) : 0),
        },
        rotation: feet[stepper].rotation,
      };
      return stepper === "left"
        ? { left: moved, right: feet.right }
        : { left: feet.left, right: moved };
    };
    const lean: number = AutoMovieMotionHumanRange.lean(TIP);
    const tip = (seconds: number): number =>
      lean * clock.envelope([START, "tipped"], ["relax", END], seconds);
    const legs: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const { stepper } = geometry();
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            ...StrikingStance.legs(body, placed(seconds), {
              left: stepper !== "left" || seconds >= landed,
              right: stepper !== "right" || seconds >= landed,
            }),
          },
        };
      },
    };
    // The arms keep the angles the entry held: a stagger has no time to
    // place them, so a guard stays a guard and hanging arms stay hanging.
    const held: Record<"left" | "right", AutoMovieMotionHumanArm.IAngles> = {
      left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
      right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
    };
    const arms: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftArm", "rightArm"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture): IHumanPosture =>
        AutoMovieMotionHumanArm.carry(body, posture, held, 0),
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
        settle: (): void => {
          built = undefined;
        },
      },
      clock,
      primitives: [
        // The push throws the hips ahead of the stepping foot: they slow
        // uniformly and come to rest over the middle of the feet as the step
        // lands, while the body above them tips with the push and rights
        // itself once the step has caught it; the root's height keeps both
        // legs on their feet.
        AutoMovieMotionHumanLean.sway({
          body,
          from: 0,
          to: duration,
          angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
            pitch: tip(seconds) * geometry().local.z,
            roll: -tip(seconds) * geometry().local.x,
          }),
          shift: (seconds: number): IAutoMovieVector3 => {
            const { local, travel } = geometry();
            const left: number = 1 - clock.linear(START, "caught", seconds);
            return Vector3.scale(local, travel * (1 - left * left));
          },
          legs: (
            seconds: number,
          ): Pick<IHumanPosture["limbs"], "leftLeg" | "rightLeg"> =>
            StrikingStance.legs(body, placed(seconds)),
        }),
        legs,
        arms,
      ],
    });
    return {
      ...composed,
      get contacts(): IHumanContactWindow[] {
        const { stepper } = geometry();
        const other: "left" | "right" = stepper === "left" ? "right" : "left";
        return [
          {
            part: `${other}Foot`,
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground" },
          },
          {
            part: `${stepper}Foot`,
            kind: "plant",
            from: landed / duration,
            to: 1,
            support: { kind: "ground" },
          },
        ];
      },
    };
  }
}
