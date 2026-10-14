import { deriveCenterOfMass } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { makeProp, primitivePart } from "../internal/fixtures";

/**
 * `deriveCenterOfMass` returns null when a model has no primitive volume to
 * weigh: the caller's signal that `centerOfMass` must be declared explicitly
 * rather than derived.
 *
 * Scenarios:
 *
 * 1. A plane-only model (zero-volume primitives) has no derivable center → null.
 * 2. A mesh-only model (no primitive parts at all) → null.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives centers for plane-only and mesh-only models and requires null, catching a fabricated origin where no supported solid volume supplies a center.
 * @evidence contracts/testing.md#independent-expectations A plane has zero solid volume and this contract does not infer mesh volume; null follows from those declared limitations, not a sampled product result.
 * @evidence contracts/testing.md#distinguishing-cases Distinguishes a supported degenerate primitive from unsupported mesh geometry; positive primitive aggregates and authored overrides belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit supplies existing prop records directly and owns both assertions, with no host or dynamically registered case.
 */
export function test_physics_derive_center_of_mass_degenerate(): void {
  TestValidator.equals(
    "plane-only model has no derivable center",
    deriveCenterOfMass(
      makeProp([primitivePart("p", { type: "plane", width: 2, depth: 2 })]),
    ),
    null,
  );
  TestValidator.equals(
    "mesh-only model has no derivable center",
    deriveCenterOfMass(
      makeProp([
        {
          id: "m",
          name: null,
          geometry: {
            type: "mesh",
            mesh: {
              positions: [0, 0, 0],
              normals: null,
              uvs: null,
              indices: null,
              skin: null,
            },
          },
          material: null,
          attachedBone: null,
          transform: null,
        },
      ]),
    ),
    null,
  );
}
