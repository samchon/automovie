import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A strike's trunk turn laid on the trunk it enters with: the spine and the
 * chest each twisted by the given share, their flexion and side bend kept.
 *
 * A guard holds the trunk flexed forward (4 degrees at each of the spine
 * and the chest); a punch that wrote its twist over a bare trunk dropped
 * that flexion, and every punch straightened the trunk 8 degrees as it
 * landed, reading 4 to 5 degrees back from the hips at impact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, what is added and the measured fault.
 * @evidence contracts/development/design.md#principled-representation A twist about the trunk's own axis, added to the entry's clinical angles, as the turn is a change from the entry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one function the punch's footwork and contact call.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No angle is fixed; the flexion and side bend are the entry's own.
 */
export namespace StrikingTwist {
  /**
   * The spine and the chest twisted on the entry's trunk.
   *
   * @param joints The entry's clinical angles.
   * @param degrees The twist at each of the spine and the chest, degrees.
   * @returns The spine's and the chest's angles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The twist added to each joint's own twist, its flexion and abduction carried.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of two joints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint the entry leaves out counts as straight.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function trunk(
    joints: IHumanPosture["joints"],
    degrees: number,
  ): Pick<IHumanPosture["joints"], "spine" | "chest"> {
    const twisted = (
      angles: readonly [number, number, number] | undefined,
    ): [number, number, number] => [
      angles?.[0] ?? 0,
      angles?.[1] ?? 0,
      (angles?.[2] ?? 0) + degrees,
    ];
    return { spine: twisted(joints.spine), chest: twisted(joints.chest) };
  }
}
