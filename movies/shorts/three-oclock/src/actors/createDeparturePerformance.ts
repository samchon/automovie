import type { IAutoMovieHumanArmPose, IAutoMovieHumanHandPose } from "@automovie/human";
import * as THREE from "three";

import { blendArmSeed } from "./blendArmSeed";
import { blendNoteGrip } from "./blendNoteGrip";
import type { createCharacterPerformance } from "./createCharacterPerformance";
import { createDepartureActor } from "./createDepartureActor";
import type { createFootControls } from "./createFootControls";
import type { createHumanActor } from "./createHumanActor";
import { createStudentNoteGrip } from "./createStudentNoteGrip";
import { createSupportedCrouch } from "./createSupportedCrouch";
import { evaluateDeparture } from "./evaluateDeparture";
import { createNotePickupFrame } from "../props/createNotePickupFrame";

/** The same accepted actor, prepared support and actual ending travel together. */
type Participant = { actor: ReturnType<typeof createHumanActor>; feet: ReturnType<typeof createFootControls>; boundary: ReturnType<ReturnType<typeof createCharacterPerformance>["snapshot"]> };
/** Future actor fits retain full actual pose and original native diagnostics. */
type ActorState = ReturnType<ReturnType<typeof createDepartureActor>["fit"]>;
/** Actual finite-note contact retains its original physical admission fields. */
type Contact = ReturnType<ReturnType<typeof createStudentNoteGrip>["measure"]>;
/** Every future frame carries its actual geometric state, never time-only custody. */
type Frame = { carina: ActorState; harry: ActorState; paper: THREE.Matrix4; owner: "floor" | "carina" | "harry"; phase: string; floorMinimum: number; carinaContact: Contact; harryContact: Contact;
  tipProgress: number; guide?: { admitted: boolean; error: number; normalDot: number }; outside: { carina: ReturnType<ReturnType<typeof createStudentNoteGrip>["outside"]>; harry: ReturnType<ReturnType<typeof createStudentNoteGrip>["outside"]> } };

/**
 * Execute the final pickup, receive-before-give exchange and separate departures.
 *
 * @evidence contracts/common.md#implementation-and-ownership Starts from the actual48s body/feet and floor-note transform. Original source pads and the finite2mm note are prepared for each actual model. Public-FK support-derived crouch planning precedes actual foot and hand fitting. Index contact guides a far-edge floor pivot before the thumb closes; only admitted bilateral contact acquires the note. Harry must establish an admitted closed grip for a prior frame before Carina gives. Hand-local attachment captures preserve the exact world note matrix across custody changes. Original point/native-frame errors, whole-hand floor and actual source-surface separation remain distinct. Left index/forehead contacts and westward steps share the same clock. No held note is teleported into a timed successful event.
 * @evidence contracts/common.md#authoring-interface Borrow the same two actors/support instances, cloned actual48s snapshots and actual resting paper, plus the measured earlier forehead event. prepare gathers the complete48–60 trajectory and all failed contact/support families before refusing; apply uses the same bounded24fps cache in either seek direction. Failed-frame errors remain unavailable rather than fabricated successful states. The finite sequential seed schedule starts at48s and has no external state or generation. Owned maps and attachment data borrow scene resources; the parent retains disposal. This is coarse contact-guided staging, not full force/friction, swept collision or an accepted soundtrack.
 */
