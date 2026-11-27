import { AutoMovieEngineGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanThrowObjectLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  throwObjectCurve
} from "../../../../../packages/motions/src/throwing/internal/throwObjectCurve";
import {
  throwObjectLaunch
} from "../../../../../packages/motions/src/throwing/internal/throwObjectLaunch";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `throwObjectCurve` joins two held places with their velocities by a cubic
 * Hermite curve over a span.
 *
 * The object goes from the origin to (1, 0, 0) over 2 s at the constant
 * velocity 0.5 m/s that line needs.
 *
 * Scenarios:
 *
 * 1. The curve starts and ends on its places.
 * 2. With end velocities matching the chord, the cubic is the straight line at
 *    constant speed: halfway at the parameter one half.
 */
function scenario_test_motions_throwing_throw_object_curve(): void {
  const velocity: IAutoMovieVector3 = { x: 0.5, y: 0, z: 0 };
  const curve: (time: number) => IAutoMovieVector3 = throwObjectCurve(
    { x: 0, y: 0, z: 0 },
    velocity,
    { x: 1, y: 0, z: 0 },
    velocity,
    2,
  );
  TestValidator.predicate(
    "the curve's ends and middle",
    vclose(curve(0), { x: 0, y: 0, z: 0 }, 1e-12) &&
      vclose(curve(1), { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(curve(0.5), { x: 0.5, y: 0, z: 0 }, 1e-12),
  );
}

/** The release, at the origin. */
const RELEASE: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * `throwObjectLaunch` writes a throw's grip and launch and solves the range
 * equation, `v² = g d² / (2 cos²(a) (d tan(a) − h))`, for the velocity whose
 * drag-free path reaches a target.
 *
 * Scenarios:
 *
 * 1. An empty-handed throw holds and launches nothing; a thrown ball is gripped in
 *    the throwing hand until the release and launched at its point and
 *    velocity, its attitude kept only when given.
 * 2. A target 10 m away on the release's level at 45 degrees takes `v² = 10 g`,
 *    split evenly between the horizontal and the vertical, and the path is
 *    there after `10 / vx` seconds.
 * 3. A target straight above, or above the line the angle rises along, has no
 *    path.
 */
function scenario_test_motions_throwing_throw_object_launch(): void {
  TestValidator.equals(
    "empty hands",
    throwObjectLaunch.held(undefined, "right", 0.6),
    [],
  );
  TestValidator.equals(
    "the grip",
    throwObjectLaunch.held("ball", "right", 0.6),
    [
      {
        part: "rightHand",
        kind: "grip",
        from: 0,
        to: 0.6,
        support: { kind: "prop", subject: "ball" },
      },
    ],
  );
  const velocity: IAutoMovieVector3 | undefined = throwObjectLaunch.aimed(
    RELEASE,
    { x: 10, y: 0, z: 0 },
    45,
  );
  const speed: number = Math.sqrt(10 * AutoMovieEngineGravity.STANDARD);
  TestValidator.predicate(
    "the range equation",
    velocity !== undefined &&
      vclose(
        velocity,
        { x: speed * Math.SQRT1_2, y: speed * Math.SQRT1_2, z: 0 },
        1e-9,
      ),
  );
  const launch: IAutoMovieMotionHumanThrowObjectLaunch.ILaunch = {
    point: RELEASE,
    velocity: velocity!,
    seconds: 1,
    target: { x: 10, y: 0, z: 0 },
  };
  TestValidator.predicate(
    "the path reaches the target",
    vclose(
      throwObjectLaunch.path(launch, 10 / launch.velocity.x),
      launch.target,
      1e-9,
    ),
  );
  TestValidator.equals(
    "the launch",
    throwObjectLaunch.launches("ball", undefined, launch),
    [{ prop: "ball", seconds: 1, point: RELEASE, velocity: launch.velocity }],
  );
  TestValidator.predicate(
    "no path",
    throwObjectLaunch.launches(undefined, undefined, launch).length === 0 &&
      throwObjectLaunch.aimed(RELEASE, { x: 0, y: 5, z: 0 }, 45) ===
        undefined &&
      throwObjectLaunch.aimed(RELEASE, { x: 1, y: 2, z: 0 }, 45) === undefined,
  );
}

/** The thrown object's own logic: its curve and its launch, each scenario below. */
export function test_motions_throwing_throw_object(): void {
  scenario_test_motions_throwing_throw_object_curve();
  scenario_test_motions_throwing_throw_object_launch();
}
