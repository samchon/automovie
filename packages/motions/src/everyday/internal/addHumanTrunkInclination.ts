import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";

/*
 * Add a share of the spine's flexion to one bone, keeping its other angles
 * (`HumanTrunk.incline`).
 * Parameter joints: The joints written into.
 * Parameter bone: The lumbar or thoracic bone.
 * Parameter part: Its share of the spine's flexion, 0 to 1.
 * Parameter spine: The spine's flexion, degrees.
 */
export function addHumanTrunkInclination(
  joints: IAutoMovieMotionHumanPosture["joints"],
  bone: AddHumanTrunkInclinationBone,
  part: number,
  spine: number,
): void {
  const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
  joints[bone] = [was[0] + part * spine, was[1], was[2]];
}

/*
 * A trunk bone an inclination's spinal share flexes.
 */
type AddHumanTrunkInclinationBone = "spine" | "chest";
