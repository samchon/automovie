import {
  AutoMovieHumanArmscyePort,
  AutoMovieHumanBoundSection,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The signed port-slope limits on two circular cylinders with axes at 60
 * degrees.
 *
 * Scenarios:
 *
 * 1. The child radius is 12 mm on the near radial sheet of the host. Following the
 *    host cylinder toward larger child radii reaches the exact star bound.
 * 2. The host tangent plane also admits a finite slope at the other child phase,
 *    with the scalar ratio inside both limits. Its radial incidence is
 *    reversed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cylinders, units, limits and radial sheets being checked.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the same source-plane slope and signed margins the port reads.
 * @evidence contracts/development/testing.md#independent-expectations At x = 0 and z = 40, the host cylinder has a constant normal. The child coordinates give z = s sin(60 degrees) + r cos(60 degrees) at the near phase, so dr/ds is minus the tangent of 60 degrees. Substitution gives the star-bound station in closed form.
 * @evidence contracts/development/testing.md#distinguishing-cases The same host plane exposes a violation, its exact level and a reversed sheet with an otherwise admissible slope.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous numeric test with no capture or reference input.
 */
export function test_human_port_slope(): void {
  const angle: number = Math.PI / 3;
  const cosine: number = Math.cos(angle),
    sine: number = Math.sin(angle);
  const axis: AutoMovieVector3Tuple = [0, cosine, sine];
  const normal: AutoMovieVector3Tuple = [0, 0, 1];
  const zero: AutoMovieVector3Tuple = [0, 0, 0];
  const radius: number = 12,
    length: number = 20,
    reach: number = 8;
  const hostRadius: number = 40;

  // The outward-facing host generator x = 0 and z = 40 intersects both
  // child rays at distinct stations. The child frame translates along its axis.
  const frame = (station: number): IAutoMovieViewAxisJet.IJet => ({
    value: {
      origin: [0, station * cosine, station * sine],
      u: [1, 0, 0],
      v: [0, -sine, cosine],
    },
    first: { origin: axis, u: zero, v: zero },
    second: { origin: zero, u: zero, v: zero },
  });
  const near: number = (hostRadius - radius * cosine) / sine;
  const reversed: number = (hostRadius + radius * cosine) / sine;
  const { portSlope, portSlopeMargins } = AutoMovieHumanBoundSection;

  const leave = portSlope(frame(near), Math.PI / 2, radius, normal);
  const [star, bulge] = portSlopeMargins(leave, radius, length, reach);
  TestValidator.predicate(
    "the near sheet violates the star bound",
    () => nclose(leave.sigma, -Math.sqrt(3), 1e-12) && star < 0 && bulge > 0,
  );

  // Substitute r = 12 + sqrt(3) d and L = 20 + d into L sigma + 5r/2 = 0.
  const step: number =
    (Math.sqrt(3) * length - (5 / 2) * radius) / ((3 / 2) * Math.sqrt(3));
  const movedRadius: number = radius + Math.sqrt(3) * step;
  const moved = portSlope(frame(near - step), Math.PI / 2, movedRadius, normal);
  const [level, room] = portSlopeMargins(
    moved,
    movedRadius,
    length + step,
    reach,
  );
  TestValidator.predicate(
    "the simple cylinder gives the star level on the host",
    () =>
      nclose((near - step) * sine + movedRadius * cosine, hostRadius, 1e-12) &&
      nclose(level, 0, 1e-12) &&
      room > 0,
  );

  // The host moves 2d along its generator for a child station decrease d.
  const movedOnHost: number | null = AutoMovieHumanArmscyePort.crossing(
    (distance: number): number => {
      const d: number = distance / 2;
      const r: number = radius + Math.sqrt(3) * d;
      const course = portSlope(frame(near - d), Math.PI / 2, r, normal);
      return Math.min(...portSlopeMargins(course, r, length + d, reach));
    },
    reach / 4,
    reach,
    1e-7,
  );
  TestValidator.predicate(
    "the host continuation reaches the analytical star level from its valid side",
    () =>
      movedOnHost !== null &&
      movedOnHost >= 2 * step &&
      nclose(movedOnHost, 2 * step, 1e-7),
  );

  const backward = portSlope(frame(reversed), -Math.PI / 2, radius, normal);
  const opposite = portSlopeMargins(backward, radius, length, reach);
  TestValidator.predicate(
    "an admissible ratio alone accepts the wrong sheet",
    () =>
      nclose(backward.sigma, Math.sqrt(3), 1e-12) &&
      backward.sigma < ((81 / 16) * reach) / length &&
      opposite.every((margin: number): boolean => margin < 0),
  );
}
