import { projectileAt } from "@automovie/engine";
import { AutoMovieHumanRigControls, AutoMovieHumanSex, type AutoMovieHumanClinicalIk, type AutoMovieHumanGrounding, type IAutoMovieHumanPose } from "@automovie/human";
import { frameTimes } from "@automovie/render";
import * as THREE from "three";

import type { DuelActorFrame as ActorFrame } from "./DuelActorFrame";
import { createDuelActor } from "./createDuelActor";
import { createDuelCaption } from "./createDuelCaption";
import { createDuelCourt } from "./createDuelCourt";
import { createDuelCapMotion } from "./createDuelCapMotion";
import { createDuelFragmentMotion } from "./createDuelFragmentMotion";
import { createDuelFootFitter } from "./createDuelFootFitter";
import { createDuelRescueContacts } from "./createDuelRescueContacts";
import { createDuelHumanParameters } from "./createDuelHumanParameters";
import { createDuelSpell } from "./createDuelSpell";
import { duelEvents } from "./duelEvents";
import { evaluateDuelExchange } from "./evaluateDuelExchange";
import { evaluateDuelOpening } from "./evaluateDuelOpening";
import { evaluateDuelRescue } from "./evaluateDuelRescue";
import type { DuelRescueEntry } from "./DuelRescueEntry";
import { evaluateDuelEnding } from "./evaluateDuelEnding";
import { loadDuelFrames } from "./loadDuelFrames";
import { interpolateDuelHeelTargets } from "./interpolateDuelHeelTargets";
import { selectDuelPalmPoint } from "./selectDuelPalmPoint";
import { resolveDuelUpperGoals } from "./resolveDuelUpperGoals";
import { solveDuelArmContact } from "./solveDuelArmContact";
import { solveDuelWandAim } from "./solveDuelWandAim";

/**
 * Bake and display the actual Human opening through one deterministic 24fps path.
 *
 * @evidence contracts/common.md#implementation-and-ownership Exact adopted25second bytes retain their original source lineage and unchanged cast construction. New canonical forward states use public Human FK/IK, hard real soles/full shoe and skin floor/ROM, fixedXZ/Y-only height preference and actual-root upper goals. Real left-arm surface fits supply redirect/forearm/shoulder events before west escape. Complete bodies and wands must clear before the finite cap restraint releases; the main mass follows its own bearing/ballistic path. Only3small fragments collide with actual shield triangles. Original requests/results and causal failures remain visible and block capture. Seeking/reverse read fixed frames and pure effects; no post-solve smoothing or failed-seed promotion occurs.
 * @evidence contracts/common.md#authoring-interface Browser factory returns scene/camera, asynchronous prepare, fixed24fps seek, inspection/frame records and disposal. Supply enabled end48 or60;60 is invoked only after the48second technical ending is adopted. The accepted25second fixed input has exact bytes and unchanged cast geometry lineage; new states retain their own current source. Guards reject any unadmitted stage or incomplete whole-film capture. Captions are words, not accepted speech. Scene owns all preparation history and effects; seeking reads fixed actor samples and pure effect paths.
 */
