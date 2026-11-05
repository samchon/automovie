import type * as THREE from "three";

/**
 * A measured small-fragment contact and its actual retained motion evaluator.
 * @evidence contracts/common.md#implementation-and-ownership The record retains the last separated centre/time, first actual triangle/box intersection time and triangle index plus the derived floor stop. Its subnanosecond refined bracket is explicit rather than inventing an exact contact point. No actor or principal-block interception is fabricated.
 * @evidence contracts/common.md#authoring-interface Contact positions are world metres and times are scene seconds. at returns independent placements before/after the actual shield encounter; source sound is not synthesized or accepted by this data.
 */
export interface DuelFragmentMotion {
  contact: { seconds: number; firstIntersectionSeconds: number; centre: THREE.Vector3; triangle: number };
  floorSeconds: number;
  at: (seconds: number) => { visible: boolean; centre: THREE.Vector3; stoppedByShield: boolean; settled: boolean };
}

