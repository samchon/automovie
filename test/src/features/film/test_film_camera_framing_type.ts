import { compileCameraMove } from "@automovie/engine";
import { IAutoMovieCamera, IAutoMovieCameraAction } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

const CAMERA: IAutoMovieCamera = {
  id: "cam",
  transform: {
    translation: { x: 0, y: 1, z: 4 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  fovY: 90,
  near: 0.1,
  far: 1000,
  depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
};

const frame: (framing: IAutoMovieCameraAction["framing"]) => IAutoMovieCameraAction = (
  framing: IAutoMovieCameraAction["framing"],
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam",
  start: 0,
  duration: "auto",
  framing,
  move: "static",
  on: { kind: "point", point: { x: 0, y: 0, z: 0 } },
});

const SUBJECT: Parameters<typeof compileCameraMove>[0]["entries"][number]["subject"] = { base: { x: 0, y: 0, z: 0 }, height: 2, at: null };

/**
 * Camera framing names index the deterministic height and aim lookup tables.
 * Unknown names must fail before `undefined` fractions can turn into NaN camera
 * keys.
 *
 * Scenarios:
 *
 * 1. The forged macro framing refuses with an Error naming the unknown framing and authored token.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compileCameraMove with macro outside the supported framing union and requires its named unknown-framing Error, catching lookup of an undefined aim fraction followed by malformed camera keys.
 * @evidence contracts/testing.md#independent-expectations Macro is outside the interface's wide/full/medium/close vocabulary; the literal error fragments identify framing admission rather than another camera failure, without deriving an expected clip from compiler output.
 * @evidence contracts/testing.md#distinguishing-cases Owns a forged framing beside supported static motion and valid lens/subject data; forged moves and supported camera paths have separate tests. Untyped property-coercion failures are outside this string case.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_camera_framing_type entry owns one direct numeric compiler refusal and observes its Error through throwsError without a viewer, GPU, native artifact or installed consumer.
 */
export function test_film_camera_framing_type(): void {
  TestValidator.predicate(
    "unknown camera framing rejects",
    throwsError(
      (): ReturnType<typeof compileCameraMove> =>
        compileCameraMove({
          clipId: "clip",
          camera: CAMERA,
          entries: [{ action: frame("macro" as never), subject: SUBJECT }],
          shotDuration: 2,
        }),
      ["unknown camera framing", "macro"],
    ),
  );
}
