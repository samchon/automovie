import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanRefusal,
  jumpAirborneTurning,
  jumpLandingHeading,
  jumpPath,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_jump_airborne_turning {
  /** A declared flight. */
  type Flight = NonNullable<jumpAirborneTurning.ITurning["declared"]["flight"]>;

  /** Rounding of a quaternion's angle, degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `jumpAirborneTurning` declares a jump's flight rotation to the performance,
   * which solves the airborne turn from the momentum and hands it back, and then
   * settles the attitude the flight lands on over the ground phase.
   *
   * Scenarios, a flight from 0.4 s to 1 s of a 1.6 s plan settling at 1.3 s:
   *
   * 1. A jump that turns neither way declares no flight.
   * 2. 2¼ twists declare the flight over its shares, 0.25 to 0.625, as turns: no
   *    somersault and the 2¼ twists.
   * 3. A backward somersault declares its turns negative; a sideways one turns its
   *    frame a quarter about the vertical.
   * 4. Handed a flight that ends turned 30 degrees about the vertical, the landing
   *    starts from that turn just after touchdown and has settled it away by 1.3
   *    s.
   */
  export function verify(): void {
    // 1. No turn.
    TestValidator.equals(
      "no flight",
      jumpAirborneTurning(undefined, 0.4, 1, 1.6, 1.3).declared,
      {},
    );

    // 2. Twists.
    const twisting: jumpAirborneTurning.ITurning = jumpAirborneTurning(
      { twist: 2.25 },
      0.4,
      1,
      1.6,
      1.3,
    );
    const flight: Flight = twisting.declared.flight!;
    TestValidator.predicate(
      "the twisting flight",
      nclose(flight.from, 0.25, ROUNDING) &&
        nclose(flight.to, 0.625, ROUNDING) &&
        flight.momentum.kind === "turns" &&
        flight.momentum.somersault === 0 &&
        flight.momentum.twist === 2.25,
    );

    // 3. Somersaults.
    const back: Flight = jumpAirborneTurning(
      { somersault: 1, way: "backward" },
      0.4,
      1,
      1.6,
      1.3,
    ).declared.flight!;
    const aside: Flight = jumpAirborneTurning(
      { somersault: 1, way: "left" },
      0.4,
      1,
      1.6,
      1.3,
    ).declared.flight!;
    TestValidator.predicate(
      "the somersaults",
      back.momentum.kind === "turns" &&
        back.momentum.somersault === -1 &&
        aside.momentum.kind === "turns" &&
        aside.momentum.frame !== undefined &&
        nclose(
          Quaternion.angle(
            aside.momentum.frame,
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
          ),
          0,
          ROUNDING,
        ),
    );

    // 4. The landing's settle.
    const turned: IAutoMovieHumanPostureRotation = {
      about: { x: 0, y: 1, z: 0 },
      turn: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30),
    };
    twisting.declared.airborne!((): IAutoMovieHumanPostureRotation => turned);
    const still: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0.9, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const just: IAutoMovieMotionHumanPosture = twisting.landed(still, 1 + 1e-6);
    TestValidator.predicate(
      "the landing starts turned",
      just.rotation !== undefined &&
        Math.abs(Quaternion.angle(just.rotation.turn, turned.turn)) < 1e-3,
    );
    TestValidator.predicate(
      "and settles it away",
      twisting.landed(still, 1.3) === still,
    );
  }
}

