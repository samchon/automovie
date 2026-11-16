import {
  type IAutoMovieResolvedBone,
  preparePoseResolution,
} from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import type { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";

/**
 * The contact goals held by stopped weapons during one displayed evaluation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns reading a stopped limb's displayed hand/foot frame and bend; the pose evaluator retains stop selection, fitting order and named seeds.
 * @evidence contracts/development/design.md#principled-representation A reader of the placed person's segment and a weapon's existing limb at an absolute film second returns the posture's complete planted goal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader serves the existing stopped-weapon loop; it introduces no authored stop, pose or fitting representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the displayed-pose and canonical FK owners rather than replacing a stop with a joint snapshot or a different body's frame.
 */
export namespace HumanSegmentStop {
  /**
   * Read stopped limb goals within one synchronous displayed evaluation.
   * The body and its topology must keep the same skeleton for the reader's
   * lifetime. Every call evaluates the full displayed stop pose anew, then
   * performs ordered FK admission and returns fresh frame values. Only FK
   * math with exactly equal scalar dependencies is shared between calls.
   *
   * @param person The person whose displayed stop poses are read.
   * @param segment The action whose weapons stopped.
   * @returns An operation-local reader of a weapon's planted goal at its stop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States absolute film seconds, the same-skeleton operation lifetime, fresh goal frames and the separation between pose evaluation and FK math reuse.
   * @evidence contracts/development/implementation.md#principled-implementation The stopped hand or foot's displayed rigid frame and lower joint define its planted goal. preparePoseResolution reuses only completed equal clinical/rest/parent-frame scalars while pose evaluation and every limb fit still execute in their original order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Capture the body once, evaluate the requested stop pose, lazily prepare FK, then read the effector and lower-joint frames.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stop pose, fitted answer or nearby seed is memoized. Signed-zero-aware exact scalar checks, full joint admission, fresh maps and fresh transforms remain with the FK owner; no tolerance or sampling rule changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each call pays full displayed-pose evaluation and O(J+B) FK scans for J joints and B bones. A segment with at most one declared weapon bypasses FK cache allocation because its loop cannot reuse it; multiple weapons may avoid only identical quaternion/vector math. Fresh frame allocations and all physical fits remain, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Multiple declared weapons of one seeded evaluation may share one explicit FK reader; every distinct pose and fit history is still evaluated, and changed clinical, rest or parent scalars miss the dependency snapshot. A single-weapon loop uses ordinary fresh FK directly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller creates this reader only for its first actual stop and releases it on evaluation return or failure. Multiple weapons prepare FK lazily after a stop pose succeeds; one last successful joint/world scalar snapshot per bone name uses O(K) space for K visited identities, without retaining joint records or pose history. Single-weapon loops allocate no FK cache. Returned goals keep fresh FK frame values; no global cache or task is added.
   */
  export function reader(
    person: HumanSegment.IPerson,
    segment: HumanSegment.ISegment,
  ): (
    weapon: IHumanActionPlan.IWeapon,
    seconds: number,
  ) => IHumanPosture.IGoal {
    const body: IHumanBody = person.performer.body;
    const shared: boolean = (segment.plan.weapons?.length ?? 0) > 1;
    let prepared: ReturnType<typeof preparePoseResolution> | undefined;
    return (
      weapon: IHumanActionPlan.IWeapon,
      seconds: number,
    ): IHumanPosture.IGoal => {
      const side: "left" | "right" = weapon.limb.startsWith("left")
        ? "left"
        : "right";
      const arm: boolean = weapon.limb.endsWith("Arm");
      const map: ReturnType<typeof poseBones> = poseBones(
        body,
        HumanSegmentPose.of(person, segment, seconds),
        shared ? (prepared ??= preparePoseResolution()) : undefined,
      );
      const effector: IAutoMovieResolvedBone = map.get(
        `${side}${arm ? "Hand" : "Foot"}`,
      )!;
      return {
        point: effector.worldPosition,
        rotation: effector.worldRotation,
        bend: map.get(`${side}${arm ? "LowerArm" : "LowerLeg"}`)!.worldPosition,
        planted: true,
      };
    };
  }
}
