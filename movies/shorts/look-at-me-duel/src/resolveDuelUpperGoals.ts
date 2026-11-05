import * as THREE from "three";

/**
 * Explicit independent coordinate weights for one actual upper-body performance.
 * @evidence contracts/common.md#implementation-and-ownership The erased record distinguishes body-owned and actual-head-owned components; it performs no solve or implicit role conversion.
 * @evidence contracts/common.md#authoring-interface Four bounded0–1 weights accompany optional world-metre head points. The resolver requires both points for active head weights; another actor's raised state supplies no authority here.
 */
export interface DuelUpperGoalFrames {
  bodyWrist: number;
  bodyAim: number;
  raised: number;
  outward: number;
  raisedReference?: THREE.Vector3;
  actualRaised?: THREE.Vector3;
}

/**
 * Resolve body-relative, held-world and head-relative goal components exactly once.
 *
 * @evidence contracts/common.md#implementation-and-ownership Ordinary body components share the actual solved-root displacement. World contacts do not move with it. A raised/head component adds only its own actual-head displacement, independently of another actor's raised phase. Mixed body/head weights are added rather than multiplied, preserving the release path. Borrowed vectors are cloned; no pose, actor or solver is changed.
 * @evidence contracts/common.md#authoring-interface Inputs are world metres and bounded0–1 source weights. Supply both head points when either head weight is active. Return independent wrist/aim points for the public arm solver; coordinate consistency is not anatomical admission. Nonfinite points or weights and incomplete active head inputs refuse.
 */
export function resolveDuelUpperGoals(plan: { position: THREE.Vector3; wrist: THREE.Vector3; aim: THREE.Vector3 }, actualRoot: THREE.Vector3, frames: DuelUpperGoalFrames): { wrist: THREE.Vector3; aim: THREE.Vector3 } {
  const weights: number[] = [frames.bodyWrist, frames.bodyAim, frames.raised, frames.outward];
  const points: THREE.Vector3[] = [plan.position, plan.wrist, plan.aim, actualRoot, ...(frames.raisedReference === undefined ? [] : [frames.raisedReference]), ...(frames.actualRaised === undefined ? [] : [frames.actualRaised])];
  if (weights.some((value: number): boolean => !Number.isFinite(value) || value < 0 || value > 1) || points.some((point: THREE.Vector3): boolean => !point.toArray().every(Number.isFinite))) throw new Error("Upper goals require finite world points and bounded weights");
  const delta: THREE.Vector3 = actualRoot.clone().sub(plan.position);
  const wrist: THREE.Vector3 = plan.wrist.clone().addScaledVector(delta, frames.bodyWrist);
  const aim: THREE.Vector3 = plan.aim.clone().addScaledVector(delta, frames.bodyAim);
  if (frames.raised > 0 || frames.outward > 0) {
    if (frames.raisedReference === undefined || frames.actualRaised === undefined) throw new Error("Active head-relative goals require both actual and reference head points");
    const headDelta: THREE.Vector3 = frames.actualRaised.clone().sub(frames.raisedReference);
    wrist.addScaledVector(headDelta, frames.raised);
    aim.addScaledVector(headDelta, frames.outward);
  }
  return { wrist, aim };
}
