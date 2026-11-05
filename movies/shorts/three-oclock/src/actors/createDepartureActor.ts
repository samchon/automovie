import type { AutoMovieHumanClinicalIk, AutoMovieHumanSkeleton, IAutoMovieHumanHandPose, IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { createArmControls } from "./createArmControls";
import type { createCharacterPerformance } from "./createCharacterPerformance";
import type { createFootControls } from "./createFootControls";
import { createForeheadTouchControls } from "./createForeheadTouchControls";
import type { createHumanActor } from "./createHumanActor";
import { createPaperArmControls } from "./createPaperArmControls";
import type { createStudentNoteGrip } from "./createStudentNoteGrip";
import type { evaluateDeparture } from "./evaluateDeparture";
import { evaluateFootContacts } from "./evaluateFootContacts";

/** A complete owned future actor state; original solver residuals stay explicit. */
type ActorState = {
  pose: IAutoMovieHumanPose;
  root: ReturnType<ReturnType<typeof createCharacterPerformance>["snapshot"]>["root"];
  heading: number;
  face: "neutral" | "smirk" | "surprise" | "smile";
  gatheredGarment: number;
  motion: ReturnType<ReturnType<typeof createCharacterPerformance>["apply"]>;
  handFloor: { left: number; right: number };
  carrier?: { nativeError: number; requiredPointError: number; request: AutoMovieHumanClinicalIk.IRequest };
  touch?: ReturnType<ReturnType<typeof createForeheadTouchControls>["fit"]>["contact"] & { nativeError: number };
};

/**
 * Compose a future actor through the same prepared body and original foot set.
 *
 * @evidence contracts/common.md#implementation-and-ownership Borrows the exact actor/support descriptor from the accepted48s ending. Carina's new bend/walk uses public foot fitting with fixedXZ; the exit retains its authored leg seed and requires both anterior air points while leaving the heel soft; stationary Harry re-inspects the unchanged accepted legs/root instead of pretending a new nominal pose is equivalent. Post-support root precedes right-hand carrier fitting; left forehead fitting preserves that right arm. Exact first carrier-point error and original full marker residual remain distinct. All actual left/right hand descendants are checked against paving. No competing rig, floor geometry deletion or clinical-bound change occurs.
 * @evidence contracts/common.md#authoring-interface Inputs include the actual actor, same-owner prepared feet, same-model note profile and an owned48s snapshot. fit takes an absolute authored action, optional previous full pose, explicit hand pose/paper world frame, left-touch amount and guide/pinch carrier role. Optional pose regions are omitted when absent. Gathered cloth is controlled only for the new Carina crouch. Returned pose/root/diagnostics own no scene resources. show restores the exact cached state, and paperFrame reads the virtual profile frame for a supplied actual pose/root. A carrier solve is not skin contact or custody; the coupled owner must measure those separately.
 */
export function createDepartureActor(actor: ReturnType<typeof createHumanActor>, person: "carina" | "harry", feet: ReturnType<typeof createFootControls>, grip: ReturnType<typeof createStudentNoteGrip>, boundary: ReturnType<ReturnType<typeof createCharacterPerformance>["snapshot"]>): {
  fit: (seconds: number, action: ReturnType<typeof evaluateDeparture>, previous?: IAutoMovieHumanPose, frame?: THREE.Matrix4, hand?: IAutoMovieHumanHandPose, touchAmount?: number, mode?: "guide" | "pinch") => ActorState;
  show: (state: ActorState) => void;
  paperFrame: (pose: IAutoMovieHumanPose, root: ActorState["root"]) => THREE.Matrix4;
} {
  if (feet.owner !== actor.object) throw new Error("Departure support belongs to another actual actor");
  const paperArm: ReturnType<typeof createPaperArmControls> = createPaperArmControls(actor, grip);
  const freeArm: ReturnType<typeof createArmControls> = createArmControls(actor);
  const touch: ReturnType<typeof createForeheadTouchControls> = createForeheadTouchControls(actor);
  const parents: Map<string, string | null> = new Map(actor.neutral.bones.map((bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent]));
  const hands: { left: THREE.Mesh[]; right: THREE.Mesh[] } = { left: [], right: [] };
  for (const [bone, mesh] of actor.drawing.parts) {
    let ancestor: string | null | undefined = bone;
    while (ancestor !== undefined && ancestor !== null && ancestor !== "leftHand" && ancestor !== "rightHand") ancestor = parents.get(ancestor);
    if (ancestor === "leftHand") hands.left.push(mesh);
    if (ancestor === "rightHand") hands.right.push(mesh);
  }

  /** Only this adapter owns placing its cached root and complete absolute pose. */
  function show(state: ActorState): void {
    actor.object.position.fromArray(state.root.translation); actor.object.rotation.set(0, state.heading, 0); actor.object.visible = true;
    actor.setPose(state.pose, state.face, state.gatheredGarment);
  }

  /** Read every actual original finger/hand vertex, not a proxy anchor height. */
  function handFloor(): { left: number; right: number } {
    const minima: { left: number; right: number } = { left: Infinity, right: Infinity };
    for (const side of ["left", "right"] as const) for (const mesh of hands[side]) {
      const vertices: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
      for (let index: number = 0; index < vertices.count; index++) minima[side] = Math.min(minima[side], mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(vertices, index)).y);
    }
    return minima;
  }

  return { show,
    paperFrame: (pose: IAutoMovieHumanPose, root: ActorState["root"]): THREE.Matrix4 => {
      actor.object.position.fromArray(root.translation); actor.object.quaternion.fromArray(root.rotation); actor.object.updateWorldMatrix(true, false);
      return paperArm.worldFrame(pose);
    },
    fit: (seconds: number, action: ReturnType<typeof evaluateDeparture>, previous?: IAutoMovieHumanPose, frame?: THREE.Matrix4, hand?: IAutoMovieHumanHandPose, touchAmount: number = 0, mode: "guide" | "pinch" = "pinch"): ActorState => {
      actor.object.position.copy(action.position); actor.object.rotation.set(0, action.heading, 0); actor.object.updateWorldMatrix(true, false);
      const modes: ReturnType<typeof evaluateFootContacts> = evaluateFootContacts(person, seconds);
      let lower: ReturnType<ReturnType<typeof createFootControls>["fit"]>;
      if (person === "harry") {
        actor.object.position.fromArray(boundary.root.translation); actor.object.quaternion.fromArray(boundary.root.rotation); actor.object.updateWorldMatrix(true, false);
        lower = feet.inspect(boundary.pose, action.left, action.right, modes);
      } else {
        const seed: IAutoMovieHumanPose = { legs: action.pose.legs, ...(action.pose.pelvis === undefined ? {} : { pelvis: action.pose.pelvis }) };
        lower = feet.fit(seed, action.left, action.right, modes, action.bendAmount > 0 ? { left: seed.legs?.left?.knee?.flexion ?? 12, right: seed.legs?.right?.knee?.flexion ?? 12 } : undefined, seconds >= 55.1);
      }
      let pose: IAutoMovieHumanPose = { ...lower.pose, ...(action.pose.head === undefined ? {} : { head: action.pose.head }), ...(action.pose.neck === undefined ? {} : { neck: action.pose.neck }), ...(action.pose.spine === undefined ? {} : { spine: action.pose.spine }), arms: structuredClone(action.pose.arms) };
      if (frame !== undefined && previous?.arms?.right !== undefined) pose.arms!.right = structuredClone(previous.arms.right);
      if (hand !== undefined) pose.arms!.right.hand = structuredClone(hand);
      actor.object.position.fromArray(lower.root.translation); actor.object.quaternion.fromArray(lower.root.rotation); actor.object.updateWorldMatrix(true, false);
      let armError: number = 0;
      let detail: ReturnType<ReturnType<typeof createCharacterPerformance>["apply"]>["armDetail"];
      let carrier: ActorState["carrier"];
      if (frame !== undefined) {
        const fitted: ReturnType<ReturnType<typeof createPaperArmControls>["fit"]> = paperArm.fit(pose, frame, mode);
        pose = fitted.pose;
        const placement: AutoMovieHumanSkeleton.IPlacement = fitted.output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
        const point: THREE.Vector3 = new THREE.Vector3(...fitted.request.targets[0]!.localPoint!).applyQuaternion(new THREE.Quaternion(...placement.rotation)).add(new THREE.Vector3(...placement.position));
        armError = point.distanceTo(new THREE.Vector3(...fitted.request.targets[0]!.position));
        detail = { iterations: fitted.iterations, request: fitted.request, seed: fitted.seed, constraintValues: fitted.constraintValues, constraintsSatisfied: fitted.constraintsSatisfied };
        carrier = { nativeError: fitted.error, requiredPointError: armError, request: fitted.request };
      }
      let touched: ActorState["touch"];
      if (touchAmount > 0) {
        const fitted: ReturnType<ReturnType<typeof createForeheadTouchControls>["fit"]> = touch.fit(pose, touchAmount);
        pose = fitted.pose; touched = { ...fitted.contact, nativeError: fitted.error };
      }
      const anchor: { bone: "rightHand"; localPoint: [number, number, number] } = frame === undefined ? freeArm.anchor : grip.anchor;
      const state: ActorState = { pose, root: lower.root, heading: action.heading, face: action.face, gatheredGarment: person === "carina" ? action.bendAmount : 0, handFloor: { left: Infinity, right: Infinity }, carrier, touch: touched,
        motion: { frame: Math.floor(seconds * 24 + 1e-7), root: lower.root, status: lower.contactAdmitted ? "admitted" : "unresolved", error: lower.error, floorMinimum: lower.floorMinimum,
          armError, handRole: frame === undefined ? "free" : "carry", knees: { left: pose.legs?.left?.knee?.flexion ?? 0, right: pose.legs?.right?.knee?.flexion ?? 0 }, handPoint: [],
          footMinimum: lower.footMinimum, softFootError: lower.softError, reason: lower.reason, iterations: lower.iterations, modes,
          footDetail: { descriptor: feet.descriptor, requestedRoot: lower.requestedRoot, rootAxes: lower.rootAxes, rootAdjustment: lower.rootAdjustment, status: lower.status, reason: lower.reason,
            iterations: lower.iterations, supportError: lower.supportError, softError: lower.softError, activeBounds: lower.activeBounds, hardTargets: lower.hardTargets, softTargets: lower.softTargets, pathError: lower.pathError },
          ...(detail === undefined ? {} : { armDetail: detail }) } };
      show(state);
      state.motion.handPoint = actor.point(anchor.bone, new THREE.Vector3(...(carrier?.request.targets[0]?.localPoint ?? anchor.localPoint))).toArray();
      state.handFloor = handFloor();
      return state;
    } };
}
