import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
} from "@automovie/interface";

/**
 * Relationship fitting must own a real contiguous path with at least one
 * articulated joint.
 */
export function isPhysicalActuatorChain(
  profile: IAutoMoviePhysicalProfile,
  chain: readonly string[],
  source: string,
): boolean {
  return (
    chain.length >= 1 &&
    chain.length <= 32 &&
    chain.at(-1) === source &&
    new Set(chain).size === chain.length &&
    chain.every(
      (bone: string, index: number): boolean =>
        profile.segments.some(
          (segment: IAutoMoviePhysicalSegment): boolean =>
            segment.bone === bone,
        ) &&
        (index === 0 ||
          profile.joints.some(
            (joint: IAutoMoviePhysicalJoint): boolean =>
              joint.parent === chain[index - 1] && joint.child === bone,
          )),
    ) &&
    profile.joints.some(
      (joint: IAutoMoviePhysicalJoint): boolean =>
        chain.includes(joint.child) && joint.axes.length > 0,
    )
  );
}
