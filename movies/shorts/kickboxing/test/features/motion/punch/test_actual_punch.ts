import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { LabActor } from "../../../../src/motion-lab/LabActor";
import { LabCase } from "../../../../src/motion-lab/LabCase";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { PunchAction } from "../../../../src/motion/punch/PunchAction";
import { PunchArm } from "../../../../src/motion/punch/PunchArm";
import { PunchTiming } from "../../../../src/motion/punch/PunchTiming";

/**
 * Realize an unobstructed A-left jab as a nearly straight supported whole arm.
 * @evidence contracts/testing.md#observable-behavior Drives the original polygon through support-first prepareBody, actual-placement coupled shoulder/elbow authoring and explicit own-side applyArm. It aggregates raw seed error, original pad, actual angle/plane/wrist, complete soles, continuity and return. Named bone/vertex snapshots and source error/work/clamps identify failures. Reverse seeking checks complete drawn geometry and immutable context. No GPU/browser or replaced method supplies the oracle.
 * @evidence contracts/testing.md#independent-cases The far target remains a miss while the arm extends with the authored12degree bend margin. Three degrees is the angle realization allowance; .25mm hard-goal and1µm floor limits remain unchanged. A new1mm boundary limit over10µs separately accommodates two .25mm endpoint errors plus .08mm at an authored8m/s comparison speed; it rejects the recorded126–154mm jumps. B, rear arms and guard stops are independent cases.
 */
export function test_actual_jab_a_left(): void {
  assertUnblocked("a", "left", "jab");
}

/**
 * Reuse the same unobstructed jab on B's right lead and opposite world heading.
 * @evidence contracts/testing.md#observable-behavior Calls the same action definition on a separate real actor with yawPI, reading actual rendered-bone transforms and complete soles. It catches local/world or anatomical-side confusion and the previously floating B-right pose.
 * @evidence contracts/testing.md#independent-cases The same anatomical165degree/actual-frame/grounding expectations apply after world reflection; actor palette and heading cannot change them. This independent export runs even if A's test fails.
 */
export function test_actual_jab_b_right(): void {
  assertUnblocked("b", "right", "jab");
}

/**
 * Preserve the nearly straight rear-arm cross rather than achieving its pad by folding.
 * @evidence contracts/testing.md#observable-behavior Applies the real cross through its measured forefoot preparation, delivery and return. It checks actual full-chain extension and hard constraints, catching the earlier140degree included-angle result despite a zero pad residual.
 * @evidence contracts/testing.md#independent-cases The authored12degree extension margin and IBA straight-arm relation define the165degree lower included-angle bound. Foot and frame checks use the same physical tolerances as jab rather than a cross-specific exemption.
 */
export function test_actual_cross_a_right(): void {
  assertUnblocked("a", "right", "cross");
}

/**
 * Reflect the same rear-arm cross into B's left rear arm and independent stance.
 * @evidence contracts/testing.md#observable-behavior Exercises the actual original actor with left rear/right lead, opposite heading and the same reusable geometry-guided cross. It checks actual joint-plane and support output rather than requested clinical signs alone.
 * @evidence contracts/testing.md#independent-cases The full-arm angle, wrist alignment and foot tolerances are unchanged by own-side/world reflection. Independent entry prevents another failed placement from masking this case.
 */
export function test_actual_cross_b_left(): void {
  assertUnblocked("b", "left", "cross");
}

/**
 * Retain a compact A-left hook through its actual whole-chain path and return.
 * @evidence contracts/testing.md#observable-behavior Reads original drawn shoulder/elbow/Hand, pad and complete soles through the Viewer consumer. Independent actual angle/plane/lever checks reject a misplaced hook. All five connected internal FK references remain observable without becoming duplicate Cartesian targets; literal external pad residual, clinical planning feasibility and final admission are separate strict checks. Early support failure cannot suppress later shape or return collection.
 * @evidence contracts/testing.md#independent-cases IBA47's bent-arm hook informs an authored88degree clinical margin, giving92degrees included at maximum reach. Three degrees is the existing straight-punch realization allowance, not relaxed hard-goal tolerance. Both actor sides and rising uppercuts run independently.
 */
export function test_actual_hook_a_left(): void {
  assertUnblocked("a", "left", "hook");
}

/**
 * Reuse the compact hook on B's opposite anatomical arm and world heading.
 * @evidence contracts/testing.md#observable-behavior Exercises the same independent pad, fixed realized body and coherent same-FK clinical arm on the original B polygon. Actual bend plane, frame continuity, Hand binding, source realization receipt and full soles expose actor/side-specific fitting failures; internal references never become host task obligations.
 * @evidence contracts/testing.md#independent-cases The same92degree included-angle staging target and unchanged physical tolerances apply on B/right. This independent export cannot be skipped by an A failure.
 */