export function createDuelScene(implementedUntil: 48 | 60 = 48): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  prepare: (onProgress?: (completed: number, total: number) => void) => Promise<void>;
  seek: (seconds: number) => void;
  inspect: () => { prepared: boolean; admitted: boolean; implementedUntil: number; [key: string]: unknown };
  frame: (index: number) => unknown;
  dispose: () => void;
} {
  if (implementedUntil !== 48 && implementedUntil !== 60) throw new Error("Explicit48or60second assembly end required");
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc4c5ba);
  scene.add(new THREE.HemisphereLight(0xe6edf1, 0x5d5947, 1.8));
  const sunlight: THREE.DirectionalLight = new THREE.DirectionalLight(0xffefd6, 2.4);
  sunlight.position.set(-3, 7, 4);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  sunlight.shadow.bias = -0.0002;
  scene.add(sunlight);
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(38, 9 / 16, 0.05, 60);
  scene.add(camera);
  const court: ReturnType<typeof createDuelCourt> = createDuelCourt();
  scene.add(court.object);
  const cap: ReturnType<typeof createDuelCapMotion> = createDuelCapMotion(court.cap, duelEvents.capRelease, court.bearing);
  let fragments: ReturnType<typeof createDuelFragmentMotion> | undefined;
  let shieldAnchor: THREE.Vector3 | undefined;
  let capCleared: boolean = false;
  let capDecisionMade: boolean = false;
  let escapeCompletedAt: number | null = null;
  let recoveryReadyAt: number | null = null;
  const spell: ReturnType<typeof createDuelSpell> = createDuelSpell();
  scene.add(spell.object);
  const carina: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(1700, AutoMovieHumanSex.Female), { hair: 0xe8d9af, house: 0x245d48, glasses: false, smirk: true, skirt: true });
  const harry: ReturnType<typeof createDuelActor> = createDuelActor(createDuelHumanParameters(1780, AutoMovieHumanSex.Male), { hair: 0x25201f, house: 0x842a33, glasses: true, smirk: false });
  carina.object.name = "Carina";
  harry.object.name = "Harry";
  scene.add(carina.object, harry.object);
  const carinaFeet: ReturnType<typeof createDuelFootFitter> = createDuelFootFitter(carina);
  const harryFeet: ReturnType<typeof createDuelFootFitter> = createDuelFootFitter(harry);
  const harryPalm: [number, number, number] = selectDuelPalmPoint(harry.drawing.parts.get("leftHand")!);
  const caption: ReturnType<typeof createDuelCaption> = createDuelCaption(camera);
  const blackGeometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(2, 2);
  const blackMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, depthTest: false, depthWrite: false });
  const black: THREE.Mesh = new THREE.Mesh(blackGeometry, blackMaterial);
  black.position.z = -0.06;
  black.renderOrder = 1000000;
  black.visible = false;
  camera.add(black);
  const frames: Map<number, { carina: ActorFrame; harry: ActorFrame }> = new Map();
  const heelPlants: Partial<Record<"Carina" | "Harry", { frame: number; vectors: { left: THREE.Vector3; right: THREE.Vector3 } }>> = {};
  const failures: { frame: number; actor: string; support: string; supportError: number; aimError: number; gripError: number; clamps: number }[] = [];
  const causalFailures: { frame: number; reason: string }[] = [];
  let rescueEntries: Record<"Carina" | "Harry", DuelRescueEntry> | undefined;
  let endingEntries: Record<"Carina" | "Harry", DuelRescueEntry> | undefined;
  let rescueContacts: ReturnType<typeof createDuelRescueContacts> | undefined;
  let prefixSource: Awaited<ReturnType<typeof loadDuelFrames>>["source"] | undefined;
  let fixedPlayback: { path: string; sha256: string; durationSeconds: number } | undefined;
  let recordedRescue: Record<string, unknown> | undefined;
  let prepared: boolean = false;
  let preparation: Promise<void> | undefined;
  let completed: number = 0;
  let preparationMs: number = 0;
  let currentSeconds: number = 0;
  let currentFrame: { carina: ActorFrame; harry: ActorFrame } | null = null;
  let shot: string = "South approach wide";
  scene.traverse((object: THREE.Object3D): void => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  /** Direct three purposeful views without resetting any continuing actor state. */
  function cameraAt(time: number): void {
    if (time < 3.6) {
      shot = "South approach wide";
      camera.position.set(-2.4, 2.6, 7.4);
      camera.lookAt(0.55, 1.45, -0.70);
    } else if (time < 6) {
      shot = "Harry challenge";
      camera.position.set(-1.5, 1.65, 1.4);
      camera.lookAt(0.94, 1.20, -0.91);
    } else if (time < 9) {
      shot = "Carina plant and reply";
      camera.position.set(2.0, 1.5, 3.4);
      camera.lookAt(-0.40, 0.90, 0.10);
    } else if (time < 25) {
      shot = time < duelEvents.retreatStart ? "Continuous held-wrist exchange" : "Retreat and deflected shot";
      const progress: number = Math.min(1, Math.max(0, (time - duelEvents.retreatStart) / (duelEvents.retreatEnd - duelEvents.retreatStart)));
      const eased: number = progress * progress * (3 - 2 * progress);
      camera.position.set(1.2, 2.5, 5.1).lerp(new THREE.Vector3(-1.6, 3.0, 7.0), eased);
      camera.lookAt(new THREE.Vector3(-0.2, 1.1, -0.15).lerp(new THREE.Vector3(0.65, 1.5, -1.0), eased));
    } else if (time < 49.7) {
      shot = time < 29 ? "Notice the retained cap" : time < 35 ? "Approach and reaching hand" : "Protective contact and west escape";
      const first: number = THREE.MathUtils.smoothstep(time, 25, 28.8);
      const second: number = THREE.MathUtils.smoothstep(time, 28.8, 30.4);
      camera.position.copy(new THREE.Vector3(-1.6, 3, 7).lerp(new THREE.Vector3(-1.0, 2.3, 4.0), first).lerp(new THREE.Vector3(-2.5, 2.9, 5.8), second));
      camera.lookAt(new THREE.Vector3(0.65, 1.5, -1.0).lerp(new THREE.Vector3(1.1, 1.75, -1.65), first).lerp(new THREE.Vector3(1.0, 1.3, -1.6), second));
    } else if (time < 55.2) {
      shot = "Held forearm, question and release";
      const close: number = THREE.MathUtils.smoothstep(time, 49.7, 50.3);
      camera.position.copy(new THREE.Vector3(-2.5, 2.9, 5.8).lerp(new THREE.Vector3(-0.9, 1.9, 2.8), close));
      camera.lookAt(new THREE.Vector3(1.0, 1.3, -1.6).lerp(new THREE.Vector3(0.6, 1.25, -1.5), close));
    } else if (time < 58.5) {
      shot = "Carina's final challenge";
      const root: THREE.Vector3 = carina.object.position;
      camera.position.copy(root).add(new THREE.Vector3(1.0, 1.55, 2.4));
      camera.lookAt(root.clone().add(new THREE.Vector3(0.1, 1.2, 0)));
    } else {
      shot = "Return to duel stance";
      camera.position.set(-1.4, 2.1, 3.9);
      camera.lookAt(0.4, 1.1, -1.4);
    }
    camera.updateMatrixWorld(true);
  }

  /** Fit current support with independent posture preference, then couple the actual hands. */
  function evaluate(actor: ReturnType<typeof createDuelActor>, feet: ReturnType<typeof createDuelFootFitter>, role: "Carina" | "Harry", time: number, previous?: ActorFrame, previousLower?: ActorFrame): ActorFrame {
    const reference: { left: THREE.Vector3; right: THREE.Vector3 } = feet.ballReference;
    const exchange: ReturnType<typeof evaluateDuelExchange> | undefined = time > 9 && time <= 25 ? evaluateDuelExchange(time, role, reference) : undefined;
    const rescue: ReturnType<typeof evaluateDuelRescue> | undefined = time > 25 && time <= 48 ? evaluateDuelRescue(time, role, rescueEntries!, reference, rescueContacts!.meeting, rescueContacts!.events().escapeReady, escapeCompletedAt !== null && time >= escapeCompletedAt, recoveryReadyAt !== null && time >= recoveryReadyAt) : undefined;
    const ending: ReturnType<typeof evaluateDuelEnding> | undefined = time > 48 ? evaluateDuelEnding(time, role, endingEntries!, reference) : undefined;
    const plan: ReturnType<typeof evaluateDuelOpening> = ending ?? rescue ?? exchange ?? evaluateDuelOpening(time, role, reference);
    actor.object.position.copy(plan.position);
    actor.object.rotation.set(0, plan.yaw, 0);
    let heelTargets: { left: THREE.Vector3; right: THREE.Vector3 } | undefined;
    if (plan.footMode === "settling") {
      if (heelPlants[role] === undefined) {
        if (previousLower === undefined) throw new Error("Heel planting requires an actual admitted predecessor");
        heelPlants[role] = { frame: previousLower.index, vectors: feet.heelVectors(previousLower.output, previousLower.yaw) };
      }
      heelTargets = interpolateDuelHeelTargets(plan, heelPlants[role]!.vectors, feet.flatHeelVectors(plan.yaw), exchange!.heelPlant);
    }
    const placement: "hard-hips" | "fixed-xz" = time > 9 ? "fixed-xz" : "hard-hips";
    const support: ReturnType<typeof feet.fit> = feet.fit(plan.pose, plan.left, plan.right, plan.footMode, plan.yaw, plan.heelTilt, previousLower?.pose, heelTargets, placement);
    actor.object.position.set(...support.root.translation);
    const supportedPose: IAutoMovieHumanPose = { ...plan.pose, legs: structuredClone(support.pose.legs) };
    if (previous?.pose.arms?.right !== undefined)
      supportedPose.arms = { left: supportedPose.arms?.left ?? {}, right: { ...previous.pose.arms.right, hand: plan.pose.arms?.right.hand } };
    if (role === "Harry" && time >= duelEvents.gripReleaseEnd && time < duelEvents.armRecoveryEnd) {
      const release: ActorFrame | undefined = frames.get(Math.floor(duelEvents.gripReleaseEnd * 24))?.harry;
      if (release !== undefined) {
        const blend: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(release.pose, supportedPose, Math.min(1, (time - duelEvents.gripReleaseEnd) / (duelEvents.armRecoveryEnd - duelEvents.gripReleaseEnd)));
        supportedPose.arms = { right: supportedPose.arms?.right ?? {}, left: blend.arms?.left ?? {} };
      }
    }
    let actualRaised: THREE.Vector3 | undefined;
    if (exchange !== undefined && role === "Carina" && (exchange.outward > 0 || exchange.raised > 0)) {
        actor.object.updateWorldMatrix(true, true);
        const head: THREE.Box3 = new THREE.Box3().setFromObject(actor.drawing.head.object);
        actualRaised = head.getCenter(new THREE.Vector3());
        actualRaised.y = head.max.y + 0.04;
        const towardHarry: THREE.Vector3 = harry.object.position.clone().sub(actor.object.position);
        towardHarry.y = 0;
        if (towardHarry.lengthSq() > 0) actualRaised.addScaledVector(towardHarry.normalize(), 0.045);
    }
    const upper: ReturnType<typeof resolveDuelUpperGoals> = resolveDuelUpperGoals(plan, actor.object.position, { bodyWrist: ending?.bodyWrist ?? rescue?.bodyWrist ?? exchange?.bodyWrist ?? 1, bodyAim: ending?.bodyAim ?? rescue?.bodyAim ?? exchange?.bodyAim ?? 0, raised: role === "Carina" ? exchange?.raised ?? 0 : 0, outward: role === "Carina" ? exchange?.outward ?? 0 : 0, raisedReference: exchange?.raisedReference, actualRaised });
    const wristGoal: THREE.Vector3 = upper.wrist;
    const aimGoal: THREE.Vector3 = upper.aim;
    const originalWand: ReturnType<typeof solveDuelWandAim> = solveDuelWandAim(actor.evaluate, supportedPose, actor.object, wristGoal, aimGoal, actor.wandTipLocal);
    let aim: AutoMovieHumanClinicalIk.IResult = originalWand;
    actor.drawing.setPose(aim.output);
    let gripError: number = 0;
    let palm: THREE.Vector3 | null = null;
    let gripTarget: THREE.Vector3 | null = null;
    if (role === "Harry" && (exchange?.grip ?? 0) > 0) {
      const freePalm: THREE.Vector3 = actor.drawing.bones.get("leftHand")!.localToWorld(new THREE.Vector3(...harryPalm));
      const surface: THREE.Vector3 = carina.wristContact("right", actor.point("leftUpperArm"));
      const target: THREE.Vector3 = freePalm.lerp(surface, exchange!.grip);
      const seed: IAutoMovieHumanPose = { ...aim.pose, arms: { right: aim.pose.arms?.right ?? {}, left: { ...previous?.pose.arms?.left, hand: plan.pose.arms?.left.hand } } };
      const contact: AutoMovieHumanClinicalIk.IResult = solveDuelArmContact(actor.evaluate, seed, actor.object, "left", target, harryPalm);
      aim = contact;
      actor.drawing.setPose(aim.output);
      palm = actor.drawing.bones.get("leftHand")!.localToWorld(new THREE.Vector3(...harryPalm));
      gripTarget = target;
      gripError = palm.distanceTo(target);
    }
    const measured: AutoMovieHumanGrounding.IResult = feet.inspect(aim.pose, plan.left, plan.right, plan.footMode, plan.yaw, plan.heelTilt, plan.pose, heelTargets, placement);
    const tip: THREE.Vector3 = actor.wandTip();
    const wrist: THREE.Vector3 = actor.point("rightHand");
    const expectedTip: THREE.Vector3 = wristGoal.clone().add(aimGoal.clone().sub(wristGoal).normalize().multiplyScalar(0.30));
    const aimError: number = Math.max(wrist.distanceTo(wristGoal), tip.distanceTo(expectedTip));
    const { output: _supportOutput, ...supportRecord } = support;
    const { output: _wandOutput, ...wandResult } = originalWand;
    return { index: Math.round(time * 24), lowerSeedFrame: previousLower?.index ?? null, heelPlantEntryFrame: heelPlants[role]?.frame ?? null, nominalRoot: [plan.position.x, plan.position.y, plan.position.z], root: [...support.root.translation], yaw: plan.yaw, pose: aim.pose, output: { posed: aim.output.posed, clamped: aim.output.clamped }, supportStatus: measured.status, supportError: measured.error, floorMinimum: measured.floorMinimum, heelMinimum: feet.heelMinima(), aimError, gripError, wandTip: [tip.x, tip.y, tip.z], wrist: [wrist.x, wrist.y, wrist.z], requestedWrist: [wristGoal.x, wristGoal.y, wristGoal.z], requestedAim: [aimGoal.x, aimGoal.y, aimGoal.z], palm: palm === null ? null : [palm.x, palm.y, palm.z], gripTarget: gripTarget === null ? null : [gripTarget.x, gripTarget.y, gripTarget.z], supportSolve: supportRecord, wandSolve: { seed: structuredClone(supportedPose), result: wandResult } };
  }

  /** Restore a baked actual actor sample through its owned polygon pose port. */
  function apply(actor: ReturnType<typeof createDuelActor>, frame: ActorFrame): void {
    actor.object.position.set(...frame.root);
    actor.object.rotation.set(0, frame.yaw, 0);
    actor.drawing.setPose(frame.output);
  }

  /** Retain actual feet, body and carried wand at a genuine segment boundary. */
  function entry(actor: ReturnType<typeof createDuelActor>, frame: ActorFrame): DuelRescueEntry {
    apply(actor, frame);
    actor.object.updateWorldMatrix(true, true);
    const left: THREE.Vector3 = actor.drawing.bones.get(actor.shoes.ball.left.bone)!.localToWorld(new THREE.Vector3(...actor.shoes.ball.left.localPoint));
    const right: THREE.Vector3 = actor.drawing.bones.get(actor.shoes.ball.right.bone)!.localToWorld(new THREE.Vector3(...actor.shoes.ball.right.localPoint));
    return { position: new THREE.Vector3(...frame.root), yaw: frame.yaw, pose: structuredClone(frame.pose), left, right, wrist: new THREE.Vector3(...frame.wrist), wandTip: new THREE.Vector3(...frame.wandTip) };
  }

  /** Re-measure final left-contact poses without discarding original support/upper results. */
  function finishContacts(actor: ReturnType<typeof createDuelActor>, feet: ReturnType<typeof createDuelFootFitter>, role: "Carina" | "Harry", time: number, frame: ActorFrame): ActorFrame {
    actor.pose(frame.pose);
    const plan: ReturnType<typeof evaluateDuelOpening> = time <= 48 ? evaluateDuelRescue(time, role, rescueEntries!, feet.ballReference, rescueContacts!.meeting, rescueContacts!.events().escapeReady, escapeCompletedAt !== null && time >= escapeCompletedAt, recoveryReadyAt !== null && time >= recoveryReadyAt) : evaluateDuelEnding(time, role, endingEntries!, feet.ballReference);
    const support: AutoMovieHumanGrounding.IResult = feet.inspect(frame.pose, plan.left, plan.right, plan.footMode, plan.yaw, plan.heelTilt, plan.pose, undefined, "fixed-xz");
    const wrist: THREE.Vector3 = actor.point("rightHand");
    const tip: THREE.Vector3 = actor.wandTip();
    const desired: THREE.Vector3 = new THREE.Vector3(...frame.requestedWrist);
    const expectedTip: THREE.Vector3 = new THREE.Vector3(...frame.requestedAim).sub(desired).normalize().multiplyScalar(0.30).add(desired);
    const bounds: THREE.Box3 = new THREE.Box3().setFromObject(actor.object);
    return { ...frame, supportStatus: support.status, supportError: support.error, floorMinimum: support.floorMinimum, heelMinimum: feet.heelMinima(), aimError: Math.max(wrist.distanceTo(desired), tip.distanceTo(expectedTip)), wrist: [wrist.x, wrist.y, wrist.z], wandTip: [tip.x, tip.y, tip.z], bodyBounds: { min: [bounds.min.x, bounds.min.y, bounds.min.z], max: [bounds.max.x, bounds.max.y, bounds.max.z] } };
  }

  /** Display one prepared sample and its exact English caption. */
  function display(index: number): void {
    const frame: { carina: ActorFrame; harry: ActorFrame } | undefined = frames.get(index);
    if (frame === undefined) throw new Error("Requested frame has not been prepared");
    currentSeconds = index / 24;
    currentFrame = frame;
    apply(carina, frame.carina);
    apply(harry, frame.harry);
    cameraAt(currentSeconds);
    caption.set(currentSeconds >= 4.3 && currentSeconds <= 5.6 ? "Ready?" : currentSeconds >= 7 && currentSeconds <= 8.4 ? "Are you?" : currentSeconds >= 49.8 && currentSeconds < 51.4 ? "Did you just save me?" : currentSeconds >= 55.2 && currentSeconds < 57.6 ? "Look at me this time." : "");
    black.visible = currentSeconds >= 59.75;
    const launch: ActorFrame | undefined = frames.get(Math.round(duelEvents.shotLaunch * 24))?.carina;
    const deflect: ActorFrame | undefined = frames.get(Math.round(duelEvents.shotDeflect * 24))?.harry;
    if (launch !== undefined && deflect !== undefined) spell.seek(currentSeconds, new THREE.Vector3(...launch.wandTip), new THREE.Vector3(...deflect.wandTip), new THREE.Vector3(1.7, 2.70, -2.27));
    court.lowerJoint.visible = currentSeconds < duelEvents.mortarImpact;
    for (let chip: number = 0; chip < court.chips.length; chip++) {
      const item: THREE.Mesh = court.chips[chip]!;
      item.visible = !court.lowerJoint.visible;
      const fallTime: number = Math.min(Math.sqrt(2 * (2.70 - 0.0125) / 9.81), Math.max(0, currentSeconds - duelEvents.mortarImpact));
      const state: ReturnType<typeof projectileAt> = projectileAt({ origin: { x: 1.7, y: 2.70, z: -2.27 }, velocity: { x: chip === 0 ? -1 : 1, y: 0, z: 0.5 }, gravity: { x: 0, y: -9.81, z: 0 } }, fallTime);
      item.position.set(state.position.x, state.position.y, state.position.z);
    }
    const capTime: number = capCleared ? currentSeconds : Math.min(currentSeconds, cap.webBreakSeconds - 1e-6);
    const capState: ReturnType<typeof cap.at> = cap.at(capTime);
    court.cap.position.copy(capState.position);
    court.cap.rotation.x = capState.rotationX;
    court.upperJoint.visible = currentSeconds < cap.webBreakSeconds || !capCleared;
    const shieldWeight: number = currentSeconds > 25 ? evaluateDuelRescue(currentSeconds, "Carina", rescueEntries!, carinaFeet.ballReference, rescueContacts!.meeting, true, escapeCompletedAt !== null && currentSeconds >= escapeCompletedAt, recoveryReadyAt !== null && currentSeconds >= recoveryReadyAt).shield : 0;
    court.shield.visible = shieldAnchor !== undefined && shieldWeight > 0;
    if (shieldAnchor !== undefined) court.shield.position.copy(shieldAnchor).sub(new THREE.Vector3(0, 0.9, 0));
    (court.shield.material as THREE.MeshBasicMaterial).opacity = 0.25 * shieldWeight;
    for (let index: number = 0; index < court.fragments.length; index++) {
      const state: ReturnType<ReturnType<typeof createDuelFragmentMotion>[number]["at"]> | undefined = fragments?.[index]?.at(currentSeconds);
      court.fragments[index]!.visible = capCleared && state?.visible === true;
      if (state !== undefined) court.fragments[index]!.position.copy(state.centre);
    }
    for (let index: number = 0; index < court.grit.length; index++) {
      const grain: THREE.Mesh = court.grit[index]!;
      const stop: number = Math.sqrt(2 * 2.75 / 9.81);
      const birth: number = 27.2 + index * (cap.impactSeconds - stop - 27.2) / (court.grit.length - 1);
      grain.visible = currentSeconds >= birth;
      const age: number = Math.max(0, currentSeconds - birth);
      const gritState: ReturnType<typeof projectileAt> = projectileAt({ origin: { x: 1.42 + (index % 7) * 0.085, y: 2.754, z: -2.24 }, velocity: { x: 0, y: 0, z: 0.025 }, gravity: { x: 0, y: -9.81, z: 0 } }, Math.min(age, stop));
      grain.position.set(gritState.position.x, Math.max(0.004, gritState.position.y), gritState.position.z);
    }
    const dustAge: number = currentSeconds - cap.impactSeconds;
    court.dust.visible = capCleared && dustAge >= 0 && dustAge < 3.0;
    court.dust.position.set(1.7, 0.15, cap.at(cap.impactSeconds).centre.z);
    court.dust.scale.set(0.52, 0.15, 0.48);
    (court.dust.material as THREE.MeshBasicMaterial).opacity = court.dust.visible ? 0.14 * Math.sin(Math.PI * Math.min(1, dustAge / 3)) : 0;
    scene.updateMatrixWorld(true);
  }

  /** Prepare the entire implemented interval before ordinary real-time playback. */
  async function bake(onProgress?: (completed: number, total: number) => void): Promise<void> {
    const begun: number = performance.now();
    const schedule: number[] = [...frameTimes(24, implementedUntil), implementedUntil];
    const prior: { carina?: ActorFrame; harry?: ActorFrame } = {};
    const priorLower: { carina?: ActorFrame; harry?: ActorFrame } = {};
    const query: URLSearchParams = new URLSearchParams(window.location.search);
    const fixedFilm: string | null = query.get("fixedFilm");
    if (fixedFilm !== null) {
      if (implementedUntil !== 60) throw new Error("Whole fixed playback requires the complete60second performance");
      const sha256: string = query.get("fixedFilmSha") ?? "";
      const loaded: Awaited<ReturnType<typeof loadDuelFrames>> = await loadDuelFrames(fixedFilm, sha256, 60);
      if (loaded.observations?.rescue.capCleared !== true) throw new Error("Whole fixed input lacks admitted cap-clearance observations");
      for (let index: number = 0; index < loaded.frames.length; index++) frames.set(index, loaded.frames[index]!);
      prefixSource = loaded.source;
      fixedPlayback = { path: fixedFilm, sha256, durationSeconds: 60 };
      recordedRescue = loaded.observations.rescue;
      rescueEntries = { Carina: entry(carina, loaded.frames[600]!.carina), Harry: entry(harry, loaded.frames[600]!.harry) };
      endingEntries = { Carina: entry(carina, loaded.frames[1152]!.carina), Harry: entry(harry, loaded.frames[1152]!.harry) };
      rescueContacts = createDuelRescueContacts({ Carina: carina, Harry: harry }, rescueEntries, { Carina: carinaFeet.ballReference, Harry: harryFeet.ballReference });
      shieldAnchor = new THREE.Vector3(...loaded.frames[972]!.carina.wandTip);
      court.shield.position.copy(shieldAnchor).sub(new THREE.Vector3(0, 0.9, 0));
      court.shield.updateWorldMatrix(true, false);
      fragments = createDuelFragmentMotion(court.fragments, court.shield, cap.at(cap.impactSeconds).centre, cap.impactSeconds);
      capCleared = true;
      capDecisionMade = true;
      if (typeof recordedRescue.escapeCompletedAt !== "number" || typeof recordedRescue.recoveryReadyAt !== "number" || !Number.isFinite(recordedRescue.escapeCompletedAt) || !Number.isFinite(recordedRescue.recoveryReadyAt)) throw new Error("Whole fixed input lacks measured escape and recovery events");
      escapeCompletedAt = recordedRescue.escapeCompletedAt;
      recoveryReadyAt = recordedRescue.recoveryReadyAt;
      completed = loaded.frames.length;
      preparationMs = performance.now() - begun;
      prepared = true;
      onProgress?.(completed, schedule.length);
      display(0);
      return;
    }
    const fixed: Awaited<ReturnType<typeof loadDuelFrames>> = await loadDuelFrames("/motion/exchange-round-eleven.json", "1830bbf936660f0301848b7ff71acda72c9b588cd8949b9125b76fb1520a5404", 25);
    prefixSource = fixed.source;
    for (let index: number = 0; index < fixed.frames.length; index++) frames.set(index, fixed.frames[index]!);
    const preceding: { carina: ActorFrame; harry: ActorFrame } = fixed.frames[600]!;
    prior.carina = priorLower.carina = preceding.carina;
    prior.harry = priorLower.harry = preceding.harry;
    rescueEntries = { Carina: entry(carina, preceding.carina), Harry: entry(harry, preceding.harry) };
    rescueContacts = createDuelRescueContacts({ Carina: carina, Harry: harry }, rescueEntries, { Carina: carinaFeet.ballReference, Harry: harryFeet.ballReference });
    completed = fixed.frames.length;
    onProgress?.(completed, schedule.length);
    for (let index: number = fixed.frames.length; index < schedule.length; index++) {
      const time: number = schedule[index]!;
      let frame: { carina: ActorFrame; harry: ActorFrame } = { carina: evaluate(carina, carinaFeet, "Carina", time, prior.carina, priorLower.carina), harry: evaluate(harry, harryFeet, "Harry", time, prior.harry, priorLower.harry) };
      const ending: ReturnType<typeof evaluateDuelEnding> | undefined = time > 48 ? evaluateDuelEnding(time, "Harry", endingEntries!, harryFeet.ballReference) : undefined;
      frame = rescueContacts.fit(time, frame, ending === undefined ? undefined : { forearmGrip: ending.forearmGrip }, recoveryReadyAt !== null && time >= recoveryReadyAt);
      frame.carina = finishContacts(carina, carinaFeet, "Carina", time, frame.carina);
      frame.harry = finishContacts(harry, harryFeet, "Harry", time, frame.harry);
      frames.set(index, frame);
      if (time === 48) endingEntries = { Carina: entry(carina, frame.carina), Harry: entry(harry, frame.harry) };
      if (time >= duelEvents.escapeStart && !rescueContacts.events().escapeReady) causalFailures.push({ frame: index, reason: "West escape has no admitted redirect/forearm/shoulder contact progression" });
      if (time >= duelEvents.escapePlanted && rescueContacts.events().escapeReady && frame.carina.bodyBounds!.max[0] < 1 && frame.harry.bodyBounds!.max[0] < 1) escapeCompletedAt ??= time;
      if (time >= duelEvents.shieldRaised && escapeCompletedAt !== null && shieldAnchor === undefined) {
        shieldAnchor = new THREE.Vector3(...frame.carina.wandTip);
        court.shield.position.copy(shieldAnchor).sub(new THREE.Vector3(0, 0.9, 0));
        court.shield.updateWorldMatrix(true, false);
        try { fragments = createDuelFragmentMotion(court.fragments, court.shield, cap.at(cap.impactSeconds).centre, cap.impactSeconds); }
        catch (error: unknown) { causalFailures.push({ frame: index, reason: `Actual fragment/shield preparation failed:${String(error)}` }); }
      }
      if (time >= cap.webBreakSeconds && !capDecisionMade) {
        capDecisionMade = true;
        capCleared = rescueContacts.events().escapeReady && frame.carina.bodyBounds!.max[0] < 1 && frame.harry.bodyBounds!.max[0] < 1;
        if (!capCleared) causalFailures.push({ frame: index, reason: "Both complete bodies/carried wands have not cleared west ofx1 before the retaining strip breaks" });
      }
      if (capCleared && fragments !== undefined && time >= cap.impactSeconds && fragments.every((fragment: ReturnType<typeof createDuelFragmentMotion>[number]): boolean => time >= fragment.floorSeconds)) recoveryReadyAt ??= time;
      if (time === duelEvents.shieldRaised && escapeCompletedAt === null) causalFailures.push({ frame: index, reason: "Shield preparation was not executed because both bodies had not cleared the principal fall strip" });
      if (time === 44.5 && recoveryReadyAt === null) causalFailures.push({ frame: index, reason: "Recovery was not executed because the cap/three-fragment outcome was not admitted" });
      for (const role of ["carina", "harry"] as const) {
        const actor: ActorFrame = frame[role];
        if (actor.supportStatus !== "admitted" || actor.supportError > 0.003 || actor.aimError > 0.002 || actor.gripError > 0.003 || actor.output.clamped.length !== 0)
          failures.push({ frame: index, actor: role, support: actor.supportStatus, supportError: actor.supportError, aimError: actor.aimError, gripError: actor.gripError, clamps: actor.output.clamped.length });
        if (actor.aimError <= 0.002 && actor.gripError <= 0.003 && actor.output.clamped.length === 0) prior[role] = actor;
        if (actor.supportStatus === "admitted" && actor.supportSolve.status === "admitted" && actor.output.clamped.length === 0) priorLower[role] = actor;
      }
      completed = index + 1;
      onProgress?.(completed, schedule.length);
      if (index % 8 === 0) await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
    }
    preparationMs = performance.now() - begun;
    prepared = true;
    display(0);
  }

  cameraAt(0);
  for (const [actor, feet, role] of [[carina, carinaFeet, "Carina"], [harry, harryFeet, "Harry"]] as const) {
    const plan: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(0, role, feet.ballReference);
    actor.object.position.x = plan.position.x;
    actor.object.position.z = plan.position.z;
    actor.object.rotation.y = plan.yaw;
  }
  return {
    scene, camera,
    prepare: (onProgress?: (completed: number, total: number) => void): Promise<void> => {
      preparation ??= bake(onProgress);
      return preparation;
    },
    seek: (seconds: number): void => {
      if (!prepared) throw new Error("Prepare the performance before seeking");
      if (!Number.isFinite(seconds)) throw new Error("Finite scene seconds required");
      display(Math.round(Math.min(implementedUntil, Math.max(0, seconds)) * 24));
    },
    inspect: (): { prepared: boolean; admitted: boolean; implementedUntil: number; [key: string]: unknown } => ({
      prepared, admitted: prepared && failures.length === 0 && causalFailures.length === 0, implementedUntil, seconds: currentSeconds,
      preparation: { completed, total: implementedUntil * 24 + 1, milliseconds: preparationMs, failedStates: failures, causalFailures, lowerCache: "Exact adopted25s fixed input followed by canonical forward preparation. Current XZ fixed/Y-only with hard actual soles/full floor/ROM; height preferred. Contacts retain actual requests and drive escape readiness. Seeking reads fixed samples; complete continuous watching remains unperformed." },
      fixedInputs: [{ ...(fixedPlayback ?? { path: "/motion/exchange-round-eleven.json", sha256: "1830bbf936660f0301848b7ff71acda72c9b588cd8949b9125b76fb1520a5404", durationSeconds: 25 }), source: prefixSource }],
      rescue: recordedRescue ?? { events: rescueContacts?.events() ?? null, escapeCompletedAt, recoveryReadyAt, capCleared, webBreakSeconds: cap.webBreakSeconds, capReleaseSeconds: duelEvents.capRelease, capImpactSeconds: cap.impactSeconds, shieldAnchor: shieldAnchor?.toArray() ?? null, fragments: fragments?.map((item: ReturnType<typeof createDuelFragmentMotion>[number]): object => ({ contact: { ...item.contact, centre: item.contact.centre.toArray() }, floorSeconds: item.floorSeconds })) ?? null, causalFailures },
      camera: { shot, position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect },
      actors: currentFrame === null ? null : { Carina: { support: currentFrame.carina.supportStatus, reason: currentFrame.carina.supportSolve.reason, activeBounds: currentFrame.carina.supportSolve.activeBounds, root: currentFrame.carina.root, error: currentFrame.carina.supportError, floorMinimum: currentFrame.carina.floorMinimum, heelMinimum: currentFrame.carina.heelMinimum, aimError: currentFrame.carina.aimError, wandTip: currentFrame.carina.wandTip, wrist: currentFrame.carina.wrist, requestedWrist: currentFrame.carina.requestedWrist }, Harry: { support: currentFrame.harry.supportStatus, reason: currentFrame.harry.supportSolve.reason, activeBounds: currentFrame.harry.supportSolve.activeBounds, root: currentFrame.harry.root, error: currentFrame.harry.supportError, floorMinimum: currentFrame.harry.floorMinimum, heelMinimum: currentFrame.harry.heelMinimum, aimError: currentFrame.harry.aimError, gripError: currentFrame.harry.gripError, wandTip: currentFrame.harry.wandTip, palm: currentFrame.harry.palm, gripTarget: currentFrame.harry.gripTarget } },
      sound: "Unaccepted; screenplay dialogue captions only",
    }),
    frame: (index: number): unknown => {
      if (!Number.isSafeInteger(index) || !frames.has(index)) throw new Error("Requested actual frame is not prepared");
      return structuredClone(frames.get(index));
    },
    dispose: (): void => {
      caption.dispose();
      blackGeometry.dispose();
      blackMaterial.dispose();
      spell.dispose();
      carina.dispose();
      harry.dispose();
      court.dispose();
      sunlight.shadow.map?.dispose();
      frames.clear();
      scene.clear();
    },
  };
}
