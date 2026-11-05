import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanHandPose, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { blendHandNormal } from "./blendHandNormal";
import { blendNoteGrip } from "./blendNoteGrip";
import { createForeheadWitness } from "./createForeheadWitness";
import type { createHumanActor } from "./createHumanActor";
import { selectFingerPad } from "./selectFingerPad";

/**
 * Direct an original left index pad to this actor's own original forehead.
 *
 * @evidence contracts/common.md#implementation-and-ownership The same-model83percent original left distal pad follows actual FK. The existing forehead owner supplies its original upper-central skin address and normal. Seven public left-arm channels preserve the already fitted right arm, support and body. A unit quaternion normal course keeps the virtual60mm marker rigid. Other fingers curl away gradually. During approach/recovery, an unresolved essential pad point receives one bounded point-only public correction after retaining the original direction attempt; final hold keeps the original two-target method. Final point/direction and outward normal clearance decide this local touch; no whole-hand/head swept-collision or force certificate is claimed.
 * @evidence contracts/common.md#authoring-interface Supply the actual actor, complete post-support/right-arm pose and bounded0–1 touch amount. Targets are evaluator-body metres from that same pose, so walking/turning cannot substitute a stale world head frame. Sixteen public updates use0.7mm marker precision toward a2mm exterior forehead offset. The final hold needs actual pad-to-original-forehead distance at most3mm, exterior side and opposed normals. Returns actual seed/request/result, original direction residual/failed attempt when corrected, and independently measured essential point/local contact, never altered head/skin geometry or owned resources.
 */
