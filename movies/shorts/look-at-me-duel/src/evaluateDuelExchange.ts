import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { duelEvents } from "./duelEvents";
import { evaluateDuelOpening } from "./evaluateDuelOpening";
import { evaluateDuelSteps } from "./evaluateDuelSteps";

/**
 * Author the continuing wrist escape, two-step retreat and deflection goals.
 *
 * @evidence contracts/common.md#implementation-and-ownership The9–25second plan inherits opening footprints. Harry follows, releases, then replants leading/closing feet before two backward beats. Shared events own phases and finite heel planting. Active front paths remain hard; heel orientation is expressive and no fixed8degree rise is required. Actual entry heel lines plant continuously. Prepared knees guide the initial body-height preference, not an exact required pelvis position. These are goals, not feasibility or continuity claims; actual Human/shoe/hand results must admit.
 * @evidence contracts/common.md#authoring-interface Supply finite scene seconds, role and matching actual shoe sole witnesses. Return world goals plus raised/head-relative, ordinary body-relative and outward-aim weights; the scene replaces the raised reference with its actual solved head clearance and follows the resulting bare-wrist point. Explicit knees guide posture independently of warm starts. No object or clock mutates here. Court axes are+X east,+Y up,-Z north.
 */
export function evaluateDuelExchange(seconds: number, role: "Carina" | "Harry", feet: { left: THREE.Vector3; right: THREE.Vector3 }): ReturnType<typeof evaluateDuelOpening> & { grip: number; wandContact: number; raised: number; raisedReference: THREE.Vector3; outward: number; bodyWrist: number; bodyAim: number; heelPlant: number } {
  if (!Number.isFinite(seconds)) throw new Error("Finite exchange scene seconds required");
  const time: number = Math.min(25, Math.max(9, seconds));
  const entry: ReturnType<typeof evaluateDuelOpening> = evaluateDuelOpening(9, role, feet);

  /** Smooth one bounded action phase while retaining fixed endpoints. */
  function phase(at: number, start: number, end: number): number {
    const value: number = Math.min(1, Math.max(0, (at - start) / (end - start)));
    return value * value * (3 - 2 * value);
  }

  /** Resolve the continuing root without a camera-dependent placement reset. */
  function path(at: number, person: "Carina" | "Harry"): { position: THREE.Vector3; yaw: number } {
    const carina: THREE.Vector3 = new THREE.Vector3(-0.65, 0, 0.30).lerp(new THREE.Vector3(-0.20, 0, -0.15), phase(at, 11.6, 12.6));
    if (person === "Carina") return { position: carina, yaw: 0.65 + Math.PI * 2 * phase(at, 12.7, duelEvents.turnEnd) };
    const harryEntry: THREE.Vector3 = new THREE.Vector3(-0.65 + Math.cos(0.65) * 2, 0, 0.30 - Math.sin(0.65) * 2);
    const harry: THREE.Vector3 = harryEntry.lerp(new THREE.Vector3(-0.03, 0, -0.22), phase(at, 9, 11.3));
    harry.lerp(new THREE.Vector3(0.40, 0, -0.50), phase(at, 11.7, 13));
    harry.lerp(new THREE.Vector3(1.40, 0, -1.35), phase(at, duelEvents.retreatStart, duelEvents.retreatEnd));
    const direction: THREE.Vector3 = carina.clone().sub(harry);
    const raw: number = Math.atan2(-direction.z, direction.x);
    const initial: number = 0.65 + Math.PI;
    const following: number = phase(at, 11.7, 12.7) * (1 - phase(at, duelEvents.gripReleaseEnd, duelEvents.armRecoveryEnd));
    return { position: harry, yaw: initial + Math.atan2(Math.sin(raw - initial), Math.cos(raw - initial)) + following * 1.2 };
  }

  /** Evaluate one immutable transfer schedule after its inherited predecessor. */
  function steps(at: number): { left: THREE.Vector3; right: THREE.Vector3 } {
    if (role === "Carina") {
      const advance: ReturnType<typeof evaluateDuelSteps> = evaluateDuelSteps(at - 11.6, [0.5, 0.5], "left", entry, feet, (local: number): ReturnType<typeof path> => {
        const placed: ReturnType<typeof path> = path(11.6 + local, role);
        placed.position.add(new THREE.Vector3(0.45, 0, -0.45).multiplyScalar(0.25));
        return placed;
      }, 0.035);
      if (at < 12.7) return advance;
      const transfer: number = (duelEvents.turnEnd - 12.7) / 6;
      return evaluateDuelSteps(at - 12.7, [transfer, transfer, transfer, transfer, transfer, transfer], "left", advance, feet, (local: number): ReturnType<typeof path> => path(12.7 + local, role), 0.035);
    }
    const approach: ReturnType<typeof evaluateDuelSteps> = evaluateDuelSteps(at - 9, [0.575, 0.575, 0.575, 0.575], "left", entry, feet, (local: number): ReturnType<typeof path> => path(9 + local, role));
    if (at < 11.7) return approach;
    const follow: ReturnType<typeof evaluateDuelSteps> = evaluateDuelSteps(at - 11.7, [1.3], "right", approach, feet, (local: number): ReturnType<typeof path> => path(11.7 + local, role), 0.035);
    if (at < duelEvents.gripReleaseEnd) return follow;
    const pivot: number = (duelEvents.armRecoveryEnd - duelEvents.gripReleaseEnd) / 2;
    const recovered: ReturnType<typeof evaluateDuelSteps> = evaluateDuelSteps(at - duelEvents.gripReleaseEnd, [pivot, pivot], "right", follow, feet, (local: number): ReturnType<typeof path> => path(duelEvents.gripReleaseEnd + local, role), 0.025);
    if (at < duelEvents.retreatStart) return recovered;
    const transfer: number = (duelEvents.retreatEnd - duelEvents.retreatStart) / 4;
    return evaluateDuelSteps(at - duelEvents.retreatStart, [transfer, transfer, transfer, transfer], "left", recovered, feet, (local: number): ReturnType<typeof path> => {
      const beatEnd: number = Math.min(4 * transfer, Math.ceil((local - 1e-8) / (2 * transfer)) * 2 * transfer);
      return path(duelEvents.retreatStart + beatEnd, role);
    }, 0.045);
  }

  const placement: ReturnType<typeof path> = path(time, role);
  const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(placement.yaw), 0, -Math.sin(placement.yaw));
  const ownRight: THREE.Vector3 = new THREE.Vector3(-Math.sin(placement.yaw), 0, -Math.cos(placement.yaw));
  const normalWrist: THREE.Vector3 = placement.position.clone().addScaledVector(forward, 0.34).addScaledVector(ownRight, 0.16);
  normalWrist.y = 1.20;
  const close: number = phase(time, role === "Harry" ? 10 : 9, 11.3);
  const release: number = phase(time, 14.7, duelEvents.gripReleaseEnd);
  const grip: number = phase(time, 10.9, 11.3) * (1 - release);
  const wandContact: number = phase(time, 10.3, 10.9) * (1 - phase(time, 11.3, 11.7));
  const caught: THREE.Vector3 = new THREE.Vector3(-0.40, 1.22, -0.01);
  const raisedReference: THREE.Vector3 = new THREE.Vector3(-0.20, 1.75, -0.15);
  const raised: number = phase(time, 11.7, 12.7) * (1 - phase(time, duelEvents.gripReleaseEnd, 17.2));
  const bodyWrist: number = Math.min(1, 1 - close + phase(time, role === "Carina" ? duelEvents.gripReleaseEnd : 11.7, role === "Carina" ? 17.2 : 12.7));
  const wrist: THREE.Vector3 = role === "Carina" ? entry.wrist.clone().lerp(caught, close) : normalWrist.clone().lerp(new THREE.Vector3(0, 1.22, -0.23), close);
  if (role === "Carina") {
    wrist.lerp(raisedReference, phase(time, 11.7, 12.7));
    wrist.lerp(normalWrist, phase(time, duelEvents.gripReleaseEnd, 17.2));
  } else wrist.lerp(normalWrist, phase(time, 11.7, 12.7));
  const other: ReturnType<typeof path> = path(time, role === "Carina" ? "Harry" : "Carina");
  const aim: THREE.Vector3 = other.position.clone();
  aim.y = 1.24;
  const touch: THREE.Vector3 = new THREE.Vector3(-0.106, 1.22, 0.051);
  aim.lerp(touch, wandContact);
  const outward: number = phase(time, 11.3, 12.1) * (1 - phase(time, 16.2, 17.2));
  let bodyAim: number = 0;
  if (role === "Carina") aim.lerp(raisedReference.clone().add(new THREE.Vector3(0, 1, 0)), outward);
  else {
    const following: number = phase(time, 11.7, 12.7) * (1 - phase(time, duelEvents.gripReleaseEnd, duelEvents.armRecoveryEnd));
    aim.lerp(wrist.clone().addScaledVector(forward, 0.7).addScaledVector(ownRight, 0.2).add(new THREE.Vector3(0, -0.3, 0)), following);
    bodyAim = following;
  }
  const sweep: number = role === "Harry" ? phase(time, 23.1, 23.5) * (1 - phase(time, 23.7, 24.2)) : 0;
  if (sweep > 0) {
    wrist.addScaledVector(ownRight, 0.10 * sweep);
    wrist.y += 0.14 * sweep;
    // He parries across the incoming shot; its outgoing magic turns toward the joint.
    aim.lerp(wrist.clone().addScaledVector(forward, 0.5).addScaledVector(ownRight, 0.5).add(new THREE.Vector3(0, 0.4, 0)), sweep);
    bodyAim = bodyAim * (1 - sweep) + sweep;
  }
  const finger: { mcpFlexion: number; pipFlexion: number; dipFlexion: number } = { mcpFlexion: 65, pipFlexion: 65, dipFlexion: 35 };
  const leftGrip: number = role === "Harry" ? grip : 0;
  const loose: number = 8 * phase(time, 9, 9.4);
  const leftFinger: { mcpFlexion: number; pipFlexion: number; dipFlexion: number } = { mcpFlexion: loose + leftGrip * 50, pipFlexion: loose + leftGrip * 70, dipFlexion: leftGrip * 35 };
  const pose: IAutoMovieHumanPose = { arms: { left: { elbow: { flexion: 12 }, hand: { index: leftFinger, middle: leftFinger, ring: leftFinger, little: leftFinger, thumb: { cmcOpposition: 35 * leftGrip, mcpFlexion: 20 * leftGrip } } }, right: { shoulder: { flexion: 40, abduction: 10 }, elbow: { flexion: 65 }, hand: { thumb: { cmcOpposition: 35, mcpFlexion: 25 }, index: finger, middle: finger, ring: finger, little: finger } } } };
  if (role === "Carina") {
    pose.legs = structuredClone(entry.pose.legs) ?? { left: {}, right: {} };
    // Prepared turn knees change the actual hips-height plan, not just IK preference.
    const knees: number = 5 + 20 * phase(time, 11.6, 12.7) * (1 - phase(time, 16.2, duelEvents.turnEnd));
    for (const side of ["left", "right"] as const) pose.legs[side].knee = { flexion: knees };
  }
  if (role === "Harry") {
    const following: number = phase(time, 11.7, 12.7) * (1 - phase(time, duelEvents.gripReleaseEnd, duelEvents.armRecoveryEnd));
    pose.neck = { atlantoAxial: { rotation: 40 * following }, cervical: { rotation: 20 * following } };
    const engaged: number = phase(time, 9, 9.6) * (1 - phase(time, duelEvents.retreatEnd, duelEvents.harryHeelsDown));
    const knees: number = 5 + 15 * engaged;
    pose.legs = { left: { knee: { flexion: knees } }, right: { knee: { flexion: knees } } };
  }
  const settleStart: number = role === "Carina" ? duelEvents.turnEnd : duelEvents.retreatEnd;
  const settleEnd: number = role === "Carina" ? duelEvents.carinaHeelsDown : duelEvents.harryHeelsDown;
  const transferring: boolean = role === "Carina" ? time >= 11.6 && time < settleStart : time < settleStart;
  const settling: boolean = time >= settleStart && time < settleEnd;
  return { ...placement, ...steps(time), wrist, aim, pose, footMode: settling ? "settling" : transferring ? "transfer" : "ball", heelTilt: 0, grip, wandContact, raised, raisedReference, outward, bodyWrist, bodyAim, heelPlant: phase(time, settleStart, settleEnd) };
}