export function test_actual_hook_b_right(): void {
  assertUnblocked("b", "right", "hook");
}

/**
 * Keep an A-right uppercut bent beneath its rising fist instead of extending straight.
 * @evidence contracts/testing.md#observable-behavior Uses real drawn geometry and the actual joint/support consumer throughout a source-timed uppercut. A lower elbow plane and compact arm angle distinguish its peak from both a straight and a horizontal hook; actual return and phase-boundary frames remain checked.
 * @evidence contracts/testing.md#independent-cases IBA52 informs the authored82degree flexion margin, hence98degree included angle at maximum range. It supplies a shape reference, not measured timing or a universal joint angle. Hard goals and complete-foot floor retain the original physical limits.
 */
export function test_actual_uppercut_a_right(): void {
  assertUnblocked("a", "right", "uppercut");
}

/**
 * Reflect the compact rising uppercut into B's left side without actor-specific goals.
 * @evidence contracts/testing.md#observable-behavior Reuses the same technique definition with opposite heading and actual Hand-bound pad. Included angle, below-line elbow, physical admission and continuous limb/foot frames catch straightening and local/world sign errors.
 * @evidence contracts/testing.md#independent-cases The98degree staging target and all physical tolerances match A/right; the separate export runs even when another family fails. Contact-driven blocked return has its own two real-receiver cases.
 */
export function test_actual_uppercut_b_left(): void {
  assertUnblocked("b", "left", "uppercut");
}

/**
 * Distinguish a real early A guard stop from unobstructed full extension and recover.
 * @evidence contracts/testing.md#observable-behavior Runs original actors and real Engine contact through LabCase. It checks a genuine guard event, bounded actual elbow bend, exact retained stop and final actual guard return, so the full-extension requirement cannot erase legitimate interception.
 * @evidence contracts/testing.md#independent-cases First contact must precede the authored peak, name guard and retain both actual body support results. The arm may remain bent here; the unblocked tests own near-straightness. No invented event or receiver translation can satisfy the trace assertion.
 */
export function test_actual_punch_guard_a(): void {
  assertGuard("a", "left");
}

/**
 * Retain real B-right guard interception and recovery after the arm-guide repair.
 * @evidence contracts/testing.md#observable-behavior Repeats actual receiving cover and the same real full-arm recovery through B's opposite heading. Both actors' physical and hand-bound output remain observable.
 * @evidence contracts/testing.md#independent-cases Explicit B/right identity and unchanged event/return tolerances prevent copying A-specific targets. Distant miss and full extension are covered separately; continuous visual quality remains Viewer review.
 */
export function test_actual_punch_guard_b(): void {
  assertGuard("b", "right");
}

