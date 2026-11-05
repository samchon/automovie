import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { createHumanActor } from "./createHumanActor";
import { evaluateReachTarget } from "./evaluateReachTarget";
import { blendHandNormal } from "./blendHandNormal";

/** Original orientation attempt stays separate from the required-point correction. */
type OrientationAttempt = { error: number; iterations: number; request: AutoMovieHumanClinicalIk.IRequest; constraintsSatisfied: boolean };

/** Final required-point fit and honestly retained optional direction mismatch. */
type ArmFit = AutoMovieHumanClinicalIk.IResult & { request: AutoMovieHumanClinicalIk.IRequest; seed: IAutoMovieHumanPose; orientationAttempt?: OrientationAttempt; orientationError?: { marker: number; radians: number } };

/**
 * Fit one real right-hand carrier through the public clinical arm controls.
 *
 * @evidence contracts/common.md#implementation-and-ownership The original hand triangle supplies a skin-face centroid/normal for an empty palm, or the fitted grip supplies its bone-local paper-edge anchor. Both use seven public shoulder/elbow/forearm/wrist degrees; none changes hand-local finger contact. The60mm virtual marker consumes the requested world normal, default upward for the accepted opening, with independently blended orientation. It is not skin/contact. Body-derived reach goals use actual supported-shoulder FK and measured neutral upper/lower-arm/anchor lengths; they still need clinical admission. No anatomy or clinical bound changes.
 * @evidence contracts/common.md#authoring-interface Supply an actor and optional fixed rightHand anchor. fit takes an absolute pose, world-metre target, bounded point weight and optional unit world normal/orientation weight. The default essential policy preserves the original16-update3mm combined-point result. Explicit preferred orientation retains that original attempt, then permits at most16 more public updates for the same actual point alone, still at3mm. Final point residual, original orientation attempt and final marker/angle mismatch remain distinct; no failed combined result is renamed converged. reachTarget uses an actual supported-shoulder ray, not assumed floor reach. Caller must inspect final direction/readability, actual contact and unchanged support. No owned scene resources.
 */
