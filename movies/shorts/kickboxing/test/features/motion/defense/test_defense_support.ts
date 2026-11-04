import assert from "node:assert/strict";
import * as THREE from "three";
import { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { DefenseMotion } from "../../../../src/motion/defense/DefenseMotion";
import { LabActor } from "../../../../src/motion-lab/LabActor";
import { displayedSurface } from "../../../../src/displayedSurface";

/**
 * Check actual left guard support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent left phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The left placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_guard_left(): void { assertDefense("guard", "left"); }

/**
 * Check actual right guard support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent right phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The right placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_guard_right(): void { assertDefense("guard", "right"); }

/**
 * Check actual left cover support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent left phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The left placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_cover_left(): void { assertDefense("cover", "left"); }

/**
 * Check actual right cover support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent right phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The right placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_cover_right(): void { assertDefense("cover", "right"); }

/**
 * Check actual left catch support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent left phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The left placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_catch_left(): void { assertDefense("catch", "left"); }

/**
 * Check actual right catch support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent right phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The right placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_catch_right(): void { assertDefense("catch", "right"); }

/**
 * Check actual left parry support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent left phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The left placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_parry_left(): void { assertDefense("parry", "left"); }

/**
 * Check actual right parry support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent right phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The right placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_parry_right(): void { assertDefense("parry", "right"); }

/**
 * Check actual left slip support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent left phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The left placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_slip_left(): void { assertDefense("slip", "left"); }

/**
 * Check actual right slip support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent right phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The right placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_slip_right(): void { assertDefense("slip", "right"); }

/**
 * Check actual left weave support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent left phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The left placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_weave_left(): void { assertDefense("weave", "left"); }

/**
 * Check actual right weave support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent right phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The right placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_weave_right(): void { assertDefense("weave", "right"); }

/**
 * Check actual left check support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent left phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The left placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_check_left(): void { assertDefense("check", "left"); }

/**
 * Check actual right check support and local phase joins on the original Human.
 *
 * Scenarios:
 * 1. Apply the independent right phase sequence through actual whole-foot fitting.
 * 2. Inspect all phase joins and retained contact dwell through actual bone matrices.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the real defense and LabActor joint fitting; asserts complete foot-floor admission, final world target errors and detached root/knee/foot/hand continuity through every phase boundary. No browser, GPU or replaced dependency participates.
 * @evidence contracts/testing.md#independent-cases The right placement uses its own measured guard and fixed ground witnesses. The .25mm named-target and 1micrometre full-foot-floor requirements remain unchanged; 20-microsecond joins use .25mm, catching reported centimetre jumps. Timings are authored. Other cases keep a failure here from masking another technique or side.
 */
export function test_defense_support_check_right(): void { assertDefense("check", "right"); }

/**
 * Keep the left checking foot behind the actual proximal shin shield.
 *
 * Scenarios:
 * 1. Pose the same actual left leg and retained original foot geometry.
 * 2. Compare every foot vertex against the own-forward proximal tibial surface.
 *
 * @evidence contracts/testing.md#observable-behavior Measures every original emitted checking-foot vertex against a point on the actual proximal shin surface under the authored ready pose. An ankle or toe protruding ahead fails; geometry is never shrunk.
 * @evidence contracts/testing.md#independent-cases The own-forward projection comes from actual mesh matrices and the upper-quarter tibial surface, not a copied degree value. This is a geometric shield-shape condition; the separate two-actor consumer must still demonstrate shin-first contact on the unchanged thigh threat.
 */
export function test_defense_shield_left(): void { assertShield("left"); }

/**
 * Preserve the same protective geometry for the independent right-side check.
 *
 * Scenarios:
 * 1. Reuse the check definition for the right leg and opposite scene heading.
 * 2. Retain every foot vertex in the same anatomical projection test.
 *
 * @evidence contracts/testing.md#observable-behavior Measures the actual right foot and proximal tibia in the opposite actor heading, catching side or world-frame shortcuts.
 * @evidence contracts/testing.md#independent-cases Uses identical anatomical meaning with independent side coordinates. Full foot coverage is retained; a failed footprint condition is not relabelled as a shin-check.
 */
export function test_defense_shield_right(): void { assertShield("right"); }

/** Exercise the final actual joint consumer, with one body fixture retired per semantic case. */
function assertDefense(kind: DefenseMotion.Kind, side: MotionAction.Side): void {
  const actor: LabActor = new LabActor("receiver", side === "left" ? "a" : "b", 0, side === "left" ? 0 : Math.PI, side);
  try {
    const input: ReturnType<typeof inputs> = inputs(actor, kind, side);
    const authoredReceiving: string = JSON.stringify(input.config.receiving);
    const failures: string[] = [];
    const observe: (sample: DefenseMotion.Sample, label: string) => THREE.Vector3[] = (sample: DefenseMotion.Sample, label: string): THREE.Vector3[] => {
      if ((kind === "slip" || kind === "weave" || kind === "check") && ["preparation", "delivery", "contact", "retraction"].includes(sample.phase) && (!actor.supportPlanning.last || actor.supportPlanning.last.status !== "admitted" || actor.supportPlanning.last.iterations > 16)) failures.push(`${label}: support preparation lacks its actual original-frame whole-foot outcome`);
      for (const foot of ["left", "right"] as const) if (sample.support[foot] > 0 && !(sample.support.patches ?? []).some((patch: MotionAction.SupportPatch): boolean => patch.side === foot && patch.mode !== "free" && patch.constraint === "hard")) failures.push(`${label}: ${foot} positive load lacks a hard ground witness`);
      actor.apply(sample);
      if (!actor.support || actor.support.status !== "admitted" || actor.support.floorMinimum < -.000001) failures.push(`${label}: ${JSON.stringify({ status: actor.support?.status, reason: actor.support?.reason, hardError: actor.support?.supportError, softError: actor.support?.softError, floor: actor.support?.floorMinimum, bounds: actor.support?.activeBounds, root: actor.support?.root, supportPlanning: actor.supportPlanning })}`);
      for (const error of actor.errors) {
        if (!Number.isFinite(error.error) || error.error > .00025) failures.push(`${label}: ${error.bone} ${error.constraint} actual error ${error.error}`);
      }
      for (const reference of sample.clinicalWitnesses ?? []) {
        const actual: THREE.Vector3 = actor.person.object.worldToLocal(actor.person.drawing.bones.get(reference.bone)!.localToWorld(new THREE.Vector3(...(reference.localPoint ?? [0, 0, 0]))));
        const error: number = actual.distanceTo(new THREE.Vector3(...reference.target));
        if (error > .00025) failures.push(`${label}: clinical ${reference.bone} body-frame error ${error}m ${JSON.stringify({ raw: reference, actual: actual.toArray(), requestedRoot: sample.rootOffset, appliedRoot: actor.person.object.position.toArray(), supportPlanning: actor.supportPlanning })}`);
      }
      return ["hips", `${side}LowerLeg`, `${side}Foot`, `${side}Hand`].map((bone: string): THREE.Vector3 => new THREE.Vector3(...actor.person.point(bone)));
    };
    const apply: (time: number) => THREE.Vector3[] = (time: number): THREE.Vector3[] => observe(DefenseMotion.sample(kind, input.request, input.context, time, input.config), `${kind}/${side} t=${time}`);
    for (const time of [0, .05, .16, .24, .36, .50, .56]) apply(time);
    for (const boundary of [.10, .22, .26, .46, .56]) {
      const beforeSample: DefenseMotion.Sample = DefenseMotion.sample(kind, input.request, input.context, boundary - .00001, input.config);
      const before: THREE.Vector3[] = observe(beforeSample, `${kind}/${side} before phase ${boundary}`);
      const beforeFeet: THREE.Vector3[] = footVertices(actor);
      const beforeApplied: { pose: typeof actor.pose; root: number[] } = { pose: structuredClone(actor.pose), root: actor.person.object.position.toArray() };
      const afterSample: DefenseMotion.Sample = DefenseMotion.sample(kind, input.request, input.context, boundary + .00001, input.config);
      const after: THREE.Vector3[] = observe(afterSample, `${kind}/${side} after phase ${boundary}`);
      const afterFeet: THREE.Vector3[] = footVertices(actor);
      const maximum: number = Math.max(...before.map((point: THREE.Vector3, index: number): number => point.distanceTo(after[index]!)), ...beforeFeet.map((point: THREE.Vector3, index: number): number => point.distanceTo(afterFeet[index]!)));
      if (maximum > .00025) failures.push(`${kind}/${side} raw/applied phase ${boundary} maximum ${maximum}m ${JSON.stringify({ beforeSample, afterSample, beforeApplied, afterApplied: { pose: actor.pose, root: actor.person.object.position.toArray() } })}`);
      for (let index: number = 0; index < before.length; index++) if (before[index]!.distanceTo(after[index]!) > .00025) failures.push(`${kind}/${side} joint ${index} phase ${boundary} jumps ${before[index]!.distanceTo(after[index]!)}m`);
      for (let index: number = 0; index < beforeFeet.length; index++) if (beforeFeet[index]!.distanceTo(afterFeet[index]!) > .00025) failures.push(`${kind}/${side} original foot vertex ${index} phase ${boundary} jumps ${beforeFeet[index]!.distanceTo(afterFeet[index]!)}m`);
    }
    const middle: number = kind === "weave" ? .28 : .22;
    apply(middle);
    if ((kind === "cover" || kind === "catch" || kind === "parry") && (actor.pose.arms?.[side].elbow?.flexion ?? 0) < 70) failures.push(`${kind}/${side} compact defense lost its bent receiving arm`);
    if (kind === "parry" && Math.abs((actor.pose.spine?.thoracic?.rotation ?? 0) - (input.context.basePose.spine?.thoracic?.rotation ?? 0)) > 1e-8) failures.push(`${kind}/${side} small guard-relative parry replaced the admitted torso rotation`);
    const stopped: MotionAction.Sample = actor.constrained();
    const event: MotionAction.ContactEvent = { actionId: "incoming", actorId: input.request.targetId, targetId: actor.id, time: 4.7, relation: kind === "check" ? "shin-check" : "guard", point: actor.person.point(`${side}LowerLeg`), normal: [1, 0, 0] };
    const contact: MotionAction.Context = { ...input.context, contact: { event, sample: stopped } };
    const held: MotionAction.Sample = DefenseMotion.sample(kind, input.request, contact, middle + .04, { ...input.config, contactElapsed: .04 });
    assert.equal(held.phase, "contact");
    assert.ok(new THREE.Vector3(...held.rootOffset).distanceTo(new THREE.Vector3(...stopped.rootOffset)) < 1e-12);
    for (let index: number = 0; index < held.effectors.length; index++) assert.ok(new THREE.Vector3(...held.effectors[index]!.target).distanceTo(new THREE.Vector3(...stopped.effectors[index]!.target)) < 1e-12);
    const beforeReturn: MotionAction.Sample = DefenseMotion.sample(kind, input.request, contact, middle + .04 - .00001, { ...input.config, contactElapsed: .04 - .00001 });
    const beforeJoints: THREE.Vector3[] = observe(beforeReturn, `${kind}/${side} before dwell release`);
    const beforeFeet: THREE.Vector3[] = footVertices(actor);
    const beforeActual: { pose: typeof actor.pose; root: number[] } = { pose: structuredClone(actor.pose), root: actor.person.object.position.toArray() };
    const afterReturn: MotionAction.Sample = DefenseMotion.sample(kind, input.request, contact, middle + .04 + .00001, { ...input.config, contactElapsed: .04 + .00001 });
    const afterJoints: THREE.Vector3[] = observe(afterReturn, `${kind}/${side} after dwell release`);
    const afterFeet: THREE.Vector3[] = footVertices(actor);
    const maximumJoin: number = Math.max(...beforeJoints.map((point: THREE.Vector3, index: number): number => point.distanceTo(afterJoints[index]!)), ...beforeFeet.map((point: THREE.Vector3, index: number): number => point.distanceTo(afterFeet[index]!)));
    if (maximumJoin > .00025) failures.push(`${kind}/${side} contact release actual joint/full-foot jump ${maximumJoin}m ${JSON.stringify({ before: beforeReturn, after: afterReturn, beforeActual, afterActual: { pose: actor.pose, root: actor.person.object.position.toArray() } })}`);
    for (const patch of stopped.support.patches ?? []) if ((stopped.support.patches ?? []).some((ground: MotionAction.SupportPatch): boolean => ground.side === patch.side && ground.mode !== "free")) {
      const retained: MotionAction.SupportPatch | undefined = afterReturn.support.patches?.find((candidate: MotionAction.SupportPatch): boolean => candidate.side === patch.side && candidate.bone === patch.bone && candidate.mode === patch.mode && candidate.localPoint.every((value: number, index: number): boolean => value === patch.localPoint[index]));
      if (!retained || JSON.stringify(retained) !== JSON.stringify(patch)) failures.push(`${kind}/${side} stopped loaded support replaced at release ${JSON.stringify({ patch, retained })}`);
    }
    for (const age of [.14, .24, .29, .34]) observe(DefenseMotion.sample(kind, input.request, contact, middle + age, { ...input.config, contactElapsed: age }), `${kind}/${side} incoming age=${age}`);
    if (!["guard", "slip", "weave"].includes(kind)) {
      const middleReturn: DefenseMotion.Sample = DefenseMotion.sample(kind, input.request, contact, middle + .14, { ...input.config, contactElapsed: .14 });
      const receiving: NonNullable<DefenseMotion.Config["receiving"]> = input.config.receiving!;
      const actual: MotionAction.Effector = middleReturn.clinicalWitnesses!.find((target: MotionAction.Effector): boolean => target.bone === receiving.bone && JSON.stringify(target.localPoint) === JSON.stringify(receiving.localPoint))!;
      actor.person.pose(middleReturn.pose);
      actor.person.object.updateWorldMatrix(true, true);
      const expected: THREE.Vector3 = actor.person.object.worldToLocal(actor.person.drawing.bones.get(receiving.bone)!.localToWorld(new THREE.Vector3(...(receiving.localPoint ?? [0, 0, 0]))));
      if (expected.distanceTo(new THREE.Vector3(...actual.target)) > 1e-8 || actual.constraint === "soft") failures.push(`${kind}/${side} originally declared clinical withdrawal does not follow its one pose ${JSON.stringify({ actual, expected: expected.toArray() })}`);
      if (middleReturn.effectors.some((target: MotionAction.Effector): boolean => target.bone === receiving.bone && JSON.stringify(target.localPoint) === JSON.stringify(receiving.localPoint))) failures.push(`${kind}/${side} clinical withdrawal leaked into external world tasks`);
    }
    if (kind === "check") {
      const beforePlant: THREE.Vector3[] = observe(DefenseMotion.sample(kind, input.request, contact, middle + .24 - .00001, { ...input.config, contactElapsed: .24 - .00001 }), `${kind}/${side} before incoming plant`);
      const beforePlantFeet: THREE.Vector3[] = footVertices(actor);
      const afterPlant: THREE.Vector3[] = observe(DefenseMotion.sample(kind, input.request, contact, middle + .24 + .00001, { ...input.config, contactElapsed: .24 + .00001 }), `${kind}/${side} after incoming plant`);
      const afterPlantFeet: THREE.Vector3[] = footVertices(actor);
      for (let index: number = 0; index < beforePlant.length; index++) if (beforePlant[index]!.distanceTo(afterPlant[index]!) > .00025) failures.push(`${kind}/${side} incoming plant joint ${index} jumps ${beforePlant[index]!.distanceTo(afterPlant[index]!)}m`);
      for (let index: number = 0; index < beforePlantFeet.length; index++) if (beforePlantFeet[index]!.distanceTo(afterPlantFeet[index]!) > .00025) failures.push(`${kind}/${side} incoming plant source vertex ${index} jumps ${beforePlantFeet[index]!.distanceTo(afterPlantFeet[index]!)}m`);
    }
    const endAge: number = input.request.timing.contact + input.request.timing.retraction + (kind === "check" ? input.request.timing.recovery : 0);
    const beforeEnd: THREE.Vector3[] = observe(DefenseMotion.sample(kind, input.request, contact, middle + endAge - .00001, { ...input.config, contactElapsed: endAge - .00001 }), `${kind}/${side} before return completion`);
    const beforeEndFeet: THREE.Vector3[] = footVertices(actor);
    const afterEnd: THREE.Vector3[] = observe(DefenseMotion.sample(kind, input.request, contact, middle + endAge + .00001, { ...input.config, contactElapsed: endAge + .00001 }), `${kind}/${side} completed return`);
    const afterEndFeet: THREE.Vector3[] = footVertices(actor);
    for (let index: number = 0; index < beforeEnd.length; index++) if (beforeEnd[index]!.distanceTo(afterEnd[index]!) > .00025) failures.push(`${kind}/${side} return completion joint ${index} jumps ${beforeEnd[index]!.distanceTo(afterEnd[index]!)}m`);
    for (let index: number = 0; index < beforeEndFeet.length; index++) if (beforeEndFeet[index]!.distanceTo(afterEndFeet[index]!) > .00025) failures.push(`${kind}/${side} return completion source vertex ${index} jumps ${beforeEndFeet[index]!.distanceTo(afterEndFeet[index]!)}m`);
    if (JSON.stringify(input.config.receiving) !== authoredReceiving) failures.push(`${kind}/${side} original independent receiving declaration was mutated`);
    assert.equal(failures.length, 0, failures.join("\n"));
  } finally { actor.dispose(); }
}

/** Build independently measured baseline points and a coherent authored check peak. */
function inputs(actor: LabActor, kind: DefenseMotion.Kind, side: MotionAction.Side): { request: MotionAction.Request; context: MotionAction.Context; config: DefenseMotion.Config } {
  const request: MotionAction.Request = { id: `defense-${kind}-${side}`, actorId: actor.id, targetId: "independent-attacker", side, leadSide: side, direction: [1, 0, 0], timing: { preparation: .1, delivery: .12, contact: .04, retraction: .2, recovery: .1 } };
  const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
  const guard: Record<MotionAction.Side, DefenseMotion.Patch> = { left: hand(actor, "left"), right: hand(actor, "right") };
  const config: DefenseMotion.Config = { guard, guardBinding: "clinical", receivingReturn: "clinical", receiving: { ...guard[side], restTarget: [...guard[side].target], target: [guard[side].target[0] + .035, guard[side].target[1], guard[side].target[2]] }, parryDisplacement: [0, 0, side === "left" ? .03 : -.03], rootDropMetres: kind === "weave" ? .10 : .035, lateralMetres: .06, supportShift: kind === "check" ? DefenseMotion.supportShift(context, side) : undefined };
  if (kind === "check") {
    const bone: MotionAction.Effector["bone"] = AutoMovieHumanRigControls.joint(`${side}LowerLeg`);
    const mesh: THREE.Mesh = actor.mesh(bone);
    const knee: THREE.Vector3 = new THREE.Vector3(...actor.person.point(bone));
    const ankle: THREE.Vector3 = new THREE.Vector3(...actor.person.point(`${side}Foot`));
    const localPoint: MotionAction.Vec3 = mesh.worldToLocal(knee.lerp(ankle, .25)).toArray();
    const restTarget: MotionAction.Vec3 = actor.local(mesh.localToWorld(new THREE.Vector3(...localPoint)).toArray());
    mesh.geometry.computeBoundingSphere();
    config.receiving = { bone, localPoint, target: [...restTarget], restTarget, radius: mesh.geometry.boundingSphere!.radius };
    const peak: MotionAction.Sample = DefenseMotion.sample(kind, request, context, .22, config);
    actor.person.pose(peak.pose);
    actor.person.object.updateWorldMatrix(true, true);
    config.receiving.target = actor.person.object.worldToLocal(actor.person.drawing.bones.get(bone)!.localToWorld(new THREE.Vector3(...localPoint))).toArray();
  }
  return { request, context, config };
}

/** Capture every original plantar/forefoot/toe source vertex through actual matrices. */
function footVertices(actor: LabActor): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (const [bone, mesh] of actor.person.drawing.parts) if ((bone.startsWith("left") || bone.startsWith("right")) && /Foot|Subtalar|Midfoot|Hallux|Toe/u.test(bone)) {
    const vertices: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
    for (let index: number = 0; index < vertices.count; index++) points.push(mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(vertices, index)));
  }
  assert.ok(points.length > 0);
  return points;
}

