import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { evaluateTwoSteps } from "./evaluateTwoSteps";

/**
 * Evaluate Carina's continuous opening rehearsal in the courtyard world frame.
 *
 * @evidence contracts/common.md#implementation-and-ownership Owns the opening approach/return phases and expressive clinical seed. Walking foot goals derive from measured neutral witnesses; turns pivot around the left world witness while the right foot moves around it. It plans motion only; the separate Human fitter must establish actual skin clearance and support. The note remains Carina's through this interval.
 * @evidence contracts/common.md#authoring-interface time is absolute scene seconds; neutralFeet are this body's matching evaluator-frame witnesses. Returns absolute world root heading, independent world foot goals and clinical seed. Human's +X forward is rotated into north (-Z) by heading pi/2. The first 13 seconds end facing the bench at the original entry position.
 */
export function evaluateRehearsal(time: number, neutralFeet: { left: THREE.Vector3; right: THREE.Vector3 }): {
  position: THREE.Vector3;
  heading: number;
  left: THREE.Vector3;
  right: THREE.Vector3;
  pose: IAutoMovieHumanPose;
} {
  const t: number = Math.max(0, Math.min(13, time));
  const north: number = Math.PI / 2;
  const position: THREE.Vector3 = new THREE.Vector3(-1.8, 0, 0.15);
  let heading: number = north;
  let feet: { left: THREE.Vector3; right: THREE.Vector3 } = worldFeet(position, heading);

  /** Map actual neutral foot witnesses into one whole-character scene frame. */
  function worldFeet(at: THREE.Vector3, yaw: number): { left: THREE.Vector3; right: THREE.Vector3 } {
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const left: THREE.Vector3 = neutralFeet.left.clone().add(new THREE.Vector3(-0.15, 0, 0)).applyQuaternion(rotation).add(at);
    const right: THREE.Vector3 = neutralFeet.right.clone().add(new THREE.Vector3(0.15, 0, 0)).applyQuaternion(rotation).add(at);
    return { left, right };
  }

  /** Consume an action's exact end before the next action starts. */
  function walk(start: number, end: number): void {
    if (t < start) return;
    const plan: ReturnType<typeof evaluateTwoSteps> = evaluateTwoSteps(t - start, end - start, 0.6);
    const direction: THREE.Vector3 = new THREE.Vector3(Math.cos(heading), 0, -Math.sin(heading));
    const initial: THREE.Vector3 = position.clone();
    feet = worldFeet(initial, heading);
    feet.left.addScaledVector(direction, plan.left.forward).setY(0.001 + plan.left.lift);
    feet.right.addScaledVector(direction, plan.right.forward).setY(0.001 + plan.right.lift);
    position.addScaledVector(direction, plan.root);
  }

  /** Keep the left support point fixed through the authored turn. */
  function turn(start: number, end: number, delta: number): void {
    if (t < start) return;
    const phase: number = Math.max(0, Math.min(1, (t - start) / (end - start)));
    const angle: number = delta * phase * phase * (3 - 2 * phase);
    const pivot: THREE.Vector3 = feet.left.clone();
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    position.sub(pivot).applyQuaternion(rotation).add(pivot);
    feet.right.sub(pivot).applyQuaternion(rotation).add(pivot);
    feet.right.y = 0.001 + 0.035 * Math.sin(Math.PI * phase) ** 2;
    heading += angle;
  }

  walk(0, 1.5);
  turn(4.1, 4.45, Math.PI);
  walk(4.45, 5.6);
  turn(5.6, 6.0, -Math.PI);
  walk(6.0, 7.3);
  turn(11.1, 11.5, Math.PI);
  walk(11.5, 12.6);
  turn(12.6, 13, -Math.PI);
  const lift: number = t < 1.2 ? smooth(t / 1.2) : t < 3.74 ? 1 : t < 4.1 ? 1 - smooth((t - 3.74) / 0.36)
    : t < 6 ? 0 : t < 7.3 ? smooth((t - 6) / 1.3) : t < 10.34 ? 1 : t < 11.1 ? 1 - smooth((t - 10.34) / 0.76) : 0;
  const discouraged: number = t >= 10.34 && t < 11.1 ? Math.sin(Math.PI * (t - 10.34) / 0.76) : 0;
  const speech: boolean = (t >= 1.5 && t < 3.74) || (t >= 7.3 && t < 10.34);
  const jaw: number = speech ? Math.round(Math.abs(Math.sin(t * 12)) * 3) * 4 : 0;
  const pose: IAutoMovieHumanPose = { head: { jaw: { opening: jaw } }, spine: { thoracic: { flexion: 4 * discouraged } }, neck: { cervical: { flexion: 6 * discouraged } }, arms: { left: { shoulder: { flexion: 3 }, elbow: { flexion: 8 } },
    right: { shoulder: { flexion: 10 + 38 * lift }, elbow: { flexion: 12 + 56 * lift }, forearm: { pronation: 75 } } } };
  return { position, heading, left: feet.left, right: feet.right, pose };
}

/** Clamp an authored interpolation phase before cubic easing. */
function smooth(value: number): number {
  const phase: number = Math.max(0, Math.min(1, value));
  return phase * phase * (3 - 2 * phase);
}
