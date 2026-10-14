import type { IPortraitEyebrowPlacement } from "./IPortraitEyebrowPlacement";

import { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
import { resolvePortraitEyebrowPlacement } from "./resolvePortraitEyebrowPlacement";

/**
 * Refuse invalid fibre dimensions before fitting an eye or allocating brow meshes.
 *
 * The check is structural: finite positive radius, nonnegative step, clearance
 * and arch, a taper in [0,1), an integral segment count from 1 to 32, a root
 * band and fade fractions inside the brow, and at most 4096 fibres. Without a
 * flow the largest possible fibre span (the explicit `span`, or 0.34, which is
 * the maximum of the default 0.26 to 0.34 span law) must also fit above the
 * highest root, because a flow supplies its own tips. Nothing here is a
 * measured hair dimension. Passing establishes local structural construction
 * premises; actual host contact and Float32 publication still need their own
 * admission. The profile is read and never modified.
 *
 * @evidence contracts/common.md#principled-implementation Finite dimensions, valid root/fade fractions, bounded integral sampling and a valid flow spell out local shaft construction premises.
 * @evidence contracts/common.md#clear-and-simple-design Central placement resolution handles spelling and flow admission before the profile guard checks dimensions and requested count.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The existing 4096-fibre/32-segment bounds refuse unsupported allocations; passing structural admission is not anatomical hair measurement.
 * @evidence contracts/common.md#meaningful-documentation The prose explains the maximum no-flow span, segment/count bounds and unchanged input ownership.
 * @evidence contracts/performance.md#efficient-algorithms Dimension checks have fixed size except the admitted flow's at-most-32 witnesses; no mesh or per-fibre work is allocated by this guard.
 * @evidence contracts/performance.md#reuse-equivalent-work Both procedural and connected reference-guide builders reuse this guard and the same placement resolver instead of duplicating profile conditions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Resolved flow data are temporary here and the supplied profile is read only; errors leave no geometry allocation, cache or task.
 */
export function assertPortraitEyebrowProfile(
  shape: IPortraitEyebrowProfile,
  fibres: number,
): void {
  if (shape.representation !== undefined && shape.representation !== "ribbon")
    throw new Error(
      "Eyebrow representation must be ribbon or omitted for tubes.",
    );
  const placement: IPortraitEyebrowPlacement = resolvePortraitEyebrowPlacement(shape);
  if (
    shape.densitySeed !== undefined &&
    (!Number.isInteger(shape.densitySeed) ||
      shape.densitySeed < 0 ||
      shape.densitySeed > 0xffffffff)
  )
    throw new Error("Eyebrow density seed must be an unsigned 32-bit integer.");
  if (
    shape.emergenceDegrees !== undefined &&
    (!Number.isFinite(shape.emergenceDegrees) ||
      shape.emergenceDegrees < 0 ||
      shape.emergenceDegrees >= 90)
  )
    throw new Error("Eyebrow emergence must be an angle in [0,90) degrees.");
  const roots: readonly [number, number] = placement.rootBand;
  const maximumSpan: number = shape.span ?? 0.34;
  const ends: readonly [number, number] = placement.endFade;
  if (
    ends.length !== 2 ||
    ends.some((value: number): boolean  => !Number.isFinite(value) || value < 0 || value > 0.5)
  )
    throw new Error("Eyebrow endpoint fades must be two fractions in [0,0.5].");
  if (
    roots.length !== 2 ||
    !roots.every(Number.isFinite) ||
    roots[0] < 0 ||
    roots[1] < roots[0] ||
    roots[1] > 1 ||
    !Number.isFinite(maximumSpan) ||
    maximumSpan < 0 ||
    maximumSpan > 1 ||
    (placement.flow === undefined && roots[1] + maximumSpan > 1)
  )
    throw new Error(
      "Eyebrow root band and fibre span must remain inside the supporting brow.",
    );
  if (
    !Number.isInteger(fibres) ||
    fibres < 0 ||
    fibres > 4096 ||
    ![
      shape.radius,
      shape.radiusStep,
      shape.taper,
      shape.clearance,
      shape.arch,
      shape.outwardBend,
    ].every(Number.isFinite) ||
    shape.radius <= 0 ||
    shape.radiusStep < 0 ||
    shape.taper < 0 ||
    shape.taper >= 1 ||
    shape.clearance < 0 ||
    shape.arch < 0 ||
    !Number.isFinite(
      shape.radius + 2 * shape.radiusStep + shape.clearance + shape.arch,
    ) ||
    !Number.isInteger(shape.segments) ||
    shape.segments < 1 ||
    shape.segments > 32
  )
    throw new Error(
      "Eyebrow fibres need finite dimensions, valid taper and bounded integral sampling.",
    );
}