/** Read the real bone-bound glove, never a detached authored hand. */
function hand(actor: LabActor, side: MotionAction.Side): DefenseMotion.Patch {
  const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
  return { bone: AutoMovieHumanRigControls.joint(`${side}Hand`), target: context.geometry.hand!, localPoint: context.geometry.handLocalPoint, radius: context.geometry.gloveRadiusMetres! };
}

/** Inspect every emitted foot vertex in the actor's own forward frame. */
function assertShield(side: MotionAction.Side): void {
  const actor: LabActor = new LabActor("receiver", side === "left" ? "a" : "b", 0, side === "left" ? 0 : Math.PI, side);
  try {
    const input: ReturnType<typeof inputs> = inputs(actor, "check", side);
    const peak: MotionAction.Sample = DefenseMotion.sample("check", input.request, input.context, .22, input.config);
    actor.person.pose(peak.pose);
    actor.person.object.updateWorldMatrix(true, true);
    const knee: THREE.Vector3 = new THREE.Vector3(...actor.person.point(`${side}LowerLeg`));
    const ankle: THREE.Vector3 = new THREE.Vector3(...actor.person.point(`${side}Foot`));
    const proximal: THREE.Vector3 = knee.clone().lerp(ankle, .25);
    const shin: THREE.Mesh = actor.mesh(`${side}LowerLeg`);
    const forward: THREE.Vector3 = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), actor.yaw);
    const surface: THREE.Vector3 = displayedSurface.nearest(shin, proximal.clone().addScaledVector(forward, .2));
    const shield: number = actor.person.object.worldToLocal(surface).x;
    let maximum: number = -Infinity;
    let count: number = 0;
    for (const [bone, mesh] of actor.person.drawing.parts) if (bone.startsWith(side) && /Foot|Subtalar|Midfoot|Hallux|Toe/u.test(bone)) {
      const vertices: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
      for (let index: number = 0; index < vertices.count; index++) {
        maximum = Math.max(maximum, actor.person.object.worldToLocal(mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(vertices, index))).x);
        count++;
      }
    }
    assert.ok(count > 0 && Number.isFinite(shield));
    assert.ok(maximum <= shield, `Checking foot projects ${maximum - shield}m ahead of its proximal shin shield`);
  } finally { actor.dispose(); }
}

