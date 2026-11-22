import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Every value the solver reads is admitted finite before any world exists.
 *
 * Scenarios:
 * 1. Non-finite settings, derived float64 overflow and non-positive tolerances refuse coherently.
 * 2. Balance rejects zero effective gravity while ordinary free flight remains legal.
 * 3. Optional objects/records, booleans and defaults reject explicit invalid primitives while retaining valid omission, zero budgets and empty strength records.
 * 4. Derived interval/COM velocity, world collider bounds and implicit damping refuse float64 overflow before allocation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through no assertion call; 4 numbered scenarios (first: Non-finite settings, derived float64 overflow and non-positive tolerances refuse coherently.; last: Derived interval/COM velocity, world collider bounds and implicit damping refuse float64 overflow before...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Non-finite settings, derived float64 overflow and non-positive tolerances refuse coherently.; last: Derived interval/COM velocity, world collider bounds and implicit damping refuse float64 overflow before...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_native_input_admission`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`, `PhysicalSupportFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Non-finite settings, derived float64 overflow and non-positive tolerances refuse coherently.).
 */
export function test_physical_native_input_admission(): void {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input(
      [PhysicalFixtures.body("solid", PhysicalFixtures.sphere(), 1 / 120)],
      1 / 120,
    );
  const mutations: ((
    copy: IAutoMoviePhysicalSimulationInput.IInput,
  ) => void)[] = [
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.gravity.y = Infinity;
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.floor = Infinity;
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.bodies[0]!.targets[0]!.segments.root!.position.x = Infinity;
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.contactFrequency = Infinity;
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.contactTolerance = 0;
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.floorBounds.thickness = 1.7e308;
      copy.floor = -1.7e308;
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.gravity.x = 1e300;
      copy.bodies[0]!.mode = {
        kind: "exaggerated",
        gravity: 1e300,
        impulse: 1,
        compliance: 1,
        reason: "Explicit overflow refusal",
      };
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.impulses.push({
        step: 1,
        body: "solid",
        bone: "root",
        impulse: { x: Infinity, y: 0, z: 0 },
        point: { x: 0, y: 1, z: 0 },
      });
    },
    (copy: IAutoMoviePhysicalSimulationInput.IInput): void => {
      copy.bodies[0]!.mode = {
        kind: "exaggerated",
        gravity: 1,
        impulse: 1e300,
        compliance: 1,
        reason: "Explicit scaled impulse refusal",
      };
      copy.impulses.push({
        step: 1,
        body: "solid",
        bone: "root",
        impulse: { x: 1e300, y: 0, z: 0 },
        point: { x: 0, y: 1, z: 0 },
      });
    },
  ];
  Simulation.identity(input);
  for (const mutate of mutations) {
    const invalid: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    mutate(invalid);
    assert.throws((): string => Simulation.identity(invalid));
  }
  for (const value of [null, false, 0, "", [], new Map(), new Date(0)]) {
    for (const key of [
      "selfAvoidance",
      "rootTorque",
      "supportTracking",
      "balance",
    ]) {
      const invalid: IAutoMoviePhysicalSimulationInput.IInput =
        structuredClone(input);
      Reflect.set(invalid.bodies[0]!, key, value);
      assert.throws((): string => Simulation.identity(invalid));
    }
    for (const key of [
      "jointStrength",
      "supportStrength",
      "releasedJointStrength",
      "unavailableSupports",
    ]) {
      if (key === "unavailableSupports" && Array.isArray(value)) continue;
      const invalid: IAutoMoviePhysicalSimulationInput.IInput =
        structuredClone(input);
      Reflect.set(invalid.bodies[0]!.targets[0]!, key, value);
      assert.throws((): string => Simulation.identity(invalid));
    }
  }
  for (const value of [null, false, 0, "1", true]) {
    for (const key of ["handoffSeconds", "maximumBindings"]) {
      const invalid: IAutoMoviePhysicalSimulationInput.IInput =
        structuredClone(input);
      Reflect.set(invalid.bodies[0]!, key, value);
      assert.throws((): string => Simulation.identity(invalid));
    }
    const invalid: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    Reflect.set(invalid, "substeps", value);
    assert.throws((): string => Simulation.identity(invalid));
  }
  for (const value of [null, 0, 1, "false"]) {
    const invalid: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    Reflect.set(invalid.bodies[0]!, "compensateGravity", value);
    assert.throws((): string => Simulation.identity(invalid));
  }
  const permitted: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  permitted.bodies[0]!.compensateGravity = false;
  permitted.bodies[0]!.targets[0]!.jointStrength = {};
  permitted.bodies[0]!.targets[0]!.supportStrength = {};
  permitted.bodies[0]!.targets[0]!.unavailableSupports = [];
  Simulation.identity(permitted);
  const zeroGravity: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  zeroGravity.bodies[0]!.mode = {
    kind: "exaggerated",
    gravity: Infinity,
    impulse: 1,
    compliance: 1,
    reason: "The raw gravity scale must remain finite even when scene gravity is zero",
  };
  assert.throws(
    (): string => Simulation.identity(zeroGravity),
    /finite factors/,
  );
  for (const factor of [1e-308, 1e308]) {
    const scaled: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    const profile: (typeof scaled.bodies)[number]["profile"] =
      scaled.bodies[0]!.profile;
    profile.materials[0]!.compliance = factor < 1 ? 1e-38 : 1e38;
    profile.materials[0]!.maximumCompression = 0.01;
    scaled.bodies[0]!.mode = {
      kind: "exaggerated",
      gravity: 1,
      impulse: 1,
      compliance: factor,
      reason:
        "Computed material products must stay finite and preserve positive compliance",
    };
    assert.throws(
      (): string => Simulation.identity(scaled),
      /scaled physical compliance/,
    );
  }
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
  const motion: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  motion.floorBounds.min.x = -8e307;
  motion.floorBounds.max.x = 8e307;
  for (const target of motion.bodies[0]!.targets)
    target.dynamicSegments = ["root"];
  motion.bodies[0]!.targets[1]!.segments.root!.position.x = 1e307;
  assert.throws((): string => Simulation.identity(motion), /not finite|outside physical floor domain/);
  const motorIntent: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(motion);
  for (const target of motorIntent.bodies[0]!.targets)
    target.dynamicSegments = undefined;
  Simulation.identity(motorIntent);
  const geometric: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(motion);
  geometric.bodies[0]!.mode = { kind: "kinematic" };
  Simulation.identity(geometric);
  const boundary: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  boundary.bodies[0]!.profile.segments[0]!.shapes[0]!.transform.position.y = 1e308;
  for (const target of boundary.bodies[0]!.targets)
    target.segments.root!.position.y = 1e308;
  assert.throws((): string => Simulation.identity(boundary), /not finite|outside physical floor domain/);
  const transport: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  transport.bodies[0]!.profile.segments[0]!.centerOfMass.x = 1e307;
  transport.bodies[0]!.profile.centerOfMass.x = 1e307;
  for (const target of transport.bodies[0]!.targets)
    target.dynamicSegments = ["root"];
  transport.bodies[0]!.targets[1]!.segments.root!.rotation = {
    x: 0,
    y: 0,
    z: Math.SQRT1_2,
    w: Math.SQRT1_2,
  };
  assert.throws((): string => Simulation.identity(transport), /not finite|outside physical floor domain/);
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.body(PhysicalModelFixtures.quadrupod(), 1 / 120);
  const balanced: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1 / 120);
  balanced.gravity.y = -9.81;
  for (const value of [0, false, null]) {
    const invalid: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(balanced);
    Reflect.set(invalid.bodies[0]!.balance!, "bracing", value);
    assert.throws((): string => Simulation.identity(invalid), /bracing/);
    const reach: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(balanced);
    Reflect.set(reach.bodies[0]!.balance!.pattern.limbs[0]!, "reach", value);
    assert.throws((): string => Simulation.identity(reach), /reach/);
    const domain: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(balanced);
    Reflect.set(
      domain.bodies[0]!.profile.joints[0]!.axes[0]!,
      "sourceDomain",
      value,
    );
    assert.throws((): string => Simulation.identity(domain), /sourceDomain/);
  }
  const damping: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(balanced);
  const axis: (typeof body.profile.joints)[number]["axes"][number] =
    damping.bodies[0]!.profile.joints[0]!.axes[0]!;
  axis.stiffness = 1;
  axis.damping = 1e308;
  axis.passiveDamping = 1e308;
  assert.throws(
    (): string => Simulation.identity(damping),
    /motor damping/,
  );
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
