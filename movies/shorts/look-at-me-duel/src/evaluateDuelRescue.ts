import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { duelEvents } from "./duelEvents";
import type { evaluateDuelOpening } from "./evaluateDuelOpening";
import { evaluateDuelSteps } from "./evaluateDuelSteps";

import type { DuelRescueEntry } from "./DuelRescueEntry";

/**
 * Author25–48second approach, redirect, protective hold, two side-step beats and recovery.
 *
 * @evidence contracts/common.md#implementation-and-ownership Accepted entry feet/pose continue into per-halfstep approach landings and a separate across-front step into the measured contact formation. The wrist reach yields to a middle-forearm hold and shoulder press, then two westward leading/trailing beats. Hard real forefoot paths and full floor remain with the support consumer. These are goals, not contact or clearance admission; no future pair endpoint is substituted for the first four approach halfsteps.
 * @evidence contracts/common.md#authoring-interface Supply accepted entries, neutral sole witnesses, measured meeting formation and separate actual escape/protection/recovery permission flags. Defaults expose the planned action for isolated goal tests; the scene must provide measured events. Protection requires both complete bodies/props clear; recovery requires the cap/three-fragment outcome. Returns pure world/body/contact goals and instantiates no effects or unaccepted predecessor.
 */
export function evaluateDuelRescue(seconds: number, role: "Carina" | "Harry", entries: Readonly<Record<"Carina" | "Harry", DuelRescueEntry>>, reference: { left: THREE.Vector3; right: THREE.Vector3 }, meeting: Readonly<Record<"Carina" | "Harry", THREE.Vector3>>, escapeEnabled: boolean = true, protectionEnabled: boolean = true, recoveryEnabled: boolean = true): ReturnType<typeof evaluateDuelOpening> & { bodyWrist: number; bodyAim: number; reach: number; redirect: number; forearmGrip: number; shoulder: number; shield: number } {
  if (!Number.isFinite(seconds)) throw new Error("Finite rescue seconds required");
  const time: number = Math.min(48, Math.max(25, seconds));
  const entry: DuelRescueEntry = entries[role];

  /** Evaluate one explicit action phase without accumulated state. */
  function phase(at: number, start: number, end: number): number {
    const p: number = Math.max(0, Math.min(1, (at - start) / (end - start)));
    return p * p * (3 - 2 * p);
  }

  /** Preserve angle winding while choosing the nearest intended facing. */
  function nearest(angle: number, from: number): number {
    return from + Math.atan2(Math.sin(angle - from), Math.cos(angle - from));
  }

  /** Stage both continuing performers in the same world frame. */
  function path(at: number, person: "Carina" | "Harry"): { position: THREE.Vector3; yaw: number } {
    const first: DuelRescueEntry = entries[person];
    const progress: number = phase(at, person === "Carina" ? 30.5 : 31.2, person === "Carina" ? 34.8 : 33.2);
    const position: THREE.Vector3 = first.position.clone();
    position.y = 0;
    const approach: THREE.Vector3 = meeting[person].clone();
    if (person === "Carina") approach.add(new THREE.Vector3(-0.12, 0, 0.08));
    position.lerp(approach, progress);
    if (person === "Carina") position.lerp(meeting.Carina, phase(at, 36.0, 37.7));
    if (escapeEnabled) position.x -= 0.70 * phase(at, duelEvents.escapeStart, duelEvents.escapePlanted);
    if (person === "Carina" && escapeEnabled && recoveryEnabled) position.x -= 0.12 * phase(at, 44.6, 45.9);
    const facing: number = nearest(person === "Carina" ? Math.PI / 4 : Math.PI, first.yaw);
    return { position, yaw: first.yaw + (facing - first.yaw) * progress };
  }

  const placed: ReturnType<typeof path> = path(time, role);
  const approachStep: number = 4.3 / 6;
  let beforeEscape: ReturnType<typeof evaluateDuelSteps> = role === "Carina"
    ? evaluateDuelSteps(time - 30.5, [approachStep, approachStep, approachStep, approachStep, approachStep, approachStep], "left", entry, reference, (at: number): ReturnType<typeof path> => path(at >= approachStep * 5 - 1e-8 ? 34.8 : 30.5 + at, role), 0.045)
    : evaluateDuelSteps(time - 31.2, [1, 1], "left", entry, reference, (_at: number): ReturnType<typeof path> => path(33.2, role), 0.025);
  if (role === "Carina" && time >= 36.0) beforeEscape = evaluateDuelSteps(time - 36.0, [0.85, 0.85], "left", beforeEscape, reference, (_at: number): ReturnType<typeof path> => path(37.7, role), 0.025);
  let feet: ReturnType<typeof evaluateDuelSteps> = time < duelEvents.escapeStart || !escapeEnabled ? beforeEscape : evaluateDuelSteps(time - duelEvents.escapeStart, [0.45, 0.45, 0.45, 0.45], role === "Carina" ? "right" : "left", beforeEscape, reference, (at: number): ReturnType<typeof path> => {
    // The leading foot lands at this side-step beat's end, then its partner follows.
    const beatEnd: number = Math.min(1.8, Math.ceil((at - 1e-8) / 0.9) * 0.9);
    return path(duelEvents.escapeStart + beatEnd, role);
  }, 0.04);
  if (role === "Carina" && time >= 44.6 && escapeEnabled && recoveryEnabled) feet = evaluateDuelSteps(time - 44.6, [0.65, 0.65], "left", feet, reference, (at: number): ReturnType<typeof path> => path(44.6 + at, role), 0.02);
  const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(placed.yaw), 0, -Math.sin(placed.yaw));
  const rightward: THREE.Vector3 = new THREE.Vector3(-Math.sin(placed.yaw), 0, -Math.cos(placed.yaw));
  const relative: THREE.Vector3 = entry.wrist.clone().sub(entry.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), placed.yaw - entry.yaw);
  const wrist: THREE.Vector3 = placed.position.clone().add(relative);
  const lower: THREE.Vector3 = placed.position.clone().addScaledVector(forward, 0.25).addScaledVector(rightward, 0.16);
  lower.y = 1.03;
  const drop: number = phase(time, role === "Carina" ? 29.1 : 35.2, role === "Carina" ? 30.5 : 36.2);
  wrist.lerp(lower, drop);
  if (role === "Harry") wrist.y += 0.08 * phase(time, 25.3, 26) * (1 - drop);
  const shield: number = protectionEnabled ? phase(time, 40, duelEvents.shieldRaised) * (1 - (recoveryEnabled ? phase(time, duelEvents.shieldFade, 45.2) : 0)) : 0;
  if (role === "Carina") {
    const raised: THREE.Vector3 = placed.position.clone().add(new THREE.Vector3(0.304, 1.60, -0.20));
    wrist.lerp(raised, shield);
  }
  const other: ReturnType<typeof path> = path(time, role === "Carina" ? "Harry" : "Carina");
  const aim: THREE.Vector3 = other.position.clone();
  aim.y = 1.24;
  aim.lerp(wrist.clone().addScaledVector(forward, 0.7).add(new THREE.Vector3(0, -0.3, 0)), drop);
  if (role === "Carina") aim.lerp(wrist.clone().add(new THREE.Vector3(1, 1, 0)), shield);
  const low: number = phase(time, 36.7, 37.8) * (1 - (recoveryEnabled ? phase(time, 44.5, 46) : 0));
  const forearmGrip: number = phase(time, 36.2, 36.9);
  const pose: IAutoMovieHumanPose = structuredClone(entry.pose);
  pose.legs ??= { left: {}, right: {} };
  for (const side of ["left", "right"] as const) {
    const initial: number = entry.pose.legs?.[side].knee?.flexion ?? 5;
    pose.legs[side].knee = { flexion: initial + (5 + (role === "Harry" ? 20 : 5) * low - initial) * phase(time, 25, 25.5) };
  }
  if (role === "Harry") {
    pose.arms ??= { left: {}, right: {} };
    const finger: { mcpFlexion: number; pipFlexion: number; dipFlexion: number } = { mcpFlexion: 8 + 50 * forearmGrip, pipFlexion: 8 + 70 * forearmGrip, dipFlexion: 35 * forearmGrip };
    pose.arms.left.hand = { index: finger, middle: finger, ring: finger, little: finger, thumb: { cmcOpposition: 35 * forearmGrip, mcpFlexion: 20 * forearmGrip } };
  }
  pose.spine = { thoracic: { flexion: role === "Harry" ? 12 * low : 0 } };
  pose.neck = role === "Carina" ? { cervical: { flexion: -15 * phase(time, 26.8, 28.6) * (1 - phase(time, 30.3, 31.2)), rotation: 20 * phase(time, 33, 35) }, atlantoAxial: { rotation: 35 * phase(time, 33, 35) } } : { atlantoAxial: { rotation: 15 * phase(time, 32, 34) } };
  const moving: boolean = time >= (role === "Carina" ? 30.5 : 31.2) && time < (role === "Carina" ? 34.8 : 33.2) || role === "Carina" && time >= 36.0 && time < 37.7 || escapeEnabled && time >= duelEvents.escapeStart && time < duelEvents.escapePlanted || role === "Carina" && recoveryEnabled && time >= 44.6 && time < 45.9;
  return { ...placed, ...feet, wrist, aim, pose, footMode: moving ? "transfer" : "ball", heelTilt: 0, bodyWrist: 1, bodyAim: drop + shield * (1 - drop), reach: role === "Harry" ? phase(time, 33.9, 35.2) * (1 - phase(time, 36.1, 36.7)) : 0, redirect: phase(time, 35.1, 35.9) * (1 - phase(time, 36.3, 36.8)), forearmGrip, shoulder: phase(time, 36.9, 37.7) * (1 - (recoveryEnabled ? phase(time, 44.6, 46) : 0)), shield };
}
