import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";

import { duelEvents } from "./duelEvents";
import { duelRescueActions as actions } from "./duelRescueActions";
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
    const progress: number = phase(at, actions.approach[person][0], actions.approach[person][1]);
    const position: THREE.Vector3 = first.position.clone();
    position.y = 0;
    const approach: THREE.Vector3 = meeting[person].clone();
    if (person === "Carina") approach.add(new THREE.Vector3(-0.12, 0, 0.08));
    position.lerp(approach, progress);
    if (person === "Carina") position.lerp(meeting.Carina, phase(at, ...actions.acrossFront));
    if (escapeEnabled) position.x -= actions.escape.westMetres * phase(at, ...actions.escape.action);
    if (person === "Carina" && escapeEnabled && recoveryEnabled) position.x -= 0.12 * phase(at, ...actions.recoveryStep);
    const facing: number = nearest(person === "Carina" ? Math.PI / 4 : Math.PI, first.yaw);
    return { position, yaw: first.yaw + (facing - first.yaw) * progress };
  }

  const placed: ReturnType<typeof path> = path(time, role);
  const approach: readonly [number, number] = actions.approach[role];
  const steps: number = actions.approach.steps[role];
  const approachStep: number = (approach[1] - approach[0]) / steps;
  let beforeEscape: ReturnType<typeof evaluateDuelSteps> = evaluateDuelSteps(time - approach[0], Array<number>(steps).fill(approachStep), "left", entry, reference, (at: number): ReturnType<typeof path> => path(at >= approachStep * (steps - 1) - 1e-8 ? approach[1] : approach[0] + at, role), role === "Carina" ? 0.045 : 0.025);
  const crossStep: number = (actions.acrossFront[1] - actions.acrossFront[0]) / 2;
  if (role === "Carina" && time >= actions.acrossFront[0]) beforeEscape = evaluateDuelSteps(time - actions.acrossFront[0], [crossStep, crossStep], "left", beforeEscape, reference, (_at: number): ReturnType<typeof path> => path(actions.acrossFront[1], role), 0.025);
  const escapeDuration: number = actions.escape.action[1] - actions.escape.action[0];
  const escapeStep: number = escapeDuration / actions.escape.steps;
  let feet: ReturnType<typeof evaluateDuelSteps> = time < duelEvents.escapeStart || !escapeEnabled ? beforeEscape : evaluateDuelSteps(time - duelEvents.escapeStart, Array<number>(actions.escape.steps).fill(escapeStep), role === "Carina" ? "right" : "left", beforeEscape, reference, (at: number): ReturnType<typeof path> => {
    // The leading foot lands at this side-step beat's end, then its partner follows.
    const beatDuration: number = 2 * escapeStep;
    const beatEnd: number = Math.min(escapeDuration, Math.ceil((at - 1e-8) / beatDuration) * beatDuration);
    return path(duelEvents.escapeStart + beatEnd, role);
  }, 0.04);
  const recoveryStep: number = (actions.recoveryStep[1] - actions.recoveryStep[0]) / 2;
  if (role === "Carina" && time >= actions.recoveryStep[0] && escapeEnabled && recoveryEnabled) feet = evaluateDuelSteps(time - actions.recoveryStep[0], [recoveryStep, recoveryStep], "left", feet, reference, (at: number): ReturnType<typeof path> => path(actions.recoveryStep[0] + at, role), 0.02);
  const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(placed.yaw), 0, -Math.sin(placed.yaw));
  const rightward: THREE.Vector3 = new THREE.Vector3(-Math.sin(placed.yaw), 0, -Math.cos(placed.yaw));
  const relative: THREE.Vector3 = entry.wrist.clone().sub(entry.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), placed.yaw - entry.yaw);
  const wrist: THREE.Vector3 = placed.position.clone().add(relative);
  const lower: THREE.Vector3 = placed.position.clone().addScaledVector(forward, 0.25).addScaledVector(rightward, 0.16);
  lower.y = 1.03;
  const drop: number = phase(time, actions.wandDrop[role][0], actions.wandDrop[role][1]);
  wrist.lerp(lower, drop);
  if (role === "Harry") wrist.y += 0.08 * phase(time, 25.3, 26) * (1 - drop);
  const shield: number = protectionEnabled ? phase(time, ...actions.shield.prepare) * (1 - (recoveryEnabled ? phase(time, ...actions.shield.recover) : 0)) : 0;
  if (role === "Carina") {
    const raised: THREE.Vector3 = placed.position.clone().add(new THREE.Vector3(0.304, 1.60, -0.20));
    wrist.lerp(raised, shield);
  }
  const other: ReturnType<typeof path> = path(time, role === "Carina" ? "Harry" : "Carina");
  const aim: THREE.Vector3 = other.position.clone();
  aim.y = 1.24;
  aim.lerp(wrist.clone().addScaledVector(forward, 0.7).add(new THREE.Vector3(0, -0.3, 0)), drop);
  if (role === "Carina") aim.lerp(wrist.clone().add(new THREE.Vector3(1, 1, 0)), shield);
  const low: number = phase(time, ...actions.lowerBody.prepare) * (1 - (recoveryEnabled ? phase(time, ...actions.lowerBody.recover) : 0));
  const forearmGrip: number = phase(time, ...actions.forearmGrip);
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
  const moving: boolean = time >= actions.approach[role][0] && time < actions.approach[role][1] || role === "Carina" && time >= actions.acrossFront[0] && time < actions.acrossFront[1] || escapeEnabled && time >= actions.escape.action[0] && time < actions.escape.action[1] || role === "Carina" && recoveryEnabled && time >= actions.recoveryStep[0] && time < actions.recoveryStep[1];
  return { ...placed, ...feet, wrist, aim, pose, footMode: moving ? "transfer" : "ball", heelTilt: 0, bodyWrist: 1, bodyAim: drop + shield * (1 - drop), reach: role === "Harry" ? phase(time, ...actions.wristReach.prepare) * (1 - phase(time, ...actions.wristReach.recover)) : 0, redirect: phase(time, ...actions.redirect.prepare) * (1 - phase(time, ...actions.redirect.recover)), forearmGrip, shoulder: phase(time, ...actions.shoulder.prepare) * (1 - (recoveryEnabled ? phase(time, ...actions.shoulder.recover) : 0)), shield };
}
