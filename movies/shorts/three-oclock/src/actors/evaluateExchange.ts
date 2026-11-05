import * as THREE from "three";

import { evaluateArrival } from "./evaluateArrival";

/**
 * Continue from the accepted arrival into concealment, a turn and a withdrawn offer.
 *
 * @evidence contracts/common.md#implementation-and-ownership Preserves the complete0–25 planner and starts at its exact root, heading and two world foot goals. Six alternating60degree transfers bring Carina around; body yaw follows their mean, rather than disagreeing with both feet.90mm swing goals leave room for the65mm shoes. Harry remains planted, looks toward the hidden paper and opens his upward receiving hand before her hover/withdrawal. Goals still require actual full-foot/hand/paper admission. Carina retains ownership through36s.
 * @evidence contracts/common.md#authoring-interface Actor identity, absolute seconds and matching neutral foot witnesses return the inherited staging plus an optional right-hand target/weight. Arm seeds retain the physical hand grip separately; the actual performer fits that same bone-bound anchor and reports residuals. This unit ends before the second attempt/drop.
 */
export function evaluateExchange(person: "carina" | "harry", time: number, reference: { left: THREE.Vector3; right: THREE.Vector3 }): ReturnType<typeof evaluateArrival> & { rightTarget?: THREE.Vector3; targetWeight?: number } {
  if (time <= 25) return evaluateArrival(person, time, reference);
  const state: ReturnType<typeof evaluateArrival> = evaluateArrival(person, 25, reference);
  const result: ReturnType<typeof evaluateExchange> = { ...state };
  if (person === "carina") {
    const turn: number = Math.max(0, Math.min(1, (time - 25.25) / 1.55));
    const yaw: { left: number; right: number } = { left: 0, right: 0 };
    for (let index: number = 0; index < 6; index++) {
      const phase: number = Math.max(0, Math.min(1, turn * 6 - index));
      if (phase === 0) continue;
      const side: "left" | "right" = index % 2 === 0 ? "right" : "left";
      yaw[side] = -Math.PI * (Math.floor(index / 2) + ease(phase)) / 3;
      result[side] = state[side].clone().sub(state.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw[side]).add(state.position).setY(0.001 + 0.09 * Math.sin(Math.PI * phase) ** 2);
    }
    result.heading = Math.PI / 2 + (yaw.left + yaw.right) / 2;
    const conceal: number = ease((time - 25) / 0.3);
    result.pose = { head: { jaw: { opening: jaw(time, 27, 28.28) } }, arms: {
      left: { elbow: { flexion: 8 } }, right: { shoulder: { flexion: 34 - 62 * conceal }, elbow: { flexion: 58 - 38 * conceal } },
    } };
    result.face = time < 29 ? "surprise" : "neutral";
    if (time >= 30) {
      const offer: number = ease((time - 30) / 2);
      const withdraw: number = ease((time - 32.6) / 1.4);
      result.pose.arms!.right.shoulder = { flexion: -28 + 62 * offer - 14 * withdraw };
      result.pose.arms!.right.elbow = { flexion: 20 + 45 * offer + 40 * withdraw };
      result.rightTarget = new THREE.Vector3(-1.8, 1.18, 0).lerp(new THREE.Vector3(-1.68, 1.16, -0.22), withdraw);
      result.targetWeight = offer;
    }
  } else {
    const offer: number = ease((time - 29) / 1);
    const glance: number = ease((time - 28.3) / 0.4) * (1 - ease((time - 29.7) / 0.6));
    result.pose = { neck: { cervical: { flexion: 14 * glance } }, arms: { left: { elbow: { flexion: 8 } }, right: {
      shoulder: { flexion: 20 * offer }, elbow: { flexion: 8 + 55 * offer }, forearm: { pronation: -75 * offer },
      hand: { index: { mcpFlexion: 0, pipFlexion: 0, dipFlexion: 0, mcpAbduction: 5 * offer }, middle: { mcpFlexion: 0, pipFlexion: 0, dipFlexion: 0 },
        ring: { mcpFlexion: 0, pipFlexion: 0, dipFlexion: 0, mcpAbduction: 5 * offer }, little: { mcpFlexion: 0, pipFlexion: 0, dipFlexion: 0, mcpAbduction: 10 * offer },
        thumb: { cmcFlexion: -12 * offer, cmcAbduction: 0, cmcOpposition: 0, mcpFlexion: 0, ipFlexion: 0 } },
    } } };
    if (time >= 29) { result.rightTarget = new THREE.Vector3(-1.8, 1.06, 0); result.targetWeight = offer; }
  }
  return result;
}

/** Smooth a bounded performance phase without state from a previous sample. */
function ease(value: number): number { const t: number = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); }

/** Coarse visible speech cue; no phonetic or heard-soundtrack claim. */
function jaw(time: number, start: number, end: number): number { return time >= start && time < end ? Math.round(Math.abs(Math.sin(time * 12)) * 3) * 4 : 0; }
