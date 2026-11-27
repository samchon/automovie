import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The bow hair's direction on an outer violin string: perpendicular to the
 * string across the instrument, the straight-stroke condition (Schoonderwaldt
 * 2010, DOI 10.3813/AAA.918314), tilted by `TILT` out of the string bar's plane
 * toward the string's own outside edge, so the hair rises toward the other
 * three strings.
 *
 * @param longitudinal The string's direction from bridge to nut, unit.
 * @param outward The string bar's outward normal, unit.
 * @param string The outer string bowed: `string1` tilts the hair outward,
 *   `string4` inward.
 * @returns The hair's unit direction.
 */
export function bowViolinHairAxis(
  longitudinal: IAutoMovieVector3,
  outward: IAutoMovieVector3,
  string: BowViolinString,
): IAutoMovieVector3 {
  const across: IAutoMovieVector3 = Vector3.cross(longitudinal, outward);
  return Vector3.add(
    Vector3.scale(across, Math.cos(TILT)),
    Vector3.scale(outward, Math.sin(TILT) * (string === "string1" ? 1 : -1)),
  );
}

/** The alternatives of `BowViolinString`'s site. */
type BowViolinString = "string1" | "string4";

/**
 * Provisional tilt of the hair toward the outside edge, radians: it clears the
 * other strings of the simplified coplanar instrument.
 */
const TILT: number = Math.PI / 15;
