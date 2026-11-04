import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSupportFrame,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { createPersonParameters } from "../../../../src/createPersonParameters";
import { LabActor } from "../../../../src/motion-lab/LabActor";
import { fitLabGuard } from "../../../../src/motion-lab/fitLabGuard";
import { labGuard } from "../../../../src/motion-lab/labGuard";
import { prepareLabHuman } from "../../../../src/motion-lab/prepareLabHuman";
import { requireLabSupport } from "../../../../src/motion-lab/requireLabSupport";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";

/**
 * Actual surface membership refuses fabricated and foreign-foot support before mutation.
 *
 * Scenarios:
 * 1. Admit the original native guard and retain its exact displayed snapshot.
 * 2. Reject a same-side hand carrier, another foot and a fabricated local vertex atomically.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real actor consumer and compares its complete stopped sample after each rejection. A same-side string prefix cannot establish foot provenance, and a real bone cannot establish source-vertex identity.
 * @evidence contracts/testing.md#independent-cases Original displayed vertices define identity without a snapshot oracle. Whole-floor and loaded-contact tolerance cases are separate tests; this portable unit uses actual original CPU polygon geometry without browser or GPU.
 */
export function test_actor_support_vertex_admission(): void {
  const actor: LabActor = new LabActor("vertex", "a", 0.3, Math.PI);
  try {
    const sample: MotionAction.Sample = standing(actor);
    actor.apply(sample);
    const before: string = JSON.stringify(actor.constrained());
    const hand: AutoMovieHumanSupportFrame.IPoint =
      actor.bodyPoints("leftHand")[0]!;
    const malformed: MotionAction.SupportPatch[] = [
      {
        ...sample.support.patches![0]!,
        bone: "leftHand",
        localPoint: [...hand.localPoint],
      },
      {
        ...sample.support.patches![0]!,
        bone: actor.patches.right.low.bone,
        localPoint: [...actor.patches.right.low.localPoint],
      },
      { ...sample.support.patches![0]!, localPoint: [123, 456, 789] },
    ];
    for (const patch of malformed) {
      assert.throws((): void =>
        actor.apply({
          ...sample,
          support: {
            left: 0.5,
            right: 0.5,
            patches: [patch, sample.support.patches![1]!],
          },
        }),
      );
      assert.equal(JSON.stringify(actor.constrained()), before);
    }
    assert.throws(
      (): MotionAction.SupportMeasurement =>
        actor.context("left", [0, 0, 0]).supportFrame!(
          actor.basePose,
          [0, 0, 0],
          malformed[2]!,
        ),
    );
    assert.throws((): unknown => actor.supportGoals(malformed[2]!));
  } finally {
    actor.dispose();
  }
}

/**
 * General contact support and explicit airborne orientation use the same original actor.
 *
 * Scenarios:
 * 1. Load an actual retained foot through contacts with zero legacy foot shares.
 * 2. Fly a rotated body with exact authored root height and no ground-load claim.
 * 3. Reject an invalid share or fabricated whole-body witness without replacing the drawing.
 *
 * @evidence contracts/testing.md#observable-behavior Uses real polygon, equipment and bone matrices; actual root quaternion must equal heading times local rotation and flight cannot be projected to the floor. Contacts use their own share authority and native reason survives independent admission.
 * @evidence contracts/testing.md#independent-cases The named actual source point defines the ground goal, and independently composed Three.js quaternions define orientation. This establishes the adapter's branch semantics and whole-cloud floor query, not physical falling, balance or continuous collision.
 */
