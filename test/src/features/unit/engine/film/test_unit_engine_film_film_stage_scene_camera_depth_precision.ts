import { stageScene } from "@automovie/engine";
import type {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieNodeTarget,
  IAutoMoviePointTarget,
  IAutoMovieStage,
  IAutoMovieStageCamera,
  IAutoMovieStagedSet,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../../../internal/filmFixtures";
import { nclose } from "../../../internal/nclose";
import { hasViolation } from "../../../internal/predicates";

/**
 * Authored clip and precision values are validated and lowered without defaults.
 *
 * Scenarios:
 *
 * 1. Valid near/far and precision operands reach the camera unchanged through a distinct precision record.
 * 2. A zero near plane, equal clip planes, unsupported bit counts and a zero metre threshold report their own field paths.
 */
export function test_unit_engine_film_film_stage_scene_camera_depth_precision(): void {
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

  /** Apply one out-of-range operand patch to an independently aimed valid base camera. */
  const camera: (
    index: number,
    value: Partial<IAutoMovieStageCamera>,
  ) => IAutoMovieStageCamera = (
    index: number,
    value: Partial<IAutoMovieStageCamera>,
  ): IAutoMovieStageCamera => ({
    ...base.cameras[0]!,
    node: `invalid-${index}`,
    lookAt: { kind: "point", point: { x: 0, y: 1, z: 0 } },
    ...value,
  });
  const rejected: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      cameras: [
        camera(0, { near: 0 }),
        camera(1, { near: 2, far: 2 }),
        camera(2, {
          depthPrecision: { minimumDepthBits: 0, maximumStepMeters: 1 },
        }),
        camera(3, {
          depthPrecision: { minimumDepthBits: 54, maximumStepMeters: 1 },
        }),
        camera(4, {
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 0 },
        }),
      ],
    }),
  );
  TestValidator.predicate(
    "invalid clip, capability, and threshold operands are addressed",
    rejected.success === false &&
      hasViolation(rejected, "range", "$input.cameras[0].near") &&
      hasViolation(rejected, "range", "$input.cameras[1].far") &&
      [2, 3].every((index: number): boolean =>
        hasViolation(
          rejected,
          "range",
          `$input.cameras[${index}].depthPrecision.minimumDepthBits`,
        ),
      ) &&
      hasViolation(
        rejected,
        "range",
        "$input.cameras[4].depthPrecision.maximumStepMeters",
      ),
  );
}
