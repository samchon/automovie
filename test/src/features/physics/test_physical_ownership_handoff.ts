import {
  AutoMoviePhysicalPlayback as Playback,
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  advancePhysicalOwnership,
  bindPhysicalWorld,
  physicalSupportPoint,
  samplePhysicalTarget,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/** Native subtree authority and C1 authored reconciliation share one collision/display tree.
 *
 * Scenarios:
 * 1. A moving parent remains authored while an impacted child simulates, returns and reactivates.
 * 2. Native entry retains actual pose and COM/angular velocity; midpoint colliders equal cached display.
 * 3. A checkpoint inside return and binary replay preserve exact frames and ownership metadata.
 * 4. Positive solver contact activates the complete receiving body irreversibly; a miss does not.
 * 5. A blocked return refuses instead of teleporting through its receiver.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `AutoMoviePhysicalPlayback` on in-memory inputs and asserts the returned observations through 9x TestValidator.equals, 11x TestValidator.predicate; 5 numbered scenarios (first: A moving parent remains authored while an impacted child simulates, returns and reactivates.; last: A blocked return refuses instead of teleporting through its receiver.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (13 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: A moving parent remains authored while an impacted child simulates, returns and reactivates.; last: A blocked return refuses instead of teleporting through its receiver.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_ownership_handoff`, which owns the cases delegated to `PhysicalFixtures`, `nclose`, `qclose`, `vclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A moving parent remains authored while an impacted child simulates, returns and reactivates.).
 */
export async function test_physical_ownership_handoff(): Promise<void> {
  const body: Simulation.IBody = movingBody(1);
  for (const [step, target] of body.targets.entries())
    target.dynamicSegments =
      (step >= 21 && step <= 44) || (step >= 57 && step <= 80) ? ["child"] : [];
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1);
  Object.assign(input, {
    substeps: 8,
    iterations: 32,
    internalIterations: 4,
    checkpointEvery: 12,
  });
  input.impulses.push({
    step: 30,
    body: body.id,
    bone: "child",
    point: { x: 0.1, y: 1.5, z: 0 },
    impulse: { x: 0, y: 0, z: 0.02 },
  });
  const baseline: Simulation = await Simulation.compute(input);
  TestValidator.equals(
    "root stays authored",
    baseline.cache.ownershipAt(body.id, "root", 0.4),
    "authored",
  );
  TestValidator.equals(
    "child return is explicit",
    baseline.cache.ownershipAt(body.id, "child", 0.4),
    "return",
  );
  TestValidator.equals(
    "reactivation interrupts return",
    baseline.cache.ownershipAt(body.id, "child", 0.5),
    "dynamic",
  );
  TestValidator.equals(
    "return reaches authored authority",
    baseline.cache.ownershipAt(body.id, "child", 1),
    "authored",
  );
  for (const frame of baseline.cache.frames) {
    const root: P.ITransform = frame.bodies[body.id]!.root!;
    const child: P.ITransform = frame.bodies[body.id]!.child!;
    TestValidator.predicate(
      "complete moving articulation retains its pivot",
      Vector3.length(
        Vector3.subtract(
          physicalSupportPoint(
            root,
            body.profile.joints[0]!.parentFrame.position,
          ),
          physicalSupportPoint(
            child,
            body.profile.joints[0]!.childFrame.position,
          ),
        ),
      ) < body.handoffLimits!.maximumLinearError,
    );
  }
  const entering: (typeof baseline.cache.frames)[number]["bodies"][string][string] =
    baseline.cache.at(44 / 120).bodies[body.id]!.child!;
  const returning: typeof entering = baseline.cache.at(45 / 120).bodies[
    body.id
  ]!.child!;
  TestValidator.predicate(
    "return entry has no velocity reset",
    Vector3.length(Vector3.subtract(entering.velocity, returning.velocity)) <
      0.05 &&
      Vector3.length(
        Vector3.subtract(entering.angularVelocity, returning.angularVelocity),
      ) < 0.1,
  );
  const world: World = RAPIER.World.restoreSnapshot(
    baseline.cache.checkpoints.get(48)!,
  );
  try {
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      baseline.input,
      true,
    );
    const actual: RigidBody = bound.bodies.get(`${body.id}/child`)!;
    const displayed: typeof entering =
      baseline.cache.at(0.4).bodies[body.id]!.child!;
    TestValidator.predicate(
      "return midpoint collider and display agree",
      vclose(actual.translation(), displayed.position) &&
        qclose(actual.rotation(), displayed.rotation),
    );
    const previous: typeof displayed = baseline.cache.at(47 / 120).bodies[
      body.id
    ]!.child!;
    const next: typeof displayed = baseline.cache.at(49 / 120).bodies[body.id]!
      .child!;
    const localCom: P.ITransform["position"] = body.profile.segments.find(
      (segment: P.ISegment): boolean => segment.bone === "child",
    )!.centerOfMass;
    const finiteCom: P.ITransform["position"] = Vector3.scale(
      Vector3.subtract(
        physicalSupportPoint(next, localCom),
        physicalSupportPoint(previous, localCom),
      ),
      60,
    );
    TestValidator.predicate(
      "native COM velocity agrees with independently sampled transport",
      Vector3.length(Vector3.subtract(actual.linvel(), finiteCom)) < 0.005,
    );
    const delta: P.ITransform["rotation"] = Quaternion.multiply(
      next.rotation,
      Quaternion.inverse(previous.rotation),
    );
    const norm: number = Math.hypot(delta.x, delta.y, delta.z);
    const scale: number =
      (120 * Math.atan2(norm, Math.abs(delta.w)) * (delta.w < 0 ? -1 : 1)) /
      norm;
    const finiteAngular: P.ITransform["position"] = {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    };
    TestValidator.predicate(
      "compound native angular derivative agrees with sampled rotation",
      Vector3.length(Vector3.subtract(actual.angvel(), finiteAngular)) < 0.01,
    );
  } finally {
    world.free();
  }
  const activation: World = RAPIER.World.restoreSnapshot(
    baseline.cache.checkpoints.get(48)!,
  );
  try {
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      activation,
      baseline.input,
      true,
    );
    const actual: RigidBody = bound.bodies.get(`${body.id}/child`)!;
    const before: {
      pose: P.ITransform;
      linear: P.ITransform["position"];
      angular: P.ITransform["position"];
    } = {
      pose: { position: actual.translation(), rotation: actual.rotation() },
      linear: actual.linvel(),
      angular: actual.angvel(),
    };
    const target: Simulation.ITarget = {
      ...baseline.input.bodies[0]!.targets[49]!,
      dynamicSegments: ["child"],
    };
    const goals: Parameters<typeof advancePhysicalOwnership>[0]["goals"] =
      Object.fromEntries(
        Object.entries(target.segments).map(
          ([bone, pose]: [string, P.ITransform]): [
            string,
            ReturnType<typeof samplePhysicalTarget>,
          ] => [
            bone,
            samplePhysicalTarget(
              baseline.input.bodies[0]!.targets[48]!.segments[bone]!,
              pose,
              1,
              120,
            ),
          ],
        ),
      );
    advancePhysicalOwnership({
      body: baseline.input.bodies[0]!,
      target,
      bound,
      goals,
      tick: 49 * 8,
      nativeRate: 120 * 8,
    });
    TestValidator.predicate(
      "activation keeps exact actual native state",
      actual.isDynamic() &&
        vclose(actual.translation(), before.pose.position) &&
        qclose(actual.rotation(), before.pose.rotation) &&
        vclose(actual.linvel(), before.linear) &&
        vclose(actual.angvel(), before.angular),
    );
  } finally {
    activation.free();
  }
  const changed: Simulation.IInput = structuredClone(input);
  changed.impulses.push({
    step: 94,
    body: body.id,
    bone: "child",
    point: { x: 0, y: 1.5, z: 0 },
    impulse: { x: 0, y: 0, z: 0 },
  });
  const fresh: Simulation = await Simulation.compute(changed);
  const resumed: Simulation = await Simulation.compute(changed, baseline);
  TestValidator.equals(
    "checkpoint resumes an active return exactly",
    JSON.stringify(resumed.cache.frames),
    JSON.stringify(fresh.cache.frames),
  );
  TestValidator.equals(
    "checkpoint preserves causal authority",
    JSON.stringify(resumed.cache.ownership),
    JSON.stringify(fresh.cache.ownership),
  );
  TestValidator.predicate(
    "checkpoint actually avoided the unchanged prefix",
    resumed.recomputedSteps === 36,
  );
  const bytes: Uint8Array = await Playback.encode(fresh.cache, 1_000_000);
  const playback: Playback = await Playback.decode(
    bytes,
    fresh.cache.identity,
    { maximumBytes: 1_000_000, maximumFrames: 121, maximumSegments: 2 },
  );
  TestValidator.equals(
    "binary ownership round trip",
    JSON.stringify(playback.ownership),
    JSON.stringify(fresh.cache.ownership),
  );
  for (const seconds of [0, 0.174, 0.4, 0.471, 0.8, 1])
    TestValidator.equals(
      "arbitrary-time authority matches live cache",
      playback.ownershipAt(body.id, "child", seconds),
      fresh.cache.ownershipAt(body.id, "child", seconds),
    );
  TestValidator.predicate(
    "final exact authored reunion",
    vclose(
      fresh.cache.at(1).bodies[body.id]!.child!.position,
      body.targets[120]!.segments.child!.position,
    ) &&
      qclose(
        fresh.cache.at(1).bodies[body.id]!.child!.rotation,
        body.targets[120]!.segments.child!.rotation,
      ),
  );
  for (const miss of [false, true]) {
    const receiving: Simulation.IBody = movingBody(0.5);
    for (const [step, target] of receiving.targets.entries())
      target.dynamicSegments = step < 30 ? ["child"] : [];
    receiving.releaseOnContact = {
      earliest: 0.05,
      latest: 0.3,
      shapes: ["child-surface"],
      otherBody: "striker",
      otherShapes: ["surface"],
    };
    const striker: Simulation.IBody = PhysicalFixtures.body(
      "striker",
      PhysicalFixtures.sphere(),
      0.5,
    );
    striker.mode = { kind: "kinematic" };
    for (const [step, target] of striker.targets.entries()) {
      const receivingPoint: P.ITransform["position"] =
        receiving.targets[step]!.segments.child!.position;
      target.segments.root!.position = {
        x: receivingPoint.x,
        y: miss ? 3 : receivingPoint.y,
        z: receivingPoint.z - 0.4 + (2 * step) / 120,
      };
    }
    const scene: Simulation.IInput = PhysicalFixtures.input(
      [receiving, striker],
      0.5,
    );
    scene.substeps = 8;
    scene.iterations = 32;
    const run: Simulation = await Simulation.compute(scene);
    TestValidator.equals(
      "only positive actual contact changes complete authority",
      run.cache.ownershipAt(receiving.id, "root", 0.5),
      miss ? "authored" : "dynamic",
    );
  }
  const ball: Simulation.IBody = PhysicalFixtures.body(
    "returning",
    PhysicalFixtures.sphere(),
    0.6,
  );
  for (const [step, target] of ball.targets.entries()) {
    target.dynamicSegments = step <= 24 ? ["root"] : [];
    target.segments.root!.position.x = (2 * step) / 120;
  }
  const obstacle: Simulation.IBody = PhysicalFixtures.body(
    "obstacle",
    PhysicalFixtures.sphere(),
    0.6,
  );
  obstacle.mode = { kind: "kinematic" };
  for (const target of obstacle.targets)
    target.segments.root!.position.x = 0.55;
  const blocked: Simulation.IInput = PhysicalFixtures.input(
    [ball, obstacle],
    0.6,
  );
  blocked.substeps = 8;
  blocked.impulses.push({
    step: 10,
    body: ball.id,
    bone: "root",
    impulse: { x: -2, y: 0, z: 0 },
    point: { x: 0.15, y: 1, z: 0 },
  });
  let refused: boolean = false;
  try {
    await Simulation.compute(blocked);
  } catch (error) {
    refused =
      error instanceof Error &&
      error.message.includes("Physical return intersects receiver");
  }
  TestValidator.predicate("blocked return is reported", refused);
  const authored: typeof entering =
    baseline.cache.at(0.4).bodies[body.id]!.root!;
  TestValidator.predicate(
    "fitted authored root retains interval progress",
    vclose(authored.position, body.targets[48]!.segments.root!.position, 1e-5),
  );
  TestValidator.predicate(
    "fitted authored parent retains compound angular transport",
    nclose(authored.velocity.x, 0.4, 1e-4) &&
      nclose(authored.angularVelocity.x, Math.PI / 9, 0.001) &&
      nclose(
        authored.angularVelocity.y,
        (Math.PI / 6) * Math.cos((0.4 * Math.PI) / 9),
        0.001,
      ) &&
      nclose(
        authored.angularVelocity.z,
        (Math.PI / 6) * Math.sin((0.4 * Math.PI) / 9),
        0.001,
      ),
  );
}

