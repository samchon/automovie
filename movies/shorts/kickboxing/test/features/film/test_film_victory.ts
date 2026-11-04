import assert from "node:assert/strict";
import * as THREE from "three";

import { FilmPlan } from "../../../src/film/FilmPlan";
import { FilmRoute } from "../../../src/film/FilmRoute";
import { FilmVictory } from "../../../src/film/FilmVictory";
import { LabActor } from "../../../src/motion-lab/LabActor";
import type { MotionAction } from "../../../src/motion/core/MotionAction";
import { FootworkMotion } from "../../../src/motion/defense/FootworkMotion";

/**
 * Keep the required ending steps and actual body-turn requests beneath the upper gesture.
 * Scenarios:
 * 1. Current corner plans begin after the complete count/decision and cover168.1..180 with three moving routes.
 * 2. Six15-degree supported phrases produce a90-degree body turn, not a cervical substitute.
 * 3. The consumed upper composition preserves the current route root, support, legs and hard sole tasks at two different swing states.
 * @evidence contracts/testing.md#observable-behavior Calls the actual FilmVictory plan and consumed compose function with the real FootworkMotion requests. It requires ongoing route movement after the first turn and checks that composing upper celebration cannot restore a fixed lower-body checkpoint or discard current foot tasks. No Human support, collision or rendered-motion approval is claimed.
 * @evidence contracts/testing.md#independent-cases The commission fixes victory after the ten count and completion at180. A quarter-turn is independently90degrees and six equal15-degree phrases preserve that sum. Distinct swing-state requests must remain distinct after composition while each exact root/support/leg/task request survives; native host convergence remains a separate actual-consumer gate.
 */
export function test_film_victory(): void {
  const plan: readonly FilmVictory.Stage[] = FilmVictory.plan(
    [-2.65, 0, -2.65],
    0,
  );
  assert.equal(plan[0]!.start, 168.1);
  assert.ok(plan[0]!.start > FilmPlan.decisionSeconds);
  assert.equal(plan.at(-1)!.end, 180);
  assert.equal(plan[0]!.turnRadians, -Math.PI / 2);
  for (let index: number = 0; index < plan.length; index++) {
    assert.ok(plan[index]!.end > plan[index]!.start);
    if (index) {
      assert.equal(plan[index]!.start, plan[index - 1]!.end);
      assert.notDeepEqual(
        plan[index]!.destination,
        plan[index - 1]!.destination,
      );
    }
  }
  let cursor: number = 0;
  const steps: FootworkMotion.Step[] = Array.from(
    { length: 6 },
    (_: unknown, index: number): FootworkMotion.Step => {
      const step: FootworkMotion.Step = {
        start: cursor,
        unload: 0.1,
        swing: 0.2,
        load: 0.1,
        follow: 0.2,
        settle: 0.2,
        first: index % 2 === 0 ? "left" : "right",
        displacement: [0, 0, 0],
        turnRadians: -Math.PI / 12,
        clearance: 0.025,
      };
      cursor = FootworkMotion.end(step);
      return step;
    },
  );
  const route: FootworkMotion = new FootworkMotion(
    "a",
    { left: [0.15, 0, 0.12], right: [-0.15, 0, -0.12] },
    steps,
  );
  assert.ok(
    Math.abs(route.sample(route.duration).rootRotation![1] + Math.SQRT1_2) <
      1e-12,
  );
  let prior: MotionAction.Sample | undefined;
  for (const seconds of [0.2, 0.55]) {
    const motion: FootworkMotion.Sample = route.sample(seconds);
    const actual: MotionAction.Sample = {
      pose: {
        legs: {
          left: { knee: { flexion: 12 } },
          right: { knee: { flexion: 18 } },
        },
      },
      rootOffset: [...motion.rootOffset],
      rootRotation: motion.rootRotation ? [...motion.rootRotation] : undefined,
      support: structuredClone(motion.support),
      effectors: (["left", "right"] as const).map(
        (side: MotionAction.Side): MotionAction.Effector => ({
          bone: `${side}Foot`,
          target: [...motion.feet[side].target],
          role: "guide",
          constraint: "hard",
          radius: 0,
        }),
      ),
      elapsed: seconds,
      phase: "delivery",
      progress: seconds / route.duration,
    };
    const composed: MotionAction.Sample = FilmVictory.compose(
      actual,
      168.1 + seconds,
    );
    assert.deepEqual(composed.rootOffset, actual.rootOffset);
    assert.deepEqual(composed.rootRotation, actual.rootRotation);
    assert.deepEqual(composed.support, actual.support);
    assert.deepEqual(composed.pose.legs, actual.pose.legs);
    assert.deepEqual(composed.effectors, actual.effectors);
    if (prior) assert.notDeepEqual(composed.effectors, prior.effectors);
    prior = composed;
  }
}

