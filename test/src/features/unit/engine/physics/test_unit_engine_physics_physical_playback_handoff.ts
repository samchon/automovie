import {
  AutoMovieXpbdBody,
  AutoMovieXpbdWorld,
  AutoMoviePhysicalPlayback as Playback,
  Quaternion,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  advancePhysicalOwnership,
  bindPhysicalWorld,
  physicalSupportPoint,
  samplePhysicalTarget,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { nclose } from "../../../internal/nclose";
import { physicalMovingPair } from "../../../internal/physicalMovingPair";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** How far the return's entry velocity may jump, m/s. */
const LINEAR_JUMP: number = 0.05;

/** How far the return's entry angular velocity may jump, rad/s. */
const ANGULAR_JUMP: number = 0.1;

/** How far the solver's centre-of-mass velocity may stand from transport, m/s. */
const COM_RATE: number = 0.005;

/** How far the solver's angular velocity may stand from transport, rad/s. */
const TURN_RATE: number = 0.01;

/**
 * The handoff between the authored pose and the native solver
 * (`advancePhysicalOwnership`, through `AutoMoviePhysicalSimulation`): a child
 * simulates under a moving authored parent, returns to its authored pose
 * continuously and reactivates, the join keeping the solver's actual state.
 *
 * Scenarios, the moving pair over 1 s, its child dynamic over steps 21 to 44
 * and 57 to 80 and struck at 30:
 *
 * 1. The root stays `authored`; the child is `return` at 0.4 s, `dynamic` again at
 *    0.5 s and `authored` by 1 s; the pivot holds within the handoff limit in
 *    every frame; the return's entry neither resets the velocity nor the
 *    angular velocity; the authored root keeps its interval progress and its
 *    compound turn rate `(pi/9, pi/6 cos(0.4 pi/9), pi/6 sin(0.4 pi/9))`.
 * 2. Restored from the snapshot at 48, the child's collider is where the cache
 *    displays it, and its velocities are the sampled transport's; activating it
 *    keeps its actual pose and velocities.
 * 3. A run resumed from the snapshot equals an uninterrupted one, frames and
 *    ownership, recomputing 36 steps; the ownership survives an archive encode
 *    and decode and reads the same at any second; the child rejoins its
 *    authored pose exactly at 1 s.
 */
export async function test_unit_engine_physics_physical_playback_handoff(): Promise<void> {
  const body: IAutoMoviePhysicalSimulationInput.IBody = physicalMovingPair(1);
  for (const [step, target] of body.targets.entries())
    target.dynamicSegments =
      (step >= 21 && step <= 44) || (step >= 57 && step <= 80) ? ["child"] : [];
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1);
  input.substeps = 8;
  input.checkpointEvery = 12;
  input.impulses.push({
    step: 30,
    body: body.id,
    bone: "child",
    point: { x: 0.1, y: 1.5, z: 0 },
    impulse: { x: 0, y: 0, z: 0.02 },
  });
  const baseline: IAutoMoviePhysicalSimulation =
    await Simulation.compute(input);
  const cache = baseline.cache;

  // 1. The authority sequence and the join.
  TestValidator.equals(
    "the authority sequence",
    [
      cache.ownershipAt(body.id, "root", 0.4),
      cache.ownershipAt(body.id, "child", 0.4),
      cache.ownershipAt(body.id, "child", 0.5),
      cache.ownershipAt(body.id, "child", 1),
    ],
    ["authored", "return", "dynamic", "authored"],
  );
  const joint = body.profile.joints[0]!;
  TestValidator.predicate(
    "the pivot holds",
    cache.frames.every(
      (frame): boolean =>
        Vector3.distance(
          physicalSupportPoint(
            frame.bodies[body.id]!.root!,
            joint.parentFrame.position,
          ),
          physicalSupportPoint(
            frame.bodies[body.id]!.child!,
            joint.childFrame.position,
          ),
        ) < body.handoffLimits!.maximumLinearError,
    ),
  );
  const entering = cache.at(44 / 120).bodies[body.id]!.child!;
  const returning = cache.at(45 / 120).bodies[body.id]!.child!;
  const authored = cache.at(0.4).bodies[body.id]!.root!;
  TestValidator.predicate(
    "a continuous join",
    Vector3.distance(entering.velocity, returning.velocity) < LINEAR_JUMP &&
      Vector3.distance(entering.angularVelocity, returning.angularVelocity) <
        ANGULAR_JUMP &&
      vclose(
        authored.position,
        body.targets[48]!.segments.root!.position,
        1e-5,
      ) &&
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

  // 2. The solver's state at the join.
  const restored = (): AutoMovieXpbdBody =>
    bindPhysicalWorld(
      AutoMovieXpbdWorld.restoreSnapshot(cache.checkpoints.get(48)!),
      baseline.input,
      true,
    ).bodies.get(`${body.id}/child`)!;
  const actual: AutoMovieXpbdBody = restored();
  const displayed = cache.at(0.4).bodies[body.id]!.child!;
  const previous = cache.at(47 / 120).bodies[body.id]!.child!;
  const next = cache.at(49 / 120).bodies[body.id]!.child!;
  const com = body.profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === "child",
  )!.centerOfMass;
  const delta = Quaternion.multiply(
    next.rotation,
    Quaternion.inverse(previous.rotation),
  );
  const norm: number = Math.hypot(delta.x, delta.y, delta.z);
  const scale: number =
    (120 * Math.atan2(norm, Math.abs(delta.w)) * (delta.w < 0 ? -1 : 1)) / norm;
  TestValidator.predicate(
    "the solver at the join",
    vclose(actual.translation(), displayed.position) &&
      qclose(actual.rotation(), displayed.rotation) &&
      Vector3.distance(
        actual.linvel(),
        Vector3.scale(
          Vector3.subtract(
            physicalSupportPoint(next, com),
            physicalSupportPoint(previous, com),
          ),
          60,
        ),
      ) < COM_RATE &&
      Vector3.distance(actual.angvel(), {
        x: delta.x * scale,
        y: delta.y * scale,
        z: delta.z * scale,
      }) < TURN_RATE,
  );
  const bound = bindPhysicalWorld(
    AutoMovieXpbdWorld.restoreSnapshot(cache.checkpoints.get(48)!),
    baseline.input,
    true,
  );
  const child: AutoMovieXpbdBody = bound.bodies.get(`${body.id}/child`)!;
  const before = {
    position: child.translation(),
    rotation: child.rotation(),
    linear: child.linvel(),
    angular: child.angvel(),
  };
  const target: IAutoMoviePhysicalSimulationInput.ITarget = {
    ...baseline.input.bodies[0]!.targets[49]!,
    dynamicSegments: ["child"],
  };
  const goals: Parameters<typeof advancePhysicalOwnership>[0]["goals"] = {};
  for (const [bone, pose] of Object.entries(target.segments))
    goals[bone] = samplePhysicalTarget(
      baseline.input.bodies[0]!.targets[48]!.segments[bone]!,
      pose,
      1,
      120,
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
    "activation keeps the actual state",
    child.isDynamic() &&
      vclose(child.translation(), before.position) &&
      qclose(child.rotation(), before.rotation) &&
      vclose(child.linvel(), before.linear) &&
      vclose(child.angvel(), before.angular),
  );

  // 3. Resume and replay.
  const changed: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  changed.impulses.push({
    step: 94,
    body: body.id,
    bone: "child",
    point: { x: 0, y: 1.5, z: 0 },
    impulse: { x: 0, y: 0, z: 0 },
  });
  const fresh: IAutoMoviePhysicalSimulation = await Simulation.compute(changed);
  const resumed: IAutoMoviePhysicalSimulation = await Simulation.compute(
    changed,
    baseline,
  );
  TestValidator.equals(
    "a resumed run is the uninterrupted one",
    [
      JSON.stringify(resumed.cache.frames) ===
        JSON.stringify(fresh.cache.frames),
      JSON.stringify(resumed.cache.ownership) ===
        JSON.stringify(fresh.cache.ownership),
      resumed.recomputedSteps,
    ],
    [true, true, 36],
  );
  const playback: IAutoMoviePhysicalPlayback = await Playback.decode(
    await Playback.encode(fresh.cache, 1_000_000),
    fresh.cache.identity,
    { maximumBytes: 1_000_000, maximumFrames: 121, maximumSegments: 2 },
  );
  TestValidator.equals(
    "the archived ownership",
    [0, 0.174, 0.4, 0.471, 0.8, 1].map(
      (seconds: number): boolean =>
        playback.ownershipAt(body.id, "child", seconds) ===
        fresh.cache.ownershipAt(body.id, "child", seconds),
    ),
    [true, true, true, true, true, true],
  );
  const end: IAutoMovieRigidTransform =
    fresh.cache.at(1).bodies[body.id]!.child!;
  TestValidator.predicate(
    "rejoined",
    JSON.stringify(playback.ownership) ===
      JSON.stringify(fresh.cache.ownership) &&
      vclose(end.position, body.targets[120]!.segments.child!.position) &&
      qclose(end.rotation, body.targets[120]!.segments.child!.rotation),
  );
}
