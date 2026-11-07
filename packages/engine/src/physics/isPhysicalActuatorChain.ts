import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Relationship fitting must own a real contiguous path with at least one articulated joint. */
export function isPhysicalActuatorChain(
  profile: P,
  chain: readonly string[],
  source: string,
): boolean {
  return (
    Array.isArray(chain) &&
    chain.length >= 1 &&
    chain.length <= 32 &&
    chain.at(-1) === source &&
    new Set(chain).size === chain.length &&
    Array.from(chain).every(
      (bone: string, index: number): boolean =>
        typeof bone === "string" &&
        profile.segments.some(
          (segment: P.ISegment): boolean => segment.bone === bone,
        ) &&
        (index === 0 ||
          profile.joints.some(
            (joint: P.IJoint): boolean =>
              joint.parent === chain[index - 1] && joint.child === bone,
          )),
    ) &&
    profile.joints.some(
      (joint: P.IJoint): boolean =>
        chain.includes(joint.child) && joint.axes.length > 0,
    )
  );
}
