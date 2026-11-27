import { jointRomOvershoot, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";

/**
 * Read actual joint ROM overshoot during one synchronous evaluation whose
 * skeleton bone order and identities stay unchanged. Only each bone's first
 * matching record is shared; current constraints and angles are still read for
 * every score. A later evaluation creates a new reader.
 *
 * @param body The body with unchanged skeleton membership/order for this
 *   evaluation.
 * @returns A reader of a bone's clinical triple, degrees, returning the
 *   original ROM overshoot in degrees, including its null/nonfinite cases.
 */
export function prepareHumanJointRom(
  body: IAutoMovieMotionHumanBody,
): (
  bone: AutoMovieHumanoidBone,
  angles: readonly [number, number, number],
) => number {
  let records: Map<AutoMovieHumanoidBone, IAutoMovieBone | null> | undefined;
  return (
    bone: AutoMovieHumanoidBone,
    angles: readonly [number, number, number],
  ): number => {
    const joint: IAutoMovieJointPose = {
      bone,
      flexion: angles[0],
      abduction: angles[1],
      twist: angles[2],
    };
    if (records === undefined) records = new Map();
    let record: IAutoMovieBone | null | undefined = records.get(bone);
    if (record === undefined) {
      record = readHumanBone(body, bone) ?? null;
      records.set(bone, record);
    }
    return jointRomOvershoot(
      joint,
      AutoMovieEngineKinematics.getConstraint(bone, record?.constraint ?? null),
    );
  };
}
