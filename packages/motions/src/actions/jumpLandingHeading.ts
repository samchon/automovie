import type { IAutoMovieMotionHumanJump } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Choose the heading of a jump's two-foot landing, in degrees about world +Y.
 *
 * A completed somersault restores the body's up axis, so a fractional twist can
 * finish upright with both footprints turned around the destination. A
 * fractional somersault needs a different support or recovery action. A turned
 * landing currently requires the level floor because a prop contact does not
 * establish room for the rotated footprints.
 *
 * @param params The authored rotation, destination and optional support.
 * @param heading The heading of the jump's unturned flight.
 * @returns World yaw for touchdown, absorption and the final stance.
 * @throws {HumanRefusal} For an unsupported landing orientation or support.
 */
export function jumpLandingHeading(
  params: IAutoMovieMotionHumanJump.IParams,
  heading: number,
): number {
  const somersault: number = params.rotation?.somersault ?? 0;
  const twist: number = params.rotation?.twist ?? 0;
  // The somersault turns the body's up axis about its lateral axis; a
  // two-foot landing needs it upright again, its cosine to world up one.
  if (Math.cos(2 * Math.PI * somersault) < 1 - UPRIGHT)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "turns",
      value: params.rotation,
      reason: "a two-foot jump landing needs an upright terminal axis",
      fix: "give complete somersault revolutions for a two-foot landing",
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

/**
 * How far below one the terminal up axis's cosine to world up may fall and
 * still read as upright: the rounding of a cosine of whole revolutions.
 */
const UPRIGHT: number = 1e-9;
