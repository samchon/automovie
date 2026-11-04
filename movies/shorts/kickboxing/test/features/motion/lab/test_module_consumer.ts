import { createAutoMovieMeshCrossingQuery } from "@automovie/engine";
import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { LabActor } from "../../../../src/motion-lab/LabActor";
import { LabCase } from "../../../../src/motion-lab/LabCase";
import type { LabSettings } from "../../../../src/motion-lab/LabSettings";
import { prepareLabHuman } from "../../../../src/motion-lab/prepareLabHuman";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { DefenseMotion } from "../../../../src/motion/defense/DefenseMotion";

/**
 * Retained inspection evidence stays independent of later seeks and caller edits.
 * @evidence contracts/testing.md#observable-behavior Retains the actual two-actor case inspection while the same actors seek forward, backward and reset. Complete serialized observations, nested error arrays and cost records must remain unchanged; caller mutation of returned pose/request/error/cost data must not change live state.
 * @evidence contracts/testing.md#independent-cases This is the real public original-Human consumer, not a copied result fixture. It does not require a motion to be physically admitted merely to prove historical evidence isolation, and it separately checks actor and composition snapshots.
 */
export function test_module_consumer_inspection_snapshots(): void {
  const sample: LabCase = new LabCase({
    ...settings(),
    action: "step",
    distance: 1.5,
  });
  try {
    sample.evaluate(0.2);
    const first: object = sample.inspect();
    const firstActor: object = sample.actors.a.inspect();
    const original: string = JSON.stringify(first);
    const originalActor: string = JSON.stringify(firstActor);
    sample.evaluate(0.5);
    sample.evaluate(0);
    assert.equal(JSON.stringify(first), original);
    assert.equal(JSON.stringify(firstActor), originalActor);
    const current: {
      request: { timing: { delivery: number } };
      actors: {
        a: {
          effectorErrors: { error: number }[];
          cpuCosts: { groundingMs: number };
          requested: MotionAction.Sample;
        };
      };
    } = sample.inspect() as {
      request: { timing: { delivery: number } };
      actors: {
        a: {
          effectorErrors: { error: number }[];
          cpuCosts: { groundingMs: number };
          requested: MotionAction.Sample;
        };
      };
    };
    const live: string = JSON.stringify(sample.inspect());
    current.request.timing.delivery = 999;
    current.actors.a.effectorErrors[0]!.error = 999;
    current.actors.a.cpuCosts.groundingMs = 999;
    current.actors.a.requested.rootOffset[0] = 999;
    assert.equal(JSON.stringify(sample.inspect()), live);
  } finally {
    sample.dispose();
  }
}

/**
 * A reusable composition preserves an explicitly adopted entry instead of resetting the actors.
 *
 * Scenarios:
 * 1. A translated, rotated actor pair retains its current roots and unique action identity.
 * 2. Replaying the original local zero reproduces that entry with native support admitted.
 * 3. Invalid preserve-entry requests refuse before allocating their own pair.
 *
 * @evidence contracts/testing.md#observable-behavior Builds the actual portable polygon actors at nondefault roots/headings, adopts them and consumes the existing step case through its additive constructor boundary. Original roots and public phase identity must survive preparation and replay; no mock rig, server or renderer participates.
 * @evidence contracts/testing.md#independent-cases The caller's literal .8/2.1 metre roots and pi/3 headings differ from distance-derived laboratory placement, detecting an accidental reset. Native support/floor checks remain unchanged, and pure constructor failures cover the borrowed-actor precondition.
 */
export function test_module_consumer_preserved_entry(): void {
  assert.throws(
    (): unknown => new LabCase(settings(), undefined, { preserveEntry: true }),
    /borrowed adopted actors/u,
  );
  const actors: Record<"a" | "b", LabActor> = {
    a: new LabActor("a", "a", 0.8, Math.PI / 3),
    b: new LabActor("b", "b", 2.1, -Math.PI / 3),
  };
  try {
    actors.a.adopt();
    actors.b.adopt();
    const roots: MotionAction.Vec3[] = [
      actors.a.person.object.position.toArray(),
      actors.b.person.object.position.toArray(),
    ];
    const yaw: number[] = [actors.a.yaw, actors.b.yaw];
    const sample: LabCase = new LabCase(
      { ...settings(), action: "step" },
      actors,
      { preserveEntry: true, actionId: "sequence-17:step" },
    );
    try {
      assert.equal(
        sample.admissionError,
        null,
        JSON.stringify(sample.inspect()),
      );
      sample.evaluate(0);
      const state: { request: MotionAction.Request } = sample.inspect() as {
        request: MotionAction.Request;
      };
      assert.equal(state.request.id, "sequence-17:step");
      assert.equal(state.request.actorId, "a");
      assert.equal(state.request.targetId, "b");
      for (const [index, actor] of Object.values(actors).entries()) {
        assert.ok(
          new THREE.Vector3(...roots[index]!).distanceTo(
            actor.person.object.position,
          ) < 0.00025,
        );
        assert.equal(actor.yaw, yaw[index]);
        assertPhysical(actor);
      }
      const original: string = JSON.stringify([
        actors.a.pose,
        actors.b.pose,
        actors.a.sample?.support,
        actors.b.sample?.support,
      ]);
      actors.a.reset(-1.7, Math.PI, "right");
      actors.b.reset(0.4, 0, "left");
      actors.a.adopt();
      actors.b.adopt();
      sample.evaluate(0);
      assert.equal(
        JSON.stringify([
          actors.a.pose,
          actors.b.pose,
          actors.a.sample?.support,
          actors.b.sample?.support,
        ]),
        original,
      );
      assert.equal(actors.a.origin.x, roots[0]![0]);
      assert.equal(actors.b.origin.x, roots[1]![0]);
    } finally {
      sample.dispose();
    }
  } finally {
    actors.a.dispose();
    actors.b.dispose();
  }
}

