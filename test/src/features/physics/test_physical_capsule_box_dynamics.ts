import {
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { capsuleBoxSeparation } from "../internal/capsuleBoxSeparation";

/** The native dynamics world detects shallow capsule-box overlap exactly and reports only the momentum it transfers.
 *
 * Scenarios:
 * 1. A capsule held 0.5 mm from a kinematic box in zero gravity produces no receipt and stays at rest.
 * 2. A capsule placed 0.2 mm to 10 mm inside the box, including the shallow band the pinned geometric query once reported as a gap, is pushed out within two steps.
 * 3. Every receipt states the analytic penetration as its first sample's separation and an impulse equal to the momentum the capsule received; an overlap without a receipt transferred no momentum.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public `AutoMoviePhysicalSimulation` on in-memory capsule and box bodies and reads cached receipts and poses. A missed shallow overlap leaves the zero-gravity capsule in place, a wrong manifold distance or witness frame changes the receipt separation, and a receipt impulse that is not the delivered momentum, or an omitted receipt for a real momentum exchange, fails an assertion. Any native depenetration rate that reduces the overlap is allowed.
 * @evidence contracts/development/testing.md#independent-expectations The reference penetration is the closed form of the capsule axis segment's distance to the oriented box less the radius. A one-kilogram capsule in zero gravity has momentum equal to its speed, so the receipt impulse must equal the measured speed. The 1e-6 m separation allowance covers float32 native coordinates near 1 m; the 1e-7 N s momentum floor is two orders below the smallest receipt observed.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a positive gap and seven overlap depths through and beyond the 1.7 mm band. Native geometric query accuracy belongs to test_physical_separation_derivative; paired hit, blocked and missed attribution belongs to test_physical_native_contact_pair; the speed sweep belongs to test_physical_compliance.
 * @evidence contracts/development/testing.md#execution-ownership Portable unit test entered through the discoverable function `test_physical_capsule_box_dynamics`, running the public engine with native WASM on two-step in-memory scenes; it starts no process, viewer or render host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios, naming the depths, the analytic reference and the momentum observation each one pins.
 */
export async function test_physical_capsule_box_dynamics(): Promise<void> {
  const capsule: IAutoMoviePhysicalShape = {
    id: "surface",
    material: "solid",
    kind: "capsule",
    radius: 0.08,
    halfLength: 0.15,
    transform: {
      position: { x: 0, y: 0.02, z: 0 },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
    },
  };
  const box: IAutoMoviePhysicalShape = {
    id: "surface",
    material: "solid",
    kind: "box",
    halfExtents: { x: 0.1, y: 0.12, z: 0.09 },
    transform: {
      position: { x: -0.02, y: 0, z: 0.01 },
      rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 25),
    },
  };
  const approach: IAutoMovieVector3 = unit({ x: 1, y: 0.3, z: -0.2 });
  const start: IAutoMovieRigidTransform = {
    position: { x: 0, y: 1, z: 0 },
    rotation: Quaternion.fromAxisAngle(unit({ x: 1, y: 2, z: 3 }), 23),
  };
  const duration: number = 2 / 120;
  const findings: string[] = [];
  for (const depth of [
    0.0005, -0.0002, -0.0005, -0.0012, -0.0013, -0.0015, -0.002, -0.01,
  ]) {
    const solid: IAutoMovieRigidTransform = place(offset(depth));
    const initial: number = capsuleBoxSeparation(capsule, start, box, solid);
    const mover: IAutoMoviePhysicalSimulationInput.IBody =
      PhysicalFixtures.body("a-capsule", profile(capsule), duration, start);
    const fixed: IAutoMoviePhysicalSimulationInput.IBody =
      PhysicalFixtures.body("b-box", profile(box), duration, solid);
    fixed.mode = { kind: "kinematic" };
    const run: IAutoMoviePhysicalSimulation = await Simulation.compute(
      PhysicalFixtures.input([mover, fixed], duration),
    );
    const receipts: readonly IAutoMovieContactReceipt[] = run.cache.contacts;
    const end: IAutoMovieRigidTransform =
      run.cache.at(duration).bodies["a-capsule"]!.root!;
    const momentum: number = Vector3.length(
      run.cache.at(duration).bodies["a-capsule"]!.root!.velocity,
    );
    const final: number = capsuleBoxSeparation(capsule, end, box, solid);
    const label: string = `${(depth * 1000).toFixed(1)} mm`;
    if (depth > 0) {
      if (
        receipts.length !== 0 ||
        momentum !== 0 ||
        !(Math.abs(final - initial) < 1e-6)
      )
        findings.push(`${label} gap touched: ${receipts.length} ${momentum}`);
      continue;
    }
    if (!(final > initial))
      findings.push(`${label} overlap ${initial} not resolved: ${final}`);
    if (receipts.length === 0) {
      if (!(momentum < 1e-7))
        findings.push(`${label} momentum ${momentum} without a receipt`);
      continue;
    }
    const receipt: IAutoMovieContactReceipt = receipts[0]!;
    const first: NonNullable<IAutoMovieContactReceipt["samples"]>[number] =
      receipt.samples![0]!;
    if (
      receipts.length !== 1 ||
      receipt.a.body !== "a-capsule" ||
      receipt.b.body !== "b-box" ||
      receipt.source !== "solver" ||
      !(Math.abs(first.separation - initial) < 1e-6) ||
      !(Math.abs(receipt.impulse! - momentum) < 1e-7 + 1e-3 * momentum)
    )
      findings.push(
        `${label} receipt ${receipts.length} separation ${first.separation} analytic ${initial} impulse ${receipt.impulse} momentum ${momentum}`,
      );
  }
  TestValidator.equals(
    "native dynamics measure shallow capsule-box overlap exactly",
    findings,
    [],
  );

  /** Box pose along the approach whose analytic separation is the target. */
  function offset(target: number): number {
    let near: number = 0;
    let far: number = 1;
    for (let iteration: number = 0; iteration < 60; ++iteration) {
      const middle: number = (near + far) / 2;
      if (capsuleBoxSeparation(capsule, start, box, place(middle)) < target)
        near = middle;
      else far = middle;
    }
    return (near + far) / 2;
  }

  /** Box placement at a distance along the approach. */
  function place(distance: number): IAutoMovieRigidTransform {
    return {
      position: Vector3.add(start.position, Vector3.scale(approach, distance)),
      rotation: Quaternion.fromAxisAngle(unit({ x: -2, y: 1, z: 1 }), 41),
    };
  }

  /** One-kilogram fixture profile carrying a single shape. */
  function profile(shape: IAutoMoviePhysicalShape): P {
    const base: P = PhysicalFixtures.sphere(0.1);
    return {
      ...base,
      segments: [{ ...base.segments[0]!, shapes: [shape] }],
    };
  }

  /** Normalize a nonzero direction. */
  function unit(vector: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.scale(vector, 1 / Vector3.length(vector));
  }
}
