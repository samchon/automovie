import { AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import type { evaluateDuelOpening } from "./evaluateDuelOpening";
import type { DuelRescueEntry } from "./DuelRescueEntry";
import { evaluateDuelSteps } from "./evaluateDuelSteps";

/**
 * Author the carried forearm, look/release, step back and final English challenge.
 *
 * @evidence contracts/common.md#implementation-and-ownership Actual48second state supplies entry forefoot/wrist/pose. Harry pivots and shares a bounded trunk/neck glance toward the fallen stone, returns to Carina, follows her down-look and releases before she steps away. Carina holds her released arm briefly, transfers her feet once back into stance and raises the wand. Both retain one continuing prop/pose owner. Source goals still require actual support, forearm contact and view checks.
 * @evidence contracts/common.md#authoring-interface Supply finite seconds48–60, actual continuing entries and matching front-sole witnesses. Returned weights identify forearm hold/release and dialogue cue, not accepted speech. The controller preserves measured grip through release, while the authored left arm recovers to a loose pose instead of disappearing at zero weight. Black is the final presentation event at59.75. Whole preparation must inspect this actual ending and refuse unresolved frames before export.
 */
export function evaluateDuelEnding(seconds: number, role: "Carina" | "Harry", entries: Readonly<Record<"Carina" | "Harry", DuelRescueEntry>>, reference: { left: THREE.Vector3; right: THREE.Vector3 }): ReturnType<typeof evaluateDuelOpening> & { bodyWrist: number; bodyAim: number; forearmGrip: number; line: string; black: boolean } {
  if (!Number.isFinite(seconds)) throw new Error("Finite ending seconds required");
  const time: number = Math.min(60, Math.max(48, seconds));
  const entry: DuelRescueEntry = entries[role];

  /** Resolve a smooth bounded performance beat. */
  function phase(at: number, start: number, end: number): number {
    const p: number = Math.max(0, Math.min(1, (at - start) / (end - start)));
    return p * p * (3 - 2 * p);
  }

  const glance: number = phase(time, 48, 48.6) * (1 - phase(time, 49, 49.7));
  const back: number = phase(time, 53.2, 54.7);
  const finalCarina: THREE.Vector3 = entries.Carina.position.clone().add(new THREE.Vector3(-0.45, 0, 0.25));
  const direction: THREE.Vector3 = (role === "Carina" ? entries.Harry.position.clone().sub(finalCarina) : finalCarina.clone().sub(entries.Harry.position));
  const desired: number = Math.atan2(-direction.z, direction.x);
  const facing: number = entry.yaw + Math.atan2(Math.sin(desired - entry.yaw), Math.cos(desired - entry.yaw));

  /** Keep footprints/root choreography on the same local step clock. */
  function path(at: number): { position: THREE.Vector3; yaw: number } {
    const p: number = phase(at, 53.2, 54.7);
    const looking: number = phase(at, 48, 48.6) * (1 - phase(at, 49, 49.7));
    const position: THREE.Vector3 = entry.position.clone();
    position.y = 0;
    if (role === "Carina") position.add(new THREE.Vector3(-0.45 * p, 0, 0.25 * p));
    return { position, yaw: entry.yaw + (facing - entry.yaw) * p + (role === "Harry" ? Math.PI / 2 * looking : 0) };
  }

  const placed: ReturnType<typeof path> = path(time);
  let feet: { left: THREE.Vector3; right: THREE.Vector3 } = role === "Carina" ? evaluateDuelSteps(time - 53.2, [0.75, 0.75], "right", entry, reference, (at: number): ReturnType<typeof path> => path(53.2 + at), 0.025) : evaluateDuelSteps(time - 48, [0.3, 0.3], "left", entry, reference, (at: number): ReturnType<typeof path> => path(48 + at), 0.025);
  if (role === "Harry" && time >= 49) feet = evaluateDuelSteps(time - 49, [0.35, 0.35], "left", feet, reference, (at: number): ReturnType<typeof path> => path(49 + at), 0.025);
  const relative: THREE.Vector3 = entry.wrist.clone().sub(entry.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), placed.yaw - entry.yaw);
  const wrist: THREE.Vector3 = placed.position.clone().add(relative);
  const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(placed.yaw), 0, -Math.sin(placed.yaw));
  const rightward: THREE.Vector3 = new THREE.Vector3(-Math.sin(placed.yaw), 0, -Math.cos(placed.yaw));
  const raise: number = phase(time, role === "Carina" ? 54.7 : 57.6, role === "Carina" ? 55.4 : 58.5);
  const ready: THREE.Vector3 = placed.position.clone().addScaledVector(forward, 0.34).addScaledVector(rightward, 0.16);
  ready.y = 1.20;
  wrist.lerp(ready, raise);
  const aim: THREE.Vector3 = wrist.clone().addScaledVector(forward, 0.7).add(new THREE.Vector3(0, -0.3, 0));
  const opponent: THREE.Vector3 = role === "Carina" ? entries.Harry.position.clone() : entries.Carina.position.clone().lerp(finalCarina, back);
  opponent.y = 1.24;
  aim.lerp(opponent, raise);
  const down: number = phase(time, 51.5, 52) * (1 - phase(time, 52.5, 53.2));
  const pose: IAutoMovieHumanPose = structuredClone(entry.pose);
  const forearmGrip: number = 1 - phase(time, 52.2, 52.7);
  if (role === "Harry") {
    pose.arms ??= { left: {}, right: {} };
    const loose: IAutoMovieHumanPose = { ...entry.pose, arms: { right: entry.pose.arms?.right ?? {}, left: { elbow: { flexion: 12 } } } };
    pose.arms.left = AutoMovieHumanRigControls.blend(entry.pose, loose, phase(time, 52.2, 53.2)).arms?.left ?? {};
    const finger: { mcpFlexion: number; pipFlexion: number; dipFlexion: number } = { mcpFlexion: 8 + 50 * forearmGrip, pipFlexion: 8 + 70 * forearmGrip, dipFlexion: 35 * forearmGrip };
    pose.arms.left.hand = { index: finger, middle: finger, ring: finger, little: finger, thumb: { cmcOpposition: 35 * forearmGrip, mcpFlexion: 20 * forearmGrip } };
  }
  pose.legs = { left: { knee: { flexion: 5 } }, right: { knee: { flexion: 5 } } };
  pose.spine = { thoracic: { rotation: role === "Harry" ? -40 * glance : 0 } };
  pose.neck = role === "Harry" ? { atlantoAxial: { rotation: -35 * glance + 15 * (1 - glance) * (1 - back) }, cervical: { rotation: -15 * glance, flexion: 35 * glance + 35 * down }, atlantoOccipital: { flexion: 10 * glance + 10 * down } } : { atlantoAxial: { rotation: 35 * (1 - back) * (1 - down) }, cervical: { rotation: 20 * (1 - back) * (1 - down), flexion: 35 * down }, atlantoOccipital: { flexion: 10 * down } };
  const transferring: boolean = role === "Harry" ? time < 49.7 : time >= 53.2 && time < 54.7;
  return { ...placed, ...feet, pose, wrist, aim, footMode: transferring ? "transfer" : "ball", heelTilt: role === "Harry" ? 5 * glance : 0, bodyWrist: 1, bodyAim: 1 - raise, forearmGrip, line: time >= 49.8 && time < 51.4 ? "Did you just save me?" : time >= 55.2 && time < 57.6 ? "Look at me this time." : "", black: time >= 59.75 };
}
