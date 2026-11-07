import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { advancePhysicalBalance as Balance } from "./advancePhysicalBalance";
import type { physicalContactSupportRows } from "./physicalContactSupportRows";
import { physicalRecoverySupportGoals } from "./physicalRecoverySupportGoals";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalSupportPoint } from "./physicalSupportPoint";

/** Preserve original enabled endpoint promises and explicitly stationary support patches. Recovery goals come from the declared trajectory, never an unmet fitted pose; moving or reserved endpoints retain XYZ without a planted-plane claim. */
export function physicalContactSupportGoals(
  body: Simulation.IBody,
  target: Simulation.ITarget,
  floor: number,
  tolerance: number,
  seconds: number,
  rate: number,
  step: number,
  state?: Balance.IState,
): physicalContactSupportRows.ISupport[] {
  const result: physicalContactSupportRows.ISupport[] = [];
  const identities: Set<string> = new Set();
  const patterns: IAutoMovieFootfallPattern[] = [
    ...(state && body.balance ? [body.balance.pattern] : []),
    ...(body.supportTracking ? [body.supportTracking.pattern] : []),
  ];
  for (const pattern of patterns) {
    const goals: Record<string, IAutoMovieVector3> =
      physicalRecoverySupportGoals(body, target, pattern, state, seconds);
    for (const limb of pattern.limbs) {
      if (
        pattern !== body.balance?.pattern &&
        (target.supportStrength?.[limb.bone] ?? 0) <= 0
      )
        continue;
      const identity: string = JSON.stringify([
        limb.bone,
        limb.localPoint,
        limb.contacts,
        limb.floorPoints,
      ]);
      if (identities.has(identity)) continue;
      identities.add(identity);
      const point: IAutoMovieVector3 = goals[limb.bone]!;
      const previous: IAutoMovieVector3 = physicalSupportPoint(
        body.targets[Math.max(0, step - 1)]!.segments[limb.bone]!,
        limb.localPoint,
      );
      const authored: IAutoMovieVector3 = physicalSupportPoint(
        target.segments[limb.bone]!,
        limb.localPoint,
      );
      const stationary: boolean =
        Vector3.length(Vector3.subtract(authored, previous)) * rate <=
        64 * Number.EPSILON * Math.max(1, Vector3.length(authored) * rate);
      const shift: IAutoMovieVector3 = Vector3.subtract(point, authored);
      const contacts: readonly string[] = limb.contacts ?? [limb.bone];
      const height: number = limb.floorPoints?.length
        ? Math.max(
            ...limb.floorPoints.map(
              (witness: NonNullable<typeof limb.floorPoints>[number]): number =>
                Math.abs(
                  physicalSupportPoint(
                    target.segments[witness.bone]!,
                    witness.localPoint,
                  ).y +
                    shift.y -
                    floor,
                ),
            ),
          )
        : Math.abs(
            Math.min(
              ...body.profile.segments
                .filter((segment: P.ISegment): boolean =>
                  contacts.includes(segment.bone),
                )
                .flatMap((segment: P.ISegment): number[] =>
                  segment.shapes.map(
                    (shape: P.IShape): number =>
                      physicalShapeBounds(target.segments[segment.bone]!, shape)
                        .min.y + shift.y,
                  ),
                ),
            ) - floor,
          );
      result.push({
        bone: limb.bone,
        localPoint: limb.localPoint,
        point,
        ...(stationary &&
        height <= tolerance &&
        !target.unavailableSupports?.includes(limb.bone) &&
        state?.swing?.bone !== limb.bone
          ? { patch: { contacts, floorPoints: limb.floorPoints, floor } }
          : {}),
      });
    }
  }
  return result;
}
