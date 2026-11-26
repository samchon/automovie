import { plantStanceFeet, validateFootSkate, validateGroundContact, AutoMovieEngineMotionTrajectory, AutoMovieEngineSpace } from "@automovie/engine";
import {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieSpace,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  nclose,
  validationHasNoWarnings,
  validationHasWarnings,
} from "../internal/predicates";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
const v: (x: number, z: number, y?: number) => IAutoMovieVector3 = (
  x: number,
  z: number,
  y: number = 0,
): IAutoMovieVector3 => ({ x, y, z });

/** A ramp rising 0 → 0.4 over x=0..2, wide enough for the whole path. */
const space: IAutoMovieSpace = {
  id: "set",
  surfaces: [
    {
      id: "ramp",
      kind: "ramp",
      polygon: [v(-1, -2), v(3, -2), v(3, 2), v(-1, 2)],
      anchor: { x: 0, y: 0, z: 0 },
      rampTo: { x: 2, y: 0.4, z: 0 },
    },
  ],
  walkable: ["ramp"],
};

// The bent-rest leg of the plant-feet suites: foot on the ground with reach
// slack, so the pin can hold while the root climbs the ramp. Its rest geometry
// is 41.1 degrees of clinical knee flexion rather than clinical zero.
const legSkeleton: IAutoMovieSkeleton = {
  id: "leg",
  bones: [
    { bone: "hips", parent: null, rest: t(0, 0.8, 0), constraint: null },
    {
      bone: "leftUpperLeg",
      parent: "hips",
      rest: t(0.1, 0, 0),
      constraint: null,
    },
    {
      bone: "leftLowerLeg",
      parent: "leftUpperLeg",
      rest: t(0, -0.4, 0.15),
      constraint: null,
    },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: t(0, -0.4, -0.15),
      constraint: null,
    },
  ],
};
const KNEE_REST_FLEXION: number = (2 * Math.atan2(0.15, 0.4) * 180) / Math.PI;
const REST_FRAMES: Parameters<typeof plantStanceFeet>[0]["restFrames"] = {
  leftLowerLeg: {
    flexion: { sign: 1 as const, neutral: KNEE_REST_FLEXION },
  },
};

const kf: (time: number) => IAutoMovieKeyframe = (
  time: number,
): IAutoMovieKeyframe => ({
  time,
  pose: { skeleton: "leg", root: null, joints: [] },
  expression: null,
  easing: "linear",
  bezier: null,
});
const gait: IAutoMovieMotion = {
  id: "stand",
  skeleton: "leg",
  duration: 1,
  loop: true,
  keyframes: [kf(0), kf(0.5), kf(1)],
};

/**
 * A bent leg plants against the same ramp as the path it follows.
 * Scenarios:
 * - The unplanted path skates; the planted stance holds and clears the same height plane.
 * - A heightfield and two explicit ramp anchors describe the same rise.
 * @evidence contracts/development/testing.md#behavioral-verification Checks raw and corrected motion with the public skate and penetration validators.
 * @evidence contracts/development/testing.md#independent-expectations Half the travelled distance times the physical slope is the midpoint elevation.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses both ground representations without duplicating skeletons or actions.
 * @evidence contracts/development/testing.md#execution-ownership Uses one synthetic leg with its analytical rest flexion.
 * @evidence contracts/development/common.md#meaningful-documentation States the ground and contact expectations in metres.
 */
export function test_motion_ground_stance_projection(): void {
  const relief: IAutoMovieSpace = {
    ...space,
    surfaces: space.surfaces.map((s) => ({
      ...s,
      height: {
        kind: "heightfield",
        originX: -1,
        originZ: -2,
        spacingX: 4,
        spacingZ: 4,
        columns: 2,
        rows: 2,
        samples: [-0.2, 0.6, -0.2, 0.6],
      },
    })),
  };
  for (const ground of [AutoMovieEngineSpace.spaceGround(space), AutoMovieEngineSpace.spaceGround(relief)]) {
    const path = AutoMovieEngineMotionTrajectory.followPathMotion({
      id: "climb",
      gait,
      waypoints: [v(0, 0), v(0.15, 0)],
      speed: 0.15,
      ground,
    });
    TestValidator.predicate(
      "slope height at half distance",
      nclose(
        path.frames.find((f) => nclose(f.time, 0.5))!.position.y,
        (0.2 * 0.15) / 2,
      ),
    );
    const planted = plantStanceFeet({
      skeleton: legSkeleton,
      motion: path.motion,
      groundY: ground,
      tolerance: 0.05,
      legs: [
        { foot: "leftFoot", upper: "leftUpperLeg", lower: "leftLowerLeg" },
      ],
      restFrames: REST_FRAMES,
    });
    const skate = (motion: IAutoMovieMotion) =>
      validateFootSkate({
        motion,
        skeleton: legSkeleton,
        contacts: [{ bone: "leftFoot", start: 0, end: 1 }],
        restFrames: REST_FRAMES,
      });
    TestValidator.predicate(
      "raw root travel skates",
      validationHasWarnings("raw ground skate", skate(path.motion)),
    );
    TestValidator.predicate(
      "planted foot holds",
      validationHasNoWarnings("planted ground skate", skate(planted.motion)),
    );
    TestValidator.predicate(
      "planted foot clears measured ground",
      validationHasNoWarnings(
        "planted ground contact",
        validateGroundContact({
          motion: planted.motion,
          skeleton: legSkeleton,
          footBones: ["leftFoot"],
          groundY: ground,
          tolerance: 1e-3,
          restFrames: REST_FRAMES,
        }),
      ),
    );
  }
}
