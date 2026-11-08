import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Read a proximal-to-distal actuator path from an admitted tree. The fixed root has no incoming actuator and is omitted. */
export function physicalJointChain(profile: P, bone: string): string[] {
  const chain: string[] = [bone];
  let joint: P.IJoint | undefined = profile.joints.find(
    (candidate: P.IJoint): boolean => candidate.child === bone,
  );
  while (
    joint &&
    profile.joints.some(
      (candidate: P.IJoint): boolean => candidate.child === joint!.parent,
    )
  ) {
    chain.unshift(joint.parent);
    joint = profile.joints.find(
      (candidate: P.IJoint): boolean => candidate.child === joint!.parent,
    );
  }
  return chain;
}
