import { AutoMovieEngineTransform } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { turnHumanPosture } from "../../posture/internal/turnHumanPosture";

/*
 * The pose of a posture's directly set joints and root, for forward kinematics
 * of its trunk without solving its limbs.
 * Parameter body: The body supplying its skeleton id.
 * Parameter posture: The root, heading and whole-body rotation; its limb goals are
 * ignored.
 * Parameter joints: The clinical-degree joint angles to pose; a bone whose entry is
 * absent stands at zero.
 * Returns: A fresh pose whose root is the posture's turned root.
 */
export function authoredHumanTrunkPose(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  joints: IAutoMovieMotionHumanPosture["joints"],
): IAutoMoviePose {
  const list: IAutoMovieJointPose[] = [];
  for (const [bone, angles] of Object.entries(joints) as [
    AutoMovieHumanoidBone,
    readonly [number, number, number] | undefined,
  ][])
    if (angles !== undefined)
      list.push({
        bone,
        flexion: angles[0],
        abduction: angles[1],
        twist: angles[2],
      });
  const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
    turnHumanPosture({ ...posture, limbs: {} });
  return {
    skeleton: body.skeleton.id,
    root: AutoMovieEngineTransform.of(turned.position, turned.rotation),
    joints: list,
  };
}