export function createArmControls(actor: ReturnType<typeof createHumanActor>, anchor?: { bone: "rightHand"; localPoint: [number, number, number] }): {
  anchor: { bone: "rightHand"; localPoint: [number, number, number] };
  palmNormal?: THREE.Vector3;
  reachTarget: (pose: IAutoMovieHumanPose, towards: THREE.Vector3, fraction: number) => THREE.Vector3;
  fit: (pose: IAutoMovieHumanPose, target: THREE.Vector3, weight: number, worldNormal?: THREE.Vector3, normalWeight?: number, normalPolicy?: "essential" | "preferred") => ArmFit;
} {
  let local: THREE.Vector3;
  let palmNormal: THREE.Vector3 | undefined;
  if (anchor !== undefined) local = new THREE.Vector3(...anchor.localPoint);
  else {
    const mesh: THREE.Mesh = actor.drawing.parts.get("rightHand")!;
    const attribute: THREE.BufferAttribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    const index: THREE.BufferAttribute | null = mesh.geometry.getIndex();
    const hand: AutoMovieHumanSkeleton.IPlacement = actor.neutral.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
    const at: (bone: string) => THREE.Vector3 = (bone: string): THREE.Vector3 => new THREE.Vector3(...actor.neutral.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone)!.position);
    const radial: THREE.Vector3 = at("rightIndexProximal").sub(at("rightLittleProximal")).normalize();
    const down: THREE.Vector3 = at("rightMiddleProximal").sub(at("rightHand")).normalize();
    const normal: THREE.Vector3 = new THREE.Vector3().crossVectors(radial, down).negate().applyQuaternion(new THREE.Quaternion(...hand.rotation).invert()).normalize();
    let best: number = -Infinity;
    local = new THREE.Vector3();
    for (let triangle: number = 0; triangle < (index?.count ?? attribute.count); triangle += 3) {
      const points: THREE.Vector3[] = [0, 1, 2].map((offset: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(attribute, index?.getX(triangle + offset) ?? triangle + offset));
      const face: THREE.Vector3 = new THREE.Vector3().crossVectors(points[1]!.clone().sub(points[0]!), points[2]!.clone().sub(points[0]!)).normalize();
      const alignment: number = face.dot(normal);
      if (alignment > best) { best = alignment; palmNormal = face.clone(); local.copy(points[0]!).add(points[1]!).add(points[2]!).multiplyScalar(1 / 3); }
    }
    if (!Number.isFinite(best)) throw new Error("The actual palm has no finite skin triangle");
  }
  const selected: { bone: "rightHand"; localPoint: [number, number, number] } = { bone: "rightHand", localPoint: local.toArray() as [number, number, number] };
  const at: (bone: string) => THREE.Vector3 = (bone: string): THREE.Vector3 => new THREE.Vector3(...actor.neutral.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone)!.position);
  const reach: number = at("rightUpperArm").distanceTo(at("rightLowerArm")) + at("rightLowerArm").distanceTo(at("rightHand")) + local.length();
  const channels: AutoMovieHumanRigControls.DegreeChannel[] = ["shoulder.flexion", "shoulder.abduction", "shoulder.rotation", "elbow.flexion"].map((path: string): AutoMovieHumanRigControls.DegreeChannel => AutoMovieHumanRigControls.channel(`arms.right.${path}`));
  channels.push(...["forearm.pronation", "wrist.flexion", "wrist.radialDeviation"].map((path: string): AutoMovieHumanRigControls.DegreeChannel => AutoMovieHumanRigControls.channel(`arms.right.${path}`)));
  return { anchor: selected, ...(palmNormal === undefined ? {} : { palmNormal }),
    reachTarget: (pose: IAutoMovieHumanPose, towards: THREE.Vector3, fraction: number): THREE.Vector3 => {
      const output: AutoMovieHumanSkeleton.IOutput = actor.evaluate(pose);
      const shoulder: AutoMovieHumanSkeleton.IPlacement = output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightUpperArm")!;
      return evaluateReachTarget(actor.object.localToWorld(new THREE.Vector3(...shoulder.position)), towards, reach, fraction);
    },
    fit: (pose: IAutoMovieHumanPose, target: THREE.Vector3, weight: number, worldNormal?: THREE.Vector3, normalWeight?: number, normalPolicy: "essential" | "preferred" = "essential"): ArmFit => {
    const current: AutoMovieHumanSkeleton.IOutput = actor.evaluate(pose);
    const frame: AutoMovieHumanSkeleton.IPlacement = current.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
    const point: THREE.Vector3 = local.clone().applyQuaternion(new THREE.Quaternion(...frame.rotation)).add(new THREE.Vector3(...frame.position));
    const goal: THREE.Vector3 = actor.object.worldToLocal(target.clone());
    goal.lerpVectors(point, goal, Math.max(0, Math.min(1, weight)));
    const targets: AutoMovieHumanClinicalIk.ITarget[] = [{ ...selected, position: goal.toArray() as [number, number, number] }];
    if (palmNormal !== undefined) {
      const currentNormal: THREE.Vector3 = palmNormal.clone().applyQuaternion(new THREE.Quaternion(...frame.rotation)).normalize();
      const supplied: THREE.Vector3 = worldNormal ?? new THREE.Vector3(0, 1, 0);
      if (!supplied.toArray().every(Number.isFinite) || Math.abs(supplied.length() - 1) > 1e-6) throw new Error("Hand normal must be a finite world unit vector");
      const requested: THREE.Vector3 = supplied.clone().applyQuaternion(actor.object.getWorldQuaternion(new THREE.Quaternion()).invert());
      const desired: THREE.Vector3 = blendHandNormal(currentNormal, requested, Math.max(0, Math.min(1, normalWeight ?? weight)), new THREE.Vector3(1, 0, 0));
      targets.push({ bone: "rightHand", localPoint: local.clone().addScaledVector(palmNormal, 0.06).toArray() as [number, number, number], position: goal.clone().addScaledVector(desired, 0.06).toArray() as [number, number, number] });
    }
    const request: AutoMovieHumanClinicalIk.IRequest = { channels, targets, iterations: 16, tolerance: 0.003 };
    const oriented: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(actor.evaluate, pose, request);
    if (normalPolicy === "essential" || palmNormal === undefined) return { ...oriented, request, seed: pose };

    // An empty reach needs its actual point; the source does not prescribe an
    // exact hand frame. Keep the direction candidate, then correct that point
    // through the same public channels without weakening either fit's precision.
    const pointRequest: AutoMovieHumanClinicalIk.IRequest = { channels, targets: [targets[0]!], iterations: 16, tolerance: 0.003 };
    const corrected: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(actor.evaluate, oriented.pose, pointRequest);
    const final: AutoMovieHumanSkeleton.IPlacement = corrected.output.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === "rightHand")!;
    const actualPoint: THREE.Vector3 = local.clone().applyQuaternion(new THREE.Quaternion(...final.rotation)).add(new THREE.Vector3(...final.position));
    const actualNormal: THREE.Vector3 = palmNormal.clone().applyQuaternion(new THREE.Quaternion(...final.rotation)).normalize();
    const desiredNormal: THREE.Vector3 = new THREE.Vector3(...targets[1]!.position).sub(new THREE.Vector3(...targets[0]!.position)).normalize();
    return { ...corrected, request: pointRequest, seed: oriented.pose,
      orientationAttempt: { error: oriented.error, iterations: oriented.iterations, request, constraintsSatisfied: oriented.constraintsSatisfied },
      orientationError: { marker: actualPoint.clone().addScaledVector(actualNormal, 0.06).distanceTo(new THREE.Vector3(...targets[1]!.position)), radians: actualNormal.angleTo(desiredNormal) } };
  } };
}
