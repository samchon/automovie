import { type IAutoMovieStagedSet, stageScene } from "@automovie/engine";
import type {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieNodeTarget,
  IAutoMoviePointTarget,
  IAutoMovieStage,
  IAutoMovieStageCamera,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { nclose } from "../internal/nclose";
import { hasViolation } from "../internal/predicates";

/**
 * Authored clip and precision values are validated and lowered without defaults.
 *
 * Scenarios:
 *
 * 1. Valid near/far and precision operands reach the camera unchanged through a distinct precision record.
 * 2. Non-finite, zero and equal clip operands report the authored camera path.
 * 3. Null precision, malformed or unsupported bit counts, and nonnumeric, infinite or zero metre thresholds report their own field paths.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages authored clip/precision operands and observes exact values with an independent copied precision record, then requires addressed invalid clip, bit-count and step-threshold failures.
 * @evidence contracts/testing.md#independent-expectations Literal near/far values, positive safe depth-code capability and a finite positive metre step define admission expectations; this test checks staging operands rather than measuring a hardware depth buffer.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the accepted copy case and all twelve original NaN/zero/infinite/equal clip, null precision, nonnumeric/fractional/zero/overflow bit count and invalid step inputs.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_stage_scene_camera_depth_precision and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_stage_scene_camera_depth_precision(): void {
  const base: IAutoMovieStage = makeStagingWrite();
  const authored: {
    near: number;
    far: number;
    depthPrecision: { minimumDepthBits: number; maximumStepMeters: number };
    node: string;
    position: IAutoMovieVector3;
    lookAt: IAutoMovieNodeTarget | IAutoMoviePointTarget;
    fovDeg: number;
    clearance?: IAutoMovieCameraClearanceEnvelope;
  } = {
    ...base.cameras[0]!,
    near: 0.25,
    far: 250,
    depthPrecision: { minimumDepthBits: 16, maximumStepMeters: 0.5 },
  };
  const accepted: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({ cameras: [authored] }),
  );
  TestValidator.predicate(
    "accepted values reach the resolved camera without aliasing",
    accepted.success &&
      nclose(accepted.scene.cameras[0]!.near, 0.25, 0) &&
      nclose(accepted.scene.cameras[0]!.far, 250, 0) &&
      accepted.scene.cameras[0]!.depthPrecision.minimumDepthBits === 16 &&
      nclose(
        accepted.scene.cameras[0]!.depthPrecision.maximumStepMeters,
        0.5,
        0,
      ) &&
      accepted.scene.cameras[0]!.depthPrecision !== authored.depthPrecision,
  );

  /** Apply one malformed operand patch without admitting it in the fixture, retaining an independently aimed valid base camera. */
  const camera: (index: number, value: unknown) => IAutoMovieStageCamera = (
    index: number,
    value: unknown,
  ): IAutoMovieStageCamera =>
    ({
      ...base.cameras[0]!,
      node: `invalid-${index}`,
      lookAt: { kind: "point", point: { x: 0, y: 1, z: 0 } },
      ...(value as object),
    }) as IAutoMovieStageCamera;
  const rejected: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      cameras: [
        camera(0, { near: Number.NaN }),
        camera(1, { near: 0 }),
        camera(2, { far: Number.POSITIVE_INFINITY }),
        camera(3, { near: 2, far: 2 }),
        camera(4, { depthPrecision: null }),
        camera(5, {
          depthPrecision: { minimumDepthBits: "24", maximumStepMeters: 1 },
        }),
        camera(6, {
          depthPrecision: { minimumDepthBits: 1.5, maximumStepMeters: 1 },
        }),
        camera(7, {
          depthPrecision: { minimumDepthBits: 0, maximumStepMeters: 1 },
        }),
        camera(8, {
          depthPrecision: { minimumDepthBits: 54, maximumStepMeters: 1 },
        }),
        camera(9, {
          depthPrecision: {
            minimumDepthBits: 24,
            maximumStepMeters: "small",
          },
        }),
        camera(10, {
          depthPrecision: {
            minimumDepthBits: 24,
            maximumStepMeters: Number.POSITIVE_INFINITY,
          },
        }),
        camera(11, {
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0 },
        }),
      ],
    }),
  );
  TestValidator.predicate(
    "invalid clip, capability, and threshold operands are addressed",
    rejected.success === false &&
      hasViolation(rejected, "range", "$input.cameras[0].near") &&
      hasViolation(rejected, "range", "$input.cameras[1].near") &&
      hasViolation(rejected, "range", "$input.cameras[2].far") &&
      hasViolation(rejected, "range", "$input.cameras[3].far") &&
      hasViolation(rejected, "type", "$input.cameras[4].depthPrecision") &&
      [5, 6, 7, 8].every((index: number): boolean =>
        hasViolation(
          rejected,
          "range",
          `$input.cameras[${index}].depthPrecision.minimumDepthBits`,
        ),
      ) &&
      [9, 10, 11].every((index: number): boolean =>
        hasViolation(
          rejected,
          "range",
          `$input.cameras[${index}].depthPrecision.maximumStepMeters`,
        ),
      ),
  );
}