/**
 * Preserve an independently declared nonzero sole residual through actual route composition.
 * Scenarios:
 * 1. An original loaded WORLD goal sits50micrometres from actual FK within the unchanged native admission bound.
 * 2. The real route, upper celebration and same-time reapplication retain that goal at a nonzero actor heading; stopped observation continues to report achieved FK separately.
 * 3. Endpoint adoption and reverse seek retain original tasks, actual floor admission and the immutable route baseline.
 * 4. Sparse, short, extra and nonfinite displacement tuples refuse before retaining an empty route; the moving endpoint retains each original WORLD anchor plus the independent rotated displacement.
 * @evidence contracts/testing.md#observable-behavior Uses one real LabActor, its public original Human support consumer, FilmRoute and the delivered FilmVictory composition. A deliberately small independently authored residual must remain visible rather than becoming a zero-error replacement goal. Both source effectors and original support requests survive actual reapplication and adoption without monkey-patching a solver or observation method.
 * @evidence contracts/testing.md#independent-cases The independent goal is the initial real sole point plus50micrometres along WORLD X, below the unchanged250micrometre admission bound but clearly different from achieved FK. The moving endpoint must add40millimetres rotated by the original heading to each original goal. Direct final carrier matrices and root-local effector transforms cross-check those fixed goals. Every coordinate hole, wrong length and nonfinite coordinate refuses; a valid route, nonzero heading, endpoint adoption and reverse seek distinguish frame conversion, task authority and baseline ownership without certifying rendered quality or continuous balance.
 */