/**
 * Explicit receiver phase seconds preserve their own clock and caller ownership.
 *
 * Scenarios:
 * 1. Omission retains the original guard defense's nominal dwell.
 * 2. An explicit longer receiver dwell is copied without changing the punch timing.
 * 3. Invalid phase seconds refuse before a source case can become operational.
 *
 * @evidence contracts/testing.md#observable-behavior Uses the real two-actor module consumer and its detached source inspection. Literal .45 receiving dwell differs from the .025 attack dwell, distinguishing independent defensive timing from resetting or relabelling the strike clock.
 * @evidence contracts/testing.md#independent-cases Existing guard contact fixtures supply a real admitted interaction. Mutation and malformed-input cases exercise input ownership and original module validation; these checks do not claim a low-elbow finishing performance or watched approval.
 */
export function test_module_consumer_defense_timing(): void {
  const normal: LabCase = new LabCase(settings());
  try {
    assert.equal(normal.admissionError, null, JSON.stringify(normal.inspect()));
    const defaultState: {
      defense: { request: MotionAction.Request };
      resolvedTiming: MotionAction.Timing;
    } = normal.inspect() as {
      defense: { request: MotionAction.Request };
      resolvedTiming: MotionAction.Timing;
    };
    assert.equal(defaultState.defense.request.timing.contact, 0.025);
    const phases: MotionAction.Timing = {
      preparation: 0,
      delivery: 0.12,
      contact: 0.45,
      retraction: 0.18,
      recovery: 0.1,
    };
    const selected: LabCase = new LabCase(settings(), normal.actors, {
      actionId: "timing-override",
      defenseTiming: phases,
    });
    try {
      assert.equal(
        selected.admissionError,
        null,
        JSON.stringify(selected.inspect()),
      );
      const state: typeof defaultState =
        selected.inspect() as typeof defaultState;
      assert.deepEqual(state.defense.request.timing, phases);
      assert.deepEqual(state.resolvedTiming, defaultState.resolvedTiming);
      phases.contact = 99;
      assert.equal(
        (selected.inspect() as typeof defaultState).defense.request.timing
          .contact,
        0.45,
      );
      selected.evaluate(0);
      assertPhysical(selected.actors.a);
      assertPhysical(selected.actors.b);
      const refused: LabCase = new LabCase(settings(), normal.actors, {
        defenseTiming: { ...phases, contact: -1 },
      });
      try {
        assert.ok(refused.admissionError);
        assert.equal(
          (refused.inspect() as { operational: boolean }).operational,
          false,
        );
      } finally {
        refused.dispose();
      }
    } finally {
      selected.dispose();
    }
  } finally {
    normal.dispose();
  }
}

/**
 * A preserved orthodox actor keeps left-lead metadata when its right leg attacks.
 * @evidence contracts/testing.md#observable-behavior Constructs the real retained actor pair with an explicit left lead and reads the actual right-kick request. Technique/limb selection must not silently redefine that retained stance.
 * @evidence contracts/testing.md#independent-cases This checks source stance attribution independently of whether this exact range admits a kick; existing actual kick units own physical acceptance. Actor checkpoints and the request must preserve the original stance after a refused placement as well.
 */
export function test_module_consumer_retained_stance(): void {
  const actors: Record<"a" | "b", LabActor> = {
    a: new LabActor("a", "a", -0.65, 0, "left"),
    b: new LabActor("b", "b", 0.65, Math.PI, "left"),
  };
  try {
    const selected: LabCase = new LabCase(
      {
        ...settings(),
        action: "low-kick",
        side: "right",
        target: "leg",
        defense: "none",
        entry: false,
      },
      actors,
      { preserveEntry: true },
    );
    try {
      const state: { request: MotionAction.Request } = selected.inspect() as {
        request: MotionAction.Request;
      };
      assert.equal(state.request.side, "right");
      assert.equal(state.request.leadSide, "left");
      assert.equal(actors.a.leadSide, "left");
      assert.equal(actors.b.leadSide, "left");
    } finally {
      selected.dispose();
    }
  } finally {
    actors.a.dispose();
    actors.b.dispose();
  }
}

