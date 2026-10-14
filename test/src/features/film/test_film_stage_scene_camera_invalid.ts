import { type IAutoMovieStagedSet, stageScene } from "@automovie/engine";
import type { IAutoMovieStage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

/**
 * Pins finite camera operands, the exclusive field-of-view bounds and refusal of absent or coincident staged targets. A node target must resolve a staged placement; the sibling target entry owns accepted actor, set-piece and camera targets.
 *
 * Scenarios:
 *
 * 1. `fovDeg = 180` (the exclusive boundary itself) → a `range` violation on
 * `$input.cameras[0].fovDeg`.
 * 2. A second camera looks at the unplaced node `nobody` → a `type` violation on
 * `$input.cameras[1].lookAt.node`.
 * 3. A third camera looks at its own position, yielding `range` on
 * `$input.cameras[2].lookAt`.
 * 4. A fourth camera declares a non-finite position, yielding `range` on
 * `$input.cameras[3].position`.
 * 5. A fifth camera declares a non-finite point target, yielding `range` on
 * `$input.cameras[4].lookAt.point`.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages five independently faulty cameras and requires located FOV, missing target, zero look vector and non-finite position/point refusals.
 * @evidence contracts/testing.md#independent-expectations The exclusive 180-degree bound, authored absent id, equal lens/target and literal Infinity determine expected paths independently of the staging diagnostic output.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all five simultaneous malformed camera inputs; accepted point/actor/set/camera targets and copied precision/clearance operands have separate owning entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_stage_scene_camera_invalid and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_stage_scene_camera_invalid(): void {
  const base: IAutoMovieStage = makeStagingWrite();
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite({
      cameras: [
        { ...base.cameras[0]!, fovDeg: 180 },
        {
          node: "cam-lost",
          position: { x: 0, y: 1, z: -2 },
          lookAt: { kind: "node", node: "nobody" },
          fovDeg: 50,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
        {
          node: "cam-zero",
          position: { x: 1, y: 2, z: 3 },
          lookAt: { kind: "point", point: { x: 1, y: 2, z: 3 } },
          fovDeg: 50,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
        {
          node: "cam-infinite",
          position: { x: Number.POSITIVE_INFINITY, y: 1, z: -2 },
          lookAt: { kind: "point", point: { x: 0, y: 1, z: 0 } },
          fovDeg: 50,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
        {
          node: "cam-skew",
          position: { x: 0, y: 1, z: -2 },
          lookAt: {
            kind: "point",
            point: { x: 0, y: Number.POSITIVE_INFINITY, z: 0 },
          },
          fovDeg: 50,
          near: 0.1,
          far: 1000,
          depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
        },
      ],
    }),
  );
  TestValidator.equals("fails", staged.success, false);
  TestValidator.equals(
    "fov boundary rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "range", "$input.cameras[0].fovDeg"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "dangling look-at rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "type", "$input.cameras[1].lookAt.node"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "zero look vector rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "range", "$input.cameras[2].lookAt"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "non-finite position rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "range", "$input.cameras[3].position"),
      ],
    ]),
    { refused: true, violated: true },
  );
  TestValidator.equals(
    "non-finite point target rejected",
    namedFacts([
      ["refused", (): boolean => staged.success === false],
      [
        "violated",
        (): boolean =>
          staged.success === false &&
          hasViolation(staged, "range", "$input.cameras[4].lookAt.point"),
      ],
    ]),
    { refused: true, violated: true },
  );
}
