import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

/**
 * Resolve the opening circle, readiness and individual foot placements from scene seconds.
 *
 * @evidence contracts/common.md#implementation-and-ownership Fixed metre paths and six short steps realize the current screenplay's 0–9-second approach. Harry retains each planted foot while the other steps. Carina has actual transfer goals with heel rise and a distinct leading-foot lift/landing before her reply. These are authored goals for full Human fitting, not claims of solver or visual admission.
 * @evidence contracts/common.md#authoring-interface Supply finite scene seconds, a performer role and measured neutral front-sole witnesses for both performers. Harry's active transfers permit heel roll while the actual front material-point path and full floor remain essential. Return root, authored clinical/toe seed, hard world foot goals and pivot mode. +X east/+Y up/-Z north; floor Y=0. No history or random draw affects goal evaluation; fixed-order numerical preparation remains with the scene.
 */
export function evaluateDuelOpening(seconds: number, role: "Carina" | "Harry", feet: { left: THREE.Vector3; right: THREE.Vector3 }): {
  position: THREE.Vector3;
  yaw: number;
  pose: IAutoMovieHumanPose;
  left: THREE.Vector3;
  right: THREE.Vector3;
  wrist: THREE.Vector3;
  aim: THREE.Vector3;
  footMode: "ball" | "lowest" | "rolling" | "transfer" | "settling";
  heelTilt: number;
} {
  if (!Number.isFinite(seconds)) throw new Error("Finite opening seconds required");
  const t: number = Math.min(9, Math.max(0, seconds));

  /** Ease a bounded phase without extrapolating its target. */
  function ease(value: number): number {
    const clamped: number = Math.min(1, Math.max(0, value));
    return clamped * clamped * (3 - 2 * clamped);
  }

  /** Resolve an actor root for any foot landing's absolute scene time. */
  function root(time: number, person: "Carina" | "Harry"): { position: THREE.Vector3; yaw: number } {
    const progress: number = ease(time / 3.6);
    const carina: THREE.Vector3 = new THREE.Vector3(-0.65, 0, 0.30);
    const angle: number = 0.40 + 0.25 * progress;
    const radius: number = 1.30 + 0.70 * progress;
    const harry: THREE.Vector3 = new THREE.Vector3(carina.x + Math.cos(angle) * radius, 0, carina.z - Math.sin(angle) * radius);
    const position: THREE.Vector3 = person === "Carina" ? carina : harry;
    const direction: THREE.Vector3 = (person === "Carina" ? harry : carina).clone().sub(position);
    return { position, yaw: Math.atan2(-direction.z, direction.x) };
  }

  /** Move the measured body-frame witness to one explicit footprint on the court. */
  function footprint(side: "left" | "right", time: number): THREE.Vector3 {
    const at: ReturnType<typeof root> = root(time, role);
    const point: THREE.Vector3 = feet[side].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), at.yaw).add(at.position);
    point.y = 0;
    return point;
  }

  const current: ReturnType<typeof root> = root(t, role);
  const goals: { left: THREE.Vector3; right: THREE.Vector3 } = { left: footprint("left", 0), right: footprint("right", 0) };
  if (role === "Harry") {
    const step: number = Math.min(5, Math.floor(Math.min(t, 3.599999) / 0.6));
    const moving: "left" | "right" = step % 2 === 0 ? "left" : "right";
    const planted: "left" | "right" = moving === "left" ? "right" : "left";
    const fraction: number = ease((t - step * 0.6) / 0.6);
    goals[planted] = footprint(planted, Math.max(0, step * 0.6));
    const prior: number = Math.max(0, (step - 1) * 0.6);
    goals[moving] = footprint(moving, prior).lerp(footprint(moving, (step + 1) * 0.6), fraction);
    goals[moving].y = Math.sin(Math.PI * fraction) * 0.045;
  }
  const heelTilt: number = role === "Carina" ? 10 * ease(t / 0.6) * (1 - ease((t - 3) / 0.6)) : 0;
  if (role === "Carina") {
    const plant: number = ease((t - 6) / 0.65);
    goals.right.add(new THREE.Vector3(Math.cos(current.yaw), 0, -Math.sin(current.yaw)).multiplyScalar(0.10 * plant));
    goals.right.y = Math.sin(Math.PI * plant) * 0.025;
  }
  const readiness: number = ease((t - (role === "Carina" ? 6.1 : 4.1)) / 0.8);
  const forward: THREE.Vector3 = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), current.yaw);
  const right: THREE.Vector3 = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), current.yaw);
  const wrist: THREE.Vector3 = current.position.clone().addScaledVector(forward, 0.34).addScaledVector(right, 0.16);
  wrist.y = 1.03 + readiness * 0.17;
  const other: ReturnType<typeof root> = root(t, role === "Carina" ? "Harry" : "Carina");
  const aim: THREE.Vector3 = other.position.clone();
  aim.y = 0.96 + readiness * 0.28;
  const finger: { mcpFlexion: number; pipFlexion: number; dipFlexion: number } = { mcpFlexion: 65, pipFlexion: 65, dipFlexion: 35 };
  const pose: IAutoMovieHumanPose = { arms: { left: { elbow: { flexion: 12 } }, right: { shoulder: { flexion: 40, abduction: 10 }, elbow: { flexion: 65 }, hand: { thumb: { cmcOpposition: 35, mcpFlexion: 25 }, index: finger, middle: finger, ring: finger, little: finger } } } };
  if (role === "Carina") {
    const toe: { mtpFlexion: number } = { mtpFlexion: -5 - heelTilt };
    const foot: NonNullable<NonNullable<IAutoMovieHumanPose["legs"]>["left"]["foot"]> = { hallux: toe, second: toe, third: toe, fourth: toe, fifth: toe };
    pose.legs = { left: { foot }, right: { foot } };
  }
  return { ...current, pose, left: goals.left, right: goals.right, wrist, aim, footMode: role === "Harry" && t > 0 && t < 3.6 ? "rolling" : "ball", heelTilt };
}