export function test_actor_support_contacts_and_airborne(): void {
  const actor: LabActor = new LabActor("contact", "b", -0.2, Math.PI);
  try {
    const foot: MotionAction.SupportPatch = actor.patches.left.low;
    const contact: MotionAction.GroundContact = {
      id: "left-contact",
      region: "foot",
      side: "left",
      bone: foot.bone as Extract<
        MotionAction.GroundContact,
        { region: "foot" }
      >["bone"],
      localPoint: [...foot.localPoint],
      world: [...foot.world],
      share: 1,
      mode: "planted",
    };
    actor.apply({
      ...standing(actor),
      support: { kind: "contacts", left: 0, right: 0, contacts: [contact] },
    });
    assert.equal(actor.support?.status, "admitted");
    const observation: {
      loadedGround: { side: string; grounded: boolean }[];
      rawJointSolverReason: string;
    } = actor.inspect() as {
      loadedGround: { side: string; grounded: boolean }[];
      rawJointSolverReason: string;
    };
    assert.equal(observation.loadedGround[0]!.side, contact.id);
    assert.equal(observation.loadedGround[0]!.grounded, true);
    assert.equal(observation.rawJointSolverReason, "converged");
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      0.2,
    );
    const flight: MotionAction.Sample = {
      ...standing(actor),
      rootOffset: [0.1, 2, -0.1],
      rootRotation: rotation.toArray(),
      support: { kind: "airborne", left: 0, right: 0 },
    };
    actor.apply(flight);
    assert.equal(actor.support?.status, "admitted");
    assert.ok(
      Math.abs(actor.person.object.position.y - actor.origin.y - 2) < 1e-12,
    );
    assert.ok(
      actor.person.object.quaternion.angleTo(
        new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
          .multiply(rotation),
      ) < 1e-7,
    );
    assert.equal(
      (actor.inspect() as { loadedGround: unknown[] }).loadedGround.length,
      0,
    );
    assert.ok(actor.support!.floorMinimum > 1);
    const lifted: MotionAction.Vec3 = actor.effector({
      bone: contact.bone,
      localPoint: contact.localPoint,
      target: [0, 0, 0],
      role: "support",
      radius: 0,
    });
    actor.apply({
      ...flight,
      support: {
        kind: "contacts",
        left: 0,
        right: 0,
        contacts: [{ ...contact, world: lifted }],
      },
    });
    const unsupported: {
      rawJointSolverStatus: string;
      rawJointSolverReason: string;
      loadedGround: { grounded: boolean }[];
    } = actor.inspect() as {
      rawJointSolverStatus: string;
      rawJointSolverReason: string;
      loadedGround: { grounded: boolean }[];
    };
    assert.equal(unsupported.rawJointSolverStatus, "admitted");
    assert.equal(unsupported.rawJointSolverReason, "converged");
    assert.equal(unsupported.loadedGround[0]!.grounded, false);
    assert.equal(actor.support?.status, "unresolved");
    assert.throws(
      (): void => requireLabSupport([actor], 0.2),
      (error: unknown): boolean =>
        error instanceof Error &&
        !!error.cause &&
        typeof error.cause === "object" &&
        Reflect.get(error.cause, "kind") === "unsupported-contact-capture",
    );
    actor.apply(flight);
    const before: string = JSON.stringify(actor.constrained());
    assert.throws((): void =>
      actor.apply({
        ...flight,
        support: {
          kind: "contacts",
          left: 0,
          right: 0,
          contacts: [{ ...contact, localPoint: [123, 456, 789] }],
        },
      }),
    );
    assert.equal(JSON.stringify(actor.constrained()), before);
    assert.throws((): void =>
      actor.apply({
        ...flight,
        support: {
          kind: "contacts",
          left: 0,
          right: 0,
          contacts: [{ ...contact, share: 0.9 }],
        },
      }),
    );
  } finally {
    actor.dispose();
  }
}

/**
 * A captured source support planner retains its immutable original frame across actor reset.
 *
 * Scenarios:
 * 1. Prepare an exact supported original plan without changing actor matrices or input.
 * 2. Reset the actor elsewhere and reuse the old context with identical original goals.
 * 3. Mutate returned geometry without corrupting future copies.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual captured public Grounding consumer and checks actor state, original WORLD goals, detached geometry and the original root offset after a new actor placement. It catches closures reading a later reset's mutable origin or support frame.
 * @evidence contracts/testing.md#independent-cases The unchanged initial plan is already physically admitted and therefore needs no numerical deformation. Exact matrix snapshots establish nonmutation only; moving support, solver work and phase joins remain independent actual-consumer cases.
 */
