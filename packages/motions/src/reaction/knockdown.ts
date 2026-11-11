import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import type { StrikingContact } from "../striking/StrikingContact";
import { StrikingTarget } from "../striking/StrikingTarget";

/**
 * A knockdown: the legs give way and the body goes down away from the blow,
 * sitting onto the floor and falling back to lie supine.
 *
 * The collapse is a buckle, not a dive: the knees and hips fold under the
 * falling pelvis (as in the stepping-response failures of Maki and McIlroy
 * 1997, where a push too large for one step ends in a fall), the seat meets
 * the floor at 0.45 s, about the free-fall time of the pelvis from its height
 * slowed by the buckling legs, and the trunk rolls back until the back rests
 * on the floor by 1.1 s, the arms trailing. Each pose rests on the floor
 * without penetrating it: the root's height is solved so the lowest point of
 * the body's own collision shapes touches the floor, so any stature lies on
 * the floor exactly. The body goes down away from the blow (the `from`
 * target), turned so its back falls toward that direction.
 *
 * Proportions of the fall (the seat point, the lean) are provisional
 * readings; detailed falls derived from the Euphoria behaviours belong to
 * tier 2 of #3201.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the buckle, its timing, the floor rule and which proportions are provisional.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, an empty cancel table, parameters and a pure plan of postures in world metres and seconds with seat and lie contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing constants, the plan and the floor rest the knockdown count's tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, contact-window, target and collider types; the floor height comes from each body's own shapes.
 */
export namespace knockdown {
  /** The action's name. */
  export const name: HumanActionName = "knockdown";

  /** Cancel table: none; a knocked-down performer stays down for the count. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blow's target and the lying time's unit and default.
   * @evidence contracts/development/design.md#principled-representation The blow is the interface's motion-target union and the lying time seconds, checked non-negative when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   */
  export interface IParams {
    /** Where the blow came from; a place ahead of the performer when absent. */
    from?: AutoMovieMotionTarget;

    /** How long the body lies after landing, seconds; 1 when absent. */
    seconds?: number;
  }

  /** Seat contact, seconds. */
  export const SEATED: number = 0.45;

  /** Back on the floor, seconds. */
  export const DOWN: number = 1.1;

