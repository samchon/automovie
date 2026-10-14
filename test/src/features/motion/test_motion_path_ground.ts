import { followPathMotion } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const BOB: number = 0.05;

const kf: (time: number) => IAutoMovieKeyframe = (
  time: number,
): IAutoMovieKeyframe => ({
  time,
  pose: {
    skeleton: "s",
    root: {
      translation: { x: 0, y: BOB, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    joints: [],
  },
  expression: null,
  easing: "linear",
  bezier: null,
});

/** A 1 s cycle whose root carries a constant vertical bob of 0.05. */
const gait: IAutoMovieMotion = {
  id: "bob",
  skeleton: "s",
  duration: 1,
  loop: true,
  keyframes: [kf(0), kf(1)],
};

/** Straight 4 m along +X, with garbage waypoint `y` that must be ignored. */
const RAMP: IAutoMovieVector3[] = [
  { x: 0, y: 7, z: 0 },
  { x: 4, y: 7, z: 0 },
];

const rootAt: (
  motion: IAutoMovieMotion,
  time: number,
) => IAutoMovieTransform = (
  motion: IAutoMovieMotion,
  time: number,
): IAutoMovieTransform =>
  motion.keyframes.find((k: IAutoMovieKeyframe): boolean =>
    nclose(k.time, time),
  )!.pose.root!;

/**
 * Observe ground-source height and carried gait bob separately: waypoint Y is ignored, the root adds its existing bob to the supplied ground, and the frame sidecar reports the bare path height.
 *
 * Scenarios (straight 4 m path, speed 1 → 4 cycles, waypoint y = 7 everywhere):
 *
 * 1. Callback slope y = 0.5·x: root y is bob + 0.5 at x=1 and bob + 1.5 at x=3,
 *    following the ramp, oblivious to the waypoint 7.
 * 2. The frame's path point carries the bare ground height (0.5 at x=1), the bob
 *    stays on the root only.
 * 3. Scalar plane 2: root y is bob + 2 all along.
 * 4. Default ground (omitted): root y is just the bob.
 * 5. Horizontal progress is unaffected by height: x=1 at t=1 in every case.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes the same XZ line against slope, scalar and default ground, then checks root height, bare sidecar height and unchanged horizontal progress, catching use of waypoint Y or double application of gait bob.
 * @evidence contracts/testing.md#independent-expectations The authored y=0.5*x slope, constant plane 2 and fixed 0.05-metre root bob determine literal heights independently of path baking. Four metres over four one-second cycles gives x=1 at t=1; existing absolute tolerances and sample lookup remain unchanged.
 * @evidence contracts/testing.md#distinguishing-cases Retains the callback slope at x=1/x=3, sidecar without bob, scalar plane, omitted flat ground and all three horizontal-progress twins despite waypoint y=7. Callback refusal, corners and contact correction have separate owning tests.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all three direct followPathMotion calls with in-memory fixture records and a pure slope callback. Private sample lookup registers no cases and no terrain host, process or renderer is started.
 */
export function test_motion_path_ground(): void {
  const slope: ReturnType<typeof followPathMotion> = followPathMotion({
    id: "walk-slope",
    gait,
    waypoints: RAMP,
    speed: 1,
    ground: (x: number): number => 0.5 * x,
  });
  TestValidator.predicate(
    "slope y at x=1",
    nclose(rootAt(slope.motion, 1).translation.y, BOB + 0.5),
  );
  TestValidator.predicate(
    "slope y at x=3",
    nclose(rootAt(slope.motion, 3).translation.y, BOB + 1.5),
  );
  TestValidator.predicate(
    "frame carries bare ground height",
    nclose(
      slope.frames.find(
        (f: ReturnType<typeof followPathMotion>["frames"][number]): boolean =>
          nclose(f.time, 1),
      )!.position.y,
      0.5,
    ),
  );

  const plane: ReturnType<typeof followPathMotion> = followPathMotion({
    id: "walk-plane",
    gait,
    waypoints: RAMP,
    speed: 1,
    ground: 2,
  });
  TestValidator.predicate(
    "scalar plane y",
    nclose(rootAt(plane.motion, 3).translation.y, BOB + 2),
  );

  const flat: ReturnType<typeof followPathMotion> = followPathMotion({
    id: "walk-flat",
    gait,
    waypoints: RAMP,
    speed: 1,
  });
  TestValidator.predicate(
    "default ground keeps only the bob",
    nclose(rootAt(flat.motion, 3).translation.y, BOB),
  );

  TestValidator.equals(
    "horizontal progress ignores height",
    namedFacts([
      [
        "ncloseRootAtSlope",
        (): boolean => nclose(rootAt(slope.motion, 1).translation.x, 1),
      ],
      [
        "ncloseRootAtPlane",
        (): boolean => nclose(rootAt(plane.motion, 1).translation.x, 1),
      ],
      [
        "ncloseRootAtFlat",
        (): boolean => nclose(rootAt(flat.motion, 1).translation.x, 1),
      ],
    ]),
    {
      ncloseRootAtSlope: true,
      ncloseRootAtPlane: true,
      ncloseRootAtFlat: true,
    },
  );
}
