import * as THREE from "three";

/**
 * Author a straight approach with alternating planted and lifted foot goals.
 * The Human support controller, not this planner, solves anatomy and floor.
 * At least two steps return both feet to the translated neutral stance.
 *
 * @evidence contracts/common.md#implementation-and-ownership Absolute normalized progress selects each foot's last/current authored step, holding the other witness stationary. A5cm swing arc is a staging choice. No joint lengths or FK are duplicated; the returned goals must be checked by actual Human support feedback.
 * @evidence contracts/common.md#authoring-interface Supply finite time bounds, world start/end roots, fixed heading and body-frame rest witnesses. Returns owned root/foot vectors and requested swing state. Time clamps to the interval; positive duration and integral step count of at least2 are required. This straight planner supplies no turning or collision avoidance.
 */
export function sampleWalkingApproach(options: {
  seconds: number;
  begin: number;
  end: number;
  start: THREE.Vector3;
  finish: THREE.Vector3;
  yaw: number;
  steps: number;
  rest: { left: THREE.Vector3; right: THREE.Vector3 };
}): {
  root: THREE.Vector3;
  feet: { left: THREE.Vector3; right: THREE.Vector3 };
  swing: "left" | "right" | null;
} {
  if (![options.seconds, options.begin, options.end, options.yaw, ...options.start.toArray(), ...options.finish.toArray()].every(Number.isFinite)
    || options.end <= options.begin || !Number.isSafeInteger(options.steps) || options.steps < 2)
    throw new Error("Walking approach requires finite bounds and at least two steps");
  const progress: number = THREE.MathUtils.clamp((options.seconds - options.begin) / (options.end - options.begin), 0, 1);
  const travel: THREE.Vector3 = options.finish.clone().sub(options.start);
  const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), options.yaw);
  const phase: number = progress * options.steps;
  const step: number = Math.min(options.steps - 1, Math.floor(phase));
  const fraction: number = progress === 1 ? 1 : phase - step;
  const eased: number = fraction * fraction * (3 - 2 * fraction);
  const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: new THREE.Vector3(), right: new THREE.Vector3() };
  let total: number = 0;
  for (const side of ["left", "right"] as const) {
    const parity: number = side === "right" ? 0 : 1;
    const swinging: boolean = step % 2 === parity;
    const last: number = step - ((step - parity + 2) % 2);
    const previous: number = swinging ? last - 2 : last;
    const from: number = Math.max(0, Math.min(1, (previous + 1) / (options.steps - 1)));
    const to: number = Math.max(0, Math.min(1, (last + 1) / (options.steps - 1)));
    const station: number = swinging ? THREE.MathUtils.lerp(from, to, eased) : to;
    total += station;
    feet[side].copy(options.rest[side]).applyQuaternion(rotation).add(options.start).addScaledVector(travel, station);
    feet[side].y = swinging ? 0.05 * Math.sin(Math.PI * fraction) : 0;
  }
  return {
    root: options.start.clone().addScaledVector(travel, total / 2), feet,
    swing: progress === 0 || progress === 1 ? null : step % 2 === 0 ? "right" : "left",
  };
}
