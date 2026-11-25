import { realizeShotCameraOutcome } from "@automovie/engine/internal";
import type {
  IAutoMovieCamera,
  IAutoMovieClip,
  IAutoMovieShotContractSubjectReader,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
 */
export function test_unit_engine_film_realize_shot_camera_outcome(): void {
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
    subjectBox: (subject: string): IAutoMovieSubjectBox =>
      box(subject === "canopy" ? 10 : 0),
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
      nclose(still.depthPrecision.requiredNear ?? Number.NaN, 8, 1e-12) &&
      nclose(still.depthPrecision.requiredFar ?? Number.NaN, 12, 1e-12),
  );

  const moving: realizeShotCameraOutcome.IOutcome = grade(["crate"], {
    cameraMotion: move,
  });
  TestValidator.predicate(
    "a moving camera records where it measured from",
    moving.passed &&
      moving.placement !== undefined &&
      nclose(moving.placement.position.z, 15, 1e-12) &&
      nclose(moving.placement.position.x, 0, 1e-12) &&
      nclose(moving.depthPrecision.requiredNear ?? Number.NaN, 13, 1e-12) &&
      nclose(moving.depthPrecision.requiredFar ?? Number.NaN, 17, 1e-12),
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
}
