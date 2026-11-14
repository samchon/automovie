import {
  AutoMovieMotionHumanTarget,
  AutoMovieMotionHumanTargetGrid,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The names of the place a world point falls in, the inverse of a named
 * place.
 *
 * The body is a stub 1.7 m tall with an upper arm of 0.3 m, a forearm of 0.25
 * m, a half shoulder width of 0.2 m and landmark heights of 0.5 m (knee, the
 * hip's 0.9 m less a thigh of 0.4 m), 0.9, 1.05, 1.25, 1.4, 1.48 and 1.6 m.
 *
 * Scenarios:
 * 1. For each of the 10 heights, 4 laterals and 4 distances, the point of
 *    the named place reads back as the same three names, for both hands, at
 *    a heading of 0° and of 90°, from a rig origin at (1, 0, 2).
 * 2. The root's own height is not read: a root lowered by 0.4 m in a crouch
 *    reads the same names.
 * 3. A point 1.3 m high, 0.05 m nearer the chest (1.25 m) than the shoulder
 *    (1.4 m), 0.19 m to the left and 0.4 m ahead at heading 0 reads chest,
 *    shoulder (0.2 m against 0.12 m for inside) and far (0.44 m against 0.33
 *    m for mid) for the left hand; for the right hand its lateral, on the
 *    other side of the midline, reads centre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads the three names; an axis read in the wrong frame, a lateral that does not mirror, or a root height that leaks in fails.
 * @evidence contracts/development/testing.md#independent-expectations Scenario 3's names are the nearest of the stated landmark lengths worked out by hand; scenario 1 states a law of two public functions, that one inverts the other.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all 160 name combinations on both sides and two headings, a second root height, and an off-grid point whose lateral differs by side.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub of the measures read. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub and lists the 3 scenarios with their numbers.
 */
export function test_motion_compose_nearest(): void {
  const body: IHumanBody = {
    measure: {
      stature: 1.7,
      upperArm: 0.3,
      forearm: 0.25,
      shoulderHalfWidth: 0.2,
      shoulderHeight: 1.4,
      eyeHeight: 1.6,
      hipHeight: 0.9,
      thigh: 0.4,
      waistHeight: 1.05,
      chestHeight: 1.25,
      neckHeight: 1.48,
    },
  } as unknown as IHumanBody;
  const laterals: AutoMovieMotionHumanTargetGrid.Lateral[] = [
    "centre",
    "inside",
    "shoulder",
    "outside",
  ];
  const distances: AutoMovieMotionHumanTargetGrid.Distance[] = [
    "close",
    "near",
    "mid",
    "far",
  ];

  const missed: string[] = [];
  for (const rootY of [0, -0.4])
    for (const yaw of [0, 90])
      for (const side of ["left", "right"] as const)
        for (const height of AutoMovieMotionHumanTargetGrid.HEIGHTS)
          for (const lateral of laterals)
            for (const distance of distances) {
              const posture = { root: { x: 1, y: rootY, z: 2 }, yaw };
              const found = AutoMovieMotionHumanTargetGrid.nearest(
                body,
                posture,
                side,
                AutoMovieMotionHumanTarget.fallback(
                  body,
                  posture,
                  AutoMovieMotionHumanTargetGrid.place(body, side, {
                    height,
                    lateral,
                    distance,
                  }),
                ).point,
              );
              if (
                found.height !== height ||
                found.lateral !== lateral ||
                found.distance !== distance
              )
                missed.push(
                  `${rootY} ${yaw} ${side} ${height} ${lateral} ${distance}`,
                );
            }
  TestValidator.equals("every named place reads back", missed, []);

  const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const point = { x: 0.19, y: 1.3, z: 0.4 };
  TestValidator.equals(
    "an off-grid point for the left hand",
    AutoMovieMotionHumanTargetGrid.nearest(body, posture, "left", point),
    { height: "chest", lateral: "shoulder", distance: "far" },
  );
  TestValidator.equals(
    "the same point for the right hand",
    AutoMovieMotionHumanTargetGrid.nearest(body, posture, "right", point),
    { height: "chest", lateral: "centre", distance: "far" },
  );
}
