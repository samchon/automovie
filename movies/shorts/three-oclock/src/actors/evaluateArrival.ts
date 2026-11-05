import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { evaluateRehearsal } from "./evaluateRehearsal";
import { evaluateTwoSteps } from "./evaluateTwoSteps";

/**
 * Carry the accepted rehearsal into the visible, initially unnoticed arrival.
 *
 * @evidence contracts/common.md#implementation-and-ownership Carina's0–13 action delegates the accepted evaluator unchanged. Her third0.6m approach holds for the exact invitation cue; Harry walks the actual west-gap route and turns before answering0.85m behind her. Fixed staggered foot goals distinguish support and swing; typed clinical seeds carry speaking, softer posture and one wrist tremble. These are goals, not admitted FK or a heard soundtrack.
 * @evidence contracts/common.md#authoring-interface Absolute scene seconds and this actor's neutral metre witnesses return one world root/heading, both world foot goals, clinical seed, face and visibility. Human+X forward maps to north at yawpi/2. This unit ends at25s before the conceal-and-turn; actual solver, rendered view and13sjoin must be inspected.
 */
export function evaluateArrival(person: "carina" | "harry", time: number, reference: { left: THREE.Vector3; right: THREE.Vector3 }): {
  position: THREE.Vector3; heading: number; left: THREE.Vector3; right: THREE.Vector3;
  pose: IAutoMovieHumanPose; face: "neutral" | "smirk" | "surprise" | "smile"; visible: boolean;
} {
  if (person === "carina") {
    if (time <= 13) return { ...evaluateRehearsal(time, reference), face: time >= 10.34 && time < 11.1 ? "neutral" : "smirk", visible: true };
    const state: ReturnType<typeof evaluateRehearsal> = evaluateRehearsal(Math.min(time - 13, 1.5), reference);
    const arm: number = ease((time - 13) / 1.5);
    state.pose = { head: { jaw: { opening: jaw(time, 20, 22.24) } }, spine: { thoracic: { flexion: 3 * arm } }, neck: { cervical: { flexion: 4 * arm } },
      arms: { left: { shoulder: { flexion: 3 * (1 - arm) }, elbow: { flexion: 8 } }, right: { shoulder: { flexion: 10 + 24 * arm }, elbow: { flexion: 12 + 46 * arm }, wrist: { radialDeviation: time >= 23.3 && time < 23.65 ? 3 * Math.sin((time - 23.3) / 0.35 * Math.PI * 2) : 0 } } } };
    return { ...state, face: time >= 23.3 ? "surprise" : "neutral", visible: true };
  }
  const start: THREE.Vector3 = new THREE.Vector3(-4.45, 0, 0.6);
  const destination: THREE.Vector3 = new THREE.Vector3(-1.8, 0, 0.4);
  const direction: THREE.Vector3 = destination.clone().sub(start).normalize();
  const distance: number = start.distanceTo(destination);
  const initialHeading: number = Math.atan2(-direction.z, direction.x);
  const progress: number = Math.max(0, Math.min(1, (time - 13.4) / 4.6));
  const cycle: number = Math.min(4, Math.floor(progress * 5));
  const step: ReturnType<typeof evaluateTwoSteps> = evaluateTwoSteps(progress * 5 - cycle, 1, distance / 5);
  const position: THREE.Vector3 = start.clone().addScaledVector(direction, cycle * distance / 5 + step.root);
  let heading: number = initialHeading;

  /** Place this body's measured witnesses in the current travel heading. */
  function feet(yaw: number): { left: THREE.Vector3; right: THREE.Vector3 } {
    const rotation: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    return { left: reference.left.clone().add(new THREE.Vector3(-0.15, 0, 0)).applyQuaternion(rotation).add(position).setY(0.001),
      right: reference.right.clone().add(new THREE.Vector3(0.15, 0, 0)).applyQuaternion(rotation).add(position).setY(0.001) };
  }
  let goals: ReturnType<typeof feet> = feet(initialHeading);
  const travelled: number = step.root;
  goals.left.addScaledVector(direction, step.left.forward - travelled).setY(0.001 + step.left.lift);
  goals.right.addScaledVector(direction, step.right.forward - travelled).setY(0.001 + step.right.lift);
  if (time >= 18) {
    position.copy(destination);
    goals = feet(initialHeading);
    const turn: number = Math.max(0, Math.min(1, time - 18));
    heading = initialHeading + (Math.PI / 2 - initialHeading) * ease(turn);
    for (let index: number = 0; index < 4; index++) {
      const phase: number = Math.max(0, Math.min(1, turn * 4 - index));
      const side: "left" | "right" = index % 2 === 0 ? "right" : "left";
      const from: number = initialHeading + (Math.PI / 2 - initialHeading) * Math.floor(index / 2) / 2;
      const to: number = initialHeading + (Math.PI / 2 - initialHeading) * (Math.floor(index / 2) + 1) / 2;
      if (phase > 0) goals[side].copy(feet(from + (to - from) * ease(phase))[side]).setY(0.001 + 0.025 * Math.sin(Math.PI * phase) ** 2);
    }
  }
  return { position, heading, ...goals, visible: time >= 13.4,
    pose: { head: { jaw: { opening: jaw(time, 22.5, 23.3) } }, arms: { left: { elbow: { flexion: 8 } }, right: { elbow: { flexion: 8 } } } }, face: "neutral" };
}

/** Smooth one bounded authored phase. */
function ease(value: number): number { const phase: number = Math.max(0, Math.min(1, value)); return phase * phase * (3 - 2 * phase); }

/** A visible speaking cue, not a claim of phoneme-aligned accepted speech. */
function jaw(time: number, start: number, end: number): number { return time >= start && time < end ? Math.round(Math.abs(Math.sin(time * 12)) * 3) * 4 : 0; }
