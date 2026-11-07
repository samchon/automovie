import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { planPhysicalContactTargets } from "../../../../packages/engine/src/physics/planPhysicalContactTargets";
import { preparePhysicalGeometry as Geometry } from "../../../../packages/engine/src/physics/preparePhysicalGeometry";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Collider relationships follow a moved receiver through generic bounded IK and actual dynamics.
 *
 * Scenarios:
 * 1. Moving only a target sphere changes an independent primitive limb's fitted pose.
 * 2. A bounded motor reaches a moving receiver and records a real positive impulse.
 * 3. Kinematic evaluation uses the same relationship with geometric-only receipts.
 * 4. A late receiver edit resumes from a checkpoint with identical frames.
 * 5. Unknown colliders and unsupported compression refuse before solver allocation.
 */
export async function test_physical_contact_binding(): Promise<void> {
  const findings: string[] = [];
  const profile: P = PhysicalModelFixtures.quadrupod();
  const receiver: P = PhysicalFixtures.sphere(0.1, 0.001);
  const geometry: Geometry.IQueries = await Geometry();
  const binding: Binding = {
    id: "mechanism-follows-panel",
    kind: "contact",
    chain: ["upper-0", "lower-0", "support-0"],
    source: {
      bone: "support-0",
      shape: profile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === "support-0",
      )!.shapes[0]!.id,
    },
    target: { body: "receiver", bone: "root", shape: "surface" },
    weight: 1,
    compression: 0.005,
    iterations: 24,
    tolerance: 0.0001,
  };
  const source: Simulation.IBody = PhysicalFixtures.body(
    "mechanism",
    profile,
    1,
  );
  Object.assign(source, {
    rootStiffness: 5000,
    rootDamping: 500,
    maximumRootForce: 5000,
    rootTorque: { stiffness: 1000, damping: 100, maximumTorque: 1000 },
  });
  for (const target of source.targets) {
    target.strength = 1;
    target.bindings = [binding];
  }
  const panel: Simulation.IBody = PhysicalFixtures.body(
    "receiver",
    receiver,
    1,
  );
  panel.mode = { kind: "kinematic" };
  for (const [step, target] of panel.targets.entries())
    target.segments.root!.position = {
      x: 0.55 + (step / 120) * 0.08,
      y: 0.3,
      z: 0.3,
    };
  const initial: Record<string, Record<string, P.ITransform>> = {
    mechanism: source.targets[0]!.segments,
    receiver: panel.targets[0]!.segments,
  };
  const first: ReturnType<typeof planPhysicalContactTargets> =
    planPhysicalContactTargets({
      body: "mechanism",
      profiles: { mechanism: profile, receiver },
      targets: initial.mechanism!,
      actual: initial,
      bindings: [binding],
      geometry,
      floor: -10,
    });
  const moved: typeof initial = structuredClone(initial);
  moved.receiver!.root!.position.x += 0.15;
  const second: ReturnType<typeof planPhysicalContactTargets> =
    planPhysicalContactTargets({
      body: "mechanism",
      profiles: { mechanism: profile, receiver },
      targets: initial.mechanism!,
      actual: moved,
      bindings: [binding],
      geometry,
      floor: -10,
    });
  if (
    !(
      Vector3.length(
        Vector3.subtract(
          first.targets["support-0"]!.position,
          second.targets["support-0"]!.position,
        ),
      ) > 0.05 &&
      first.residuals[binding.id]! < 0.005 &&
      second.residuals[binding.id]! < 0.005
    )
  )
    findings.push(
      `surface fitting residuals ${JSON.stringify([first.residuals, second.residuals])}`,
    );
  const input: Simulation.IInput = PhysicalFixtures.input([source, panel], 1);
  input.substeps = 16;
  input.iterations = 32;
  input.internalIterations = 4;
  const native: Simulation = await Simulation.compute(input);
  const stationaryInput: Simulation.IInput = structuredClone(input);
  for (const target of stationaryInput.bodies[1]!.targets)
    target.segments = structuredClone(panel.targets[0]!.segments);
  const stationary: Simulation = await Simulation.compute(stationaryInput);
  for (const [name, run] of [
    ["moving", native],
    ["stationary", stationary],
  ] as const) {
    const actual: ReturnType<typeof run.cache.at>["bodies"] =
      run.cache.at(1).bodies;
    const contact: ReturnType<Geometry.IQueries["contact"]> = geometry.contact(
      {
        body: "mechanism",
        bone: "support-0",
        shape: profile.segments.find(
          (segment: P.ISegment): boolean => segment.bone === "support-0",
        )!.shapes[0]!,
        pose: actual.mechanism!["support-0"]!,
      },
      {
        body: "receiver",
        bone: "root",
        shape: receiver.segments[0]!.shapes[0]!,
        pose: actual.receiver!.root!,
      },
      1,
      10,
    );
    if (
      !run.cache.contacts.some(
        (receipt: (typeof run.cache.contacts)[number]): boolean =>
          receipt.source === "solver" &&
          (receipt.impulse ?? 0) > 0 &&
          receipt.separation <= 0 &&
          receipt.a.body !== receipt.b.body &&
          receipt.a.body !== "floor" &&
          receipt.b.body !== "floor",
      )
    )
      findings.push(
        `${name}: no actual solver contact; final gap ${contact?.separation}; source ${JSON.stringify(actual.mechanism!["support-0"]!.position)}`,
      );
  }
  const kinematicInput: Simulation.IInput = structuredClone(input);
  kinematicInput.bodies[0]!.mode = { kind: "kinematic" };
  const kinematic: Simulation = await Simulation.compute(kinematicInput);
  if (
    !(
      kinematic.recomputedSteps === 0 &&
      kinematic.cache.contacts.length > 0 &&
      kinematic.cache.contacts.every(
        (receipt: (typeof kinematic.cache.contacts)[number]): boolean =>
          receipt.source === "geometric" && receipt.impulse === null,
      )
    )
  )
    findings.push("kinematic relationship provenance");
  const edit: Simulation.IInput = structuredClone(input);
  for (const target of edit.bodies[1]!.targets.slice(90))
    target.segments.root!.position.y += 0.02;
  const fresh: Simulation = await Simulation.compute(edit);
  const resumed: Simulation = await Simulation.compute(edit, native);
  if (
    !(
      resumed.recomputedSteps === 60 &&
      JSON.stringify(fresh.cache.frames) ===
        JSON.stringify(resumed.cache.frames)
    )
  )
    findings.push("live binding checkpoint frame identity");
  const failures: string[] = [];
  for (const invalid of [
    { ...binding, compression: 1 },
    { ...binding, target: { ...binding.target, shape: "absent" } },
    ...[null, false, 0, "", [], new Map()].map((normal: unknown): Binding => {
      const invalid: Binding = structuredClone(binding);
      Reflect.set(invalid.target, "normal", normal);
      return invalid;
    }),
  ]) {
    const bad: Simulation.IInput = structuredClone(input);
    bad.bodies[0]!.targets[0]!.bindings = [invalid];
    try {
      Simulation.identity(bad);
      failures.push("accepted invalid relationship");
    } catch (error: unknown) {
      if (!String(error).includes("contact binding"))
        failures.push(String(error));
    }
  }
  TestValidator.equals("invalid relationship admission", failures, []);
  TestValidator.equals("all collider relationship observations", findings, []);
}