/** Same physical regression for one independently instantiated anatomical placement. */
function assertUnblocked(
  identity: "a" | "b",
  side: MotionAction.Side,
  kind: "jab" | "cross" | "hook" | "uppercut",
): void {
  const lead: MotionAction.Side =
    kind === "jab" ? side : side === "left" ? "right" : "left";
  const actor: LabActor = new LabActor(
    identity,
    identity,
    0,
    identity === "a" ? 0 : Math.PI,
    lead,
  );
  const failures: string[] = [];
  try {
    const data: MotionAction.Context = actor.context(side, [0, 0, 0]);
    data.target = [
      data.geometry.shoulder![0] + 2,
      data.geometry.hand![1],
      data.geometry.shoulder![2],
    ];
    const contextBefore: string = JSON.stringify({
      basePose: data.basePose,
      target: data.target,
      geometry: data.geometry,
      supportPatches: data.supportPatches,
      frame: data.frame,
    });
    let peakWitnesses: Witness[] | undefined;
    const reference: PunchTiming.Measurement = PunchTiming.measurement(kind);
    const request: MotionAction.Request = {
      id: `unblocked-${identity}-${side}-${kind}`,
      actorId: identity,
      targetId: "distant-receiver",
      side,
      leadSide: lead,
      direction: [1, 0, 0],
      timing: {
        preparation: 0.12,
        delivery: reference.delivery,
        contact: 0.025,
        retraction: reference.retraction,
        recovery: 0.18,
      },
    };
    const action: PunchAction.Instance = PunchAction.create(kind, request);
    assert.equal(action.inspect(data).reachable, false);
    const peak: number = action.timing.preparation + action.timing.delivery;
    for (const elapsed of [
      0,
      action.timing.preparation * 0.5,
      action.timing.preparation,
      action.timing.preparation + action.timing.delivery * 0.5,
    ]) {
      if (applyAt(actor, action, data, elapsed, failures, `apply ${elapsed}`))
        collect(failures, `physical ${elapsed}`, (): void => physical(actor));
    }
    if (applyAt(actor, action, data, peak, failures, "peak apply")) {
      peakWitnesses = witnesses(actor);
      collect(failures, "peak physical", (): void => physical(actor));
      const shoulder: THREE.Vector3 = drawn(actor, `${side}UpperArm`);
      const elbow: THREE.Vector3 = drawn(actor, `${side}LowerArm`);
      const wrist: THREE.Vector3 = drawn(actor, `${side}Hand`);
      const pad: THREE.Vector3 = new THREE.Vector3(
        ...actor.effector(actor.sample!.effectors[0]!),
      );
      const angle: number =
        (shoulder.clone().sub(elbow).angleTo(wrist.clone().sub(elbow)) * 180) /
        Math.PI;
      const expected: number =
        kind === "hook" ? 92 : kind === "uppercut" ? 98 : 168;
      collect(failures, "peak included angle", (): void =>
        assert.ok(
          Math.abs(angle - expected) <= 3,
          `${angle}, expected ${expected}`,
        ),
      );
      const axis: THREE.Vector3 = wrist.clone().sub(shoulder).normalize();
      const arm: THREE.Vector3 = elbow.clone().sub(shoulder);
      const offLine: THREE.Vector3 = arm
        .clone()
        .addScaledVector(axis, -arm.dot(axis));
      collect(failures, "peak elbow plane", (): void => {
        if (kind === "hook")
          assert.ok(offLine.y >= 0.02, `Hook elbow plane ${offLine.y}`);
        else if (kind === "uppercut")
          assert.ok(offLine.y <= -0.02, `Uppercut elbow plane ${offLine.y}`);
        else assert.ok(offLine.y <= 0.002, `Straight elbow plane ${offLine.y}`);
      });
      collect(failures, "peak rigid wrist/pad", (): void => {
        assert.ok(
          pad
            .clone()
            .sub(wrist)
            .normalize()
            .dot(wrist.clone().sub(elbow).normalize()) >= 0.99,
        );
        assert.ok(
          pad.distanceTo(shoulder) < 1,
          "A two-metre target cannot stretch the arm",
        );
        assert.equal(
          actor.glove(side).parent,
          actor.person.drawing.bones.get(`${side}Hand`),
        );
        assert.ok((actor.pose.arms?.[side].hand?.index?.mcpFlexion ?? 0) >= 65);
        assert.ok(Math.abs(actor.pose.arms?.[side].wrist?.flexion ?? 0) < 1e-8);
      });
      collect(failures, "raw arm geometry", (): void =>
        rawGeometry(actor.sample!, data),
      );
    }
    continuity(actor, action, data, failures);
    const guardElbow: number = actor.basePose.arms![side].elbow!.flexion!;
    if (
      applyAt(actor, action, data, action.duration, failures, "guard apply")
    ) {
      collect(failures, "guard physical", (): void => physical(actor));
      collect(failures, "guard elbow return", (): void =>
        assert.ok(
          Math.abs(actor.pose.arms![side].elbow!.flexion! - guardElbow) <= 1e-8,
        ),
      );
    }
    if (
      peakWitnesses &&
      applyAt(actor, action, data, peak, failures, "reverse seek peak apply")
    ) {
      const repeated: Witness[] = witnesses(actor);
      const retained: Witness[] = peakWitnesses;
      collect(failures, "reverse seek determinism", (): void => {
        assert.equal(retained.length, repeated.length);
        for (let index: number = 0; index < retained.length; index++)
          assert.ok(
            retained[index]!.world.distanceTo(repeated[index]!.world) <= 1e-10,
            retained[index]!.name,
          );
      });
    }
    collect(failures, "immutable actor context", (): void =>
      assert.equal(
        JSON.stringify({
          basePose: data.basePose,
          target: data.target,
          geometry: data.geometry,
          supportPatches: data.supportPatches,
          frame: data.frame,
        }),
        contextBefore,
      ),
    );
    assert.deepEqual(
      failures,
      [],
      `${identity}/${side}/${kind} full-phase findings`,
    );
  } finally {
    actor.dispose();
  }
}

