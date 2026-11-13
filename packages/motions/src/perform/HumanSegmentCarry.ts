import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { HumanSegment } from "./HumanSegment";
import { HumanSegmentPose } from "./HumanSegmentPose";

/**
 * The carry of a prop an earlier action left held: the holding arm's place
 * relative to the chest, captured where its action ended, and the arm goals
 * that keep it there on a later pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Split from `HumanSegment` unchanged, so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentCarry {
  /**
   * The arm goals that carry held props on a pose: each holding hand rides
   * the chest with the offset it had when its action ended, the
   * trunk-relative goal of a carried object.
   *
   * @param person The person.
   * @param pose The pose whose chest carries the hands.
   * @param holds The holds to carry.
   * @returns Each holding arm with its goal.
   */
  export function carries(
    person: HumanSegment.IPerson,
    pose: IAutoMoviePose,
    holds: readonly HumanSegment.IHeld[],
  ): ["leftArm" | "rightArm", IHumanPosture.IGoal][] {
    if (holds.length === 0) return [];
    const chest: IAutoMovieResolvedBone = bones(person, pose).get("chest")!;
    return holds.map(
      (h: HumanSegment.IHeld): ["leftArm" | "rightArm", IHumanPosture.IGoal] => {
        h.carry ??= capture(person, h);
        return [
          h.side === "left" ? "leftArm" : "rightArm",
          {
            point: Vector3.add(
              chest.worldPosition,
              Quaternion.rotateVector(chest.worldRotation, h.carry.position),
            ),
            rotation: Quaternion.normalize(
              Quaternion.multiply(chest.worldRotation, h.carry.rotation),
            ),
            bend: Vector3.add(
              chest.worldPosition,
              Quaternion.rotateVector(chest.worldRotation, h.carry.elbow),
            ),
            reference: h.carry.reference,
            planted: true,
          },
        ];
      },
    );
  }

  /** A pose's world bones. */
  function bones(
    person: HumanSegment.IPerson,
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(person.performer.body, pose);
  }

  /** A holding arm relative to the chest at the end of the action that took hold. */
  function capture(person: HumanSegment.IPerson, held: HumanSegment.IHeld): HumanSegment.ICarry {
    const at: number = Math.max(held.from, held.source.end);
    const pose: IAutoMoviePose = HumanSegmentPose.of(person, held.source, at);
    const map: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = bones(
      person,
      pose,
    );
    const chest: IAutoMovieResolvedBone = map.get("chest")!;
    const hand: IAutoMovieResolvedBone = map.get(`${held.side}Hand`)!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      chest.worldRotation,
    );
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, chest.worldPosition),
      );
    return {
      position: local(hand.worldPosition),
      rotation: Quaternion.normalize(
        Quaternion.multiply(inverse, hand.worldRotation),
      ),
      elbow: local(map.get(`${held.side}LowerArm`)!.worldPosition),
      reference: resolveHumanPosture.reference(
        pose,
        held.side === "left" ? "leftArm" : "rightArm",
      ),
    };
  }
}
