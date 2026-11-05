import * as THREE from "three";

import { motionPhase as phase } from "./motionPhase";
import { sampleFlight } from "./sampleFlight";
import { shaftPoint as point } from "./shaftPoint";
import { sampleReleasedBroom } from "./sampleReleasedBroom";
import { sampleBroomPath } from "./sampleBroomPath";

/**
 * Compose the opening pursuit and final recognition around the central rescue.
 * Source: screenplay#airborne-race, all six audiovisual intervals. The same
 * world state continues through camera cuts; output time is never remapped to
 * restart an actor or object.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reuses the central controller unchanged within23–53, with actual rig-derived left-hand boundary input for a continuous opening reach. Ending carries the same occupied broom/actors and continues independent prize/old-broom paths. Owns the complete60-second composition, not external generation or voice acceptance.
 * @evidence contracts/common.md#authoring-interface Finite seconds are clamped0–60. reachAtEntry is the actual Human left wrist relative to Harry's broom at23seconds, obtained from the same posed rig by the scene. Returned vectors are owned; callers still verify rendered contact, joins and crop.
 */
export function sampleWholeFlight(seconds: number, reachAtEntry: THREE.Vector3, calibration: Parameters<typeof sampleFlight>[1] = {}): ReturnType<typeof sampleFlight> {
  if (!Number.isFinite(seconds)) throw new Error("Whole-film time must be finite");
  const t: number = Math.max(0, Math.min(60, seconds));
  const frame: ReturnType<typeof sampleFlight> = sampleFlight(t, calibration);
  if (t >= 23 && t <= 53) {
    if (t >= 38 && t < 39.8) { frame.target.set(-10, 40.7, 8); frame.camera.set(0, 42.5, 5); }
    return frame;
  }
  if (t < 23) {
    frame.carinaBroom = sampleBroomPath("carina", t);
    frame.harryBroom = sampleBroomPath("old", t);
    const x: number = frame.harryBroom.position.x;
    const advance: number = frame.carinaBroom.position.x - x;
    frame.carina.pelvis.copy(point(frame.carinaBroom, 0.12, 0.08, 0));
    frame.harry.pelvis.copy(point(frame.harryBroom, 0.08 * phase(t, 20, 23), 0.08, 0));
    frame.carina.bank = 0; frame.harry.bank = 0;
    frame.carina.orientation.copy(frame.carinaBroom.quaternion);
    frame.harry.orientation.copy(frame.harryBroom.quaternion);
    frame.carina.wrists = { left: point(frame.carinaBroom, 0.30, 0.04, 0.035), right: point(frame.carinaBroom, 0.35, 0.04, -0.035) };
    const reaching: number = phase(t, 18, 23);
    frame.harry.wrists = {
      right: point(frame.harryBroom, 0.02, 0.04, -0.035),
      left: point(frame.harryBroom, 0.18, 0.04, 0.035).lerp(frame.harryBroom.position.clone().add(reachAtEntry), reaching),
    };
    frame.harry.pose.arms = { left: { shoulder: { flexion: 25 + 50 * reaching, abduction: 12 }, elbow: { flexion: 80 - 70 * reaching } }, right: frame.harry.pose.arms!.right };
    frame.harry.pose.neck = { cervical: { flexion: -20 } };
    frame.harry.pose.neck.cervical!.flexion = -20 * (1 - phase(t, 20, 23));
    frame.harry.pose.spine = { lumbar: { flexion: 26 + 10 * phase(t, 5.8, 7) * (1 - phase(t, 18, 23)) + Math.atan2(frame.harryBroom.acceleration.x, 9.81) * 25 }, thoracic: { flexion: 8 } };
    frame.carina.pose.spine = { lumbar: { flexion: 30 + 8 * phase(t, 3.5, 4.5) * (1 - phase(t, 6, 8)) + Math.atan2(frame.carinaBroom.acceleration.x, 9.81) * 25 }, thoracic: { flexion: 8 } };
    const taunt: number = phase(t, 3.5, 4) * (1 - phase(t, 5.8, 6.5));
    frame.carina.pose.neck = { cervical: { flexion: -25, rotation: -20 * taunt }, atlantoAxial: { rotation: -20 * taunt } };
    frame.carina.hands = { left: "shaft", right: "shaft" };
    frame.harry.hands = { left: t < 18 ? "shaft" : "open", right: "shaft" };
    frame.snitch.set(x + 1.7 + Math.max(0, advance) * 0.4, 32.3 + 0.15 * Math.sin(t * 1.4), frame.harryBroom.position.z + 0.4).lerp(new THREE.Vector3(x + 0.7, 32.42, -5.8), reaching);
    const closing: number = phase(t, 20, 23);
    const lag: number = 0.8 * phase(t, 8, 11) * (1 - phase(t, 14, 18));
    const middleZ: number = (frame.carinaBroom.position.z + frame.harryBroom.position.z) / 2;
    frame.target.set(x - 0.2 + Math.max(0, advance) * 0.6 - lag, 32.6 - 0.7 * closing, middleZ * (1 - closing) - 5.4 * closing);
    frame.camera.copy(frame.target).add(new THREE.Vector3(3.5, 2.2 - 0.85 * closing, 7 - 0.7 * closing));
    if (t < 1.2) { frame.target.set(-80, 30, 0); frame.camera.set(220, 150, -400); }
    else if (t < 2.5) { frame.target.set(-54, 34.5, 18); frame.camera.set(-30, 44, -17); }
    else if (t < 3.5) { frame.target.set(-65, 34.7, 32); frame.camera.set(-58, 37, 25); }
    else if (t >= 18 && t < 19.2) { frame.target.set(-48, 35, 16); frame.camera.set(-33, 40, -7); }
    else if (t >= 19.2 && t < 20.2) { frame.target.set(-100, 36.7, 36); frame.camera.set(-93, 39, 29); }
    frame.support = { left: t < 18 ? "old" : "none", right: "old", seated: true };
    return frame;
  }
  const delta: THREE.Vector3 = sampleBroomPath("carina", t).position.sub(frame.carinaBroom.position);
  frame.carinaBroom = sampleBroomPath("carina", t);
  frame.carina.pelvis.add(delta); frame.harry.pelvis.add(delta);
  for (const actor of [frame.carina, frame.harry]) {
    for (const side of ["left", "right"] as const) actor.wrists[side]?.add(delta);
  }
  frame.harryBroom = sampleReleasedBroom(t);
  frame.snitch.set(161.5 - 8 * (t - 35.8), 34 + 0.7 * (t - 35.8), -4.9 + 0.15 * (t - 35.8));
  const look: number = phase(t, 53, 53.7) * (1 - phase(t, 54.4, 55.1));
  const ease: number = phase(t, 58.5, 59.3);
  frame.harry.pose.spine = { lumbar: { flexion: 34 - 4 * ease, rotation: 4 * look }, thoracic: { flexion: 8 - 2 * ease, rotation: 25 * look } };
  frame.harry.pose.neck = { cervical: { flexion: -28, rotation: 20 * look }, atlantoAxial: { rotation: 40 * look } };
  const glance: number = phase(t, 55.5, 56) * (1 - phase(t, 56.3, 56.7));
  frame.carina.pose.neck = { cervical: { flexion: -25, rotation: 20 * glance }, atlantoAxial: { rotation: 30 * glance } };
  frame.carina.wrists.right = point(frame.carinaBroom, 0.35 + 0.08 * phase(t, 56.7, 57.5), 0.04, -0.035);
  frame.target.add(delta);
  frame.camera.copy(frame.target).add(new THREE.Vector3(3.5, 1.35, 6.3));
  if (t >= 53.1 && t < 53.8) {
    frame.camera.copy(frame.harry.pelvis).add(new THREE.Vector3(-1.7, 0.8, 0.15));
    frame.target.copy(frame.snitch);
  }
  return frame;
}