/**
 * Admit the complete actual checking pose before any incoming technique is composed.
 * @evidence contracts/testing.md#observable-behavior Fits both anatomical sides of the same original actor at lift, peak, return and landing using the real joint support solver, full foot vertices and unchanged hard/soft residual reporting. The actual FK peak supplies the receiving patch without a guessed vertical offset.
 * @evidence contracts/testing.md#independent-cases This isolates free defense feasibility from two-actor shin-check contact. A collision event cannot conceal a floating support foot, missing knee fold or discarded authored ankle control. Opposite actor/heading reset remains deterministic.
 */
export function test_module_consumer_check_fit(): void {
  const actor: LabActor = new LabActor("check", "b", 0, Math.PI);
  try {
    const failures: string[] = [];
    for (const side of ["left", "right"] as const) {
      actor.reset(0, Math.PI, "left");
      const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
      const guard: Record<MotionAction.Side, DefenseMotion.Patch> = {
        left: handPatch(actor, "left"),
        right: handPatch(actor, "right"),
      };
      const bone: MotionAction.Effector["bone"] =
        AutoMovieHumanRigControls.joint(`${side}LowerLeg`);
      const localPoint: MotionAction.Vec3 = [0, -0.15, 0];
      const point: (pose: IAutoMovieHumanPose) => MotionAction.Vec3 = (
        pose: IAutoMovieHumanPose,
      ): MotionAction.Vec3 => {
        const row: AutoMovieHumanSkeleton.IPlacement | undefined = actor.person
          .evaluate(pose)
          .posed.find(
            (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
              item.bone === bone,
          );
        assert.ok(row);
        return new THREE.Vector3(...localPoint)
          .applyQuaternion(new THREE.Quaternion(...row.rotation))
          .add(new THREE.Vector3(...row.position))
          .toArray();
      };
      const rest: MotionAction.Vec3 = point(actor.basePose);
      const other: MotionAction.Side = side === "left" ? "right" : "left";
      const stationary: MotionAction.Vec3 = actor.basePoint(`${other}Foot`);
      const config: DefenseMotion.Config = {
        guard,
        guardBinding: "clinical",
        receivingReturn: "clinical",
        receiving: {
          bone,
          localPoint,
          restTarget: rest,
          target: [...rest],
          radius: 0.055,
        },
        supportShift: [stationary[0], 0, stationary[2]],
      };
      const request: MotionAction.Request = {
        id: `check-${side}`,
        actorId: actor.id,
        targetId: "incoming",
        side,
        leadSide: "left",
        direction: [1, 0, 0],
        timing: {
          preparation: 0.1,
          delivery: 0.12,
          contact: 0.04,
          retraction: 0.2,
          recovery: 0.1,
        },
      };
      config.receiving!.target = point(
        DefenseMotion.sample("check", request, context, 0.22, config).pose,
      );
      for (const time of [0, 0.05, 0.16, 0.22, 0.36, 0.47, 0.56]) {
        try {
          const sample: MotionAction.Sample = DefenseMotion.sample(
            "check",
            request,
            context,
            time,
            config,
          );
          actor.apply(sample);
          assertPhysical(actor);
          if (sample.preservedChannels?.length) {
            assert.equal(
              actor.pose.legs?.[side].knee?.flexion,
              sample.pose.legs?.[side].knee?.flexion,
            );
            assert.equal(
              actor.pose.legs?.[side].ankle?.dorsiflexion,
              sample.pose.legs?.[side].ankle?.dorsiflexion,
            );
          }
        } catch (error: unknown) {
          failures.push(
            `${side}/${time}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
          );
        }
      }
    }
    assert.deepEqual(failures, []);
  } finally {
    actor.dispose();
  }
}

/** Measure a real own-side Hand-bound guard patch. */
function handPatch(
  actor: LabActor,
  side: MotionAction.Side,
): DefenseMotion.Patch {
  const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
  return {
    bone: `${side}Hand`,
    localPoint: context.geometry.handLocalPoint,
    target: context.geometry.hand!,
    radius: context.geometry.gloveRadiusMetres!,
  };
}

/**
 * Observe anatomical preparation and mutable actor isolation across pooled selections.
 * @evidence contracts/testing.md#observable-behavior Counts actual public preparation builds, retains actual actor UUIDs and checks independent FK tuples, foreign-mesh refusal and arbitrary-order reset/sample results using original polygon actors without mocks or a GPU.
 * @evidence contracts/testing.md#independent-cases Complete anatomy/options keys establish equivalence; palette and actor names do not. Independent geometry snapshots must survive another evaluation and actor reset. Reusing a failed case must clear prior trace and contact state rather than inheriting a successful event.
 */
export function test_module_consumer_preparation_and_reuse(): void {
  const first: ReturnType<typeof prepareLabHuman> = prepareLabHuman();
  const second: ReturnType<typeof prepareLabHuman> = prepareLabHuman();
  assert.equal(second.diagnostics.builds, first.diagnostics.builds);
  assert.equal(second.evaluate, first.evaluate);
  const output: ReturnType<typeof first.evaluate> = first.evaluate({});
  const original: string = JSON.stringify(output);
  const other: ReturnType<typeof first.evaluate> = second.evaluate({
    pelvis: { rotation: 20 },
  });
  assert.notEqual(output.posed, other.posed);
  assert.notEqual(output.posed[0]!.position, other.posed[0]!.position);
  assert.equal(JSON.stringify(output), original);
  const actors: Record<"a" | "b", LabActor> = {
    a: new LabActor("a", "a", -0.75, 0),
    b: new LabActor("b", "b", 0.75, Math.PI),
  };
  let active: LabCase | undefined;
  try {
    const ids: string[] = Object.values(actors).map(
      (actor: LabActor): string => actor.person.object.uuid,
    );
    assert.throws(
      (): unknown => actors.a.worldMesh(actors.b.glove("left")),
      /does not belong/u,
    );
    active = new LabCase(
      { ...settings(), action: "step", distance: 1.5 },
      actors,
    );
    active.evaluate(0.2);
    const snapshot: string = JSON.stringify(actors.a.constrained());
    const receiver: string = JSON.stringify(actors.b.constrained());
    active.evaluate(active.duration);
    active.evaluate(0.2);
    assert.equal(JSON.stringify(actors.a.constrained()), snapshot);
    assert.equal(JSON.stringify(actors.b.constrained()), receiver);
    active.dispose();
    active = new LabCase(
      {
        ...settings(),
        actor: "b",
        side: "right",
        action: "step",
        distance: 1.5,
      },
      actors,
    );
    active.evaluate(0.3);
    active.dispose();
    active = new LabCase(
      { ...settings(), action: "step", distance: 1.5 },
      actors,
    );
    active.evaluate(0.2);
    assert.equal(JSON.stringify(actors.a.constrained()), snapshot);
    assert.deepEqual(
      Object.values(actors).map(
        (actor: LabActor): string => actor.person.object.uuid,
      ),
      ids,
    );
    assert.equal(
      prepareLabHuman().diagnostics.builds,
      first.diagnostics.builds,
    );
  } finally {
    active?.dispose();
    actors.a.dispose();
    actors.b.dispose();
  }
}

/**
 * Inspect free straight-punch shape after the final shared support solve.
 * @evidence contracts/testing.md#observable-behavior Executes each actor and side at a distant unblocked raw target, then measures actual drawn shoulder/elbow/Hand/glove geometry at delivery end and final physical constraints. A short guard interception cannot mask a failed free trajectory.
 * @evidence contracts/testing.md#independent-cases The elbow must approach straight extension with at most the authored12degree bend plus a one-degree numerical margin. The glove pad must remain collinear with the actual wrist/forearm; distance stays intentionally unreachable and must not create contact.
 */
export function test_module_consumer_free_jab_shape(): void {
  const actors: Record<"a" | "b", LabActor> = {
    a: new LabActor("a", "a", -1, 0),
    b: new LabActor("b", "b", 1, Math.PI),
  };
  try {
    for (const id of ["a", "b"] as const)
      for (const side of ["left", "right"] as const) {
        const sample: LabCase = new LabCase(
          {
            ...settings(),
            actor: id,
            side,
            target: "head",
            defense: "none",
            distance: 2,
          },
          actors,
        );
        try {
          assert.equal(sample.admissionError, null);
          assert.equal(sample.trace?.event, null);
          const timing: MotionAction.Timing = (
            sample.inspect() as { resolvedTiming: MotionAction.Timing }
          ).resolvedTiming;
          sample.evaluate(timing.preparation + timing.delivery);
          const actor: LabActor = actors[id];
          assertPhysical(actor);
          const shoulder: THREE.Vector3 = new THREE.Vector3(
            ...actor.person.point(`${side}UpperArm`),
          );
          const elbow: THREE.Vector3 = new THREE.Vector3(
            ...actor.person.point(`${side}LowerArm`),
          );
          const wrist: THREE.Vector3 = new THREE.Vector3(
            ...actor.person.point(`${side}Hand`),
          );
          const pad: THREE.Vector3 = actor
            .glove(side)
            .getWorldPosition(new THREE.Vector3());
          const angle: number =
            (shoulder.clone().sub(elbow).angleTo(wrist.clone().sub(elbow)) *
              180) /
            Math.PI;
          assert.ok(
            angle >= 167,
            `Actual free jab elbow included angle ${angle}`,
          );
          assert.ok(
            pad
              .sub(wrist)
              .normalize()
              .dot(wrist.clone().sub(elbow).normalize()) >= 0.99,
            "Actual Hand-bound glove must follow the forearm lever",
          );
        } finally {
          sample.dispose();
        }
      }
  } finally {
    actors.a.dispose();
    actors.b.dispose();
  }
}

/**
 * Prove actual guarded interception, hand binding and connected arbitrary-order recovery.
 * @evidence contracts/testing.md#observable-behavior Runs the real original polygon, joint Human fitting and Engine interception without a browser/GPU or replaced dependency. Actual glove parents, world constraints and exact stop-state seeking catch disconnected display and recovery behavior.
 * @evidence contracts/testing.md#independent-cases Uses a 1.1m source guard arrangement with explicit geometry-derived supported entry, explicit delivery bounds and measured guard landmarks. The two independently exported cases keep actor/side reuse from being masked by another setup failure; pixels and continuous quality remain Viewer review.
 */
export function test_module_consumer_guard_a(): void {
  assertGuard({ ...settings(), actor: "a", side: "left", entry: true });
}

/**
 * Reuse the exact same definition for the other independent actor and anatomical side.
 * @evidence contracts/testing.md#observable-behavior Exercises real B-right jab and actual receiving cover through the same public actor fitter/contact modules, then checks binding and deterministic applied state.
 * @evidence contracts/testing.md#independent-cases Actor identity and limb side differ from A while range/units remain the same. This is real generated geometry, not a second copied animation or a fixture target substitution.
 */
export function test_module_consumer_guard_b(): void {
  assertGuard({
    ...settings(),
    actor: "b",
    side: "right",
    defense: "cover",
    entry: true,
  });
}

/**
 * Preserve visible actual actors when an initial real crossing refuses the case.
 * @evidence contracts/testing.md#observable-behavior Constructs a .4m overlapping body setup and observes its rejection reason plus retained real actor objects and finite actual vertices.
 * @evidence contracts/testing.md#independent-cases Strict original-mesh crossing remains an error; the viewer must retain inspectable actors instead of deleting them or shrinking geometry. Valid separated setups are exercised independently.
 */
export function test_module_consumer_refused_setup(): void {
  const sample: LabCase = new LabCase({ ...settings(), distance: 0.4 });
  try {
    assert.match(sample.admissionError ?? "", /crossing|interception/u);
    assert.equal(sample.objects().length, 2);
    const before: string = JSON.stringify(sample.inspect());
    assert.equal(
      (sample.inspect() as { operational: boolean }).operational,
      false,
    );
    assert.throws((): void => sample.evaluate(0), /No action is loaded/u);
    assert.equal(
      JSON.stringify(sample.inspect()),
      before,
      "Refusal must not create an idle timeline or change its restored frame",
    );
    const aim: { originalWorld: MotionAction.Vec3; world: MotionAction.Vec3 } =
      (
        sample.inspect() as {
          aim: { originalWorld: MotionAction.Vec3; world: MotionAction.Vec3 };
        }
      ).aim;
    assert.ok(
      new THREE.Vector3(...aim.originalWorld).distanceTo(
        new THREE.Vector3(...aim.world),
      ) < 1e-12,
    );
    for (const actor of Object.values(sample.actors))
      assert.ok(actor.person.point("head").every(Number.isFinite));
  } finally {
    sample.dispose();
  }
}

/**
 * Retain the former .85m failure as a real compact-guard regression.
 * @evidence contracts/testing.md#observable-behavior Reuses the exact old range against all actual registered surfaces after the anatomical Hand-frame and bilateral cheek-guard repairs. Entry remains disabled; the case must avoid an initial crossing and preserve measured pad-fit residuals.
 * @evidence contracts/testing.md#independent-cases The separate .4m body-overlap case still requires refusal, so correcting an extended forward guard cannot disable collision checks. This range is a historical regression input, not a universal allowed fighting distance.
 */
export function test_module_consumer_compact_guard(): void {
  const sample: LabCase = new LabCase({ ...settings(), distance: 0.85 });
  try {
    assert.equal(sample.admissionError, null);
    for (const actor of Object.values(sample.actors)) {
      for (const error of actor.guardErrors)
        assert.ok(
          error <= 0.00025,
          `Initial actual compact guard residual ${error}`,
        );
      const head: ReturnType<typeof createAutoMovieMeshCrossingQuery> =
        createAutoMovieMeshCrossingQuery(actor.worldMesh(actor.mesh("head")));
      for (const side of ["left", "right"] as const) {
        assert.equal(
          actor.glove(side).parent,
          actor.person.drawing.bones.get(`${side}Hand`),
        );
        assert.equal(
          head.crosses(actor.worldMesh(actor.glove(side))),
          false,
          `Actual ${side} cheek glove crosses the head`,
        );
        assert.equal(
          head.crosses(actor.worldMesh(actor.mesh(`${side}LowerArm`))),
          false,
          `Actual ${side} compact forearm crosses the head`,
        );
      }
    }
  } finally {
    sample.dispose();
  }
}

/**
 * A distant target remains a miss when visible supported entry is explicitly disabled.
 * @evidence contracts/testing.md#observable-behavior Runs B-right original geometry against every preceding receiver surface and verifies no impact event or paired root translation appears.
 * @evidence contracts/testing.md#independent-cases Two metres exceeds the measured one-arm reach and actor A stays at its independent authored X=-1m. No auto-entry, target relocation or omitted guard can turn this negative case into a hit.
 */
export function test_module_consumer_distant_miss(): void {
  const sample: LabCase = new LabCase({
    ...settings(),
    actor: "b",
    side: "right",
    target: "head",
    defense: "none",
    distance: 2,
    entry: false,
  });
  try {
    assert.equal(sample.admissionError, null);
    assert.equal(sample.trace?.outcome, "miss");
    assert.equal(sample.trace?.event, null);
    sample.evaluate(sample.duration / 2);
    assert.ok(Math.abs(sample.actors.a.person.object.position.x + 1) < 1e-12);
  } finally {
    sample.dispose();
  }
}

/**
 * Fit fixed world swing/plant goals and the complete actual foot cloud in one state.
 * @evidence contracts/testing.md#observable-behavior Seeks unload, swing, landing, follow and settle on the real original Human, checking final joint-target residuals and nonpenetration at the unchanged physical tolerances.
 * @evidence contracts/testing.md#independent-cases At most one foot is free; an airborne route point is a guide and has no ground-support patch. The receiving actor's independent root must not move. This catches the former sequential IK/Grounding invalidation and moved-oracle error.
 */
export function test_module_consumer_step(): void {
  assertStep("a");
}

/**
 * Reuse the fixed-world step contract with the other independently headed actor.
 * @evidence contracts/testing.md#observable-behavior Runs the final real Human swing/plant fit for B with its pi heading while A stays fixed, including arbitrary phase seeks and unchanged floor/target limits.
 * @evidence contracts/testing.md#independent-cases Opposite heading must invert world displacement once. Passing A cannot mask B-frame conversion, actor-state aliasing or an unsupported airborne foot.
 */
export function test_module_consumer_step_b(): void {
  assertStep("b");
}

/**
 * Connect actual entry-end feet, hands and root to technique time zero without restarting guard.
 * @evidence contracts/testing.md#observable-behavior Seeks both sides of the visible entry/technique seam on the original two-actor consumer. The actual drawing's root, both soles and real Hand-bound pads must remain continuous, and later seek must reproduce that same adopted endpoint.
 * @evidence contracts/testing.md#independent-cases The case retains its genuine collision-admission error if the chosen corridor is blocked; continuity remains independently measurable and cannot be satisfied by deleting actors or disabling entry. A ten-microsecond seam interval is smaller than .25mm at ordinary foot/hand speed.
 */
export function test_module_consumer_entry_continuity(): void {
  const sample: LabCase = new LabCase({
    ...settings(),
    action: "cross",
    side: "right",
    target: "body",
    defense: "none",
    distance: 1.05,
    entry: true,
  });
  try {
    assert.ok(sample.entrySeconds > 0);
    const entry: { attempts: unknown[]; clearance?: { outcome: string } } = (
      sample.inspect() as {
        entry: { attempts: unknown[]; clearance?: { outcome: string } };
      }
    ).entry;
    assert.ok(
      entry.attempts.length >= 1 && entry.attempts.length <= 5,
      "Actual corridor planning has a finite candidate budget",
    );
    if (sample.admissionError === null)
      assert.equal(
        entry.clearance?.outcome,
        "miss",
        "An accepted entry must retain its actual full-surface no-impact receipt",
      );
    const aim: { originalWorld: MotionAction.Vec3; world: MotionAction.Vec3 } =
      (
        sample.inspect() as {
          aim: { originalWorld: MotionAction.Vec3; world: MotionAction.Vec3 };
        }
      ).aim;
    assert.ok(
      new THREE.Vector3(...aim.originalWorld).distanceTo(
        new THREE.Vector3(...aim.world),
      ) < 1e-12,
      "Adopting actual entry must preserve the original independent world aim",
    );
    assert.equal(
      sample.admissionError,
      null,
      "Continuity requires a genuinely admitted entry; refused-candidate frame restoration is checked independently",
    );
    const actor: LabActor = sample.actors.a;
    sample.evaluate(sample.entrySeconds - 0.00001);
    const before: THREE.Vector3[] = [
      actor.person.object.position.clone(),
      ...(["left", "right"] as const).flatMap(
        (side: MotionAction.Side): THREE.Vector3[] => [
          new THREE.Vector3(...actor.person.point(`${side}Foot`)),
          actor.glove(side).getWorldPosition(new THREE.Vector3()),
        ],
      ),
    ];
    sample.evaluate(sample.entrySeconds + 0.00001);
    const after: THREE.Vector3[] = [
      actor.person.object.position.clone(),
      ...(["left", "right"] as const).flatMap(
        (side: MotionAction.Side): THREE.Vector3[] => [
          new THREE.Vector3(...actor.person.point(`${side}Foot`)),
          actor.glove(side).getWorldPosition(new THREE.Vector3()),
        ],
      ),
    ];
    for (let index: number = 0; index < before.length; index++)
      assert.ok(
        before[index]!.distanceTo(after[index]!) <= 0.00025,
        `Actual entry seam point ${index} jumps ${before[index]!.distanceTo(after[index]!)}`,
      );
    const endpoint: string = JSON.stringify(actor.constrained());
    sample.evaluate(sample.duration);
    sample.evaluate(sample.entrySeconds + 0.00001);
    assert.equal(JSON.stringify(actor.constrained()), endpoint);
  } finally {
    sample.dispose();
  }
}

/** Exercise actual independent footwork without sharing the expected route result. */
function assertStep(id: "a" | "b"): void {
  const sample: LabCase = new LabCase({
    ...settings(),
    actor: id,
    action: "step",
    distance: 1.5,
    direction: 0.2,
  });
  try {
    assert.equal(sample.admissionError, null);
    const other: "a" | "b" = id === "a" ? "b" : "a";
    const receiverX: number = sample.actors[other].person.object.position.x;
    const failures: string[] = [];
    for (const time of [0, 0.04, 0.2, 0.36, 0.5, 0.69, sample.duration]) {
      try {
        sample.evaluate(time);
        assertPhysical(sample.actors[id]);
        const request: MotionAction.Sample = sample.actors[id].sample!;
        for (const effector of request.effectors)
          if (effector.role === "guide")
            assert.ok(
              !request.support.patches?.some(
                (patch: MotionAction.SupportPatch): boolean =>
                  patch.mode !== "free" &&
                  patch.side ===
                    (effector.bone.startsWith("left") ? "left" : "right"),
              ),
            );
        for (const side of ["left", "right"] as const)
          if (request.support[side] > 0)
            assert.ok(
              request.support.patches?.some(
                (patch: MotionAction.SupportPatch): boolean =>
                  patch.side === side && patch.mode === "planted",
              ),
              `Positive ${side} load must retain actual planted geometry during unload/load/settle`,
            );
        assert.ok(
          Math.abs(sample.actors[other].person.object.position.x - receiverX) <
            1e-12,
        );
      } catch (error: unknown) {
        failures.push(
          `${time}s: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n${JSON.stringify((sample.inspect() as { failedEvaluation?: object }).failedEvaluation)}`,
        );
      }
    }
    assert.deepEqual(
      failures,
      [],
      "Every independently sampled step phase must satisfy its actual physical contract",
    );
  } finally {
    sample.dispose();
  }
}

/**
 * Demonstrate a genuine body encounter after explicit independently supported range entry.
 * @evidence contracts/testing.md#observable-behavior The same cross module executes after real FootworkMotion entry and must encounter the actual body with all preceding guards still participating. It checks the final same-pose support/effector constraints around the stop.
 * @evidence contracts/testing.md#independent-cases A body hit is distinct from guard interception and the distant miss. The target is the original actual chest surface and the opponent is never translated to create success; unachieved physical admission fails this case.
 */
export function test_module_consumer_body_hit(): void {
  assertEncounter(
    {
      ...settings(),
      action: "cross",
      side: "right",
      target: "body",
      defense: "none",
      distance: 1.05,
      entry: true,
    },
    "body",
  );
}

/**
 * Realize an actual distal-shin kick and recover from its first full-limb encounter.
 * @evidence contracts/testing.md#observable-behavior Runs the body-roundhouse with geometric knee/ankle guides, actual forefoot roll and original foot/shin surfaces through the same joint fitter and Engine query.
 * @evidence contracts/testing.md#independent-cases Guard interception remains valid before the body; the case requires an actual event and small final physical residuals instead of accepting a nearby foot or a radial-reach calculation as shin realization.
 */
export function test_module_consumer_body_kick(): void {
  assertEncounter({
    ...settings(),
    action: "body-kick",
    actor: "b",
    side: "left",
    target: "body",
    defense: "cover",
    distance: 1.2,
    entry: true,
  });
}

/**
 * Keep actual high-kick realization independent from lower-target cases.
 * @evidence contracts/testing.md#observable-behavior Runs the same original distal-shin, knee/ankle guides, supported entry and forefoot-roll consumer at the actual head-height surface. It requires a real first encounter and admitted final constraints.
 * @evidence contracts/testing.md#independent-cases This catches the original approximately825mm high-shin failure even if another kick passes. Earlier actual guard interception remains valid; target-height or foot proximity alone cannot satisfy the case.
 */
export function test_module_consumer_high_kick(): void {
  assertEncounter({
    ...settings(),
    action: "high-kick",
    side: "right",
    target: "head",
    defense: "none",
    distance: 1.3,
    entry: true,
  });
}

/**
 * Exercise a distinct actual shin-check stop rather than a chest-aimed low kick.
 * @evidence contracts/testing.md#observable-behavior Targets the actual leg-height receiving region, retains every guard/body/check mesh, and requires an attributed shin-check event plus the same final support/effector constraints.
 * @evidence contracts/testing.md#independent-cases The leg target and check relationship are coherent and independent of body/guard positive cases. A miss, guard stop or unresolved high shin target cannot substitute for this promised check interaction.
 */
export function test_module_consumer_shin_check(): void {
  assertEncounter(
    {
      ...settings(),
      action: "low-kick",
      actor: "b",
      side: "right",
      target: "leg",
      defense: "check",
      distance: 1.2,
      entry: true,
    },
    "shin-check",
  );
}

/**
 * Prove a public toe channel moves the real original toe mesh while full-foot floor remains checked.
 * @evidence contracts/testing.md#observable-behavior Reads a distal actual HalluxProximal vertex, applies public MTP extension through the real actor, and verifies its changed world position and public full-foot nonpenetration result.
 * @evidence contracts/testing.md#independent-cases A nonzero anatomical toe control must change a non-pivot vertex by more than numerical noise; the .25mm/1µm joint/floor limits are physical contracts, not copied output values. Continuous skin is outside this rigid model.
 */
export function test_module_consumer_original_toe(): void {
  const actor: LabActor = new LabActor("toe", "a", 0, 0);
  try {
    const mesh: THREE.Mesh = actor.mesh("leftHalluxProximal");
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
      mesh.geometry.getAttribute("position");
    let index: number = 0;
    for (let item: number = 1; item < attribute.count; item++)
      if (
        new THREE.Vector3().fromBufferAttribute(attribute, item).lengthSq() >
        new THREE.Vector3().fromBufferAttribute(attribute, index).lengthSq()
      )
        index = item;
    const before: THREE.Vector3 = mesh.localToWorld(
      new THREE.Vector3().fromBufferAttribute(attribute, index),
    );
    const pose: IAutoMovieHumanPose = structuredClone(actor.basePose);
    pose.legs!.left.foot = {
      ...pose.legs!.left.foot,
      hallux: { mtpFlexion: -20 },
    };
    actor.apply({
      pose,
      rootOffset: [0, 0, 0],
      support: {
        left: 0.5,
        right: 0.5,
        patches: [actor.patches.left.low, actor.patches.right.low],
      },
      effectors: [],
      phase: "recovery",
      elapsed: 0,
      progress: 0,
    });
    const after: THREE.Vector3 = mesh.localToWorld(
      new THREE.Vector3().fromBufferAttribute(attribute, index),
    );
    assert.ok(
      before.distanceTo(after) > 0.005,
      "Actual original toe geometry must consume the public toe pose",
    );
    assert.ok(actor.support!.floorMinimum >= -0.000001);
  } finally {
    actor.dispose();
  }
}

/** One explicit default input record shared only by these portable cases. */
function settings(): LabSettings {
  return {
    action: "jab",
    actor: "a",
    side: "left",
    target: "guard",
    defense: "catch",
    distance: 1.1,
    seed: 17,
    aim: 0,
    timingVariation: 0,
    timingScale: 1,
    direction: 0,
    entry: false,
  };
}

/** Real shared assertion path; cases remain separate discoverable test functions. */
function assertGuard(controls: LabSettings): void {
  const sample: LabCase = new LabCase(controls);
  try {
    assert.equal(sample.admissionError, null);
    assert.equal(sample.trace?.event?.relation, "guard");
    const event: MotionAction.ContactEvent = sample.trace!.event!;
    assert.equal(event.actorId, controls.actor);
    assert.equal(event.time, sample.trace!.constrainedSample!.elapsed);
    assert.ok(event.time >= 0.08 && event.time <= 0.197);
    sample.evaluate(sample.entrySeconds + event.time);
    const actor: LabActor = sample.actors[controls.actor];
    const first: string = JSON.stringify(actor.constrained());
    assertPhysical(actor);
    sample.evaluate(sample.duration);
    sample.evaluate(sample.entrySeconds + event.time);
    assert.equal(JSON.stringify(actor.constrained()), first);
    assert.equal(
      actor.glove(controls.side).parent,
      actor.person.drawing.bones.get(`${controls.side}Hand`),
    );
    for (const epsilon of [-0.00001, 0, 0.00001]) {
      sample.evaluate(sample.entrySeconds + event.time + epsilon);
      assertPhysical(actor);
    }
  } finally {
    sample.dispose();
  }
}

/** Require the actual requested relationship and final physical realization together. */
function assertEncounter(
  controls: LabSettings,
  relation?: MotionAction.ContactEvent["relation"],
): void {
  const sample: LabCase = new LabCase(controls);
  try {
    assert.equal(sample.admissionError, null);
    assert.ok(
      sample.trace?.event,
      "An actual fitted-surface encounter is required",
    );
    if (relation) assert.equal(sample.trace.event.relation, relation);
    for (const time of [
      sample.entrySeconds + sample.readySeconds + sample.trace.event.time,
      sample.duration,
    ]) {
      sample.evaluate(time);
      assertPhysical(sample.actors[controls.actor]);
    }
  } finally {
    sample.dispose();
  }
}

/** Check the same final FK used by the drawing against unchanged physical tolerances. */
function assertPhysical(actor: LabActor): void {
  const failures: string[] = [];
  if (!actor.support || actor.support.status !== "admitted")
    failures.push(
      `Actual support ${actor.support?.status}/${actor.support?.reason}`,
    );
  if (!actor.support || actor.support.floorMinimum < -0.000001)
    failures.push(`Original full-foot floor ${actor.support?.floorMinimum}`);
  for (const result of actor.errors) {
    if (!Number.isFinite(result.error))
      failures.push(`${result.bone} nonfinite residual`);
    if (result.constraint === "hard" && result.error > 0.00025)
      failures.push(`${result.bone} hard world residual ${result.error}`);
  }
  assert.deepEqual(
    failures,
    [],
    failures.length ? JSON.stringify(actor.inspect()) : undefined,
  );
}
