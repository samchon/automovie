import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";

/**
 * A strike's trunk turn laid on the trunk it enters with: the spine and the
 * chest each twisted by the given share, their flexion and side bend kept.
 *
 * A guard holds the trunk flexed forward (4 degrees at each of the spine and
 * the chest); a punch that wrote its twist over a bare trunk dropped that
 * flexion, and every punch straightened the trunk 8 degrees as it landed,
 * reading 4 to 5 degrees back from the hips at impact.
 */
export namespace StrikingTwist {
  /**
   * The spine and the chest twisted on the entry's trunk.
   *
   * @param joints The entry's clinical angles.
   * @param degrees The twist at each of the spine and the chest, degrees.
   * @returns The spine's and the chest's angles.
   */
  export function trunk(
    joints: IAutoMovieMotionHumanPosture["joints"],
    degrees: number,
  ): Pick<IAutoMovieMotionHumanPosture["joints"], TrunkResult> {
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

/** The alternatives of `TrunkResult`'s site. */
type TrunkResult = "spine" | "chest";
