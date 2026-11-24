import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanThrowObjectLaunch,
  IAutoMovieVector3,
} from "@automovie/interface";
import { throwObjectLaunch } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

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
export function test_unit_motions_throwing_throw_object_launch(): void {
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
  const speed: number = Math.sqrt(10 * AutoMovieGravity.STANDARD);
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
