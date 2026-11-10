import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
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
    /** Where the blow came from. */
    from: AutoMovieMotionTarget;

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
    const duration: number = DOWN + lie;
    const entry: IHumanPosture = context.entry.posture;
    let away: number | undefined;
    const heading = (): number => {
      if (away !== undefined) return away;
      const threat: IAutoMovieVector3 = context.aim(
        context.params.from,
        context.start - StrikingTarget.LOOK,
      ).point;
      const d: IAutoMovieVector3 = {
        x: entry.root.x - threat.x,
        y: 0,
        z: entry.root.z - threat.z,
      };

      // Facing the blow, the back falls away from it.
      away =
        Vector3.length(d) > 1e-6
          ? (Math.atan2(-d.x, -d.z) * 180) / Math.PI
          : entry.yaw;
      return away;
    };
    const events: IAutoMovieMotionEvent[] = [
      { name: "seated", share: SEATED / duration },
      { name: "down", share: DOWN / duration },
    ];
    const contacts: IHumanContactWindow[] = [
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
    ];
    const limp: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {
      leftUpperArm: [10, 20, 0],
      rightUpperArm: [10, 20, 0],
      leftLowerArm: [30, 0, 0],
      rightLowerArm: [30, 0, 0],
    };
    return {
      duration,
      events,
      contacts,
      settle: (): void => {
        away = undefined;
      },
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const yaw: number = heading();
        const sit: number = minimumJerk(t / SEATED).s;
        const back: number = minimumJerk(
          (t - 0.6 * SEATED) / (DOWN - 0.6 * SEATED),
        ).s;
        const frame: HumanFrame.IFrame = {
          origin: { ...entry.root, y: 0 },
          yaw,
        };

        // The pelvis moves back by a thigh as it sits, the feet slide forward
        // to lie a leg's length ahead, and the trunk rolls back to the floor.
        const root: IAutoMovieVector3 = HumanFrame.point(frame, {
          x: 0,
          y: 0,
          z: -0.5 * m.thigh * sit - 0.3 * m.thigh * back,
        });
        const knee: number = 100 * sit * (1 - back) + 15 * back;
        const posture: IHumanPosture = {
          root,
          yaw: entry.yaw + angle(yaw - entry.yaw) * sit,
          pitch: -88 * back,
          roll: 0,
          joints: {
            ...limp,
            leftUpperLeg: [knee * 0.9, 5, 0],
            rightUpperLeg: [knee * 0.9, 5, 0],
            leftLowerLeg: [knee, 0, 0],
            rightLowerLeg: [knee, 0, 0],
            neck: [20 * back, 0, 0],
          },
          limbs: {},
        };
        const floor: number = rest(body, posture);
        const standing: number = entry.root.y;
        posture.root = { ...root, y: standing + (floor - standing) * sit };
        return posture;
      },
    };
  }

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