/** A separate1mm/10µs continuity bound leaves strict .25mm hard-goal and1µm floor admission unchanged. */
function continuity(
  actor: LabActor,
  action: PunchAction.Instance,
  data: MotionAction.Context,
  failures: string[],
): void {
  const delivery: number = action.timing.preparation;
  const contact: number = delivery + action.timing.delivery;
  const retraction: number = contact + action.timing.contact;
  const recovery: number = retraction + action.timing.retraction;
  for (const boundary of [
    delivery * 0.3,
    delivery,
    delivery + action.timing.delivery * 0.25,
    contact,
    retraction,
    recovery,
    recovery + action.timing.recovery * 0.3,
    recovery + action.timing.recovery * 0.8,
    action.duration,
  ]) {
    if (
      !applyAt(
        actor,
        action,
        data,
        boundary - 0.000005,
        failures,
        `boundary ${boundary} before apply`,
      )
    )
      continue;
    collect(failures, `boundary ${boundary} before physical`, (): void =>
      physical(actor),
    );
    const before: Witness[] = witnesses(actor);
    if (
      !applyAt(
        actor,
        action,
        data,
        boundary + 0.000005,
        failures,
        `boundary ${boundary} after apply`,
      )
    )
      continue;
    collect(failures, `boundary ${boundary} after physical`, (): void =>
      physical(actor),
    );
    const after: Witness[] = witnesses(actor);
    collect(failures, `boundary ${boundary} actual continuity`, (): void => {
      assert.equal(before.length, after.length);
      const distances: number[] = before.map(
        (value: Witness, index: number): number =>
          value.world.distanceTo(after[index]!.world),
      );
      const maximum: number = Math.max(...distances);
      const index: number = distances.indexOf(maximum);
      assert.ok(
        maximum <= 0.001,
        JSON.stringify({
          kind: action.kind,
          boundary,
          witness: before[index]!.name,
          bone: before[index]!.bone,
          metres: maximum,
          before: before[index]!.world.toArray(),
          after: after[index]!.world.toArray(),
          phase: actor.sample?.phase,
          reason: actor.support?.reason,
        }),
      );
    });
  }
}

