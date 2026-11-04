import { AutoMovieHumanRigControls } from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { LabActor } from "../../../../src/motion-lab/LabActor";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";

/**
 * Borrowed original support frames survive reuse, seeks and caller mutation.
 * @evidence contracts/testing.md#observable-behavior Compares each returned source carrier point with the original native bone's relative matrix, separately requires one plain-contact point and three explicit frame points, and retains the same callback across actor reset and pose application.
 * @evidence contracts/testing.md#independent-cases The native matrix oracle uses the declared original world anchor rather than an achieved goal. Input and returned-tuple mutation cannot change a later call; opposite heading and a new baseline cannot silently rebind an existing callback.
 */
export function test_body_support_targets_snapshots(): void {
  const actor: LabActor = new LabActor("borrowed", "a", -0.55, 0);
  try {
    const targets: NonNullable<MotionAction.Context["supportTargets"]> =
      actor.context("left", [0, 0, 0]).supportTargets!;
    const patch: MotionAction.SupportPatch = {
      ...structuredClone(actor.patches.left.low),
      mode: "free",
      constraint: "hard",
      frameRotation: [0, 0, 0, 1],
    };
    const originalInput: string = JSON.stringify(patch);
    const first: ReturnType<typeof targets> = targets(patch);
    assert.equal(first.length, 3);
    const bone: THREE.Group = actor.person.drawing.bones.get(patch.bone)!;
    const centre: THREE.Vector3 = bone.localToWorld(
      new THREE.Vector3(...patch.localPoint),
    );
    for (const goal of first) {
      const expected: THREE.Vector3 = bone
        .localToWorld(new THREE.Vector3(...goal.localPoint!))
        .sub(centre)
        .add(new THREE.Vector3(...patch.world));
      assert.ok(
        expected.distanceTo(new THREE.Vector3(...goal.position)) < 1e-12,
      );
    }
    const retained: string = JSON.stringify(first);
    const plain: MotionAction.SupportPatch = {
      ...patch,
      mode: "planted",
      frameRotation: undefined,
    };
    assert.equal(targets(plain).length, 1);
    assert.equal(JSON.stringify(patch), originalInput);
    actor.apply({
      pose: structuredClone(actor.basePose),
      rootOffset: [0, 0, 0],
      support: {
        left: 0.5,
        right: 0.5,
        patches: [actor.patches.left.low, actor.patches.right.low],
      },
      effectors: [],
      phase: "idle",
      elapsed: 0,
      progress: 0,
    });
    actor.reset(0.7, Math.PI, "right");
    assert.equal(JSON.stringify(first), retained);
    assert.equal(JSON.stringify(targets(patch)), retained);
    Reflect.set(first[0]!.position, "0", 99);
    assert.equal(JSON.stringify(targets(patch)), retained);
    assert.equal(JSON.stringify(patch), originalInput);
  } finally {
    actor.dispose();
  }
}

/**
 * A known actual body realizes its original rigid frames before a fixed-body arm application.
 * @evidence contracts/testing.md#observable-behavior Reapplies original left/right native sole frames on both headings, requires admitted support and unchanged root, then consumes a same-pose real Hand task through the shoulder-only stage. Every original foot remains above the same floor and original support goals remain unchanged.
 * @evidence contracts/testing.md#independent-cases This retains the known-pose coordinate oracle separately from unreachable motion authoring. The final native root and complete leg pose must equal the returned placement; caller mutation cannot alter the actor's independently stored body snapshot.
 */
