import {
  preparePhysicalGeometry as Geometry,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  planPhysicalContactTargets,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Two target steps: the relationship is planned per step, so one is enough. */
const DURATION: number = 1 / 120;

/** Collider relationships follow a moved receiver through generic bounded IK.
 *
 * Scenarios:
 * 1. Moving only a target sphere changes an independent primitive limb's fitted pose, and both fits reach the receiver's surface.
 * 2. The fitted source collider, queried natively against the receiver, is a geometric receipt without a solver impulse.
 * 3. The valid relationship is admitted; unknown colliders, unsupported compression and malformed normals refuse before solver allocation.
 *
 * Solver impulses and checkpoint continuation belong to the native simulation units.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `AutoMoviePhysicalSimulation`, `planPhysicalContactTargets` on in-memory inputs and asserts the returned observations through 2x TestValidator.equals; 3 numbered scenarios (first: Moving only a target sphere changes an independent primitive limb's fitted pose, and both fits reach the...; last: The valid relationship is admitted; unknown colliders, unsupported compression and malformed normals refuse...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Moving only a target sphere changes an independent primitive limb's fitted pose, and both fits reach the...; last: The valid relationship is admitted; unknown colliders, unsupported compression and malformed normals refuse...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_contact_binding`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Moving only a target sphere changes an independent primitive limb's fitted pose, and both fits reach the receiver's surface.).
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
    DURATION,
  );
  for (const target of source.targets) {
    target.strength = 1;
    target.bindings = [binding];
  }
  const panel: Simulation.IBody = PhysicalFixtures.body(
    "receiver",
    receiver,
    DURATION,
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

  // The fitted collider touches the receiver as a geometric receipt.
  const contact: ReturnType<Geometry.IQueries["contact"]> = geometry.contact(
    {
      body: "mechanism",
      bone: "support-0",
      shape: profile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === "support-0",
      )!.shapes[0]!,
      pose: second.targets["support-0"]!,
    },
    {
      body: "receiver",
      bone: "root",
      shape: receiver.segments[0]!.shapes[0]!,
      pose: moved.receiver!.root!,
    },
    0,
    0.01,
  );
  if (
    !contact ||
    contact.source !== "geometric" ||
    contact.impulse !== null ||
    !(contact.separation <= 0.005 + 1e-9)
  )
    findings.push(`fitted geometric receipt ${JSON.stringify(contact)}`);
  const input: Simulation.IInput = PhysicalFixtures.input(
    [source, panel],
    DURATION,
  );
  const failures: string[] = [];
  try {
    Simulation.identity(input);
  } catch (error: unknown) {
    failures.push(`refused the valid relationship: ${String(error)}`);
  }
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
