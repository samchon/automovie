import type {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieCameraDepthPrecisionConstraint,
  IAutoMovieNodeTarget,
  IAutoMoviePointTarget,
  IAutoMovieStage,
  IAutoMovieStageCamera,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieStagedSet } from "../../../../packages/engine/src/film/IAutoMovieStagedSet";
import { stageScene } from "../../../../packages/engine/src/film/stageScene";
import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation, nclose, vclose } from "../internal/predicates";

/**
 * Camera staging admits metre-based clearance spheres before resolving any scene, and copies admitted envelopes instead of sharing mutable input state.
 *
 * Scenarios:
 *
 * 1. Body-only and parent-rig envelopes resolve with independent nested objects.
 * 2. Malformed envelopes, spheres and centres produce located type violations.
 * 3. Non-finite centre coordinates and non-positive or non-numeric radii produce
 * range violations; a missing parent-rig declaration is separately reported.
 *
 * @evidence contracts/testing.md#behavioral-verification Stages body-only and parent-rig clearance envelopes and observes value preservation with distinct nested objects, then checks located malformed sphere and parent-rig failures.
 * @evidence contracts/testing.md#independent-expectations Authored envelope objects supply expected values, while reference inequality independently checks ownership rather than visual clearance; literal malformed/finite/radius requirements supply refusal kinds and paths.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both positive shapes and all original null, missing, non-object, non-finite, nonnumeric, zero and negative radius/centre/parent-rig inputs.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_stage_scene_camera_clearance_envelope and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_stage_scene_camera_clearance_envelope(): void {
  const standard: IAutoMovieStage = makeStagingWrite();
  const sphere: {
    center: { x: number; y: number; z: number };
    radius: number;
  } = { center: { x: 0, y: 0.2, z: -0.1 }, radius: 0.25 };
  const envelopes: IAutoMovieCameraClearanceEnvelope[] = [
    { body: sphere, parentRig: null },
    {
      body: sphere,
      parentRig: { center: { x: 0, y: 0.5, z: 0 }, radius: 0.5 },
    },
  ];
  for (const clearance of envelopes) {
    const authored: {
      clearance: IAutoMovieCameraClearanceEnvelope;
      node: string;
      position: IAutoMovieVector3;
      lookAt: IAutoMovieNodeTarget | IAutoMoviePointTarget;
      fovDeg: number;
      near: number;
      far: number;
      depthPrecision: IAutoMovieCameraDepthPrecisionConstraint;
    } = { ...standard.cameras[0]!, clearance };
    const result: IAutoMovieStagedSet = stageScene(
      makeScriptWrite(),
      makeStagingWrite({ cameras: [authored] }),
    );
    TestValidator.equals("valid clearance stages", result.success, true);
    if (result.success === false) throw new Error("clearance must stage");
    const lowered: IAutoMovieCameraClearanceEnvelope =
      result.scene.cameras[0]!.clearance!;
    TestValidator.predicate(
      "clearance values preserved",
      vclose(lowered.body.center, clearance.body.center, 0) &&
        nclose(lowered.body.radius, clearance.body.radius, 0) &&
        (clearance.parentRig === null
          ? lowered.parentRig === null
          : lowered.parentRig !== null &&
            vclose(lowered.parentRig.center, clearance.parentRig.center, 0) &&
            nclose(lowered.parentRig.radius, clearance.parentRig.radius, 0)),
    );
    TestValidator.predicate(
      "body envelope and centre are copied",
      lowered !== clearance &&
        lowered.body !== clearance.body &&
        lowered.body.center !== clearance.body.center,
    );
    if (clearance.parentRig === null)
      TestValidator.equals(
        "no parent rig remains null",
        lowered.parentRig,
        null,
      );
    else
      TestValidator.predicate(
        "parent rig and centre are copied",
        lowered.parentRig !== null &&
          lowered.parentRig !== clearance.parentRig &&
          lowered.parentRig.center !== clearance.parentRig.center,
      );
  }

  const invalid: Array<[unknown, "type" | "range", string]> = [
    [null, "type", ""],
    [{ body: null, parentRig: null }, "type", ".body"],
    [
      { body: { ...sphere, center: null }, parentRig: null },
      "type",
      ".body.center",
    ],
    [
      {
        body: { ...sphere, center: { x: 0, y: Infinity, z: 0 } },
        parentRig: null,
      },
      "range",
      ".body.center",
    ],
    [
      { body: { ...sphere, center: { x: "0", y: 0, z: 0 } }, parentRig: null },
      "range",
      ".body.center",
    ],
    [
      { body: { ...sphere, radius: "large" }, parentRig: null },
      "range",
      ".body.radius",
    ],
    [
      { body: { ...sphere, radius: Infinity }, parentRig: null },
      "range",
      ".body.radius",
    ],
    [
      { body: { ...sphere, radius: 0 }, parentRig: null },
      "range",
      ".body.radius",
    ],
    [{ body: sphere }, "type", ".parentRig"],
    [{ body: sphere, parentRig: false }, "type", ".parentRig"],
    [
      { body: sphere, parentRig: { ...sphere, radius: -1 } },
      "range",
      ".parentRig.radius",
    ],
  ];
  for (const [clearance, kind, suffix] of invalid) {
    const camera: IAutoMovieStageCamera = {
      ...standard.cameras[0]!,
      clearance,
    } as IAutoMovieStageCamera;
    const result: IAutoMovieStagedSet = stageScene(
      makeScriptWrite(),
      makeStagingWrite({ cameras: [camera] }),
    );
    TestValidator.predicate(
      `malformed clearance reports ${suffix || "envelope"}`,
      result.success === false &&
        hasViolation(result, kind, `$input.cameras[0].clearance${suffix}`),
    );
  }
}
