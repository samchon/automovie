import * as THREE from "three";

/** Root placement in the court's +X east/+Y up/-Z north metre frame. */
interface Placement {
  position: THREE.Vector3;
  yaw: number;
}

/**
 * Transfer alternating actual sole witnesses between explicit timed landings.
 *
 * @evidence contracts/common.md#implementation-and-ownership The caller supplies the continuing entry footprints, fixed body-frame sole witnesses and root path. Completed landings remain fixed; only the current swing foot interpolates to its next path-derived landing, with an authored positive lift. The result is an independent kinematic goal, never a claim of Human support or collision admission.
 * @evidence contracts/common.md#authoring-interface Supply finite local seconds, positive step durations, first moving side, nonnegative lift in metres and a pure path in the same local clock. Entry feet are borrowed and cloned. The returned world goals clamp before entry and after the final landing; each call reconstructs the same finite schedule without retained state.
 */
export function evaluateDuelSteps(
  seconds: number,
  durations: readonly number[],
  first: "left" | "right",
  entry: { left: THREE.Vector3; right: THREE.Vector3 },
  reference: { left: THREE.Vector3; right: THREE.Vector3 },
  path: (seconds: number) => Placement,
  lift: number = 0.045,
): { left: THREE.Vector3; right: THREE.Vector3 } {
  if (!Number.isFinite(seconds) || !Number.isFinite(lift) || lift < 0 || durations.length === 0 || durations.some((value: number): boolean => !Number.isFinite(value) || value <= 0))
    throw new Error("Foot transfers require finite time, positive durations and nonnegative metre lift");
  const goals: { left: THREE.Vector3; right: THREE.Vector3 } = { left: entry.left.clone(), right: entry.right.clone() };
  const up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  let start: number = 0;
  for (let index: number = 0; index < durations.length; index++) {
    const end: number = start + durations[index]!;
    const side: "left" | "right" = index % 2 === 0 ? first : first === "left" ? "right" : "left";
    const placement: Placement = path(end);
    const landing: THREE.Vector3 = reference[side].clone().applyAxisAngle(up, placement.yaw).add(placement.position);
    landing.y = 0;
    if (seconds >= end) goals[side] = landing;
    else if (seconds > start) {
      const phase: number = (seconds - start) / durations[index]!;
      const eased: number = phase * phase * (3 - 2 * phase);
      goals[side].lerp(landing, eased);
      goals[side].y += Math.sin(Math.PI * eased) * lift;
      break;
    } else break;
    start = end;
  }
  return goals;
}
