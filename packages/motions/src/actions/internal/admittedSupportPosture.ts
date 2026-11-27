import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";

/**
 * Return the posture the support merit actually read. Preserve a previous key's
 * identity when the same root, joint map and auxiliary goals were read, so a
 * held interval can keep its existing stationary course.
 *
 * @param candidate The source key whose fitted coordinates were read.
 * @param written The certified posture written over the fit's preference.
 * @returns The certified posture, or its exactly equivalent original key.
 */
export function admittedSupportPosture(
  candidate: IAutoMovieMotionHumanPosture,
  written: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture {
  if (
    candidate.yaw !== written.yaw ||
    candidate.pitch !== written.pitch ||
    candidate.roll !== written.roll ||
    candidate.root.x !== written.root.x ||
    candidate.root.y !== written.root.y ||
    candidate.root.z !== written.root.z ||
    candidate.rotation !== written.rotation ||
    candidate.digits !== written.digits ||
    Object.keys(candidate.limbs).length !== 0
  )
    return written;

  const source: JointEntries = candidate.joints;
  const certified: JointEntries = written.joints;
  const names: string[] = Object.keys(source);
  const checked: ReadonlyMap<string, JointEntries[string]> = new Map(
    Object.entries(certified),
  );
  if (names.length !== checked.size) return written;
  for (const name of names) {
    const a: JointEntries[string] = source[name];
    const b: JointEntries[string] = checked.get(name);
    if (b === undefined && !checked.has(name)) return written;
    if (a === b) continue;
    if (
      a === undefined ||
      b === undefined ||
      a[0] !== b[0] ||
      a[1] !== b[1] ||
      a[2] !== b[2]
    )
      return written;
  }
  return candidate;
}

/** Clinical triples indexed by their written bone names. */
type JointEntries = Readonly<
  Record<string, readonly [number, number, number] | undefined>
>;
