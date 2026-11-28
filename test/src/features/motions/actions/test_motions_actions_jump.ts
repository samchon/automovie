import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  jumpLandingHeading
} from "../../../../../packages/motions/src/actions/internal/jumpLandingHeading";
import {
  jumpPath
} from "../../../../../packages/motions/src/actions/internal/jumpPath";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

namespace part_jump_landing_heading {
  /**
   * `jumpLandingHeading` turns a jump's two-foot landing by its twist's
   * fraction: whole twists land facing the flight's heading, a fractional twist
   * lands turned by that fraction of a turn on the level floor, a fractional
   * somersault cannot land upright, and a fractional twist onto a raised point
   * or a prop has no room for both turned footprints.
   *
   * Scenarios, the flight heading 37 degrees toward a floor point:
   *
   * 1. Two whole twists land at 37 degrees.
   * 2. 2¼ twists land at 37 + 90 = 127 degrees; one somersault with half a twist
   *    at 37 + 180 = 217.
   * 3. Half a somersault is refused on `turns`.
   * 4. A ¼ twist onto a point 0.3 m up is refused on `to`, onto a named prop on
   *    `on`.
   */
  export function verify(): void {
    const floor: IAutoMovieVector3 = { x: 1, y: 0, z: 1 };
    TestValidator.equals(
      "whole and fractional twists",
      [
        jumpLandingHeading({ to: floor, rotation: { twist: 2 } }, 37),
        jumpLandingHeading({ to: floor, rotation: { twist: 2.25 } }, 37),
        jumpLandingHeading(
          { to: floor, rotation: { somersault: 1, twist: 0.5 } },
          37,
        ),
      ],
      [37, 127, 217],
    );
    const refused = (
      params: Parameters<typeof jumpLandingHeading>[0],
      axis: string,
    ): boolean => {
      try {
        jumpLandingHeading(params, 37);
      } catch (error: unknown) {
        return error instanceof AutoMovieMotionHumanRefusal && error.axis === axis;
      }
      return false;
    };
    TestValidator.predicate(
      "half a somersault",
      refused({ to: floor, rotation: { somersault: 0.5 } }, "turns"),
    );
    TestValidator.predicate(
      "no room for a turned landing",
      refused({ to: { ...floor, y: 0.3 }, rotation: { twist: 0.25 } }, "to") &&
        refused({ to: floor, on: "box", rotation: { twist: 0.25 } }, "on"),
    );
  }
}

namespace part_jump_path_prepare {
  /** Rounding of one quintic Hermite evaluation, metres. */
  const ROUNDING: number = 1e-12;

  /** A finite-difference step, seconds. */
  const STEP: number = 1e-6;

  /** The finite difference's truncation over that step, metres per second. */
  const DIFFERENCE: number = 1e-5;

  /**
   * `jumpPath.prepare` draws the root on a quintic Hermite path between two
   * points and velocities: with both velocities and accelerations at rest it is
   * the minimum-jerk path, `p0 + (p1 - p0) s(u)` with `s(1/2) = 1/2`, and given
   * a start velocity it leaves at that velocity.
   *
   * Scenarios:
   *
   * 1. At its start and end the path is at its two points, and it holds them
   *    before and after.
   * 2. At rest at both ends, its middle second is half way.
   * 3. Given a start velocity, its first derivative there is that velocity.
   */
  export function verify(): void {
    const rest: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const p0: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const p1: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
    const at: (t: number) => IAutoMovieVector3 = jumpPath.prepare(
      p0,
      rest,
      p1,
      rest,
      2,
    );

    // 1. The ends, held outside.
    TestValidator.predicate("the start", vclose(at(0), p0, ROUNDING));
    TestValidator.predicate("the end", vclose(at(2), p1, ROUNDING));
    TestValidator.predicate("held before", vclose(at(-1), p0, ROUNDING));
    TestValidator.predicate("held after", vclose(at(5), p1, ROUNDING));

    // 2. Half way at the middle.
    TestValidator.predicate(
      "half way",
      vclose(at(1), { x: 0.5, y: 1, z: 1.5 }, ROUNDING),
    );

    // 3. Leaving at the given velocity.
    const v0: IAutoMovieVector3 = { x: 0.5, y: -1, z: 2 };
    const moving: (t: number) => IAutoMovieVector3 = jumpPath.prepare(
      p0,
      v0,
      p1,
      rest,
      2,
    );
    const ahead: IAutoMovieVector3 = moving(STEP);
    TestValidator.predicate(
      "the start velocity",
      vclose(
        {
          x: (ahead.x - p0.x) / STEP,
          y: (ahead.y - p0.y) / STEP,
          z: (ahead.z - p0.z) / STEP,
        },
        v0,
        DIFFERENCE,
      ),
    );
  }
}

/**
 * `jump`'s unit contract: its flight path, airborne turn and landing heading.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `jump_landing_heading`: `jumpLandingHeading` turns a jump's two-foot landing
 *   by its twist's fraction:
 * - `jump_path_prepare`: `jumpPath.prepare` draws the root on a quintic Hermite
 *   path between two points and velocities:
 *
 * @evidence contracts/development/common.md#meaningful-documentation Jump curves carry launch and landing velocities, with heading chosen within the landing foot room.
 * @evidence contracts/development/testing.md#behavioral-verification Calls jump path preparation and landing heading with fixed points, velocities, turn shares, and restricted support geometry.
 * @evidence contracts/development/testing.md#independent-expectations The endpoint velocities and twist shares determine expected values before the interpolator is called. A constrained landing distinguishes lack of foot room from an ordinary turn.
 */
export async function test_motions_actions_jump(): Promise<void> {
  part_jump_landing_heading.verify();
  part_jump_path_prepare.verify();
}