export function test_actor_support_captured_planner(): void {
  const actor: LabActor = new LabActor("planner", "a", 0.2, 0);
  try {
    const context: MotionAction.Context = actor.context("left", [0, 0, 0]);
    const source: MotionAction.Sample = standing(actor);
    const plan: MotionAction.BodyPlacement = {
      pose: source.pose,
      rootOffset: source.rootOffset,
      support: source.support,
    };
    const before: string = JSON.stringify({
      position: actor.person.object.position.toArray(),
      pose: actor.pose,
    });
    const input: string = JSON.stringify(plan);
    const first: MotionAction.BodyPlacement = context.prepareSupport!(plan);
    assert.equal(
      JSON.stringify({
        position: actor.person.object.position.toArray(),
        pose: actor.pose,
      }),
      before,
    );
    assert.equal(JSON.stringify(plan), input);
    assert.deepEqual(first.support, plan.support);
    assert.ok(Math.hypot(...first.rootOffset) < 0.00025);
    actor.reset(1.2, Math.PI, "right", -0.4);
    assert.equal(actor.origin.z, -0.4);
    const second: MotionAction.BodyPlacement = context.prepareSupport!(plan);
    assert.deepEqual(second, first);
    const cloud: AutoMovieHumanSupportFrame.IPoint[] = actor.bodyPoints();
    const coordinate: number = cloud[0]!.localPoint[0];
    cloud[0]!.localPoint[0] += 100;
    assert.equal(actor.bodyPoints()[0]!.localPoint[0], coordinate);
  } finally {
    actor.dispose();
  }
}

/**
 * The male official reuses the original supported polygon without striking equipment.
 *
 * Scenarios:
 * 1. Place the official independently in both horizontal coordinates.
 * 2. Use the original full-foot support seam without an artificial glove context.
 *
 * @evidence contracts/testing.md#observable-behavior Creates the actual official through the shared actor and checks the absence of glove nodes, independent original root and native supported stance. This catches a second rig or equipment-dependent support host.
 * @evidence contracts/testing.md#independent-cases Role and initial X/Z are caller inputs, while actual original foot vertices and fixed floor define admission. Film choreography, appearance review and gestures remain separate consumers.
 */
export function test_actor_support_official(): void {
  const actor: LabActor = new LabActor(
    "official",
    "referee",
    0.7,
    0.3,
    "left",
    -1.55,
  );
  try {
    assert.equal(actor.origin.x, 0.7);
    assert.equal(actor.origin.z, -1.55);
    assert.equal(actor.person.object.getObjectByName("left-glove"), undefined);
    assert.equal(actor.person.object.getObjectByName("right-glove"), undefined);
    const identity: { heightMetres: number; declaredMassKg: number } = (
      actor.inspect() as {
        identity: { heightMetres: number; declaredMassKg: number };
      }
    ).identity;
    assert.equal(identity.heightMetres, 1.78);
    assert.equal(identity.declaredMassKg, 76);
    const source: MotionAction.Sample = standing(actor);
    const realized: MotionAction.BodyPlacement = actor.planSupport({
      pose: source.pose,
      rootOffset: source.rootOffset,
      support: source.support,
    });
    actor.apply({ ...source, pose: structuredClone(realized.pose) });
    assert.equal(actor.support?.status, "admitted");
    assert.ok(actor.support!.floorMinimum >= -0.000001);
    assert.ok(actor.supportGoals(actor.patches.left.low).length > 0);
  } finally {
    actor.dispose();
  }
}

/**
 * Distinct complete body inputs retain separate original Human preparations.
 *
 * Scenarios:
 * 1. Alternate fighter and regular official profiles without losing either evaluator.
 * 2. Preserve input bytes and detached parameter ownership on same-key reuse.
 * 3. Actual neutral Human geometry responds to height and muscularity differences.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the actual preparation seam with complete public inputs and compares exact evaluator identity only for equal complete keys. Same-body FK remains independent while real bone heights/radii distinguish the two profiles.
 * @evidence contracts/testing.md#independent-cases Public authored inputs specify1800/1780mm and different chest/arm shape controls; actual neutral head and upper-arm geometry must respond. This does not infer mass from volume, prove likeness or establish a posed actor's standing height.
 */
