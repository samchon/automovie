import type { IAutoMovieMotionHumanJump } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Choose the heading of a jump's two-foot landing, in degrees about world +Y.
 *
 * A completed somersault restores the body's up axis, so a fractional twist
 * can finish upright with both footprints turned around the destination.
 * A fractional somersault needs a different support or recovery action. A
 * turned landing currently requires the level floor because a prop contact
 * does not establish room for the rotated footprints.
 *
 * @param params The authored rotation, destination and optional support.
 * @param heading The heading of the jump's unturned flight.
 * @returns World yaw for touchdown, absorption and the final stance.
 * @throws {HumanRefusal} For an unsupported landing orientation or support.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the axes, units, admitted supports and unsupported recovery case.
 * @evidence contracts/development/implementation.md#principled-implementation The feet-first endpoint requires the somersault to restore +Y; only the signed twist remainder changes world yaw because both jump heading and twist act about +Y there.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the terminal up axis and its support before planning any landing geometry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The signed winding remains in params for the airborne pass; the remainder sets only a rigid endpoint. Refuses unnamed raised supports and props whose turned footprint clearance has not been qualified.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed scalar arithmetic and comparisons.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The result is a pure function of the current authoring and travel heading.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains no resources.
 */
export function jumpLandingHeading(
  params: IAutoMovieMotionHumanJump.IParams,
  heading: number,
): number {
  const somersault: number = params.rotation?.somersault ?? 0;
  const twist: number = params.rotation?.twist ?? 0;
  if (
    !Number.isInteger(somersault) ||
    !Number.isFinite(somersault * 360) ||
    !Number.isFinite(twist * 360)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "turns",
      value: params.rotation,
      reason:
        "a two-foot jump landing needs a finite twist and an upright terminal axis",
      fix: "give complete somersault revolutions and a finite twist for a two-foot landing",
    });
  const remainder: number = twist % 1;
  if (remainder === 0) return heading;
  if (params.on !== undefined || params.to.y !== 0)
    throw new HumanRefusal({
      kind: "affordance",
      axis: params.on === undefined ? "to" : "on",
      value: params.on ?? params.to.y,
      reason:
        "a fractional twist needs room for both rotated footprints on the level floor",
      fix: "author a floor landing at zero height or use a complete twist on this support",
    });
  return heading + 360 * remainder;
}
