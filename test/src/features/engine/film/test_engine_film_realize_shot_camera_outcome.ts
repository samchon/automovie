import {
  realizeShotCameraOutcome
} from "../../../../../packages/engine/src/film/internal/realizeShotCameraOutcome";
import type {
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieShotContractSubjectReader,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Integer clip positions at the midpoint and identity projection give exact binary64 depths. */
const EXACT_PLACEMENT_TOLERANCE: number = 0;

/** The staged camera: at (0, 0, 10) looking down -Z, a 50° vertical field. */
const CAMERA: IAutoMovieCamera = {
  id: "cam",
  transform: {
    translation: { x: 0, y: 0, z: 10 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  fovY: 50,
  near: 0.1,
  far: 100,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
};

/**
 * `realizeShotCameraOutcome`, the camera grade of `realizeShotContract`: at one
 * shot second, how many required subjects resolve to a placement, how many of
 * their world boxes the live camera's frustum holds, the depth precision over
 * the depths those boxes span, and, when the camera moves, the placement it
 * measured.
 *
 * Subjects: `crate`, a box x, y ±0.5, z ±2 at the origin; `canopy`, the same
 * footprint lifted to 8–12 m, out of a level camera's ±tan 25° × 10 ≈ ±4.7 m;
 * `ghost`, which resolves to no placement.
 *
 * Scenarios:
 *
 * 1. The locked-off camera holds `crate`, whose corners lie 8 to 12 m deep, and
 *    passes with no placement recorded.
 * 2. A move to z = 20 over 2 s puts the camera at z = 15 at 1 s: the recorded
 *    placement is that position, and the crate now lies 13 to 17 m deep.
 * 3. `canopy` resolves but is not held: 1 resolved, 0 readable, failed.
 * 4. `ghost` resolves to nothing: 0 resolved, failed.
 * 5. A missing camera, or no raster, fails with no subject resolved.
 * 6. The box also fails when its far side clips or the depth grid is too coarse,
 *    though some of the box remains within the frustum in either case.
 * 7. A boxing failure between two readable subjects leaves their combined
 *    depth range intact and counts its resolved placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify live versus locked camera geometry, required-subject placement, frustum and depth outcomes and the remaining combined range after a box failure.
 * @evidence contracts/development/testing.md#behavioral-verification The test evaluates the shot camera outcome at prepared instants, then compares measured placement, counts and addressed failed conditions across models, depth windows and absent inputs.
 * @evidence contracts/development/testing.md#independent-expectations The crate's two-metre depth radius spans eight through twelve metres from the staged camera and thirteen through seventeen when the camera reaches z = 15. The canopy's authored height is outside the level view and the ghost has no placement. The supplied clip and bit limits independently refuse inadequate depth.
 */
export function test_engine_film_realize_shot_camera_outcome(): void {
  const box = (lift: number): IAutoMovieSubjectBox => ({
    min: { x: -0.5, y: -0.5 + lift, z: -2 },
    max: { x: 0.5, y: 0.5 + lift, z: 2 },
  });
  const reader: Pick<
    IAutoMovieShotContractSubjectReader,
    "placementAt" | "subjectBox"
  > = {
    placementAt: (subject: string): IAutoMovieTransform => {
      if (subject === "ghost") throw new Error("ghost is not staged");
      return CAMERA.transform;
    },
    subjectBox: (subject: string): IAutoMovieSubjectBox => {
      if (subject === "unboxed") throw new Error("the subject has no box");
      const bounds: IAutoMovieSubjectBox = box(subject === "canopy" ? 10 : 0);
      if (subject === "near")
        return {
          min: { ...bounds.min, z: 3 },
          max: { ...bounds.max, z: 4 },
        };
      if (subject === "far")
        return {
          min: { ...bounds.min, z: -3 },
          max: { ...bounds.max, z: -2 },
        };
      return bounds;
    },
  };
  const move: IAutoMovieClip = {
    id: "move",
    name: null,
    duration: 2,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node: "cam", path: "translation" },
        times: [0, 2],
        values: [0, 0, 10, 0, 0, 20],
        interpolation: "linear",
      },
    ],
  };
  const grade = (
    subjects: string[],
    input: Partial<realizeShotCameraOutcome.IInput> = {},
    time: number = 1,
  ): realizeShotCameraOutcome.IOutcome =>
    realizeShotCameraOutcome(
      {
        requiredSubjects: subjects,
        cameras: [CAMERA],
        camera: "cam",
        cameraMotion: null,
        frameFormat: { width: 1920, height: 1080 },
        ...input,
      },
      reader,
      time,
    );

  const still: realizeShotCameraOutcome.IOutcome = grade(["crate"]);
  TestValidator.predicate(
    "a locked-off camera holds the crate 8 to 12 m deep",
    still.passed &&
      still.placement === undefined &&
      still.resolvedSubjects === 1 &&
      still.readableSubjects === 1 &&
      nclose(still.depthPrecision.requiredNear ?? Number.NaN, 8, EXACT_PLACEMENT_TOLERANCE) &&
      nclose(still.depthPrecision.requiredFar ?? Number.NaN, 12, EXACT_PLACEMENT_TOLERANCE),
  );

  const moving: realizeShotCameraOutcome.IOutcome = grade(["crate"], {
    cameraMotion: move,
  });
  TestValidator.predicate(
    "a moving camera records where it measured from",
    moving.passed &&
      moving.placement !== undefined &&
      vclose(moving.placement.position, { x: 0, y: 0, z: 15 }, EXACT_PLACEMENT_TOLERANCE) &&
      qclose(moving.placement.rotation, CAMERA.transform.rotation, EXACT_PLACEMENT_TOLERANCE) &&
      nclose(moving.depthPrecision.requiredNear ?? Number.NaN, 13, EXACT_PLACEMENT_TOLERANCE) &&
      nclose(moving.depthPrecision.requiredFar ?? Number.NaN, 17, EXACT_PLACEMENT_TOLERANCE),
  );

  TestValidator.equals(
    "unheld, unresolved and ungraded subjects fail",
    [
      grade(["canopy"]),
      grade(["ghost"]),
      grade(["crate"], { camera: "missing" }),
      grade(["crate"], { frameFormat: undefined }),
    ].map((outcome: realizeShotCameraOutcome.IOutcome) => [
      outcome.resolvedSubjects,
      outcome.readableSubjects,
      outcome.passed,
    ]),
    [
      [1, 0, false],
      [0, 0, false],
      [0, 0, false],
      [0, 0, false],
    ],
  );

  const clipped: realizeShotCameraOutcome.IOutcome = grade(["crate"], {
    cameras: [{ ...CAMERA, far: 10 }],
  });
  const coarse: realizeShotCameraOutcome.IOutcome = grade(["crate"], {
    cameras: [{
      ...CAMERA,
      depthPrecision: { minimumDepthBits: 8, maximumStepMeters: 0.01 },
    }],
  });
  TestValidator.equals(
    "each readable box still needs its full depth range and precision",
    [clipped, coarse].map((outcome: realizeShotCameraOutcome.IOutcome) => [
      outcome.readableSubjects,
      outcome.depthPrecision.status,
      outcome.passed,
    ]),
    [[1, "outside-clipping-range", false], [1, "insufficient-precision", false]],
  );
  const mixture: realizeShotCameraOutcome.IOutcome = grade([
    "near",
    "unboxed",
    "far",
  ]);
  TestValidator.predicate(
    "both boxed subjects contribute depth and the unboxed placement still counts",
    mixture.requiredSubjects === 3 &&
      mixture.resolvedSubjects === 3 &&
      mixture.readableSubjects === 2 &&
      mixture.passed === false &&
      nclose(mixture.depthPrecision.requiredNear ?? Number.NaN, 6, 0) &&
      nclose(mixture.depthPrecision.requiredFar ?? Number.NaN, 13, 0),
  );
}
