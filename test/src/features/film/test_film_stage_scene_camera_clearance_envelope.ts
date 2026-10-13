import { stageScene } from "@automovie/engine";
import type {
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieStageCamera,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeScriptWrite, makeStagingWrite } from "../internal/filmFixtures";
import { hasViolation } from "../internal/predicates";

/**
 * Camera staging admits metre-based clearance spheres before resolving any
 * scene, and copies admitted envelopes instead of sharing mutable input state.
 *
 * Scenarios:
 *
 * 1. Body-only and parent-rig envelopes resolve with independent nested objects.
 * 2. Malformed envelopes, spheres and centres produce located type violations.
 * 3. Non-finite centre coordinates and non-positive or non-numeric radii produce
 *    range violations; a missing parent-rig declaration is separately reported.
 */
export const test_film_stage_scene_camera_clearance_envelope = (): void => {
  const standard = makeStagingWrite();
  const sphere = { center: { x: 0, y: 0.2, z: -0.1 }, radius: 0.25 };
  const envelopes: IAutoMovieCameraClearanceEnvelope[] = [
    { body: sphere, parentRig: null },
    {
      body: sphere,
      parentRig: { center: { x: 0, y: 0.5, z: 0 }, radius: 0.5 },
    },
  ];
  for (const clearance of envelopes) {
    const authored = { ...standard.cameras[0]!, clearance };
    const result = stageScene(
      makeScriptWrite(),
      makeStagingWrite({ cameras: [authored] }),
    );
    TestValidator.equals("valid clearance stages", result.success, true);
    if (result.success === false) throw new Error("clearance must stage");
    const lowered = result.scene.cameras[0]!.clearance!;
    TestValidator.equals("clearance values preserved", lowered, clearance);
    TestValidator.predicate(
      "body envelope and centre are copied",
      lowered !== clearance &&
        lowered.body !== clearance.body &&
        lowered.body.center !== clearance.body.center,
    );
    if (clearance.parentRig === null)
      TestValidator.equals("no parent rig remains null", lowered.parentRig, null);
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
    [{ body: { ...sphere, center: null }, parentRig: null }, "type", ".body.center"],
    [
      { body: { ...sphere, center: { x: 0, y: Infinity, z: 0 } }, parentRig: null },
      "range",
      ".body.center",
    ],
    [
      { body: { ...sphere, center: { x: "0", y: 0, z: 0 } }, parentRig: null },
      "range",
      ".body.center",
    ],
    [{ body: { ...sphere, radius: "large" }, parentRig: null }, "range", ".body.radius"],
    [{ body: { ...sphere, radius: Infinity }, parentRig: null }, "range", ".body.radius"],
    [{ body: { ...sphere, radius: 0 }, parentRig: null }, "range", ".body.radius"],
    [{ body: sphere }, "type", ".parentRig"],
    [{ body: sphere, parentRig: false }, "type", ".parentRig"],
    [{ body: sphere, parentRig: { ...sphere, radius: -1 } }, "range", ".parentRig.radius"],
  ];
  for (const [clearance, kind, suffix] of invalid) {
    const camera = {
      ...standard.cameras[0]!,
      clearance,
    } as IAutoMovieStageCamera;
    const result = stageScene(
      makeScriptWrite(),
      makeStagingWrite({ cameras: [camera] }),
    );
    TestValidator.predicate(
      `malformed clearance reports ${suffix || "envelope"}`,
      result.success === false &&
        hasViolation(result, kind, `$input.cameras[0].clearance${suffix}`),
    );
  }
};
