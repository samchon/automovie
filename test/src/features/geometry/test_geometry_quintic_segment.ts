import { HumanQuinticSegment } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The minimum-jerk quintic between two boundary states
 * (`HumanQuinticSegment`, Flash and Hogan 1985) against its closed forms.
 *
 * Scenarios:
 *
 * 1. Rest to rest from 0 to 1 in 1 s is Flash and Hogan's 10τ³ − 15τ⁴ + 6τ⁵:
 *    at τ = 0.5 the position is 0.5, the velocity 1.875 (15/8 of the mean),
 *    the acceleration 0; the jerk is 60 at the start.
 * 2. A segment with every boundary value nonzero (p 0 → 3, v 1 → −1, a 2 → 0.5,
 *    T = 2) reproduces its six boundary conditions at both ends.
 * 3. Instants outside the segment hold its ends.
 */
export function test_geometry_quintic_segment(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;

  // 1. Rest to rest.
  const rest: HumanQuinticSegment.ISegment = HumanQuinticSegment.prepare(
    { position: [0], velocity: [0], acceleration: [0] },
    { position: [1], velocity: [0], acceleration: [0] },
    1,
  );
  const middle: HumanQuinticSegment.IState = HumanQuinticSegment.state(
    rest,
    0.5,
  );
  TestValidator.predicate(
    "rest to rest is Flash and Hogan's quintic at its middle",
    close(middle.position[0]!, 0.5) &&
      close(middle.velocity[0]!, 1.875) &&
      close(middle.acceleration[0]!, 0) &&
      close(HumanQuinticSegment.state(rest, 0).jerk[0]!, 60),
  );
  TestValidator.predicate(
    "position agrees with the state",
    close(HumanQuinticSegment.position(rest, 0.3)[0]!, 10 * 0.027 - 15 * 0.0081 + 6 * 0.00243),
  );

  // 2. General boundary states.
  const start: HumanQuinticSegment.IBoundary = {
    position: [0],
    velocity: [1],
    acceleration: [2],
  };
  const end: HumanQuinticSegment.IBoundary = {
    position: [3],
    velocity: [-1],
    acceleration: [0.5],
  };
  const general: HumanQuinticSegment.ISegment = HumanQuinticSegment.prepare(
    start,
    end,
    2,
  );
  const a: HumanQuinticSegment.IState = HumanQuinticSegment.state(general, 0);
  const b: HumanQuinticSegment.IState = HumanQuinticSegment.state(general, 2);
  TestValidator.predicate(
    "the six boundary conditions hold",
    close(a.position[0]!, 0) &&
      close(a.velocity[0]!, 1) &&
      close(a.acceleration[0]!, 2) &&
      close(b.position[0]!, 3) &&
      close(b.velocity[0]!, -1) &&
      close(b.acceleration[0]!, 0.5),
  );

  // 3. Outside the segment.
  TestValidator.predicate(
    "instants outside hold the ends",
    close(HumanQuinticSegment.position(general, -1)[0]!, 0) &&
      close(HumanQuinticSegment.position(general, 5)[0]!, 3),
  );
}
