import type {
  AutoMovieHumanoidBone,
  IAutoMovieCapsuleProxy,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/*
 * Require distinct skeleton endpoints that are declared and FK-reachable, plus
 * finite positive radius.
 */
export function validateCapsule(
  capsule: IAutoMovieCapsuleProxy,
  path: string,
  skeletonBones: ReadonlySet<AutoMovieHumanoidBone>,
  reachableBones: ReadonlySet<AutoMovieHumanoidBone>,
  collector: IAutoMovieViolationCollector,
): boolean {
  let valid: boolean = true;
  const endpoint: (bone: AutoMovieHumanoidBone, at: string) => void = (
    bone: AutoMovieHumanoidBone,
    at: string,
  ): void => {
    if (!skeletonBones.has(bone)) {
      valid = false;
      collector.push(
        "type",
        `${path}.${at}`,
        `capsule endpoint "${bone}" must exist in the target skeleton`,
        bone,
      );
    } else if (!reachableBones.has(bone)) {
      valid = false;
      collector.push(
        "type",
        `${path}.${at}`,
        `capsule endpoint "${bone}" is declared but not reachable from a root bone via forward kinematics`,
        bone,
      );
    }
  };
  endpoint(capsule.from, "from");
  endpoint(capsule.to, "to");
  if (capsule.from === capsule.to) {
    valid = false;
    collector.push(
      "type",
      path,
      "capsule endpoints must be two distinct bones",
      { from: capsule.from, to: capsule.to },
    );
  }
  if (capsule.radius <= 0) {
    valid = false;
    collector.push(
      "range",
      `${path}.radius`,
      `capsule radius must be a finite number > 0, but was ${capsule.radius}`,
      capsule.radius,
    );
  }
  return valid;
}