/** Two independently declared one-kilogram bodies have offset COMs, an oblique pivot, compound parent motion and a noncommuting child rotation. */
function movingBody(duration: number): Simulation.IBody {
  const prototype: P.ISegment = PhysicalFixtures.sphere().segments[0]!;
  const root: P.ISegment = {
    ...structuredClone(prototype),
    bone: "root",
    neutral: {
      position: { x: 0, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
  const child: P.ISegment = {
    ...structuredClone(prototype),
    bone: "child",
    neutral: {
      position: { x: 0.19, y: 1.65, z: 0.04 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
  root.centerOfMass = { x: -0.015, y: 0.01, z: 0.02 };
  child.centerOfMass = { x: 0.03, y: -0.02, z: 0.01 };
  root.shapes[0]!.id = "root-surface";
  child.shapes[0]!.id = "child-surface";
  const profile: P = {
    id: "moving-pair",
    mass: 2,
    centerOfMass: { x: 0.1025, y: 1.82, z: 0.035 },
    provenance:
      "Two declared one-kilogram rigid bodies, sphere collision envelopes and offset mass centres, joined at an oblique fixed pivot.",
    segments: [root, child],
    materials: PhysicalFixtures.sphere().materials,
    joints: [
      {
        id: "pivot",
        parent: "root",
        child: "child",
        parentFrame: {
          position: { x: 0.12, y: -0.2, z: 0.08 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        childFrame: {
          position: { x: -0.07, y: 0.15, z: 0.04 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        axes: (["x", "y", "z"] as const).map(
          (axis: "x" | "y" | "z"): P.IAxis => ({
            axis,
            channel: `pivot.${axis}`,
            minimum: -Math.PI / 2,
            maximum: Math.PI / 2,
            stiffness: 30,
            damping: 4,
            maximumTorque: 100,
            passiveDamping: 0.1,
          }),
        ),
      },
    ],
  };
  const result: Simulation.IBody = PhysicalFixtures.body(
    "pair",
    profile,
    duration,
  );
  result.handoffLimits = {
    maximumLinearError: 0.001,
    maximumJointViolation: 0.0001,
  };
  result.selfAvoidance = { iterations: 1, tolerance: 0.0001 };
  for (const [step, target] of result.targets.entries()) {
    target.strength = 1;
    const seconds: number = step / 120;
    const rootPose: P.ITransform = {
      position: { x: 0.4 * seconds, y: 2 + 0.05 * seconds, z: 0.02 * seconds },
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 20 * seconds),
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30 * seconds),
      ),
    };
    const childRotation: P.ITransform["rotation"] = Quaternion.multiply(
      rootPose.rotation,
      Quaternion.multiply(
        Quaternion.fromAxisAngle(
          { x: 0, y: 0, z: 1 },
          12 * Math.sin(Math.PI * seconds),
        ),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 8 * seconds),
      ),
    );
    target.segments.root = rootPose;
    target.segments.child = {
      position: Vector3.subtract(
        physicalSupportPoint(rootPose, profile.joints[0]!.parentFrame.position),
        Quaternion.rotateVector(
          childRotation,
          profile.joints[0]!.childFrame.position,
        ),
      ),
      rotation: childRotation,
    };
    target.bindings = [
      {
        id: "bound-child",
        kind: "separate",
        chain: ["child"],
        source: { bone: "child", shape: "child-surface" },
        target: { body: result.id, bone: "root", shape: "root-surface" },
        weight: 1,
        compression: 0,
        iterations: 1,
        tolerance: 0.0001,
      },
    ];
  }
  return result;
}