export function test_actor_support_profile_preparation(): void {
  const fighterInput: Parameters<typeof prepareLabHuman>[0] =
    createPersonParameters(1800, true);
  const officialInput: Parameters<typeof prepareLabHuman>[0] =
    createPersonParameters(1780, false);
  const before: string = JSON.stringify([fighterInput, officialInput]);
  const fighter: ReturnType<typeof prepareLabHuman> =
    prepareLabHuman(fighterInput);
  const official: ReturnType<typeof prepareLabHuman> =
    prepareLabHuman(officialInput);
  const fighterAgain: ReturnType<typeof prepareLabHuman> = prepareLabHuman(
    structuredClone(fighterInput),
  );
  const officialAgain: ReturnType<typeof prepareLabHuman> = prepareLabHuman(
    structuredClone(officialInput),
  );
  assert.notEqual(fighter.diagnostics.key, official.diagnostics.key);
  assert.equal(fighterAgain.evaluate, fighter.evaluate);
  assert.equal(officialAgain.evaluate, official.evaluate);
  assert.equal(fighterAgain.diagnostics.reused, true);
  assert.equal(officialAgain.diagnostics.reused, true);
  assert.equal(JSON.stringify([fighterInput, officialInput]), before);
  assert.equal(
    JSON.stringify(fighter.parameters),
    JSON.stringify(fighterInput),
  );
  assert.equal(
    JSON.stringify(official.parameters),
    JSON.stringify(officialInput),
  );
  const fighterNeutral: ReturnType<
    ReturnType<typeof prepareLabHuman>["evaluate"]
  > = fighter.evaluate({});
  const officialNeutral: ReturnType<
    ReturnType<typeof prepareLabHuman>["evaluate"]
  > = official.evaluate({});
  assert.ok(
    fighterNeutral.posed.find(
      (row: { bone: string }): boolean => row.bone === "head",
    )!.position[1] >
      officialNeutral.posed.find(
        (row: { bone: string }): boolean => row.bone === "head",
      )!.position[1] +
        0.005,
  );
  assert.ok(
    fighterNeutral.bones.find(
      (row: { bone: string }): boolean => row.bone === "leftUpperArm",
    )!.radius >
      officialNeutral.bones.find(
        (row: { bone: string }): boolean => row.bone === "leftUpperArm",
      )!.radius,
  );
  fighterAgain.parameters.body!.controls!.height!.value = 999;
  assert.equal(
    prepareLabHuman(fighterInput).parameters.body!.controls!.height!.value,
    1800,
  );
}

/**
 * The arm stage retains a leg strike goal frozen before body root fitting.
 *
 * Scenarios:
 * 1. Request a vertical root correction with one available ankle control and original fixed feet.
 * 2. Carry an independent original ankle goal through body preparation and one arm writer.
 * 3. Reject an arm task in the body-only stage before changing the displayed actor.
 *
 * @evidence contracts/testing.md#observable-behavior Uses the actual original polygon/public solver with a deliberately different requested root. After the body is realized, the arm-only consumer must keep the original leg WORLD goal and full-floor/load admission while selecting no leg controls. This catches copying original local targets around a corrected root and silently dropping the kick's external goal.
 * @evidence contracts/testing.md#independent-cases The original direct bone matrix fixes the ankle WORLD oracle before fitting. A fully fixed right leg requires root height correction; a real left ankle degree keeps the native fitting request nonempty. One actual arm writer exercises composition without a new rig, browser or solver.
 */