export function createForeheadTouchControls(actor: ReturnType<typeof createHumanActor>): {
  fit: (pose: IAutoMovieHumanPose, amount: number) => AutoMovieHumanClinicalIk.IResult & { request: AutoMovieHumanClinicalIk.IRequest; seed: IAutoMovieHumanPose; contact: { admitted: boolean; distance: number; outward: number; normalDot: number; amount: number; pointError: number; directionError: number; directionAttempt?: { error: number; iterations: number; pose: IAutoMovieHumanPose; seed: IAutoMovieHumanPose; request: AutoMovieHumanClinicalIk.IRequest } } };
} {
  const source: AutoMovieHumanSkeleton.IBone = actor.neutral.bones.find((row: AutoMovieHumanSkeleton.IBone): boolean => row.bone === "leftIndexDistal")!;
  const at: (bone: string) => THREE.Vector3 = (bone: string): THREE.Vector3 => new THREE.Vector3(...actor.neutral.bones.find((row: AutoMovieHumanSkeleton.IBone): boolean => row.bone === bone)!.position);
  const forward: THREE.Vector3 = at("leftMiddleProximal").sub(at("leftHand")).normalize();
  const palmar: THREE.Vector3 = at("leftIndexProximal").sub(at("leftLittleProximal")).normalize().cross(forward).normalize();
  if (source.tip === null) throw new Error("Forehead touch requires the actual index leaf tip");
  const pad: ReturnType<typeof selectFingerPad> = selectFingerPad(actor.drawing.parts.get("leftIndexDistal")!, new THREE.Vector3(...source.tip).sub(new THREE.Vector3(...source.position)), palmar, 0.83, 0);
  const forehead: ReturnType<typeof createForeheadWitness> = createForeheadWitness(actor);
  const normal: THREE.Vector3 = forehead.normal().transformDirection(actor.drawing.head.object.matrixWorld.clone().invert());
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = ["shoulder.flexion", "shoulder.abduction", "shoulder.rotation", "elbow.flexion", "forearm.pronation", "wrist.flexion", "wrist.radialDeviation"].map((path: string): AutoMovieHumanRigControls.DegreeChannel => AutoMovieHumanRigControls.channel(`arms.left.${path}`));
  const hand: IAutoMovieHumanHandPose = { index: { mcpFlexion: 0, pipFlexion: 0, dipFlexion: 0 },
    middle: { mcpFlexion: 45, pipFlexion: 70, dipFlexion: 20 }, ring: { mcpFlexion: 45, pipFlexion: 70, dipFlexion: 20 }, little: { mcpFlexion: 45, pipFlexion: 70, dipFlexion: 20 },
    thumb: { cmcAbduction: 15, cmcOpposition: 30, mcpFlexion: 25, ipFlexion: 20 } };

  /** Carry the exact original index material address through one returned FK. */
  function material(output: AutoMovieHumanSkeleton.IOutput): { point: THREE.Vector3; normal: THREE.Vector3 } {
    const row: AutoMovieHumanSkeleton.IPlacement = output.posed.find((entry: AutoMovieHumanSkeleton.IPlacement): boolean => entry.bone === "leftIndexDistal")!;
    return { point: pad.point.clone().applyQuaternion(new THREE.Quaternion(...row.rotation)).add(new THREE.Vector3(...row.position)), normal: pad.normal.clone().applyQuaternion(new THREE.Quaternion(...row.rotation)).normalize() };
  }
  return { fit: (pose: IAutoMovieHumanPose, amount: number): ReturnType<ReturnType<typeof createForeheadTouchControls>["fit"]> => {
    if (!Number.isFinite(amount) || amount < 0 || amount > 1) throw new Error("Forehead touch amount must lie within0–1");
    const seed: IAutoMovieHumanPose = structuredClone(pose);
    seed.arms!.left.hand = blendNoteGrip(hand, amount);
    const output: AutoMovieHumanSkeleton.IOutput = actor.evaluate(seed);
    const head: AutoMovieHumanSkeleton.IPlacement = output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "head")!;
    const headNormal: THREE.Vector3 = normal.clone().applyQuaternion(new THREE.Quaternion(...head.rotation)).normalize();
    const skin: THREE.Vector3 = forehead.localPoint.clone().applyQuaternion(new THREE.Quaternion(...head.rotation)).add(new THREE.Vector3(...head.position));
    const current: ReturnType<typeof material> = material(output);
    const goal: THREE.Vector3 = current.point.clone().lerp(skin.clone().addScaledVector(headNormal, 0.002), amount);
    const axis: THREE.Vector3 = Math.abs(current.normal.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const direction: THREE.Vector3 = blendHandNormal(current.normal, headNormal.clone().negate(), amount, axis);
    const request: AutoMovieHumanClinicalIk.IRequest = { channels, targets: [
      { bone: "leftIndexDistal", localPoint: pad.point.toArray() as [number, number, number], position: goal.toArray() as [number, number, number] },
      { bone: "leftIndexDistal", localPoint: pad.point.clone().addScaledVector(pad.normal, 0.06).toArray() as [number, number, number], position: goal.clone().addScaledVector(direction, 0.06).toArray() as [number, number, number] },
    ], iterations: 16, tolerance: 0.0007 };
    let fitted: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(actor.evaluate, seed, request);
    const directionError: number = fitted.error;
    let actualRequest: AutoMovieHumanClinicalIk.IRequest = request;
    let directionAttempt: { error: number; iterations: number; pose: IAutoMovieHumanPose; seed: IAutoMovieHumanPose; request: AutoMovieHumanClinicalIk.IRequest } | undefined;
    if (amount < 0.999 && material(fitted.output).point.distanceTo(goal) > 0.003) {
      directionAttempt = { error: fitted.error, iterations: fitted.iterations, pose: fitted.pose, seed, request };
      actualRequest = { channels, targets: request.targets.slice(0, 1), iterations: 16, tolerance: 0.0007 };
      fitted = AutoMovieHumanClinicalIk.solve(actor.evaluate, fitted.pose, actualRequest);
    }
    const actual: ReturnType<typeof material> = material(fitted.output);
    const distance: number = actual.point.distanceTo(skin); const outward: number = actual.point.clone().sub(skin).dot(headNormal); const normalDot: number = actual.normal.dot(headNormal);
    return { ...fitted, request: actualRequest, seed: directionAttempt?.pose ?? seed, contact: { admitted: distance <= 0.003 && outward >= -1e-8 && normalDot < -0.25, distance, outward, normalDot, amount, pointError: actual.point.distanceTo(goal), directionError, ...(directionAttempt === undefined ? {} : { directionAttempt }) } };
  } };
}