export function createDeparturePerformance(input: { carina: Participant; harry: Participant; paper: THREE.Mesh; event: { time: number; progress: number }; ground: THREE.Vector3 }): {
  apply: (seconds: number) => { carina: ActorState["motion"]; harry: ActorState["motion"]; note: number[]; noteOwner: string; paperFloorMinimum: number; actualPaperContact?: Contact; record: object };
  prepare: (progress?: (done: number, total: number) => void) => Promise<void>;
} {
  const candidates: Partial<Record<"carina" | "harry", ReturnType<typeof createStudentNoteGrip>>> = {};
  const constructionFailures: string[] = [];
  for (const person of ["carina", "harry"] as const) {
    try { candidates[person] = createStudentNoteGrip(input[person].actor, person, person === "carina" ? "lower" : "upper"); }
    catch (error) { constructionFailures.push(`${person}:${error instanceof Error ? error.message : String(error)}`); }
  }
  if (constructionFailures.length !== 0) throw new Error(`Actual student-grip resource failures:${JSON.stringify(constructionFailures)}`);
  const grips: { carina: ReturnType<typeof createStudentNoteGrip>; harry: ReturnType<typeof createStudentNoteGrip> } = { carina: candidates.carina!, harry: candidates.harry! };
  const actors: { carina: ReturnType<typeof createDepartureActor>; harry: ReturnType<typeof createDepartureActor> } = {
    carina: createDepartureActor(input.carina.actor, "carina", input.carina.feet, grips.carina, input.carina.boundary),
    harry: createDepartureActor(input.harry.actor, "harry", input.harry.feet, grips.harry, input.harry.boundary),
  };
  const crouch: ReturnType<typeof createSupportedCrouch> = createSupportedCrouch(input.carina.actor, input.carina.feet, input.carina.boundary);
  const pickup: ReturnType<typeof createNotePickupFrame> = createNotePickupFrame(input.paper);
  const beginning: { carina: THREE.Matrix4; harry: THREE.Matrix4 } = {
    carina: actors.carina.paperFrame(input.carina.boundary.pose, input.carina.boundary.root), harry: actors.harry.paperFrame(input.harry.boundary.pose, input.harry.boundary.root),
  };
  const offer: THREE.Matrix4 = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)).setPosition(-1.8, 1.05, 0.255);
  const states: Map<number, Frame> = new Map(); const errors: Map<number, string> = new Map();
  let last: number = 1152;
  let lastAvailable: Frame | undefined;
  let preparation: Promise<void> | undefined;
  let acquired: { frame: number; attachment: THREE.Matrix4 } | undefined;
  let readyFrame: number | undefined;
  let transferred: { frame: number; attachment: THREE.Matrix4; paper: THREE.Matrix4; transformJump: number } | undefined;
  let receiverStart: THREE.Matrix4 | undefined;
  let releasedArm: IAutoMovieHumanArmPose | undefined;
  let failedPickupArm: IAutoMovieHumanArmPose | undefined;
  let guided: { frame: number } | undefined;
  let tipProgress: number = 0;
  input.paper.geometry.computeBoundingBox();
  const bounds: THREE.Box3 = input.paper.geometry.boundingBox!;
  const corners: THREE.Vector3[] = [];
  for (let index: number = 0; index < 8; index++) corners.push(new THREE.Vector3(index & 1 ? bounds.max.x : bounds.min.x, index & 2 ? bounds.max.y : bounds.min.y, index & 4 ? bounds.max.z : bounds.min.z));

  /** Smooth a rigid frame without collapsing any orientation marker. */
  function interpolate(first: THREE.Matrix4, second: THREE.Matrix4, phase: number): THREE.Matrix4 {
    const a: THREE.Vector3 = new THREE.Vector3(); const aq: THREE.Quaternion = new THREE.Quaternion(); const scale: THREE.Vector3 = new THREE.Vector3();
    const b: THREE.Vector3 = new THREE.Vector3(); const bq: THREE.Quaternion = new THREE.Quaternion();
    first.decompose(a, aq, scale); second.decompose(b, bq, scale);
    return new THREE.Matrix4().compose(a.lerp(b, phase), aq.slerp(bq, phase), new THREE.Vector3(1, 1, 1));
  }

  /** Convert desired actual paper placement to the prepared carrier's goal. */
  function carrierGoal(paper: THREE.Matrix4, attachment: THREE.Matrix4, profile: ReturnType<typeof createStudentNoteGrip>): THREE.Matrix4 {
    return paper.clone().multiply(attachment.clone().invert()).multiply(profile.frameInHand);
  }

  /** Preserve every exact displayed paper transform with a single world owner. */
  function place(matrix: THREE.Matrix4): void { matrix.decompose(input.paper.position, input.paper.quaternion, input.paper.scale); input.paper.scale.set(1, 1, 1); input.paper.updateMatrixWorld(true); }

  /** The actual positive-face index contact drives only the floor-edge guide. */
  function guide(): { admitted: boolean; error: number; normalDot: number } {
    const point: THREE.Vector3 = input.carina.actor.point(grips.carina.index.bone, grips.carina.index.point);
    const local: THREE.Vector3 = input.paper.worldToLocal(point);
    const normal: THREE.Vector3 = grips.carina.index.normal.clone().transformDirection(input.carina.actor.drawing.bones.get(grips.carina.index.bone)!.matrixWorld);
    const plane: THREE.Vector3 = new THREE.Vector3(1, 0, 0).transformDirection(input.paper.matrixWorld);
    const error: number = Math.abs(local.x - bounds.max.x); const normalDot: number = normal.dot(plane);
    return { admitted: local.x >= bounds.max.x - 1e-9 && error <= 0.003 && local.y >= bounds.min.y - 1e-8 && local.y <= bounds.max.y + 1e-8 && local.z >= bounds.min.z - 1e-8 && local.z <= bounds.max.z + 1e-8 && normalDot < -0.25, error, normalDot };
  }

  /** Plan bodily action while the actual supported fit remains authoritative. */
  function action(person: "carina" | "harry", seconds: number): ReturnType<typeof evaluateDeparture> {
    const result: ReturnType<typeof evaluateDeparture> = evaluateDeparture(person, seconds, input[person].feet.reference, input.event, input.ground);
    if (person === "carina" && seconds < 55.1) {
      const recovery: number = acquired?.frame === undefined ? 50.2 : acquired.frame / 24;
      const bend: number = ease((seconds - 48) / 0.9) * (1 - ease((seconds - recovery) / 0.9));
      const supported: ReturnType<ReturnType<typeof createSupportedCrouch>["at"]> = crouch.at(bend);
      result.position = supported.position; result.pose.legs = supported.pose.legs; result.pose.pelvis = supported.pose.pelvis; result.bendAmount = bend;
      result.pose.spine = { thoracic: { flexion: 28 * bend + 5 * ease((seconds - 50.5) / 1) * (1 - bend) }, lumbar: { flexion: 45 * bend + 5 * ease((seconds - 50.5) / 1) * (1 - bend) } };
      result.pose.neck = { cervical: { flexion: -30 * bend } };
      result.pose.arms!.left = { shoulder: { flexion: 25 * bend }, elbow: { flexion: 8 + 80 * bend } };
    }
    if (person === "harry" && seconds < 54.9) result.pose.arms!.left = blendArmSeed(input.harry.boundary.pose.arms!.left, { elbow: { flexion: 8 } }, ease((seconds - 48.3) / 0.9));
    if (person === "carina") {
      const start: number = transferred === undefined ? Infinity : Math.max(52.2, transferred.frame / 24 + 0.04);
      result.pose.head = { jaw: { opening: seconds >= start && seconds < start + 2.88 ? Math.round(Math.abs(Math.sin(seconds * 12)) * 3) * 4 : 0 } };
    }
    return result;
  }

  /** Closed index/other fingers precede the thumb's route around the raised edge. */
  function hand(person: "carina" | "harry", seconds: number): IAutoMovieHumanHandPose {
    const start: number = person === "carina" ? 48 : 50.4;
    const result: IAutoMovieHumanHandPose = blendNoteGrip(grips[person].hand, ease((seconds - start) / (person === "carina" ? 0.7 : 1.1)));
    const close: number = person === "carina" ? ease((tipProgress - 0.5) / 0.5) : ease((seconds - 51.8) / 0.3);
    const release: number = person === "carina" && transferred !== undefined ? 1 - ease((seconds - transferred.frame / 24) / 0.15) : 1;
    result.thumb = blendNoteGrip(grips[person].hand, close * release).thumb;
    return result;
  }

  /** Build one chronological frame; each native call has fixed finite budgets. */
  function build(index: number, previous: Frame | undefined): Frame {
    const seconds: number = index / 24;
    const cAction: ReturnType<typeof action> = action("carina", seconds);
    const hAction: ReturnType<typeof action> = action("harry", seconds);
    const proposedTip: number = guided === undefined || acquired !== undefined ? tipProgress : Math.min(1, tipProgress + 1 / 12);
    let intended: THREE.Matrix4 = pickup.at(proposedTip).matrix;
    if (acquired !== undefined) intended = interpolate(pickup.at(1).matrix, offer, ease((seconds - acquired.frame / 24) / 1));
    let cGoal: THREE.Matrix4 | undefined = seconds < 48.9 ? interpolate(beginning.carina, pickup.rest, ease((seconds - 48) / 0.9)) : intended;
    if (acquired !== undefined) cGoal = carrierGoal(intended, acquired.attachment, grips.carina);
    if (transferred !== undefined) {
      const elapsed: number = seconds - transferred.frame / 24;
      const withdrawn: THREE.Matrix4 = transferred.paper.clone();
      withdrawn.elements[13]! += 0.12 * ease((elapsed - 0.15) / 0.4);
      cGoal = acquired === undefined ? undefined : carrierGoal(withdrawn, acquired.attachment, grips.carina);
      if (elapsed >= 0.55) {
        releasedArm ??= structuredClone(previous?.carina.pose.arms?.right ?? input.carina.boundary.pose.arms!.right);
        cAction.pose.arms!.right = blendArmSeed(releasedArm, { elbow: { flexion: 8 } }, ease((elapsed - 0.55) / 0.6));
        cGoal = undefined;
      }
    }
    if (acquired === undefined && seconds > 50.2) {
      failedPickupArm ??= structuredClone(previous?.carina.pose.arms?.right ?? input.carina.boundary.pose.arms!.right);
      cAction.pose.arms!.right = blendArmSeed(failedPickupArm, { elbow: { flexion: 8 } }, ease((seconds - 50.2) / 0.9));
      cGoal = undefined;
    }
    const cTouch: number = ease((seconds - 58) / 0.4) * (1 - ease((seconds - 59) / 0.6));
    const relaxed: IAutoMovieHumanHandPose = cGoal === undefined ? blendNoteGrip(grips.carina.hand, transferred === undefined ? 1 - ease((seconds - 50.2) / 0.9) : 1 - ease((seconds - transferred.frame / 24 - 0.55) / 0.6)) : hand("carina", seconds);
    if (cGoal === undefined && transferred !== undefined) relaxed.thumb = {};
    const carina: ActorState = actors.carina.fit(seconds, cAction, previous?.carina.pose ?? input.carina.boundary.pose, cGoal, relaxed, cTouch, acquired === undefined ? "guide" : "pinch");
    let paper: THREE.Matrix4 = intended;
    let owner: Frame["owner"] = "floor";
    let phase: string = guided === undefined ? "floor" : "index-guided-edge";
    if (acquired !== undefined && transferred === undefined) {
      paper = input.carina.actor.drawing.bones.get("rightHand")!.matrixWorld.clone().multiply(acquired.attachment); owner = "carina"; phase = "held";
    }
    place(paper);
    let cContact: Contact = grips.carina.measure(input.paper);
    let cOutside: ReturnType<ReturnType<typeof createStudentNoteGrip>["outside"]> = grips.carina.outside(input.paper);
    let indexContact: ReturnType<typeof guide> = guide();
    const supportedGuide: boolean = cGoal !== undefined && carina.motion.status === "admitted" && indexContact.admitted && cOutside.certified && Math.min(carina.handFloor.left, carina.handFloor.right) >= -1e-8;
    if (acquired === undefined) {
      if (guided === undefined && seconds >= 48.7 && seconds <= 50.2 && supportedGuide) guided = { frame: index };
      if (proposedTip > tipProgress) {
        if (supportedGuide) tipProgress = proposedTip;
        else {
          paper = pickup.at(tipProgress).matrix; place(paper);
          cContact = grips.carina.measure(input.paper); cOutside = grips.carina.outside(input.paper); indexContact = guide();
        }
      }
    }
    if (grips.carina.admitted && acquired === undefined && guided !== undefined && tipProgress >= 1 && seconds <= 50.2 && carina.motion.status === "admitted" && cContact.admitted && cOutside.certified && Math.min(carina.handFloor.left, carina.handFloor.right) >= -1e-8) {
      acquired = { frame: index, attachment: input.carina.actor.drawing.bones.get("rightHand")!.matrixWorld.clone().invert().multiply(paper) };
      owner = "carina"; phase = "held";
    }
    let hGoal: THREE.Matrix4 | undefined;
    if (acquired !== undefined && seconds >= 50.4) {
      receiverStart ??= actors.harry.paperFrame(previous?.harry.pose ?? input.harry.boundary.pose, input.harry.boundary.root);
      hGoal = interpolate(receiverStart, paper, ease((seconds - 50.4) / 1.1));
    } else hAction.pose.arms!.right = blendArmSeed(input.harry.boundary.pose.arms!.right, { elbow: { flexion: 8 } }, ease((seconds - 48.3) / 0.9));
    if (transferred !== undefined) {
      const chest: THREE.Matrix4 = offer.clone().setPosition(-1.8, 1.1, 0.65);
      const desired: THREE.Matrix4 = interpolate(transferred.paper, chest, ease((seconds - 55.1) / 0.8));
      hGoal = carrierGoal(desired, transferred.attachment, grips.harry);
    }
    const hTouch: number = ease((seconds - 54.9) / 0.45) * (1 - ease((seconds - 56.2) / 0.6));
    const harry: ActorState = actors.harry.fit(seconds, hAction, previous?.harry.pose ?? input.harry.boundary.pose, hGoal, hGoal === undefined ? {} : hand("harry", seconds), hTouch, seconds < 52.1 ? "guide" : "pinch");
    if (transferred !== undefined) { paper = input.harry.actor.drawing.bones.get("rightHand")!.matrixWorld.clone().multiply(transferred.attachment); owner = "harry"; phase = "held"; place(paper); }
    const hContact: Contact = grips.harry.measure(input.paper);
    const hOutside: ReturnType<ReturnType<typeof createStudentNoteGrip>["outside"]> = grips.harry.outside(input.paper);
    if (grips.harry.admitted && acquired !== undefined && transferred === undefined && seconds >= 52.1 && hContact.admitted && hOutside.certified && harry.motion.status === "admitted") {
      if (readyFrame === undefined) readyFrame = index;
      else if (index > readyFrame) {
        const attachment: THREE.Matrix4 = input.harry.actor.drawing.bones.get("rightHand")!.matrixWorld.clone().invert().multiply(paper);
        const rebuilt: THREE.Matrix4 = input.harry.actor.drawing.bones.get("rightHand")!.matrixWorld.clone().multiply(attachment);
        transferred = { frame: index, attachment, paper: paper.clone(), transformJump: Math.max(...rebuilt.elements.map((value: number, offset: number): number => Math.abs(value - paper.elements[offset]!))) };
        owner = "harry"; phase = "held";
      }
    }
    if (owner === "harry") { cContact = grips.carina.measure(input.paper); cOutside = grips.carina.outside(input.paper); }
    return { carina, harry, paper, owner, phase, tipProgress, floorMinimum: Math.min(...corners.map((point: THREE.Vector3): number => point.clone().applyMatrix4(paper).y)),
      carinaContact: cContact, harryContact: hContact, guide: seconds >= 49 && seconds <= 50.2 && acquired?.frame !== index && (acquired === undefined || index < acquired.frame) ? indexContact : undefined,
      outside: { carina: cOutside, harry: hOutside } };
  }

  /** Fixed chronological predecessor seeds make all supported seeking reproducible. */
  function ensure(index: number): Frame {
    for (let frame: number = last + 1; frame <= index; frame++) {
      try { const value: Frame = build(frame, lastAvailable); states.set(frame, value); lastAvailable = value; }
      catch (error) { errors.set(frame, error instanceof Error ? error.message : String(error)); }
      last = frame;
    }
    const value: Frame | undefined = states.get(index);
    if (value === undefined) throw new Error(`Departure frame${index} unavailable:${errors.get(index) ?? "not prepared"}`);
    return value;
  }

  return { apply: (seconds: number): ReturnType<ReturnType<typeof createDeparturePerformance>["apply"]> => {
    const index: number = Math.max(1153, Math.min(1440, Math.floor(seconds * 24 + 1e-7)));
    const value: Frame = ensure(index);
    actors.carina.show(value.carina); actors.harry.show(value.harry); place(value.paper);
    return { carina: value.carina.motion, harry: value.harry.motion, note: input.paper.position.toArray(), noteOwner: value.owner, paperFloorMinimum: value.floorMinimum,
      actualPaperContact: value.owner === "carina" ? value.carinaContact : value.owner === "harry" ? value.harryContact : undefined,
      record: { phase: value.phase, guidedContact: guided === undefined ? undefined : { frame: guided.frame, time: guided.frame / 24 }, tipProgress: value.tipProgress, profileAdmission: { carina: grips.carina.admitted, harry: grips.harry.admitted }, diagnosticOnly: !grips.carina.admitted || !grips.harry.admitted, handFloor: { carina: value.carina.handFloor, harry: value.harry.handFloor }, guide: value.guide, outside: value.outside,
        contacts: { carina: value.carinaContact, harry: value.harryContact }, carriers: { carina: value.carina.carrier, harry: value.harry.carrier }, touches: { carina: value.carina.touch, harry: value.harry.touch },
        acquisition: acquired === undefined ? undefined : { frame: acquired.frame, time: acquired.frame / 24, attachment: acquired.attachment.toArray() }, receiverReadyFrame: readyFrame,
        transfer: transferred === undefined ? undefined : { frame: transferred.frame, time: transferred.frame / 24, attachment: transferred.attachment.toArray(), transformJump: transferred.transformJump }, paperMatrix: value.paper.toArray(),
        profiles: index === 1153 ? { carina: { hand: grips.carina.hand, anchor: grips.carina.anchor, frameInHand: grips.carina.frameInHand.toArray(), index: grips.carina.index, thumb: grips.carina.thumb, attempts: grips.carina.attempts },
          harry: { hand: grips.harry.hand, anchor: grips.harry.anchor, frameInHand: grips.harry.frameInHand.toArray(), index: grips.harry.index, thumb: grips.harry.thumb, attempts: grips.harry.attempts } } : undefined } };
  }, prepare: (progress?: (done: number, total: number) => void): Promise<void> => {
    if (preparation === undefined) preparation = (async (): Promise<void> => {
      const failures: string[] = [];
      for (const person of ["carina", "harry"] as const) if (!grips[person].admitted) failures.push(`${person}:profile-unadmitted:diagnostic-trajectory-only:${JSON.stringify(grips[person].attempts)}`);
      for (let index: number = 1153; index <= 1440; index++) {
        try {
          const value: Frame = ensure(index);
          for (const person of ["carina", "harry"] as const) {
            const actor: ActorState = value[person];
            if (actor.motion.status !== "admitted") failures.push(`${person}:${index}:support:${actor.motion.reason}:${actor.motion.error}`);
            if (actor.motion.armError > 0.003) failures.push(`${person}:${index}:carrier-point:${actor.motion.armError}`);
            if (Math.min(actor.handFloor.left, actor.handFloor.right) < -1e-8) failures.push(`${person}:${index}:hand-paving:${JSON.stringify(actor.handFloor)}`);
            if (!value.outside[person].certified) failures.push(`${person}:${index}:original-hand/paper-uncertified:${JSON.stringify(value.outside[person])}`);
            if (actor.touch !== undefined && (actor.touch.pointError > 0.003 || actor.touch.amount >= 0.999 && !actor.touch.admitted)) failures.push(`${person}:${index}:forehead-touch:${JSON.stringify(actor.touch)}`);
          }
          if (value.floorMinimum < -1e-8) failures.push(`${index}:paper-paving:${value.floorMinimum}`);
          if (value.guide !== undefined && !value.guide.admitted) failures.push(`${index}:index-guide:${JSON.stringify(value.guide)}`);
          if (value.owner === "carina" && !value.carinaContact.admitted || value.owner === "harry" && !value.harryContact.admitted) failures.push(`${index}:held-note-contact`);
        } catch (error) { failures.push(`${index}:${error instanceof Error ? error.message : String(error)}`); }
        progress?.(index - 1152, 288);
        if (index % 4 === 0) await new Promise<void>((resolve: () => void): void => { setTimeout(resolve, 0); });
      }
      if (acquired === undefined || acquired.frame / 24 > 50.2) failures.push("The actual note was not picked up within the bounded staging window");
      if (transferred === undefined || readyFrame === undefined || readyFrame >= transferred.frame || transferred.frame / 24 > 52.5 || transferred.transformJump > 1e-9) failures.push("Receiver-before-giver exact-transform handoff was not admitted");
      if (failures.length !== 0) throw new Error(`Departure readiness failures:${JSON.stringify(failures)}`);
    })();
    return preparation;
  } };
}

/** Bounded cubic timing has no dependency on wall-clock playback order. */
function ease(value: number): number { const t: number = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); }
