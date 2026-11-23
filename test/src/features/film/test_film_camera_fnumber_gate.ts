import { performShot, stageScene } from "@automovie/engine";
import type {
  IAutoMovieActionCall,
  IAutoMovieConstraintViolation,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";

/**
 * A frame action's lens stop is admitted like its focal length and rides to
 * `shot.cameraIntent` exactly when authored.
 *
 * Scenarios:
 *
 * 1. A frame with `focus: knightB` and `fNumber: 2` performs and its intent
 *    carries `fNumber: 2`.
 * 2. The same frame without `fNumber` performs and its intent has no `fNumber`
 *    member.
 * 3. `fNumber: 0` and `fNumber: NaN` are each refused with a `range` violation at
 *    `.fNumber`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the real staging and performance assembly and reads the emitted intent and the violations; a gate that let a zero or NaN stop through, or a compiler that dropped or invented the member, fails.
 * @evidence contracts/development/testing.md#independent-expectations The issue states the gate mirrors the focal length's: finite and above zero, a `range` violation at the field; presence follows the issue's "present exactly when the action authored it".
 * @evidence contracts/development/testing.md#distinguishing-cases A valid stop, an omitted stop, the zero boundary and a non-finite value. Focus resolution belongs to test_film_camera_lens_resolve.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test over the film fixtures, discovered by its export name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with their inputs and expected outcomes.
 */
export function test_film_camera_fnumber_gate(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging fixture must succeed");
  const perform: (
    over: Partial<Extract<IAutoMovieActionCall, { verb: "frame" }>>,
  ) => ReturnType<typeof performShot> = (
    over: Partial<Extract<IAutoMovieActionCall, { verb: "frame" }>>,
  ): ReturnType<typeof performShot> => {
    const base: ReturnType<typeof makePerformanceWrite> =
      makePerformanceWrite();
    return performShot({
      script: makeScriptWrite(),
      staged,
      performance: {
        ...base,
        draft: [
          ...base.draft.slice(0, 2),
          {
            verb: "frame",
            actor: "cam-main",
            start: 0,
            duration: "auto",
            framing: "medium",
            move: "static",
            on: { kind: "node", node: "knightA" },
            focus: { kind: "node", node: "knightB" },
            ...over,
          },
        ],
      },
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    });
  };

  const stopped: ReturnType<typeof performShot> = perform({ fNumber: 2 });
  const open: ReturnType<typeof performShot> = perform({});
  TestValidator.equals(
    "the stop rides to the intent exactly when authored",
    [
      stopped.success === true ? stopped.shot.cameraIntent?.[0]?.fNumber : -1,
      open.success === true
        ? "fNumber" in (open.shot.cameraIntent?.[0] ?? { fNumber: 0 })
        : true,
    ],
    [2, false],
  );

  const refused: (value: number) => boolean = (value: number): boolean => {
    const result: ReturnType<typeof performShot> = perform({ fNumber: value });
    return (
      result.success === false &&
      result.violations.some(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.kind === "range" && violation.path.endsWith(".fNumber"),
      )
    );
  };
  TestValidator.equals(
    "a zero and a non-finite stop are range violations",
    [refused(0), refused(Number.NaN)],
    [true, true],
  );
}
