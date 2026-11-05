import type { IAutoMovieHumanPose } from "@automovie/human";
import * as THREE from "three";
import { motionPhase as phase } from "./motionPhase";
import { shaftPoint as point } from "./shaftPoint";
import { sampleReleasedBroom } from "./sampleReleasedBroom";
import { sampleBroomPath } from "./sampleBroomPath";

/** One actor's absolute metric pose, wrist targets and contact ownership. */
interface Actor {
  pelvis: THREE.Vector3;
  pose: IAutoMovieHumanPose;
  wrists: Partial<Record<"left" | "right", THREE.Vector3>>;
  bank: number;
  orientation: THREE.Quaternion;
  hands: Partial<Record<"left" | "right", "open" | "shaft" | "fist">>;
  supports?: Parameters<ReturnType<typeof import("./createRider").createRider>["update"]>[4];
}
/** A rigid broom transform and the fixed local shaft-contact frame. */
type Broom = ReturnType<typeof sampleBroomPath>;
/** Actual frame state consumed by the production scene. */
interface Frame {
  carina: Actor; harry: Actor; carinaBroom: Broom; harryBroom: Broom;
  snitch: THREE.Vector3; camera: THREE.Vector3; target: THREE.Vector3;
  support: { left: "old" | "none" | "new"; right: "old" | "moving" | "new"; seated: boolean };
  dynamics: { hangingLength: number; pendulumAngle: number; newLoadShare: number };
}

/**
 * Evaluate the central hanging/transfer/recovery segment from fixed time.
 * Source: screenplay/snitch-before-you.md#airborne-race, One hand 23–35,
 * Make room 35–43 and Across 43–53. World +X is east, +Y up, +Z north;
 * setting north-y is therefore world-z. No free fall is invented while Harry
 * retains a supported shaft. Magic broom paths are authored, not rigid physics.
 *
 * @evidence contracts/common.md#implementation-and-ownership Owns the central segment clock, support transitions and Human clinical pose targets. Left new contact precedes old-right release; sampleReleasedBroom owns the separate upper-right glide. The scene consumes these same transforms and composes the opening and ending through sampleWholeFlight.
 * @evidence contracts/common.md#authoring-interface Finite seconds are clamped to the implemented 23–53 second segment. Returns owned vectors/pose records, with world-metre wrist targets rather than fabricated solved contacts. Consumer must inspect actual Human IK residuals and moving pixels.
 */