/** Independent WORLD snapshots include both whole arms, leg centres, Hand axes and every original foot vertex. */
function witnesses(actor: LabActor): Witness[] {
  actor.person.object.updateWorldMatrix(true, true);
  const result: Witness[] = [];
  for (const side of ["left", "right"] as const) {
    for (const joint of [
      "UpperArm",
      "LowerArm",
      "Hand",
      "UpperLeg",
      "LowerLeg",
      "Foot",
      "Midfoot",
    ])
      result.push({
        name: `${side}${joint}`,
        bone: `${side}${joint}`,
        world: drawn(actor, `${side}${joint}`),
      });
    const hand: THREE.Group = actor.person.drawing.bones.get(`${side}Hand`)!;
    result.push(
      {
        name: `${side}Hand-X`,
        bone: `${side}Hand`,
        world: hand.localToWorld(new THREE.Vector3(0.05, 0, 0)),
      },
      {
        name: `${side}Hand-Y`,
        bone: `${side}Hand`,
        world: hand.localToWorld(new THREE.Vector3(0, 0.05, 0)),
      },
    );
    result.push({
      name: `${side}Hand-pad`,
      bone: `${side}Hand`,
      world: new THREE.Vector3(
        ...actor.effector({
          bone: side === "left" ? "leftHand" : "rightHand",
          localPoint: actor.glove(side).position.toArray(),
          target: [0, 0, 0],
          radius: 0,
          role: "guide",
        }),
      ),
    });
    for (const [bone, mesh] of actor.person.drawing.parts) {
      if (
        !bone.startsWith(side) ||
        !/(Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/u.test(
          bone,
        )
      )
        continue;
      const positions:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      for (let index: number = 0; index < positions.count; index++)
        result.push({
          name: `${bone}-vertex-${index}`,
          bone,
          world: new THREE.Vector3()
            .fromBufferAttribute(positions, index)
            .applyMatrix4(mesh.matrixWorld),
        });
    }
  }
  return result;
}

/** Actual contact remains the source of its connected return, never a planned peak. */
function assertGuard(identity: "a" | "b", side: MotionAction.Side): void {
  const scene: LabCase = new LabCase({
    action: "jab",
    actor: identity,
    side,
    target: "guard",
    defense: identity === "a" ? "catch" : "cover",
    distance: 1.1,
    seed: 17,
    aim: 0,
    timingVariation: 0,
    timingScale: 1,
    direction: 0,
    entry: false,
  });
  const failures: string[] = [];
  const actor: LabActor = scene.actors[identity];
  const originalGuard: IAutoMovieHumanPose = structuredClone(actor.basePose);
  try {
    assert.equal(scene.admissionError, null);
    assert.equal(scene.trace?.event?.relation, "guard");
    const event: MotionAction.ContactEvent = scene.trace!.event!;
    assert.ok(
      event.time >= 0.08 &&
        event.time < 0.08 + PunchTiming.measurement("jab").delivery,
    );
    scene.evaluate(scene.entrySeconds + event.time);
    collect(failures, "actual stop support", (): void => physical(actor));
    collect(failures, "receiver stop support", (): void =>
      physical(scene.actors[identity === "a" ? "b" : "a"]),
    );
    const stopped: string = JSON.stringify(actor.constrained());
    const shoulder: THREE.Vector3 = drawn(actor, `${side}UpperArm`);
    const elbow: THREE.Vector3 = drawn(actor, `${side}LowerArm`);
    const wrist: THREE.Vector3 = drawn(actor, `${side}Hand`);
    const angle: number =
      (shoulder.sub(elbow).angleTo(wrist.sub(elbow)) * 180) / Math.PI;
    collect(failures, "actual stopped arm", (): void =>
      assert.ok(
        angle > 20 && angle < 180,
        "A genuine early guard stop may retain a bent arm",
      ),
    );
    const stopFrame: Witness[] = witnesses(actor);
    scene.evaluate(scene.entrySeconds + event.time + 0.00001);
    collect(failures, "dwell support", (): void => physical(actor));
    const afterStop: Witness[] = witnesses(actor);
    collect(failures, "actual dwell continuity", (): void =>
      assert.ok(
        Math.max(
          ...stopFrame.map((point: Witness, index: number): number =>
            point.world.distanceTo(afterStop[index]!.world),
          ),
        ) <= 0.001,
      ),
    );
    const deadline: number =
      scene.entrySeconds +
      scene.readySeconds +
      event.time +
      scene.punchAction!.timing.contact +
      scene.punchAction!.timing.retraction;
    assert.equal(
      scene.recoveryPort().actions[0]!.endSeconds,
      deadline + scene.punchAction!.timing.recovery,
    );
    scene.evaluate(deadline);
    collect(failures, "original actual arm deadline", (): void =>
      guardReturn(actor, side, originalGuard),
    );
    scene.evaluate(scene.duration);
    collect(failures, "original actual final guard", (): void =>
      guardReturn(actor, side, originalGuard),
    );
    collect(failures, "actual return support", (): void => physical(actor));
    collect(failures, "receiver return support", (): void =>
      physical(scene.actors[identity === "a" ? "b" : "a"]),
    );
    scene.evaluate(scene.entrySeconds + event.time);
    collect(failures, "actual stop seek identity", (): void =>
      assert.equal(JSON.stringify(actor.constrained()), stopped),
    );
    assert.deepEqual(
      failures,
      [],
      `${identity}/${side} retained guard findings`,
    );
  } finally {
    scene.dispose();
  }
}

/** Independently retained guard articulation is rebound only to the same admitted actual body/root. */
function guardReturn(
  actor: LabActor,
  side: MotionAction.Side,
  original: IAutoMovieHumanPose,
): void {
  const paths: AutoMovieHumanRigControls.DegreeChannel[] = [
    ...AutoMovieHumanRigControls.chain({ region: "arm", side }),
    AutoMovieHumanRigControls.channel(`arms.${side}.wrist.flexion`),
    AutoMovieHumanRigControls.channel(`arms.${side}.wrist.radialDeviation`),
    ...(["thumb", "index", "middle", "ring", "little"] as const).flatMap(
      (
        digit: "thumb" | "index" | "middle" | "ring" | "little",
      ): AutoMovieHumanRigControls.DegreeChannel[] =>
        AutoMovieHumanRigControls.chain({ region: "finger", side, digit }),
    ),
  ];
  for (const path of paths)
    assert.ok(
      Math.abs(
        AutoMovieHumanRigControls.readApplied(actor.pose, path, []) -
          AutoMovieHumanRigControls.readApplied(original, path, []),
      ) <= 1e-8,
      `Original guard channel ${path}`,
    );
  const expected: IAutoMovieHumanPose = structuredClone(actor.pose);
  expected.arms ??= { left: {}, right: {} };
  expected.arms[side] = structuredClone(original.arms![side]);
  const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
  const pad: PunchArm.Witness = PunchArm.witnesses(context, expected, side)[0]!;
  const world: THREE.Vector3 = new THREE.Vector3(...pad.point).applyMatrix4(
    actor.person.object.matrixWorld,
  );
  const actual: THREE.Vector3 = new THREE.Vector3(
    ...actor.effector({
      bone: pad.bone,
      localPoint: pad.localPoint,
      target: [0, 0, 0],
      role: "guard",
      radius: 0.08,
    }),
  );
  assert.ok(
    actual.distanceTo(world) <= 0.00025,
    "Original same-body guard pad at original deadline",
  );
}

/** Read every original foot vertex, not merely a nonpenetrating but floating cloud. */
function physical(actor: LabActor): void {
  const failures: string[] = [];
  const floors: {
    side: MotionAction.Side;
    bone: string;
    vertex: number;
    world: number[];
  }[] = [];
  if (actor.support?.status !== "admitted")
    failures.push(
      `Support ${actor.support?.status}/${actor.support?.reason}, hard ${actor.support?.supportError}, floor ${actor.support?.floorMinimum}`,
    );
  for (const error of actor.errors)
    if (error.constraint === "hard" && error.error > 0.00025)
      failures.push(
        `${error.bone}/${error.role} hard world error ${error.error}`,
      );
  actor.person.object.updateWorldMatrix(true, true);
  for (const side of ["left", "right"] as const) {
    let minimum: number = Infinity;
    let lowest: { bone: string; vertex: number; world: number[] } | undefined;
    for (const [bone, mesh] of actor.person.drawing.parts) {
      if (
        !bone.startsWith(side) ||
        !/(Foot|Subtalar|Midfoot|Toe|Hallux|Second|Third|Fourth|Fifth)/u.test(
          bone,
        )
      )
        continue;
      const positions:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      for (let index: number = 0; index < positions.count; index++) {
        const world: THREE.Vector3 = new THREE.Vector3()
          .fromBufferAttribute(positions, index)
          .applyMatrix4(mesh.matrixWorld);
        if (world.y < minimum) {
          minimum = world.y;
          lowest = { bone, vertex: index, world: world.toArray() };
        }
      }
    }
    const released: boolean =
      actor.sample?.support[side] === 0 &&
      actor.sample.support.patches?.some(
        (patch: MotionAction.SupportPatch): boolean =>
          patch.side === side && patch.mode === "free",
      ) === true;
    if (!(minimum >= -0.000001 && (released || minimum <= 0.00025)))
      failures.push(`${side} complete foot minimum ${minimum}`);
    if (lowest) floors.push({ side, ...lowest });
  }
  assert.deepEqual(
    failures,
    [],
    failures.length ? failureFacts(actor, floors) : undefined,
  );
}

/** Detached named geometry identifies the actual bone/vertex responsible for a boundary jump. */
interface Witness {
  /** Stable original bone or vertex identity. */ name: string;
  /** Original drawn bone carrying this point. */ bone: string;
  /** Detached actual world position, metres. */ world: THREE.Vector3;
}

/** Failed admission retains exact raw/actual points and frames, phase and native solver reason. */
function failureFacts(actor: LabActor, floors: readonly unknown[]): string {
  const sample: MotionAction.Sample = actor.sample!;
  const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    actor.yaw,
  );
  const root: THREE.Vector3 = new THREE.Vector3(...sample.rootOffset)
    .applyQuaternion(heading)
    .add(actor.origin);
  const arm: unknown[] = sample.effectors.map(
    (effector: MotionAction.Effector, index: number): unknown => ({
      index,
      bone: effector.bone,
      localPoint: effector.localPoint,
      goal: new THREE.Vector3(...effector.target)
        .applyQuaternion(heading)
        .add(root)
        .toArray(),
      actual: actor.effector(effector),
      frame: actor.person.drawing.bones
        .get(effector.bone)!
        .getWorldQuaternion(new THREE.Quaternion())
        .toArray(),
      error: actor.errors[index],
    }),
  );
  const support: unknown[] = (sample.support.patches ?? []).map(
    (patch: MotionAction.SupportPatch): unknown => ({
      side: patch.side,
      load: sample.support[patch.side],
      bone: patch.bone,
      mode: patch.mode,
      constraint: patch.constraint,
      localPoint: patch.localPoint,
      goal: patch.world,
      actual: actor.effector({
        bone: patch.bone,
        localPoint: patch.localPoint,
        target: [0, 0, 0],
        role: "support",
        radius: 0,
      }),
      requestedFrameDelta: patch.frameRotation,
      actualFrame: actor.person.drawing.bones
        .get(patch.bone)!
        .getWorldQuaternion(new THREE.Quaternion())
        .toArray(),
    }),
  );
  const side: MotionAction.Side = sample.effectors[0]!.bone.startsWith("left")
    ? "left"
    : "right";
  const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
  const inspection: object = actor.inspect();
  return JSON.stringify({
    phase: sample.phase,
    elapsed: sample.elapsed,
    reason: actor.support?.reason,
    iterations: actor.support?.iterations,
    activeBounds: actor.support?.activeBounds,
    requestedRoot: root.toArray(),
    appliedRoot: actor.person.object.position.toArray(),
    preserved: sample.preservedChannels,
    floors,
    arm,
    support,
    clinicalPlanning: PunchArm.witnesses(context, sample.pose, side),
    clinicalShown: PunchArm.witnesses(context, actor.pose, side),
    armFit: Reflect.get(sample, "armFit"),
    authoredSeed: Reflect.get(inspection, "authoredSeed"),
    exactHardAxes: Reflect.get(inspection, "hardGoalResiduals"),
    fittingPlan: Reflect.get(inspection, "fittingPlan"),
  });
}

