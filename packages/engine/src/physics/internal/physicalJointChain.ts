import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";

/*
 * Read a proximal-to-distal actuator path from an admitted tree. The fixed root
 * has no incoming actuator and is omitted.
 */
export function physicalJointChain(
  profile: IAutoMoviePhysicalProfile,
  bone: string,
): string[] {
  const chain: string[] = [bone];
  let joint: IAutoMoviePhysicalJoint | undefined = profile.joints.find(
    (candidate: IAutoMoviePhysicalJoint): boolean => candidate.child === bone,
  );
  while (
    joint &&
    profile.joints.some(
      (candidate: IAutoMoviePhysicalJoint): boolean =>
        candidate.child === joint!.parent,
    )
  ) {
    chain.unshift(joint.parent);
    joint = profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean =>
        candidate.child === joint!.parent,
    );
  }
  return chain;
}
