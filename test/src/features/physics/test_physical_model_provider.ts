import {
  deriveCenterOfMass,
  derivePhysicalProfile,
  validatePhysicalProfile,
} from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures as Fixtures } from "../internal/PhysicalModelFixtures";
import { makeProp } from "../internal/makeProp";
import { vclose } from "../internal/predicates";
import { primitivePart } from "../internal/primitivePart";

/** Primitive model provider and override consistency.
 *
 * Scenarios:
 * 1. The actual catalogue stickman's mass centre includes every neutral bone placement.
 * 2. Explicit segment replacement changes total mass by its declared difference.
 * 3. A four-support primitive assembly has analytic total mass and neutral centre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `deriveCenterOfMass`, `derivePhysicalProfile`, `validatePhysicalProfile` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate; 3 numbered scenarios (first: The actual catalogue stickman's mass centre includes every neutral bone placement.; last: A four-support primitive assembly has analytic total mass and neutral centre.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (4 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: The actual catalogue stickman's mass centre includes every neutral bone placement.; last: A four-support primitive assembly has analytic total mass and neutral centre.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_model_provider`, which owns the cases delegated to `PhysicalModelFixtures`, `makeProp`, `predicates`, `primitivePart`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The actual catalogue stickman's mass centre includes every neutral bone placement.).
 */
export function test_physical_model_provider(): void {
  const { model, profile }: ReturnType<typeof Fixtures.stickman> =
    Fixtures.stickman();
  TestValidator.predicate(
    "existing model and physical profile share neutral centre",
    vclose(profile.centerOfMass, deriveCenterOfMass(model)!, 1e-10) &&
      profile.joints.length === model.skeleton!.bones.length - 1,
  );
  const replacement: P.ISegment = structuredClone(profile.segments[0]!);
  replacement.mass += 1;
  const overridden: P = derivePhysicalProfile(model, {
    density: 1000,
    densities: {},
    material: "solid",
    materials: profile.materials,
    joints: profile.joints,
    overrides: { [replacement.bone]: replacement },
    provenance: "One explicit mass replacement over the same primitive model.",
  });
  TestValidator.predicate(
    "whole-segment override replaces derived mass",
    Math.abs(overridden.mass - profile.mass - 1) < 1e-10 &&
      overridden.segments[0]!.mass === replacement.mass,
  );
  const four: P = Fixtures.quadrupod();
  TestValidator.predicate(
    "independent primitive assembly totals",
    validatePhysicalProfile(four).length === 0 &&
      Math.abs(four.mass - 8) < 1e-12 &&
      vclose(four.centerOfMass, { x: 0, y: 0.75, z: 0 }, 1e-12),
  );
  const analytic: IAutoMovieModel = makeProp([
    primitivePart("base", { type: "box", width: 1, height: 1, depth: 1 }),
    primitivePart("tip", { type: "box", width: 1, height: 1, depth: 1 }),
    primitivePart(
      "unbound",
      { type: "box", width: 1, height: 1, depth: 1 },
      {
        translation: { x: 4, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
    ),
  ]);
  analytic.parts[0]!.attachedBone = "hips";
  analytic.parts[1]!.attachedBone = "spine";
  analytic.skeleton = {
    id: "analytic",
    bones: [
      {
        bone: "hips",
        parent: null,
        rest: {
          translation: { x: 0, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
          scale: { x: 1, y: 1, z: 1 },
        },
        constraint: null,
      },
      {
        bone: "spine",
        parent: "hips",
        rest: {
          translation: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        constraint: null,
      },
    ],
  };
  const derived: P = derivePhysicalProfile(analytic, {
    density: 1,
    densities: {},
    material: "solid",
    materials: profile.materials,
    actuator: { frequency: 20, dampingRatio: 1, torquePerKg: 50 },
    provenance:
      "Three equal unit cubes at model (0,1,0), (0,3,0), and (4,0,0).",
  });
  const expected: { x: number; y: number; z: number } = {
    x: 4 / 3,
    y: 4 / 3,
    z: 0,
  };
  TestValidator.predicate(
    "independent rotated bone and unbound-part centre",
    vclose(derived.centerOfMass, expected, 1e-12) &&
      vclose(deriveCenterOfMass(analytic)!, expected, 1e-12),
  );
}
