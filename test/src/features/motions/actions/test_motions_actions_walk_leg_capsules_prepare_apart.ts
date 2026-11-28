import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  walkLegCapsules
} from "../../../../../packages/motions/src/actions/internal/walkLegCapsules";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a segment-to-segment distance, metres. */
const ROUNDING: number = 1e-12;

/**
 * `walkLegCapsules.prepareApart` reads the least distance between a capsule's
 * axis and another segment (Ericson 2005, Real-Time Collision Detection,
 * 5.1.9).
 *
 * Scenarios, the axis from (-1, 0, 0) to (1, 0, 0):
 *
 * 1. A parallel segment 0.3 m above it lies 0.3 m away.
 * 2. A segment crossing it lies 0.
 * 3. A segment across it 0.2 m off in Z, skew to it, lies 0.2 m away.
 * 4. A collinear segment beginning 1 m past its end lies 1 m away.
 * 5. A point 0.4 m above its middle lies 0.4 m away.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Segment separation covers parallel, crossing, skew, collinear and point cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls prepared segment distance against one fixed axis and five explicit segment configurations.
 * @evidence contracts/development/testing.md#independent-expectations The known coordinate offsets and shared points yield distances of 0.3, 0, 0.2, 1, and 0.4 metres by inspection of those configurations.
 */
export function test_motions_actions_walk_leg_capsules_prepare_apart(): void {
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const apart: (from: IAutoMovieVector3, to: IAutoMovieVector3) => number =
    walkLegCapsules.prepareApart(p(-1, 0, 0), p(1, 0, 0));
  TestValidator.predicate(
    "parallel",
    nclose(apart(p(-1, 0.3, 0), p(1, 0.3, 0)), 0.3, ROUNDING),
  );
  TestValidator.predicate(
    "crossing",
    nclose(apart(p(0, -1, 0), p(0, 1, 0)), 0, ROUNDING),
  );
  TestValidator.predicate(
    "skew",
    nclose(apart(p(0, -1, 0.2), p(0, 1, 0.2)), 0.2, ROUNDING),
  );
  TestValidator.predicate(
    "collinear",
    nclose(apart(p(2, 0, 0), p(3, 0, 0)), 1, ROUNDING),
  );
  TestValidator.predicate(
    "a point",
    nclose(apart(p(0, 0.4, 0), p(0, 0.4, 0)), 0.4, ROUNDING),
  );
}