export function sampleFlight(seconds: number, calibration: { hangingLength?: number; leftAt40?: THREE.Vector3 } = {}): Frame {
  if (!Number.isFinite(seconds)) throw new Error("Flight time must be finite");
  const t: number = Math.max(23, Math.min(53, seconds));
  const carinaBroom: Broom = sampleBroomPath("carina", t);
  const approach: number = phase(t, 35, 40.5);
  // Recover the common eastward travel independently of the releasing broom.
  const u: number = Math.max(0, Math.min(1, (t - 35) / 5.5));
  const exactApproach: number = u ** 3 * (10 - 15 * u + 6 * u * u);
  const x: number = carinaBroom.position.x + 1.1 - 1.6 * exactApproach;
  const slip: number = phase(t, 23, 25.5);
  const release: number = phase(t, 44.3, 45.2);
  const mount: number = phase(t, 45.2, 50.5);
  const load: number = phase(t, 43, 44.3);
  const recover: number = phase(t, 49.5, 53);
  const thighLift: number = phase(t, 45.5, 47);
  const thighSettle: number = phase(t, 48, 50.5);
  const harryBroom: Broom = sampleReleasedBroom(t);
  const hanging: number = slip * (1 - phase(t, 40, 45));
  const hangingLength: number = calibration.hangingLength ?? 0.8;
  if (!(hangingLength > 0.2 && hangingLength < 2)) throw new Error("Invalid measured hanging proxy length");
  const damping: number = 0.25;
  const omega: number = Math.sqrt(9.81 / hangingLength - damping * damping);
  const tau: number = Math.max(0, t - 25.5);
  const angle: number = 0.09 * Math.exp(-damping * tau) * (Math.cos(omega * tau) + damping / omega * Math.sin(omega * tau));
  const swing: number = hangingLength * Math.sin(angle) * hanging;
  const creep: number = 0.10 * phase(t, 28, 35) * (1 - mount);
  const harryPelvis: THREE.Vector3 = new THREE.Vector3(
    x + 0.08 * (1 - slip) + creep + swing + 0.02 * mount,
    32.28 - 1.16 * slip + hangingLength * (1 - Math.cos(angle)) * hanging + (carinaBroom.position.y + 0.08 - 31.12) * mount,
    -6 + 0.24 * slip + (carinaBroom.position.z + 5.76) * phase(t, 44.3, 46.5),
  );
  const rearSeat: THREE.Vector3 = point(carinaBroom, -0.48, 0.08, 0);
  harryPelvis.x += (rearSeat.x - (x + 0.02)) * mount;
  harryPelvis.y += (rearSeat.y - (carinaBroom.position.y + 0.08)) * mount;
  const carina: Actor = {
    pelvis: point(carinaBroom, 0.12, 0.08, 0),
    pose: seated(30 + 8 * load * (1 - recover) + 0.5 * Math.atan2(carinaBroom.acceleration.x, 9.81) * 180 / Math.PI),
    wrists: {
      right: point(carinaBroom, 0.35, 0.04, -0.035),
      left: point(carinaBroom, 0.30, 0.04, 0.035),
    }, bank: 0, orientation: carinaBroom.quaternion.clone(), hands: { left: "shaft", right: "shaft" },
  };
  const harryPose: IAutoMovieHumanPose = {
    ...seated(26 * (1 - slip) + 34 * mount + 25 * Math.sin(Math.PI * mount)),
    legs: {
      left: { hip: { flexion: 78 * (1 - slip) + 125 * thighLift - 47 * thighSettle + hanging * (6 + 5 * Math.sin(t * 2)), abduction: 25 * (1 - slip) + 40 * thighLift - 15 * thighSettle, rotation: 40 * thighLift * (1 - thighSettle) }, knee: { flexion: 95 * (1 - slip) + 125 * thighLift - 30 * thighSettle + hanging * (12 + 8 * Math.sin(t * 2)) } },
      right: { hip: { flexion: 78 * (1 - slip) + 78 * mount + hanging * (6 - 5 * Math.sin(t * 2)), abduction: 25 * (1 - slip) + 25 * mount }, knee: { flexion: 95 * (1 - slip) + 90 * mount + hanging * (12 - 8 * Math.sin(t * 2)) } },
    },
    arms: {
      left: { shoulder: { flexion: 25 + 50 * (1 - phase(t, 23, 25.5)) + 115 * Math.sin(Math.PI * phase(t, 26.5, 29.5)), abduction: 12 }, elbow: { flexion: 80 - 70 * (1 - phase(t, 23, 25.5)) - 70 * Math.sin(Math.PI * phase(t, 26.5, 29.5)) } },
      right: { shoulder: { flexion: 65 + 95 * slip * (1 - release) }, elbow: { flexion: 55 * (1 - slip) + 15 * slip + 40 * release } },
    },
    neck: { cervical: { flexion: 20 * phase(t, 27, 30) * (1 - phase(t, 33, 35)) - 28 * phase(t, 49.5, 53) } },
  };
  carina.pose.neck = { cervical: { flexion: -25, rotation: -20 * phase(t, 33.4, 35) * (1 - phase(t, 43, 47)) }, atlantoAxial: { rotation: -25 * phase(t, 33.4, 35) * (1 - phase(t, 43, 47)) } };
  const oldRight: THREE.Vector3 = point(harryBroom, 0.02 + 0.12 * phase(t, 28, 35), 0.04, -0.035);
  const seatedGrip: number = 0.1 * phase(t, 48.5, 50.5);
  const newLeft: THREE.Vector3 = point(carinaBroom, -0.20 - seatedGrip, 0.04, -0.005);
  const newRight: THREE.Vector3 = point(carinaBroom, -0.08 - seatedGrip, 0.04, -0.025);
  const harry: Actor = {
    pelvis: harryPelvis, pose: harryPose,
    wrists: { right: oldRight.clone().lerp(newRight, release) },
    bank: -0.55 * Math.sin(Math.PI * mount),
    orientation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle * hanging).slerp(carinaBroom.quaternion, mount),
    hands: { left: t < 43 ? "open" : "shaft", right: t >= 44.3 && t < 45.2 ? "open" : "shaft" },
  };
  const bearing: number = phase(t, 45.5, 46.5) * (1 - phase(t, 48, 49));
  const forearmBearing: number = phase(t, 45.5, 46.5) * (1 - phase(t, 46.7, 47));
  if (bearing > 0) harry.supports = { shaftQuaternion: carinaBroom.quaternion, supports: [
    { name: "lower-rib surface", bone: "chest", localPoint: [0.165, 0, 0], position: point(carinaBroom, -0.10, 0.03, 0), region: "body", amount: bearing },
  ] };
  if (forearmBearing > 0) harry.supports!.supports!.push({ name: "left forearm hook", bone: "leftLowerArm", towards: "leftHand", position: point(carinaBroom, -0.34, 0.058, 0.046), region: "left", amount: forearmBearing, slideOnShaft: true });
  if (t >= 40) {
    const start: THREE.Vector3 = calibration.leftAt40?.clone().add(new THREE.Vector3(x, 0, 0)) ?? new THREE.Vector3(x + 0.2, 31.15, -5.56);
    harry.wrists.left = start.lerp(newLeft, phase(t, 40, 43));
  }
  const snitch: THREE.Vector3 = new THREE.Vector3(x - 0.4, 32.9, -5.05);
  if (t < 35) {
    const offer: number = phase(t, 30.5, 32) * (1 - phase(t, 33.7, 35));
    const hand: THREE.Vector3 = point(carinaBroom, 0.55, 0.52, 0.13);
    carina.wrists.left!.lerp(hand, offer);
    carina.hands.left = offer > 0.1 ? "open" : "shaft";
    snitch.set(x + 0.7, 32.42, -5.8).lerp(hand.clone().add(new THREE.Vector3(0.26, 0.03, 0)), phase(t, 25, 30));
  } else if (t < 35.8) {
    const escape: THREE.CubicBezierCurve3 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(164.71, 32.75, -5.02), new THREE.Vector3(166.5766667, 32.75, -5.02),
      new THREE.Vector3(163.6333333, 33.8133333, -4.94), new THREE.Vector3(161.5, 34, -4.9),
    );
    snitch.copy(escape.getPoint((t - 35) / 0.8));
  } else snitch.set(161.5 - 8 * (t - 35.8), 34 + 0.7 * (t - 35.8), -4.9 + 0.15 * (t - 35.8));
  const choiceView: number = phase(t, 30.5, 32) * (1 - phase(t, 34, 35));
  const contactView: number = phase(t, 42, 43) * (1 - phase(t, 48, 50));
  const target: THREE.Vector3 = new THREE.Vector3(x - 0.2 + 0.75 * approach, 31.9 - 0.15 * load + 0.5 * recover, -5.4);
  const approachView: number = phase(t, 35, 37) * (1 - phase(t, 41, 43));
  return {
    carina, harry, carinaBroom, harryBroom, snitch,
    camera: target.clone().add(new THREE.Vector3(3.5 - 0.6 * choiceView - 2.3 * contactView - 4 * approachView, 1.35 - 0.25 * choiceView - 0.6 * contactView, 6.3 - 1.2 * choiceView)), target,
    support: { left: t >= 43 ? "new" : "none", right: t < 44.3 ? "old" : t < 45.2 ? "moving" : "new", seated: t === 23 || t >= 50.5 },
    dynamics: { hangingLength, pendulumAngle: angle * hanging, newLoadShare: load },
  };
}

/** Clinical riding controls; the Human evaluator supplies all joint positions. */
function seated(lean: number): IAutoMovieHumanPose {
  return {
    legs: { left: { hip: { flexion: 78, abduction: 25 }, knee: { flexion: 95 } }, right: { hip: { flexion: 78, abduction: 25 }, knee: { flexion: 95 } } },
    spine: { lumbar: { flexion: lean }, thoracic: { flexion: 8 } },
    arms: { left: { shoulder: { flexion: 55 }, elbow: { flexion: 45 } }, right: { shoulder: { flexion: 55 }, elbow: { flexion: 45 } } },
  };
}