/** Collect every independently reachable phase/shape result in the one inspection round. */
function collect(
  failures: string[],
  label: string,
  inspect: () => void,
): boolean {
  try {
    inspect();
    return true;
  } catch (error: unknown) {
    failures.push(`${label}: ${String(error)}`);
    return false;
  }
}

/** The clinical path must preserve measured rigid geometry and realize its independent raw pad task. */
function rawGeometry(
  sample: PunchAction.Sample,
  context: MotionAction.Context,
): void {
  const side: MotionAction.Side = sample.effectors[0]!.bone.startsWith("left")
    ? "left"
    : "right";
  const shape: PunchArm.Witness[] = PunchArm.witnesses(
    context,
    sample.pose,
    side,
  );
  const pad: THREE.Vector3 = new THREE.Vector3(...shape[0]!.point);
  const shoulder: THREE.Vector3 = new THREE.Vector3(...shape[1]!.point);
  const elbow: THREE.Vector3 = new THREE.Vector3(...shape[2]!.point);
  const wrist: THREE.Vector3 = new THREE.Vector3(...shape[3]!.point);
  assert.equal(
    sample.effectors.length,
    1,
    "Internal clinical witnesses must not become independent Cartesian obligations",
  );
  if (sample.armFit) {
    assert.equal(
      sample.armFit.status,
      "realized",
      JSON.stringify(sample.armFit),
    );
    assert.ok(sample.armFit.error <= 0.00025, JSON.stringify(sample.armFit));
    assert.deepEqual(sample.armFit.channels, [
      `arms.${side}.shoulder.flexion`,
      `arms.${side}.shoulder.abduction`,
      `arms.${side}.shoulder.rotation`,
      `arms.${side}.elbow.flexion`,
    ]);
    assert.deepEqual(
      sample.armFit.shape.failures,
      [],
      JSON.stringify(sample.armFit),
    );
    assert.equal(
      sample.armFit.constraintsSatisfied,
      true,
      JSON.stringify(sample.armFit),
    );
    assert.equal(sample.armFit.constraintValues.length, 2);
    assert.ok(
      sample.armFit.constraintValues.every(
        (row: PunchArm.Fit["constraintValues"][number]): boolean =>
          Number.isFinite(row.value) &&
          Number.isFinite(row.violation) &&
          row.violation >= 0,
      ),
      JSON.stringify(sample.armFit),
    );
    assert.deepEqual(
      sample.armFit.points.map(
        (reference: PunchArm.Fit["points"][number]): string => reference.name,
      ),
      ["pad"],
    );
    for (const reference of sample.armFit.points)
      assert.ok(reference.error <= 0.00025, JSON.stringify(reference));
  }
  assert.ok(
    pad.distanceTo(new THREE.Vector3(...sample.effectors[0]!.target)) <=
      0.00025,
    JSON.stringify({
      phase: sample.phase,
      elapsed: sample.elapsed,
      cause: "authored clinical pad task is not realized",
      raw: sample.effectors[0]!.target,
      clinical: pad.toArray(),
      shape,
    }),
  );
  assert.ok(
    Math.abs(shoulder.distanceTo(elbow) - context.geometry.upperArmMetres!) <=
      1e-10,
  );
  assert.ok(
    Math.abs(elbow.distanceTo(wrist) - context.geometry.forearmMetres!) <=
      1e-10,
  );
  assert.ok(
    Math.abs(wrist.distanceTo(pad) - context.geometry.gloveOffsetMetres!) <=
      1e-10,
  );
  assert.ok(
    pad
      .clone()
      .sub(wrist)
      .normalize()
      .dot(wrist.clone().sub(elbow).normalize()) >=
      1 - 1e-10,
  );
  assert.ok(
    Math.abs(new THREE.Vector3(...shape[4]!.point).distanceTo(wrist) - 0.05) <=
      1e-10,
  );
}

