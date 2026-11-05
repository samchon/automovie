import * as THREE from "three";

import { evaluateExchange } from "./evaluateExchange";
import { evaluateTwoSteps } from "./evaluateTwoSteps";
import type { IPerformanceIntent } from "./IPerformanceIntent";

/**
 * Plan the second offer, released paper, shared aborted reach and offered space.
 *
 * @evidence contracts/common.md#implementation-and-ownership Consumes the prior36s ending without changing its root, feet or grip. The two short preparatory replants align the formerly staggered feet and add only10mm lateral width per side. Moderate knee preferences and the shared torso/head course are admitted against the actual supported body. Actual measured forehead contact owns stopping/recovery; the second28percent lean is a separate smaller aborted action. Empty-palm anchors and downward normal consume the real body-derived reach direction instead of the former carry anchor/fixed28cm goal. Harry then completes a0.5m backward two-step. Release remains requested and actually measured elsewhere.
 * @evidence contracts/common.md#authoring-interface Supply actor, absolute seconds, matching neutral sole references, measured forehead event and actual grounded-note centre. Returns authored intent only; unresolved contact prevents assembly. Hands approach opposite sides above the untouched paper. Harry's46.2–47.7s retreat retains the original fixedXZ hip path and exact0.5m translation; public support adjustsY only. Actual continuity still needs inspection. This module is not itself a rendered or accepted36–48s segment.
 */
export function evaluateSharedReach(person: "carina" | "harry", time: number, reference: { left: THREE.Vector3; right: THREE.Vector3 }, contact: { time: number; progress: number }, note: THREE.Vector3): IPerformanceIntent {
  const inherited: ReturnType<typeof evaluateExchange> = evaluateExchange(person, Math.min(time, 36), reference);
  const result: IPerformanceIntent = { ...inherited, gripWeight: person === "carina" ? 1 : 0, bendAmount: 0, requests: [] };
  if (time <= 36) return result;
  if (!Number.isFinite(contact.time) || contact.time <= 39 || contact.time >= 42.5 || !(contact.progress > 0 && contact.progress <= 1)) throw new Error("Shared reach needs its actually measured bounded forehead event");
  const start: ReturnType<typeof evaluateExchange> = evaluateExchange(person, 36, reference);
  const retry: number = ease((time - 36) / 1.1);
  const open: number = ease((time - 37.2) / 0.25);
  const widen: THREE.Vector3 = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), result.heading);
  const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(result.heading), 0, -Math.sin(result.heading));
  for (const side of ["left", "right"] as const) {
    const begin: number = side === "left" ? 38.2 : 38.6;
    const phase: number = Math.max(0, Math.min(1, (time - begin) / 0.4));
    result[side] = start[side].clone().addScaledVector(forward, (side === "left" ? 1 : -1) * 0.15 * ease(phase))
      .addScaledVector(widen, (side === "left" ? 1 : -1) * 0.01 * ease(phase)).setY(0.001 + 0.05 * Math.sin(Math.PI * phase) ** 2);
  }
  let bend: number = contact.progress * ease((time - 39) / (contact.time - 39));
  if (time >= contact.time) bend = contact.progress * (1 - ease((time - contact.time - 0.28) / (43.3 - contact.time - 0.28)));
  if (time >= 44) bend = 0.28 * contact.progress * ease((time - 44) / 0.35) * (1 - ease((time - 44.75) / 0.5));
  result.bendAmount = bend;
  result.position = start.position.clone().addScaledVector(forward, -0.11 * bend);
  const lookDown: number = ease((time - 37.4) / 0.5) * (1 - ease((time - 43.0) / 0.3));
  result.pose = {
    legs: { left: { knee: { flexion: 12 + (person === "carina" ? 18 : 22) * bend } }, right: { knee: { flexion: 12 + (person === "carina" ? 18 : 22) * bend } } },
    spine: { thoracic: { flexion: 25 * bend }, lumbar: { flexion: 45 * bend } },
    neck: { cervical: { flexion: 10 * lookDown * (1 - bend) - 20 * bend } },
    arms: structuredClone(start.pose.arms),
  };
  if (person === "carina" && time > 37.5) result.rightSeedFrom = { seconds: 37.5, blend: ease((time - 38.2) / 0.8) };
  if (person === "harry" && time >= 38.2) result.rightSeedFrom = { seconds: 36, blend: ease((time - 38.2) / 0.8) };
  if (time >= 38.2) {
    result.rightHandRole = "free";
    result.rightNormalPolicy = "preferred";
    const lower: number = ease((time - 38.2) / 0.8);
    result.pose.arms!.right.forearm = { pronation: person === "carina" ? 65.5125 + 4.4875 * lower : -75 + 145 * lower };
  }
  result.face = time >= contact.time && time < 43.3 ? "surprise" : "neutral";
  if (person === "carina") {
    result.gripWeight = 1 - open;
    if (time >= 37.2) result.requests.push("release");
    if (time < 38.2) { result.rightTarget = start.rightTarget!.clone().lerp(new THREE.Vector3(-1.64, 1.10, -0.06), retry); result.targetWeight = 1 - ease((time - 37.5) / 0.7); }
  }
  if (time >= 38.2 && time < 45.3) {
    delete result.rightTarget; delete result.targetWeight;
    const lower: number = ease((time - 38.2) / 0.8);
    result.rightReach = { towards: new THREE.Vector3(note.x + (person === "carina" ? 0.10 : -0.10), note.y, note.z), fraction: 0.82, weight: bend * (1 - ease((time - 44.75) / 0.55)) };
    result.rightNormal = new THREE.Vector3(0, -1, 0);
    result.rightNormalWeight = lower;
  } else if (time >= 38.2) { delete result.rightTarget; delete result.targetWeight; }
  if (person === "carina" && time >= 45.3) { result.rightNormal = new THREE.Vector3(0, -1, 0); result.rightNormalWeight = 1; }
  if (person === "harry" && time >= 45.3) {
    const hands: number = ease((time - 45.3) / 0.7);
    result.pose.arms = { left: { shoulder: { flexion: 50 * hands }, elbow: { flexion: 8 + 62 * hands }, wrist: { flexion: -35 * hands } },
      right: { ...start.pose.arms!.right, shoulder: { flexion: 20 + 30 * hands }, elbow: { flexion: 63 + 7 * hands }, wrist: { flexion: -35 * hands }, forearm: { pronation: 70 } } };
    result.rightHandRole = "free";
    result.rightNormal = new THREE.Vector3(0, -1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 * hands);
    result.rightNormalWeight = 1;
    const back: THREE.Vector3 = forward.clone().negate();
    const retreat: ReturnType<typeof evaluateTwoSteps> = evaluateTwoSteps(time - 46.2, 1.5, 0.5);
    result.position = start.position.clone().addScaledVector(back, retreat.root);
    for (const side of ["left", "right"] as const) result[side].addScaledVector(back, retreat[side].forward).setY(0.001 + retreat[side].lift);
  }
  return result;
}

/** Bounded cubic phase; no prior sampled state is retained. */
function ease(value: number): number { const t: number = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); }