namespace part_jump_landing_heading {
  /**
   * `jumpLandingHeading` turns a jump's two-foot landing by its twist's fraction:
   * whole twists land facing the flight's heading, a fractional twist lands
   * turned by that fraction of a turn on the level floor, a fractional somersault
   * cannot land upright, and a fractional twist onto a raised point or a prop has
   * no room for both turned footprints.
   *
   * Scenarios, the flight heading 37 degrees toward a floor point:
   *
   * 1. Two whole twists land at 37 degrees.
   * 2. 2¼ twists land at 37 + 90 = 127 degrees; one somersault with half a twist at
   *    37 + 180 = 217.
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
        return error instanceof HumanRefusal && error.axis === axis;
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

namespace part_jump_path_lerp {
  /** Rounding of one product and sum per component, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `jumpPath.lerp` interpolates two points straight, `a + (b - a) s`, the share
   * unclamped.
   *
   * Scenarios:
   *
   * 1. The share 0 gives `a` and 1 gives `b`.
   * 2. A quarter of the way from (0, 0, 0) to (4, -8, 2) is (1, -2, 0.5).
   * 3. A share past 1 extrapolates: 1.5 gives (6, -12, 3).
   */
  export function verify(): void {
    const a: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const b: IAutoMovieVector3 = { x: 4, y: -8, z: 2 };
    TestValidator.predicate(
      "at a",
      vclose(jumpPath.lerp(a, b, 0), a, ROUNDING),
    );
    TestValidator.predicate(
      "at b",
      vclose(jumpPath.lerp(a, b, 1), b, ROUNDING),
    );
    TestValidator.predicate(
      "a quarter of the way",
      vclose(jumpPath.lerp(a, b, 0.25), { x: 1, y: -2, z: 0.5 }, ROUNDING),
    );
    TestValidator.predicate(
      "past b",
      vclose(jumpPath.lerp(a, b, 1.5), { x: 6, y: -12, z: 3 }, ROUNDING),
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
   * the minimum-jerk path, `p0 + (p1 - p0) s(u)` with `s(1/2) = 1/2`, and given a
   * start velocity it leaves at that velocity.
   *
   * Scenarios:
   *
   * 1. At its start and end the path is at its two points, and it holds them before
   *    and after.
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

namespace part_jump_path_unwrap {
  /** Rounding of one wrap of whole turns, degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `jumpPath.unwrap` gives the equivalent of a heading within half a turn of
   * another, so a turn between them takes the shorter way.
   *
   * Scenarios:
   *
   * 1. 10 degrees near 350 is 370.
   * 2. 350 degrees near 10 is -10.
   * 3. A heading already near is unchanged: 30 near 20 is 30.
   * 4. Whole turns away are taken off: 725 near 0 is 5.
   */
  export function verify(): void {
    TestValidator.predicate(
      "forward through 360",
      nclose(jumpPath.unwrap(10, 350), 370, ROUNDING),
    );
    TestValidator.predicate(
      "back through 0",
      nclose(jumpPath.unwrap(350, 10), -10, ROUNDING),
    );
    TestValidator.predicate(
      "already near",
      nclose(jumpPath.unwrap(30, 20), 30, ROUNDING),
    );
    TestValidator.predicate(
      "whole turns away",
      nclose(jumpPath.unwrap(725, 0), 5, ROUNDING),
    );
  }
}

/**
 * `jump`'s unit contract: its flight path, airborne turn and landing heading.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `jump_airborne_turning`: `jumpAirborneTurning` declares a jump's flight
 *   rotation to the performance, which solves the airborne turn from the
 *   momentum and hands it back, and then settles the attitude the flight lands
 *   on over the ground phase.
 * - `jump_landing_heading`: `jumpLandingHeading` turns a jump's two-foot landing
 *   by its twist's fraction:
 * - `jump_path_lerp`: `jumpPath.lerp` interpolates two points straight, `a + (b -
 *   a) s`, the share unclamped.
 * - `jump_path_prepare`: `jumpPath.prepare` draws the root on a quintic Hermite
 *   path between two points and velocities:
 * - `jump_path_unwrap`: `jumpPath.unwrap` gives the equivalent of a heading
 *   within half a turn of another, so a turn between them takes the shorter
 *   way.
 */
export async function test_unit_motions_actions_jump(): Promise<void> {
  part_jump_airborne_turning.verify();
  part_jump_landing_heading.verify();
  part_jump_path_lerp.verify();
  part_jump_path_prepare.verify();
  part_jump_path_unwrap.verify();
}