  /**
   * The root height that rests a posture on the floor: its lowest collision
   * point at zero.
   *
   * @param body The body.
   * @param posture The posture, its root height ignored.
   * @returns The root height, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, the ignored input and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the posture with its root at zero height, then the lowest support point of every collision shape (a capsule's lower end less its radius, a box's lowest corner), negated.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk resolution and one pass over the shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; the height follows from the body's own shapes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones and shapes.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rest(body: IHumanBody, posture: IHumanPosture): number {
    const bones = StrikingBody.trunk(body, {
      ...posture,
      root: { ...posture.root, y: 0 },
    });
    let lowest: number = Infinity;
    for (const c of StrikingBody.colliders(body, bones))
      lowest = Math.min(lowest, bottom(c));
    return -lowest;
  }

  /**
   * Plan a knockdown.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the lying time is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Overlapping minimum-jerk sit and roll-back profiles over clinical angles, the root height solved each posture by the floor rest so any body lies on the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the blow's heading once, then evaluates each posture in closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative lying time throws; the fall's proportions are named provisional values.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and one pass over the shapes per posture.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The heading away from the blow is computed once per plan and dropped on settle.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one cached heading, cleared by settle and released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body = context.body;
    const m = body.measure;
    const lie: number = context.params.seconds ?? 1;
    if (!(lie >= 0)) throw new Error("A knockdown lies a non-negative time");
    const entry: IHumanPosture = context.entry.posture;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      DOWN + lie,
      [
        { name: "rolling", seconds: ROLLING * SEATED },
        { name: "seated", seconds: SEATED },
        { name: "stroke", seconds: SEATED },
        { name: "down", seconds: DOWN },
        { name: "relax", seconds: DOWN },
      ],
    );
    const duration: number = clock.duration;
    const sit = (seconds: number): number =>
      clock.progress(AutoMovieMotionClock.START, "seated", seconds);
    const back = (seconds: number): number =>
      clock.progress("rolling", "down", seconds);

    // The heading that faces the blow, so the back falls away from it.
    let cached: number | undefined;
    const heading = (): number => {
      if (cached !== undefined) return cached;
      const away: IAutoMovieVector3 = AutoMovieMotionHumanTarget.away(
        AutoMovieMotionHumanTarget.resolve(
          context,
          context.params.from,
          context.start - StrikingTarget.LOOK,
          entry,
          AutoMovieMotionHumanTarget.DEFAULTS.ahead,
        ),
        entry.root,
        entry.yaw,
      );
      cached = (Math.atan2(-away.x, -away.z) * 180) / Math.PI;
      return cached;
    };

    // What the fall folds at a second: the trunk's pitch and the joints of
    // the legs and the neck. The root reads it to rest the body on the floor.
    const legs = (seconds: number): AutoMovieMotionHumanJoints.Angles => {
      const knee: number =
        100 * sit(seconds) * (1 - back(seconds)) + 15 * back(seconds);
      return {
        leftUpperLeg: [knee * 0.9, 5, 0],
        rightUpperLeg: [knee * 0.9, 5, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
      };
    };
    const neck = (seconds: number): AutoMovieMotionHumanJoints.Angles => ({
      neck: [20 * back(seconds), 0, 0],
    });
    const pitch = (seconds: number): number => -88 * back(seconds);
    return composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(
          duration,
          {
            root: entry.root,
            yaw: entry.yaw,
            pitch: 0,
            roll: 0,
            joints: LIMP,
            limbs: {},
          },
          [
            {
              part: "seat",
              kind: "seat",
              from: SEATED / duration,
              to: DOWN / duration,
              support: { kind: "ground" },
            },
            {
              part: "back",
              kind: "lie",
              from: DOWN / duration,
              to: 1,
              support: { kind: "ground" },
            },
          ],
        ),
        settle: (): void => {
          cached = undefined;
        },
      },
      clock,
      primitives: [
        // The pelvis moves back by a thigh as it sits and comes down to rest
        // on the floor, the body turning to face the blow.
        AutoMovieMotionHumanRoot.travel({
          from: 0,
          to: duration,
          offset: (seconds: number): AutoMovieMotionHumanRoot.IOffset => {
            const yaw: number = heading();
            const floor: number = rest(body, {
              root: entry.root,
              yaw: entry.yaw,
              pitch: pitch(seconds),
              roll: 0,
              joints: { ...LIMP, ...legs(seconds), ...neck(seconds) },
              limbs: {},
            });
            const slide: IAutoMovieVector3 = HumanFrame.local(
              { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
              HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw },
                {
                  x: 0,
                  y: 0,
                  z:
                    -0.5 * m.thigh * sit(seconds) -
                    0.3 * m.thigh * back(seconds),
                },
              ),
            );
            return {
              point: { ...slide, y: (floor - entry.root.y) * sit(seconds) },
              yaw: angle(yaw - entry.yaw) * sit(seconds),
            };
          },
        }),
        // The trunk rolls back to the floor.
        AutoMovieMotionHumanLean.tilt({
          from: 0,
          to: duration,
          angles: (seconds: number): AutoMovieMotionHumanLean.IAngles => ({
            pitch: pitch(seconds),
            roll: 0,
          }),
        }),
        // The knees and hips fold under the pelvis, then straighten to lie.
        AutoMovieMotionHumanJoints.add({
          channels: ["leftLeg", "rightLeg"],
          from: 0,
          to: duration,
          delta: legs,
        }),
        AutoMovieMotionHumanJoints.add({
          channels: ["head"],
          from: 0,
          to: duration,
          delta: neck,
        }),
      ],
    });
  }

  /** When the trunk starts rolling back, as a share of the time to the seat. */
  const ROLLING: number = 0.6;

  /** The arms' joints as they trail the fall, degrees. */
  const LIMP: AutoMovieMotionHumanJoints.Angles = {
    leftUpperArm: [10, 20, 0],
    rightUpperArm: [10, 20, 0],
    leftLowerArm: [30, 0, 0],
    rightLowerArm: [30, 0, 0],
  };

  /** A heading difference wrapped into (-180, 180]. */
  function angle(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }

  /** The lowest world height of a collider. */
  function bottom(c: StrikingContact.ICollider): number {
    if (c.kind === "capsule") return Math.min(c.a.y, c.b.y) - c.radius;
    let low: number = Infinity;
    for (const sx of [-1, 1])
      for (const sy of [-1, 1])
        for (const sz of [-1, 1]) {
          const corner: IAutoMovieVector3 = Vector3.add(
            c.centre,
            Quaternion.rotateVector(c.rotation, {
              x: sx * c.halfExtents.x,
              y: sy * c.halfExtents.y,
              z: sz * c.halfExtents.z,
            }),
          );
          low = Math.min(low, corner.y);
        }
    return low;
  }
}