export function test_actor_support_retained_leg_goal(): void {
  const actor: LabActor = new LabActor("retained-leg", "a", 0.3, Math.PI);
  try {
    const source: MotionAction.Sample = standing(actor);
    const original: THREE.Vector3 = actor.person.drawing.bones
      .get("leftFoot")!
      .getWorldPosition(new THREE.Vector3());
    const local: MotionAction.Vec3 = actor.basePoint("leftFoot");
    const leg: MotionAction.Effector = {
      bone: "leftFoot",
      target: [local[0], local[1] - 0.02, local[2]],
      role: "guide",
      radius: 0,
      constraint: "hard",
    };
    const preservedChannels: AutoMovieHumanRigControls.DegreeChannel[] = (
      ["left", "right"] as const
    )
      .flatMap(
        (side: MotionAction.Side): AutoMovieHumanRigControls.DegreeChannel[] =>
          AutoMovieHumanRigControls.chain({ region: "leg", side }),
      )
      .filter(
        (channel: AutoMovieHumanRigControls.DegreeChannel): boolean =>
          channel !== "legs.left.ankle.dorsiflexion",
      );
    const plan: MotionAction.BodyPlacement = {
      pose: source.pose,
      rootOffset: [0, 0.02, 0],
      support: source.support,
      preservedChannels,
    };
    const realized: MotionAction.BodyPlacement = actor.prepareBody(plan, [leg]);
    assert.ok(Math.abs(realized.rootOffset[1] - 0.02) > 0.01);
    const context: MotionAction.Context = actor.context("left", [0, 0, 0]);
    const hand: MotionAction.Effector = {
      bone: "leftHand",
      localPoint: context.geometry.handLocalPoint,
      target: [0, 0, 0],
      role: "guard",
      radius: context.geometry.gloveRadiusMetres!,
    };
    hand.target = actor.person.object
      .worldToLocal(new THREE.Vector3(...actor.effector(hand)))
      .toArray();
    const arm: MotionAction.Sample = {
      pose: structuredClone(realized.pose),
      rootOffset: [...realized.rootOffset],
      rootRotation: realized.rootRotation
        ? [...realized.rootRotation]
        : undefined,
      support: structuredClone(realized.support) as MotionAction.Support,
      effectors: [hand],
      phase: "retraction",
      elapsed: 0.3,
      progress: 0.2,
    };
    actor.applyArm(
      arm,
      realized,
      "left",
      AutoMovieHumanRigControls.chain({ region: "arm", side: "left" }),
    );
    assert.equal(actor.support?.status, "admitted");
    assert.ok(actor.support!.floorMinimum >= -0.000001);
    const observation: {
      actualWorldGoals: { bone: string; position: MotionAction.Vec3 }[];
      fittingPlan: { channels: string[] };
    } = actor.inspect() as {
      actualWorldGoals: { bone: string; position: MotionAction.Vec3 }[];
      fittingPlan: { channels: string[] };
    };
    const retained: { bone: string; position: MotionAction.Vec3 } | undefined =
      observation.actualWorldGoals.find(
        (goal: { bone: string }): boolean => goal.bone === "leftFoot",
      );
    assert.ok(
      retained &&
        new THREE.Vector3(...retained.position).distanceTo(original) < 1e-12,
    );
    assert.ok(
      actor.errors.find(
        (error: { bone: string }): boolean => error.bone === "leftFoot",
      )!.error <= 0.00025,
    );
    assert.ok(
      observation.fittingPlan.channels.every((channel: string): boolean =>
        channel.startsWith("arms.left."),
      ),
    );
    const before: string = JSON.stringify(actor.constrained());
    assert.throws(
      (): MotionAction.BodyPlacement => actor.prepareBody(plan, [hand]),
    );
    assert.equal(JSON.stringify(actor.constrained()), before);
  } finally {
    actor.dispose();
  }
}

/**
 * Upright adoption retains actual heading and original declared ground goals.
 *
 * Scenarios:
 * 1. Adopt a supported guard whose public root has a nonzero pure yaw.
 * 2. Retain original declared WORLD patch coordinates after a small admitted residual.
 * 3. Reject a tilted endpoint before changing baseline, frame or lead metadata.
 *
 * @evidence contracts/testing.md#observable-behavior Uses the real original actor, public pose/root and actual matrices. The adopted frame must match its displayed forward direction, and original WORLD goals must remain byte-identical instead of following an achieved residual. Tilt refusal is atomic.
 * @evidence contracts/testing.md#independent-cases A pure Y quaternion defines an upright heading independently of the adapter. A50µm shift lies within the existing point/floor tolerances and distinguishes declared targets from achieved points. Full moving turns and tilted contact performances have separate consumers.
 */
export function test_actor_support_adopt_heading(): void {
  const actor: LabActor = new LabActor("adopt", "a", 0.3, 0.4, "right");
  try {
    const source: MotionAction.Sample = standing(actor);
    source.rootRotation = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.2)
      .toArray();
    for (const patch of source.support.patches!)
      patch.world = new THREE.Vector3(...patch.world)
        .sub(actor.origin)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.2)
        .add(actor.origin)
        .toArray();
    source.support.patches![0]!.world[0] += 0.00005;
    actor.apply(source);
    assert.equal(actor.support?.status, "admitted");
    const goals: MotionAction.SupportPatch[] = structuredClone(
      source.support.patches!,
    );
    const root: MotionAction.Vec3 = actor.person.object.position.toArray();
    actor.adopt();
    assert.ok(Math.abs(actor.yaw - 0.6) < 1e-12);
    assert.deepEqual(actor.origin.toArray(), root);
    assert.deepEqual(actor.patches.left.low.world, goals[0]!.world);
    assert.deepEqual(actor.patches.right.low.world, goals[1]!.world);
    assert.equal(actor.leadSide, "right");
    const before: string = JSON.stringify({
      base: actor.basePose,
      origin: actor.origin.toArray(),
      yaw: actor.yaw,
      patches: actor.patches,
      lead: actor.leadSide,
    });
    actor.person.object.quaternion.multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.1),
    );
    assert.throws((): void => actor.adopt(), /upright root/u);
    assert.equal(
      JSON.stringify({
        base: actor.basePose,
        origin: actor.origin.toArray(),
        yaw: actor.yaw,
        patches: actor.patches,
        lead: actor.leadSide,
      }),
      before,
    );
  } finally {
    actor.dispose();
  }
}