export function test_film_victory_world_authority(): void {
  const actor: LabActor = new LabActor("a", "a", 0, Math.PI / 5);
  try {
    const left: MotionAction.SupportPatch = structuredClone(
      actor.patches.left.low,
    );
    const right: MotionAction.SupportPatch = structuredClone(
      actor.patches.right.low,
    );
    left.world[0] += 0.00005;
    const independent: MotionAction.Vec3 = [...left.world];
    actor.apply({
      pose: structuredClone(actor.basePose),
      rootOffset: [0, 0, 0],
      support: { left: 0.5, right: 0.5, patches: [left, right] },
      effectors: [],
      phase: "complete",
      elapsed: 0,
      progress: 1,
    });
    assert.equal(actor.support?.status, "admitted");
    actor.adopt();
    assert.deepEqual(actor.patches.left.low.world, independent);
    const initialYaw: number = actor.yaw;
    for (const axis of [0, 1, 2]) {
      const sparse: number[] = new Array<number>(3);
      for (let index: number = 0; index < 3; index++)
        if (index !== axis) sparse[index] = index === 0 ? 0.04 : 0;
      assert.throws(
        (): FilmRoute => new FilmRoute(actor, sparse as MotionAction.Vec3, 0.8),
        /finite horizontal three-tuple/,
      );
      const nonfinite: MotionAction.Vec3 = [0.04, 0, 0];
      nonfinite[axis] = Infinity;
      assert.throws(
        (): FilmRoute => new FilmRoute(actor, nonfinite, 0.8),
        /finite horizontal three-tuple/,
      );
    }
    for (const malformed of [[], [0.04, 0], [0.04, 0, 0, 0]])
      assert.throws(
        (): FilmRoute => new FilmRoute(actor, malformed as MotionAction.Vec3, 0.8),
        /finite horizontal three-tuple/,
      );
    assert.deepEqual(actor.patches.left.low.world, independent);
    const route: FilmRoute = new FilmRoute(actor, [0.04, 0, 0], 0.8);
    const entry: MotionAction.Sample = route.evaluate(0);
    const original: MotionAction.SupportPatch = entry.support.patches!.find(
      (patch: MotionAction.SupportPatch): boolean =>
        patch.side === "left" && patch.mode === "planted",
    )!;
    assert.deepEqual(original.world, independent);
    const carrier: THREE.Group = actor.person.drawing.bones.get(original.bone)!;
    const achieved: MotionAction.Vec3 = carrier
      .localToWorld(new THREE.Vector3(...original.localPoint))
      .toArray();
    const residual: number = new THREE.Vector3(...achieved).distanceTo(
      new THREE.Vector3(...independent),
    );
    assert.ok(
      residual > 0.000001 && residual <= 0.00025,
      `Original residual: ${residual}`,
    );
    const stopped: MotionAction.SupportPatch = actor
      .constrained()
      .support.patches!.find(
        (patch: MotionAction.SupportPatch): boolean =>
          patch.side === "left" && patch.mode === "planted",
      )!;
    assert.deepEqual(stopped.world, achieved);
    assert.notDeepEqual(stopped.world, independent);
    actor.apply(FilmVictory.compose(entry, FilmPlan.victory.start));
    assert.equal(actor.support?.status, "admitted");
    assert.deepEqual(actor.sample!.support.patches, entry.support.patches);
    for (const effector of actor.sample!.effectors) {
      const point: MotionAction.SupportPatch = entry.support.patches!.find(
        (patch: MotionAction.SupportPatch): boolean =>
          patch.bone === effector.bone,
      )!;
      const world: THREE.Vector3 = actor.person.object.localToWorld(
        new THREE.Vector3(...effector.target),
      );
      assert.ok(world.distanceTo(new THREE.Vector3(...point.world)) < 1e-10);
    }
    actor.adopt();
    assert.deepEqual(actor.patches.left.low.world, independent);
    const endpoint: MotionAction.Sample = route.evaluate(route.duration);
    assert.equal(endpoint.phase, "complete");
    assert.equal(endpoint.elapsed, route.sourceDuration);
    for (const side of ["left", "right"] as const) {
      const initial: MotionAction.SupportPatch = side === "left" ? left : right;
      const expected: THREE.Vector3 = new THREE.Vector3(
        initial.world[0] + 0.04 * Math.cos(initialYaw),
        initial.world[1],
        initial.world[2] - 0.04 * Math.sin(initialYaw),
      );
      const goal: MotionAction.SupportPatch = endpoint.support.patches!.find(
        (patch: MotionAction.SupportPatch): boolean =>
          patch.side === side && patch.mode === "planted",
      )!;
      assert.ok(new THREE.Vector3(...goal.world).distanceTo(expected) < 1e-12);
    }
    actor.apply(
      FilmVictory.compose(endpoint, FilmPlan.victory.start + route.duration),
    );
    assert.equal(actor.support?.status, "admitted");
    const endGoal: MotionAction.Vec3 = [
      ...actor.sample!.support.patches!.find(
        (patch: MotionAction.SupportPatch): boolean =>
          patch.side === "left" && patch.mode === "planted",
      )!.world,
    ];
    actor.adopt();
    assert.deepEqual(actor.patches.left.low.world, endGoal);
    assert.deepEqual(route.evaluate(0).support.patches, entry.support.patches);
    assert.equal(actor.support?.status, "admitted");
  } finally {
    actor.dispose();
  }
}