/** Source planning, shown geometry and actual admission are collected independently at each existing phase. */
function applyAt(
  actor: LabActor,
  action: PunchAction.Instance,
  context: MotionAction.Context,
  elapsed: number,
  failures: string[],
  label: string,
): boolean {
  return collect(failures, label, (): void => {
    const placement: MotionAction.BodyPlacement = actor.prepareBody(
      action.planBody(elapsed, context),
    );
    const sample: PunchAction.Sample = action.sample(
      elapsed,
      context,
      placement,
    );
    collect(failures, `${label} clinical planning`, (): void =>
      rawGeometry(sample, context),
    );
    const bodyBefore: string = JSON.stringify({
      root: placement.rootOffset,
      support: placement.support,
      legs: placement.pose.legs,
      pelvis: placement.pose.pelvis,
      spine: placement.pose.spine,
    });
    actor.applyArm(sample, placement, action.request.side, action.armChannels);
    collect(failures, `${label} fixed body stage`, (): void => {
      assert.equal(
        JSON.stringify({
          root: sample.rootOffset,
          support: sample.support,
          legs: sample.pose.legs,
          pelvis: sample.pose.pelvis,
          spine: sample.pose.spine,
        }),
        bodyBefore,
      );
      assert.ok(
        actor.person.object.position.distanceTo(
          new THREE.Vector3(...sample.rootOffset)
            .applyAxisAngle(new THREE.Vector3(0, 1, 0), actor.yaw)
            .add(actor.origin),
        ) <= 1e-10,
      );
    });
    collect(failures, `${label} shown clinical shape`, (): void =>
      shownClinical(actor, context, sample),
    );
  });
}

