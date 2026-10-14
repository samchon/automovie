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

const frame: (
  move: IAutoMovieCameraAction["move"],
) => IAutoMovieCameraAction = (
  move: IAutoMovieCameraAction["move"],
): IAutoMovieCameraAction => ({
  verb: "frame",
  actor: "cam",
  start: 0,
  duration: "auto",
  framing: "full",
  move,
  on: { kind: "point", point: { x: 0, y: 0, z: 0 } },
});

const SUBJECT: Parameters<
  typeof compileCameraMove
>[0]["entries"][number]["subject"] = {
  base: { x: 0, y: 0, z: 0 },
  height: 2,
  at: null,
};

/**
 * Camera frame actions are a runtime grammar boundary. Unknown move names must
 * fail before the builder emits a camera clip with no keys.
 *
 * Scenarios:
 *
 * 1. The forged crane move refuses with an Error naming the unknown move and authored token.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls compileCameraMove with an unsupported crane move and requires the named unknown-move Error, catching fallthrough that emits a camera clip without keys instead of refusing the action.
 * @evidence contracts/testing.md#independent-expectations Crane is outside the interface's closed camera-move vocabulary, while full framing and the literal camera/subject are valid; required message fragments identify the authored move rather than relying on a generated clip snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Owns one forged move with otherwise supported framing and lens data; unsupported framing has its own refusal test, and each admitted path is exercised by the camera grammar and path tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_camera_move_type entry owns its portable engine call and shared Error observer, with no installed consumer, native compilation, process or rendering host.
 */
export function test_film_camera_move_type(): void {
  TestValidator.predicate(
    "unknown camera move rejects",
    throwsError(
      (): ReturnType<typeof compileCameraMove> =>
        compileCameraMove({
          clipId: "clip",
          camera: CAMERA,
          entries: [{ action: frame("crane" as never), subject: SUBJECT }],
          shotDuration: 2,
        }),
      ["unknown camera frame move", "crane"],
    ),
  );
}
