import { AutoMovieEngineViolationCollector } from "@automovie/engine";
import {
  lowerCameraClearanceEnvelope
} from "../../../../../packages/engine/src/film/staging/internal/lowerCameraClearanceEnvelope";
import {
  validateCameraClearanceEnvelope
} from "../../../../../packages/engine/src/film/staging/internal/validateCameraClearanceEnvelope";
import type { IAutoMovieCameraClearanceEnvelope } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Camera clearance lowers owned sphere copies and rejects nonpositive radii at
 * the body or parent-rig field that introduced them.
 *
 * Scenarios:
 *
 * 1. An accepted envelope retains the authored body and parent coordinates and
 *    radii even after the authored envelope is mutated.
 * 2. A zero body size and negative parent-rig size report together. An absent
 *    parent stays absent and the same valid body still lowers.
 */
export function test_engine_film_camera_clearance_envelope(): void {
  const out: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
  const authored: IAutoMovieCameraClearanceEnvelope = {
    body: { center: { x: 0, y: 1, z: 0 }, radius: 0.5 },
    parentRig: { center: { x: 0, y: 0, z: 1 }, radius: 0.25 },
  };
  validateCameraClearanceEnvelope(authored, "$input.clearance", out);
  const lowered: IAutoMovieCameraClearanceEnvelope =
    lowerCameraClearanceEnvelope(authored);
  authored.body.center.y = 7;
  authored.parentRig!.center.z = 8;
  TestValidator.equals(
    "the accepted placement holds both independently authored spheres",
    [lowered, out.items],
    [
      {
        body: { center: { x: 0, y: 1, z: 0 }, radius: 0.5 },
        parentRig: { center: { x: 0, y: 0, z: 1 }, radius: 0.25 },
      },
      [],
    ],
  );
  validateCameraClearanceEnvelope(
    {
      body: { ...authored.body, radius: 0 },
      parentRig: { ...authored.parentRig!, radius: -1 },
    },
    "$input.clearance",
    out,
  );
  TestValidator.equals(
    "both radii must be greater than zero",
    out.items.map(({ kind, path }) => [kind, path]),
    [
      ["range", "$input.clearance.body.radius"],
      ["range", "$input.clearance.parentRig.radius"],
    ],
  );
  TestValidator.equals(
    "no parent rig stays absent",
    lowerCameraClearanceEnvelope({ ...authored, parentRig: null }).parentRig,
    null,
  );
}