export function test_body_stages_actual_reapplication(): void {
  const failures: string[] = [];
  for (const role of ["a", "b"] as const) {
    const actor: LabActor = new LabActor(
      role,
      role,
      role === "a" ? -0.55 : 0.55,
      role === "a" ? 0 : Math.PI,
    );
    try {
      const plan: MotionAction.BodyPlacement = knownBody(actor);
      const input: string = JSON.stringify(plan);
      const placement: MotionAction.BodyPlacement = actor.prepareBody(plan);
      assert.equal(actor.support?.status, "admitted");
      assert.ok(actor.support!.supportError <= 0.00025);
      assert.ok(actor.support!.floorMinimum >= -0.000001);
      assert.equal(JSON.stringify(plan), input);
      const beforeRoot: MotionAction.Vec3 =
        actor.person.object.position.toArray();
      const beforeLegs: string = JSON.stringify(actor.pose.legs);
      const side: MotionAction.Side = role === "a" ? "left" : "right";
      const localPoint: MotionAction.Vec3 = actor
        .glove(side)
        .position.toArray();
      const point: MotionAction.Vec3 = actor.person.object
        .worldToLocal(
          actor.person.drawing.bones
            .get(`${side}Hand`)!
            .localToWorld(new THREE.Vector3(...localPoint)),
        )
        .toArray();
      const channels: AutoMovieHumanRigControls.DegreeChannel[] =
        AutoMovieHumanRigControls.chain({ region: "arm", side }).filter(
          (channel: AutoMovieHumanRigControls.DegreeChannel): boolean =>
            channel.startsWith(`arms.${side}.shoulder.`),
        );
      actor.applyArm(
        {
          pose: structuredClone(actor.pose),
          rootOffset: [...placement.rootOffset],
          rootRotation: placement.rootRotation
            ? [...placement.rootRotation]
            : undefined,
          support: structuredClone(placement.support) as MotionAction.Support,
          effectors: [
            {
              bone: `${side}Hand`,
              localPoint,
              target: point,
              role: "guard",
              radius: actor.context(side, [0, 0, 0]).geometry
                .gloveRadiusMetres!,
            },
          ],
          phase: "idle",
          elapsed: 0,
          progress: 0,
        },
        placement,
        side,
        channels,
      );
      assert.equal(actor.support?.status, "admitted");
      assert.ok(actor.support!.floorMinimum >= -0.000001);
      assert.ok(
        actor.errors.every(
          (error: { error: number }): boolean => error.error <= 0.00025,
        ),
      );
      assert.deepEqual(actor.person.object.position.toArray(), beforeRoot);
      assert.equal(JSON.stringify(actor.pose.legs), beforeLegs);
      const state: {
        fittingPlan: { channels: string[]; budget: { rootAxes: string[] } };
        bodyPreparation: object;
      } = actor.inspect() as {
        fittingPlan: { channels: string[]; budget: { rootAxes: string[] } };
        bodyPreparation: object;
      };
      assert.deepEqual(state.fittingPlan.budget.rootAxes, []);
      assert.ok(
        state.fittingPlan.channels.every((channel: string): boolean =>
          /^arms\.(left|right)\.shoulder\./u.test(channel),
        ),
      );
      const stored: string = JSON.stringify(state.bodyPreparation);
      if (Reflect.set(placement.rootOffset, "0", 99))
        assert.throws(
          (): void => actor.applyArm(actor.sample!, placement, side, channels),
          /prepared body snapshot/u,
        );
      assert.equal(
        JSON.stringify(
          (actor.inspect() as { bodyPreparation: object }).bodyPreparation,
        ),
        stored,
      );
    } catch (error: unknown) {
      failures.push(
        `${role}: ${error instanceof Error ? error.stack : String(error)}`,
      );
    } finally {
      actor.dispose();
    }
  }
  assert.deepEqual(failures, []);
}

/**
 * An impossible body plan cannot become arm authoring or disturb a committed actor.
 * @evidence contracts/testing.md#observable-behavior Keeps the original world feet while requesting an unreachable root displacement. Preparation must refuse, preserve its raw observed stage and restore the original actual pose/root/support state atomically.
 * @evidence contracts/testing.md#independent-cases Original floor, geometry, world anchors and budgets remain unchanged. This is a deliberate negative plan, distinct from the admitted known-pose oracle, and no achieved goal or zero-load fallback can satisfy it.
 */
export function test_body_stages_refused_plan_rollback(): void {
  const actor: LabActor = new LabActor("rollback-body", "a", 0, 0);
  try {
    const plan: MotionAction.BodyPlacement = knownBody(actor);
    actor.prepareBody(plan);
    const beforePose: string = JSON.stringify(actor.pose);
    const beforeRoot: MotionAction.Vec3 =
      actor.person.object.position.toArray();
    const beforeRequest: string = JSON.stringify(actor.sample);
    const impossible: MotionAction.BodyPlacement = {
      ...plan,
      rootOffset: [10, plan.rootOffset[1], plan.rootOffset[2]],
    };
    assert.throws(
      (): unknown => actor.prepareBody(impossible),
      /Body support is unresolved/u,
    );
    assert.equal(JSON.stringify(actor.pose), beforePose);
    assert.deepEqual(actor.person.object.position.toArray(), beforeRoot);
    assert.equal(JSON.stringify(actor.sample), beforeRequest);
    const state: {
      failedAttempt: {
        observed: {
          support: { status: string };
          requested: { rootOffset: MotionAction.Vec3 };
        };
      };
    } = actor.inspect() as {
      failedAttempt: {
        observed: {
          support: { status: string };
          requested: { rootOffset: MotionAction.Vec3 };
        };
      };
    };
    assert.equal(state.failedAttempt.observed.support.status, "unresolved");
    assert.equal(state.failedAttempt.observed.requested.rootOffset[0], 10);
  } finally {
    actor.dispose();
  }
}

/** Actual source points define this independent identity oracle, not a future motion target. */
function knownBody(actor: LabActor): MotionAction.BodyPlacement {
  return {
    pose: structuredClone(actor.pose),
    rootOffset: actor.person.object.position
      .clone()
      .sub(actor.origin)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw)
      .toArray(),
    support: {
      left: 0.5,
      right: 0.5,
      patches: (["left", "right"] as const).map(
        (side: MotionAction.Side): MotionAction.SupportPatch => {
          const patch: MotionAction.SupportPatch = actor.patches[side].low;
          const group: THREE.Group = actor.person.drawing.bones.get(
            patch.bone,
          )!;
          return {
            ...structuredClone(patch),
            world: group
              .localToWorld(new THREE.Vector3(...patch.localPoint))
              .toArray(),
            mode: "planted",
            constraint: "hard",
            frameRotation: [0, 0, 0, 1],
          };
        },
      ),
    },
  };
}