/** All five actual coupled-FK references match the original drawing; retained clinical controls remain explicit. */
function shownClinical(
  actor: LabActor,
  context: MotionAction.Context,
  planned: MotionAction.Sample,
): void {
  const side: MotionAction.Side = planned.effectors[0]!.bone.startsWith("left")
    ? "left"
    : "right";
  const source: NonNullable<typeof actor.pose.arms>["left"] =
    planned.pose.arms![side];
  const actual: NonNullable<typeof actor.pose.arms>["left"] =
    actor.pose.arms![side];
  for (const [value, expected] of [
    [
      actual.shoulderGirdle?.elevation ?? 0,
      source.shoulderGirdle?.elevation ?? 0,
    ],
    [
      actual.shoulderGirdle?.upwardRotation ?? 0,
      source.shoulderGirdle?.upwardRotation ?? 0,
    ],
    [
      actual.shoulderGirdle?.protraction ?? 0,
      source.shoulderGirdle?.protraction ?? 0,
    ],
    [actual.forearm?.pronation ?? 0, source.forearm?.pronation ?? 0],
    [actual.wrist?.flexion ?? 0, source.wrist?.flexion ?? 0],
    [actual.wrist?.radialDeviation ?? 0, source.wrist?.radialDeviation ?? 0],
  ])
    assert.ok(Math.abs(value! - expected!) <= 1e-8);
  for (const point of PunchArm.witnesses(context, actor.pose, side)) {
    const reference: THREE.Vector3 = actor.person.object.localToWorld(
      new THREE.Vector3(...point.point),
    );
    const displayed: THREE.Vector3 = new THREE.Vector3(
      ...actor.effector({
        bone: point.bone,
        localPoint: point.localPoint,
        target: [0, 0, 0],
        radius: 0,
        role: "guide",
      }),
    );
    assert.ok(
      reference.distanceTo(displayed) <= 1e-8,
      JSON.stringify({
        name: point.name,
        bone: point.bone,
        clinical: reference.toArray(),
        displayed: displayed.toArray(),
        rotation: point.rotation,
      }),
    );
  }
}

/** The actual Viewer bone node is the oracle, alongside the real attached glove and sole meshes. */
function drawn(actor: LabActor, bone: string): THREE.Vector3 {
  const node: THREE.Group | undefined = actor.person.drawing.bones.get(bone);
  assert.ok(node, `Missing displayed ${bone}`);
  actor.person.object.updateWorldMatrix(true, true);
  return node.getWorldPosition(new THREE.Vector3());
}
