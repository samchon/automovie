import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieMotionHumanBend, type IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Bend hints: an elbow's point beside the shoulder from a preset, and a
 * knee's point ahead of the knee along the foot's heading.
 *
 * The body is a stub with shoulders at (±0.2, 1.4, 0), knees at (±0.1, 0.5,
 * 0.02) and an upper arm of 0.3 m.
 *
 * Scenarios:
 * 1. With the root at (1, 0, 2) heading 90° (forward +X, left -Z), the left
 *    elbow's `hang` hint (0.4 out, 1 down, 0.5 behind in upper arms) is at
 *    (0.85, 1.1, 1.68), and the right one mirrors it at (0.85, 1.1, 2.32).
 * 2. `hang` is the default preset, and the `hang` function is that preset; an
 *    extra outward share of 0.5 moves the left hint 0.15 m farther left.
 * 3. Shares given in place of a preset are used as they are, and a preset
 *    other than `hang` gives another point.
 * 4. A posture pitched 90° forward at a heading of 0° carries the hint with
 *    the trunk: the left `hang` hint of a root at the origin goes from (0.32,
 *    1.1, -0.15) to (0.32, 0.15, 1.1).
 * 5. A knee's hint is 1 m ahead of the knee along the posture's heading; a
 *    foot heading of 90° puts it 1 m toward +X instead; a splay of 90° opens
 *    the left knee toward +X and the right knee toward -X.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads the world points; a hint mirrored to the wrong side, left unturned by the heading or the pitch, or a splay with one sign for both knees fails.
 * @evidence contracts/development/testing.md#independent-expectations Each point is worked out by hand from the stub's rest places and the stated shares, with the axes of the floor frame written in the scenario.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both sides, the default and another preset, raw shares, the extra outward share, a turned and a pitched posture, and a knee with a default heading, a foot heading and a splay on each side.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; the body is a stub of the two members the hints read (rest places and the upper arm), because a measured body is built by the capture cases, which judge the hints on real limbs. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub and lists the 5 scenarios with their numbers.
 */
export function test_motion_compose_bend(): void {
  const body: IHumanBody = {
    rest: new Map<string, IAutoMovieVector3>([
      ["leftUpperArm", { x: 0.2, y: 1.4, z: 0 }],
      ["rightUpperArm", { x: -0.2, y: 1.4, z: 0 }],
      ["leftLowerLeg", { x: 0.1, y: 0.5, z: 0.02 }],
      ["rightLowerLeg", { x: -0.1, y: 0.5, z: 0.02 }],
    ]),
    measure: { upperArm: 0.3 },
  } as unknown as IHumanBody;
  const at = (
    got: IAutoMovieVector3,
    x: number,
    y: number,
    z: number,
  ): boolean =>
    Math.abs(got.x - x) <= 1e-9 &&
    Math.abs(got.y - y) <= 1e-9 &&
    Math.abs(got.z - z) <= 1e-9;
  const turned = { root: { x: 1, y: 0, z: 2 }, yaw: 90 };
  const origin = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };

  TestValidator.predicate(
    "the hang hint follows the root and the heading on both sides",
    at(
      AutoMovieMotionHumanBend.arm(body, turned, "left", "hang"),
      0.85,
      1.1,
      1.68,
    ) &&
      at(
        AutoMovieMotionHumanBend.arm(body, turned, "right", "hang"),
        0.85,
        1.1,
        2.32,
      ),
  );
  TestValidator.predicate(
    "hang is the default and widens by a share",
    at(AutoMovieMotionHumanBend.arm(body, turned, "left"), 0.85, 1.1, 1.68) &&
      at(AutoMovieMotionHumanBend.hang(body, turned, "left"), 0.85, 1.1, 1.68) &&
      at(
        AutoMovieMotionHumanBend.hang(body, turned, "left", 0.5),
        0.85,
        1.1,
        1.53,
      ) &&
      at(
        AutoMovieMotionHumanBend.arm(body, turned, "left", "hang", 0.5),
        0.85,
        1.1,
        1.53,
      ),
  );
  TestValidator.predicate(
    "shares are used as given and presets differ",
    at(
      AutoMovieMotionHumanBend.arm(body, origin, "left", {
        out: 1,
        up: 1,
        forward: 1,
      }),
      0.5,
      1.7,
      0.3,
    ) &&
      !at(
        AutoMovieMotionHumanBend.arm(body, turned, "left", "raised"),
        0.85,
        1.1,
        1.68,
      ),
  );
  TestValidator.predicate(
    "a pitched posture carries the hint",
    at(AutoMovieMotionHumanBend.arm(body, origin, "left"), 0.32, 1.1, -0.15) &&
      at(
        AutoMovieMotionHumanBend.arm(body, { ...origin, pitch: 90 }, "left"),
        0.32,
        0.15,
        1.1,
      ),
  );
  TestValidator.predicate(
    "a knee bends along the foot's heading and opens by the splay",
    at(AutoMovieMotionHumanBend.knee(body, turned, "left"), 2.02, 0.5, 1.9) &&
      at(
        AutoMovieMotionHumanBend.knee(body, origin, "left", 90),
        1.1,
        0.5,
        0.02,
      ) &&
      at(
        AutoMovieMotionHumanBend.knee(body, origin, "left", 0, 90),
        1.1,
        0.5,
        0.02,
      ) &&
      at(
        AutoMovieMotionHumanBend.knee(body, origin, "right", 0, 90),
        -1.1,
        0.5,
        0.02,
      ),
  );
}
