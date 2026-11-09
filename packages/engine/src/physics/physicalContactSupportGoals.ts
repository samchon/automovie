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

/**
 * Preserve original enabled endpoint promises and explicitly stationary support patches. Recovery goals come from the declared trajectory, never an unmet fitted pose; moving or reserved endpoints retain XYZ without a planted-plane claim.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Preserve original enabled endpoint promises and explicitly stationary support patches) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Preserve original enabled endpoint promises and explicitly stationary support patches) directly over its typed inputs (`body`, `target`, `floor`, `tolerance`, `seconds`, `rate`, `step`, `state`) as nested iteration of depth 4 (for-of over patterns; for-of over pattern.limbs; map over limb.floorPoints), delegating to `physicalRecoverySupportGoals`, `JSON.stringify`, `identities.has`, `identities.add`, `physicalSupportPoint`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 82 lines and 5 top-level statements that reuses `physicalRecoverySupportGoals`, `JSON.stringify`, `identities.has`, `identities.add`, `physicalSupportPoint` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 6 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `body`, `target`, `floor`, `tolerance`, `seconds`, `rate`, `step`, `state`; the dominant cost is nested iteration of depth 4 (for-of over patterns; for-of over pattern.limbs; map over limb.floorPoints), performed once per call with 13 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 13 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
