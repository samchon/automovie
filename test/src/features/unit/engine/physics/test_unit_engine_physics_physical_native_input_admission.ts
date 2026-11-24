import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../../internal/PhysicalSupportFixtures";

/**
 * The solver's declared ranges are admitted before any world exists.
 *
 * Scenarios:
 *
 * 1. A non-positive contact tolerance refuses.
 * 2. Balance rejects zero effective gravity while ordinary free flight remains
 *    legal.
 * 3. Valid omission, zero budgets and empty strength records are admitted.
 * 4. A scaled compliance that underflows to zero and a compressible collider with
 *    no rigid core refuse; a motor-intent or kinematic body far inside a wide
 *    floor is admitted.
 */
export function test_unit_engine_physics_physical_native_input_admission(): void {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input(
      [PhysicalFixtures.body("solid", PhysicalFixtures.sphere(), 1 / 120)],
      1 / 120,
    );
  Simulation.identity(input);

  // 1. A non-positive contact tolerance.
  const tolerance: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  tolerance.contactTolerance = 0;
  assert.throws((): string => Simulation.identity(tolerance));

  // 3. Omission, zero budgets and empty records.
  const permitted: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  permitted.bodies[0]!.compensateGravity = false;
  permitted.bodies[0]!.targets[0]!.jointStrength = {};
  permitted.bodies[0]!.targets[0]!.supportStrength = {};
  permitted.bodies[0]!.targets[0]!.unavailableSupports = [];
  Simulation.identity(permitted);

  // 4. Compliance underflow and rigid cores.
  const scaled: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  const profile: (typeof scaled.bodies)[number]["profile"] =
    scaled.bodies[0]!.profile;
  profile.materials[0]!.compliance = 1e-38;
  profile.materials[0]!.maximumCompression = 0.01;
  scaled.bodies[0]!.mode = {
    kind: "exaggerated",
    gravity: 1,
    impulse: 1,
    compliance: 1e-308,
    reason: "A computed material product must preserve positive compliance",
  };
  assert.throws(
    (): string => Simulation.identity(scaled),
    /scaled physical compliance/,
  );
  const core: IAutoMoviePhysicalSimulationInput.IInput = structuredClone(input);
  core.bodies[0]!.profile.segments[0]!.inertia = { x: 1, y: 1, z: 1 };
  core.bodies[0]!.profile.materials[0]!.compliance = 0.001;
  core.bodies[0]!.profile.materials[0]!.maximumCompression =
    1e-320 * (1 - 2 ** -52);
  const coreShape: (typeof core.bodies)[number]["profile"]["segments"][number]["shapes"][number] =
    core.bodies[0]!.profile.segments[0]!.shapes[0]!;
  assert.equal(coreShape.kind, "sphere");
  if (coreShape.kind === "sphere") coreShape.radius = 1e-320;
  assert.throws((): string => Simulation.identity(core), /rigidCore/);
  core.bodies[0]!.profile.segments[0]!.shapes = [
    {
      id: coreShape.id,
      material: coreShape.material,
      transform: structuredClone(coreShape.transform),
      kind: "box",
      halfExtents: { x: 1e-320, y: 0.1, z: 0.1 },
    },
  ];
  assert.throws((): string => Simulation.identity(core), /rigidCore/);
  const motorIntent: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  motorIntent.floorBounds.min.x = -8e307;
  motorIntent.floorBounds.max.x = 8e307;
  motorIntent.bodies[0]!.targets[1]!.segments.root!.position.x = 1e307;
  Simulation.identity(motorIntent);
  const geometric: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(motorIntent);
  geometric.bodies[0]!.mode = { kind: "kinematic" };
  Simulation.identity(geometric);

  // 2. Zero effective gravity under balance.
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.body(PhysicalModelFixtures.quadrupod(), 1 / 120);
  const balanced: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1 / 120);
  balanced.gravity.y = -9.81;
  body.mode = {
    kind: "exaggerated",
    gravity: 0,
    impulse: 1,
    compliance: 1,
    reason: "Zero-gravity recovery is undefined",
  };
  assert.throws((): string => Simulation.identity(balanced), /recovery/);
  delete body.balance;
  Simulation.identity(balanced);
}