/**
 * Current face attachments replace their full-cloud physical population.
 *
 * Scenarios:
 * 1. Read the actual head/face cloud, then change the public jaw opening.
 * 2. The next cloud read uses the new displayed vertices and retains native body points.
 * 3. Repeating the same head pose reuses the same actual face population.
 *
 * @evidence contracts/testing.md#observable-behavior Changes the real person's public pose and observes the actor's actual bone-local geometry seam. A stale pre-replacement cloud fails while the native full-body population remains available.
 * @evidence contracts/testing.md#independent-cases Jaw opening is a supported public millimetre control that moves the drawn mouth marks. Current native mesh vertex count independently checks population size; no screenshot, reduced hull or generated snapshot serves as the oracle.
 */
export function test_actor_support_current_face_cloud(): void {
  const actor: LabActor = new LabActor("face-cloud", "a", 0, 0);
  try {
    const original: string = JSON.stringify(actor.bodyPoints("head"));
    const body: string = JSON.stringify(actor.bodyPoints("leftSubtalar"));
    const pose: MotionAction.Sample["pose"] = structuredClone(actor.pose);
    pose.head = { ...pose.head, jaw: { opening: 10 } };
    actor.person.pose(pose);
    const revision: number = actor.person.geometryRevision;
    const current: AutoMovieHumanSupportFrame.IPoint[] =
      actor.bodyPoints("head");
    assert.notEqual(JSON.stringify(current), original);
    assert.equal(JSON.stringify(actor.bodyPoints("leftSubtalar")), body);
    const count: number = actor.person
      .collisionParts()
      .filter((part: { bone: string }): boolean => part.bone === "head")
      .reduce(
        (total: number, part: { mesh: THREE.Mesh }): number =>
          total + part.mesh.geometry.getAttribute("position").count,
        0,
      );
    assert.equal(current.length, count);
    actor.person.pose(pose);
    assert.equal(actor.person.geometryRevision, revision);
    assert.deepEqual(actor.bodyPoints("head"), current);
  } finally {
    actor.dispose();
  }
}

/** Original two-foot supported request, independent of any action or prior actor sample. */
function standing(actor: LabActor): MotionAction.Sample {
  return {
    pose: structuredClone(actor.basePose),
    rootOffset: [0, 0, 0],
    support: {
      left: 0.5,
      right: 0.5,
      patches: [
        structuredClone(actor.patches.left.low),
        structuredClone(actor.patches.right.low),
      ],
    },
    effectors: [],
    phase: "idle",
    elapsed: 0,
    progress: 0,
  };
}

/**
 * Compact guard preparation and cached reset retain the final exact arm FK.
 * @evidence contracts/testing.md#observable-behavior Calls the actual compact guard producer, compares its returned FK against an independent evaluation of its returned pose, then resets the actual actor through the cached baseline and repeats the complete FK comparison. Returning the pre-arm support output fails even if the feet remain supported.
 * @evidence contracts/testing.md#independent-cases Fresh and cached preparations share actual original CPU geometry and a common final pose contract; the oracle is direct public FK, not cached bytes or a screenshot. Root support and visible shape remain separately checked by the existing actor admission units.
 */
export function test_actor_support_guard_fk_consistency(): void {
  const actor: LabActor = new LabActor("guard-fk", "a", 0, 0);
  try {
    actor.person.object.position.set(0, 0, 0);
    actor.person.object.quaternion.identity();
    const fresh: ReturnType<typeof fitLabGuard> = fitLabGuard(
      actor.person,
      labGuard("left"),
    );
    assert.deepEqual(
      fresh.support.output,
      actor.person.evaluate(fresh.support.pose),
    );
    assert.deepEqual(actor.person.output, fresh.support.output);
    actor.reset(0.2, 0.3, "left", -0.1);
    assert.deepEqual(
      actor.support!.output,
      actor.person.evaluate(actor.basePose),
    );
    assert.deepEqual(actor.person.output, actor.support!.output);
  } finally {
    actor.dispose();
  }
}
