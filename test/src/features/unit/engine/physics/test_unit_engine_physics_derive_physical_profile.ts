import {
  deriveCenterOfMass,
  derivePhysicalProfile,
  validatePhysicalProfile,
} from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

import { PhysicalModelFixtures as Fixtures } from "../../../internal/PhysicalModelFixtures";
import { makeProp } from "../../../internal/makeProp";
import { vclose } from "../../../internal/predicates";
import { primitivePart } from "../../../internal/primitivePart";

/**
 * Primitive model provider and override consistency.
 *
 * Scenarios:
 *
 * 1. The actual catalogue stickman's mass centre includes every neutral bone
 *    placement.
 * 2. Explicit segment replacement changes total mass by its declared difference.
 * 3. A four-support primitive assembly has analytic total mass and neutral centre.
 */
export function test_unit_engine_physics_derive_physical_profile(): void {
  const { model, profile }: ReturnType<typeof Fixtures.stickman> =
    Fixtures.stickman();
  TestValidator.predicate(
    "existing model and physical profile share neutral centre",
    vclose(profile.centerOfMass, deriveCenterOfMass(model)!, PhysicalTolerance.ACCUMULATED) &&
      profile.joints.length === model.skeleton!.bones.length - 1,
  );
  const replacement: IAutoMoviePhysicalSegment = structuredClone(
    profile.segments[0]!,
  );
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
    Math.abs(overridden.mass - profile.mass - 1) < PhysicalTolerance.ACCUMULATED &&
      overridden.segments[0]!.mass === replacement.mass,
  );
  // The fixture's legs bend their knees by pi / 4, each 0.45 m link leaning
  // pi / 8, so the body and hips stand d = 0.9 (1 - cos(pi / 8)) lower: the
  // 4 kg body at 1.05 - d, each leg's 0.4 kg thigh at 0.775 - 0.75 d, 0.4 kg
  // shank at 0.325 - d / 4 and 0.2 kg foot at 0.05 put the 8 kg centre at
  // (6 - 5.6 d) / 8 = 0.75 - 0.7 d, on the symmetric plan's axis.
  const four: P = Fixtures.quadrupod();
  const d: number = 0.9 * (1 - Math.cos(Math.PI / 8));
  TestValidator.predicate(
    "independent primitive assembly totals",
    validatePhysicalProfile(four).length === 0 &&
      Math.abs(four.mass - 8) < PhysicalTolerance.ROUNDING &&
      vclose(four.centerOfMass, { x: 0, y: 0.75 - 0.7 * d, z: 0 }, PhysicalTolerance.ROUNDING),
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
    vclose(derived.centerOfMass, expected, PhysicalTolerance.ROUNDING) &&
      vclose(deriveCenterOfMass(analytic)!, expected, PhysicalTolerance.ROUNDING),
  );
}
