import type { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * Human standing-recovery envelope for the generic bounded bracing controller.
 * The neutral knee plane is the declared lower COM limit for this standing
 * controller; recovery from deeper crouches or the floor needs a separate task.
 * Maximum root shift is the actual mean thigh length. These are geometric
 * controller limits, not measured muscle strength or a guarantee of recovery.
 */
export function AutoMovieHumanPhysicalBracing(
  profile: P,
): NonNullable<NonNullable<Simulation.IBody["balance"]>["bracing"]> {
  const at: (bone: string) => P.ITransform["position"] = (
    bone: string,
  ): P.ITransform["position"] => {
    const segment: P.ISegment | undefined = profile.segments.find(
      (candidate: P.ISegment): boolean => candidate.bone === bone,
    );
    if (!segment) throw new Error(`Human bracing landmark missing: ${bone}`);
    return segment.neutral.position;
  };
  const left: P.ITransform["position"] = at("leftLowerLeg");
  const right: P.ITransform["position"] = at("rightLowerLeg");
  const hipLeft: P.ITransform["position"] = at("leftUpperLeg");
  const hipRight: P.ITransform["position"] = at("rightUpperLeg");
  return {
    minimumCenterHeight: (left.y + right.y) / 2,
    maximumRootShift:
      (Math.hypot(hipLeft.x - left.x, hipLeft.y - left.y, hipLeft.z - left.z) +
        Math.hypot(
          hipRight.x - right.x,
          hipRight.y - right.y,
          hipRight.z - right.z,
        )) /
      2,
  };
}
