import type { IAutoMovieSwivelArcs } from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { ROM_TOLERANCE } from "../../rom/ROM_TOLERANCE";
import { distalEndSwivelReadings } from "../distalEndSwivelReadings";
import { sphericalBoxMiss } from "./sphericalBoxMiss";

/**
 * A certified lower bound, over an interval of swivels, of how far the end
 * joint of a chain whose mid segment twists distally (a wrist beyond a forearm)
 * must miss a requested rotation, degrees.
 *
 * Whatever twist the mid segment takes and wherever in its box the end joint
 * stands, the rotation the chain shows carries the mid segment's world axis `u`
 * to `d(f, a) = (-sin a, cos a sin f, cos a cos f)` in the end joint's basis,
 * with `(f, a)` inside the box (`distalEndSwivelReadings`), while the requested
 * rotation carries it to `x(s)`, the direction the readings give at swivel `s`.
 * A rotation by an angle moves no unit vector by more than that angle, so the
 * angle between the shown and the requested rotation is at least the angle from
 * `x(s)` to the nearest `d(f, a)` of the box: the spherical distance from a
 * point to a rectangle of latitudes (abduction) and longitudes (flexion) about
 * the flexion axis. Inside the rectangle's longitudes that distance is the
 * abduction's excess past its interval; outside them the nearest point lies on
 * one of the two bounding meridians, where the direction's cosine with the
 * meridian point of abduction `a` is `-x_f sin a + c cos a`, `c = x_a sin e +
 * x_t cos e`, greatest at the abduction nearest `atan2(-x_f, c)`.
 *
 * `x(s)` circles an axis as the swivel turns, on a circle whose radius is the
 * norm of its sinusoids' cosine (or sine) coefficients, so it moves by at most
 * that radius per unit of swivel and the distance, which changes by no more
 * than its point moves, is bounded over an interval by its value at the middle
 * less the radius times the half width.
 *
 * The bound is lowered by the joints' tolerance (`ROM_TOLERANCE`), within which
 * a projection onto the box may stand past its ends, so it stays below every
 * miss it bounds.
 *
 * @param props The end joint and the mid segment's direction by swivel.
 * @returns The bound over `low` to `high` degrees, never negative; null when
 *   the analysis does not apply (`distalEndSwivelReadings.of`).
 */
export function distalEndSwivelMiss(
  props: distalEndSwivelReadings.IProps,
): ((low: number, high: number) => number) | null {
  const read: distalEndSwivelReadings.IReadings | null =
    distalEndSwivelReadings.of(props);
  if (read === null) return null;
  const { onFlexion, onAbduction, onTwist }: distalEndSwivelReadings.IReadings =
    read;
  const box: readonly [number, number] = read.abduction ?? [-90, 90];
  const flexion: readonly [number, number] | null = read.flexion;
  const radius: number = Math.max(
    Math.hypot(onFlexion.b, onAbduction.b, onTwist.b),
    Math.hypot(onFlexion.c, onAbduction.c, onTwist.c),
  );
  const D: number = Quaternion.DEG2RAD;

  // The direction's distance from the box at one swivel, degrees
  // (`sphericalBoxMiss`).
  const at = (swivel: number): number => {
    const cos: number = Math.cos(swivel * D);
    const sin: number = Math.sin(swivel * D);
    const value = (f: IAutoMovieSwivelArcs.ISinusoid): number =>
      f.a + f.b * cos + f.c * sin;
    const length: number = Math.hypot(
      value(onFlexion),
      value(onAbduction),
      value(onTwist),
    );
    if (!(length > 1e-9)) return 0;
    const x: number = value(onFlexion) / length;
    const y: number = value(onAbduction) / length;
    const z: number = value(onTwist) / length;
    return sphericalBoxMiss(x, y, z, box, flexion);
  };
  return (low: number, high: number): number =>
    Math.max(
      0,
      at((low + high) / 2) - (radius * (high - low)) / 2 - ROM_TOLERANCE,
    );
}
