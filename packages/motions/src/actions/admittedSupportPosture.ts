import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

/**
 * Return the posture the support merit actually read. Preserve a previous
 * key's identity when the same root, joint map and auxiliary goals were read,
 * so a held interval can keep its existing stationary course.
 *
 * @param candidate The source key whose fitted coordinates were read.
 * @param written The certified posture written over the fit's preference.
 * @returns The certified posture, or its exactly equivalent original key.
 */
export function admittedSupportPosture(
  candidate: IAutoMovieMotionHumanPosture,
  written: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  if (candidate.yaw !== written.yaw || candidate.pitch !== written.pitch ||
      candidate.roll !== written.roll || candidate.root.x !== written.root.x ||
      candidate.root.y !== written.root.y || candidate.root.z !== written.root.z ||
      candidate.rotation !== written.rotation || candidate.digits !== written.digits ||
      Object.keys(candidate.limbs).length !== 0)
    return written;

  const names: AutoMovieHumanoidBone[] = Object.keys(candidate.joints) as AutoMovieHumanoidBone[];
  if (names.length !== Object.keys(written.joints).length) return written;
  for (const name of names) {
    const a: typeof candidate.joints[typeof name] = candidate.joints[name];
    const b: typeof written.joints[typeof name] = written.joints[name];
    if (b === undefined && !Object.hasOwn(written.joints, name)) return written;
    if (a === b) continue;
    if (a === undefined || b === undefined || a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2])
      return written;
  }
  return candidate;
}
