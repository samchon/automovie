import { HumanQuinticSegment } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a quintic's Horner evaluation, coordinate units. */
const ROUNDING: number = 1e-12;

/**
 * `HumanQuinticSegment` is the minimum-jerk quintic between two boundary states
 * (Flash and Hogan 1985): its position, velocity and acceleration take the
 * given values at both ends, and the rest-to-rest case is `Δ (10τ³ − 15τ⁴ +
 * 6τ⁵)` on τ = t / T.
 *
 * Scenarios:
 *
 * 1. Rest to rest from 0 to 1 over 2 s: at the middle the position is ½, the
 *    velocity `(30τ² − 60τ³ + 30τ⁴) / T` = 0.9375 and the acceleration 0; at
 *    the start the jerk is `60 / T³` = 7.5.
 * 2. Non-zero boundary states over 1.5 s: `state` returns each end's position,
 *    velocity and acceleration.
 * 3. A second before the start or after the end is held to that end.
 */
export function test_unit_motions_posture_quintic_segment(): void {
  // 1. Rest to rest.
  const rest: HumanQuinticSegment.ISegment = HumanQuinticSegment.prepare(
    { position: [0], velocity: [0], acceleration: [0] },
    { position: [1], velocity: [0], acceleration: [0] },
    2,
  );
  const middle: HumanQuinticSegment.IState = HumanQuinticSegment.state(rest, 1);
  TestValidator.predicate(
    "the rest-to-rest middle state",
    nclose(middle.position[0]!, 0.5, ROUNDING) &&
      nclose(middle.velocity[0]!, 0.9375, ROUNDING) &&
      nclose(middle.acceleration[0]!, 0, ROUNDING) &&
      nclose(HumanQuinticSegment.state(rest, 0).jerk[0]!, 7.5, ROUNDING),
  );

  // 2. Every boundary condition.
  const start: HumanQuinticSegment.IBoundary = {
    position: [1, -2],
    velocity: [2, 0.5],
    acceleration: [3, -1],
  };
  const end: HumanQuinticSegment.IBoundary = {
    position: [4, 0],
    velocity: [-1, 0],
    acceleration: [0.5, 2],
  };
  const bent: HumanQuinticSegment.ISegment = HumanQuinticSegment.prepare(
    start,
    end,
    1.5,
  );
  const matches = (
    state: HumanQuinticSegment.IState,
    boundary: HumanQuinticSegment.IBoundary,
  ): boolean =>
    [0, 1].every(
      (c: number): boolean =>
        nclose(state.position[c]!, boundary.position[c]!, 1e-9) &&
        nclose(state.velocity[c]!, boundary.velocity[c]!, 1e-9) &&
        nclose(state.acceleration[c]!, boundary.acceleration[c]!, 1e-9),
    );
  TestValidator.predicate(
    "both ends take their boundary states",
    matches(HumanQuinticSegment.state(bent, 0), start) &&
      matches(HumanQuinticSegment.state(bent, 1.5), end),
  );

  // 3. Held to the ends.
  TestValidator.predicate(
    "a second outside the segment is held to its end",
    nclose(HumanQuinticSegment.position(bent, -1)[0]!, 1, ROUNDING) &&
      nclose(HumanQuinticSegment.position(bent, 9)[0]!, 4, 1e-9),
  );
}
