import * as THREE from "three";

/**
 * Evaluate station-keeping, marking and the distant Keeper's attempted aid.
 * These magical hover controllers may face the ball while translating; their
 * shared platform normal follows the required acceleration minus gravity.
 * The Keeper travels68m east over11s, not the old246m burst.
 *
 * @evidence contracts/common.md#implementation-and-ownership Owns analytic supporting positions and derivatives, catch-bank curvature, bounded marking and Keeper launch/brake. Rider and broom consume one quaternion, rather than decorating a straight path with roll.
 * @evidence contracts/common.md#authoring-interface Uses stable team-role IDs and global finite seconds, returning owned metre/second vectors and a world attitude. Source population owns IDs; returned force is per unit mass, not a measured human capacity.
 */
export function sampleSupportingPath(id: string, seconds: number): { position: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3; quaternion: THREE.Quaternion; forcePerKg: number } {
  if (!Number.isFinite(seconds)) throw new Error("Supporting path time must be finite");
  const green: boolean = id.startsWith("G-");
  const role: string = id.slice(2);
  const n: number = Number(role[1]);
  let position: THREE.Vector3;
  let velocity: THREE.Vector3 = new THREE.Vector3();
  let acceleration: THREE.Vector3 = new THREE.Vector3();
  const reaction: number = smooth(seconds, 38, 40).p;
  let yaw: number = (green ? 0 : Math.PI) * (1 - reaction) + 0.25 * reaction;
  if (role === "K") {
    const s: Phase = smooth(seconds, 40, 51);
    position = new THREE.Vector3(green ? -10 + 68 * s.p : -150, green ? 40 - 8 * s.p : 40, green ? 8 - 10 * s.p : 0);
    if (green) { velocity.set(68 * s.v, -8 * s.v, -10 * s.v); acceleration.set(68 * s.a, -8 * s.a, -10 * s.a); }
    yaw = green ? Math.PI * (1 - smooth(seconds, 38, 39.6).p) : Math.PI;
  } else {
    if (!Number.isInteger(n) || n < 1 || n > (role[0] === "C" ? 3 : 2)) throw new Error("Unknown supporting role");
    const b: number = Math.max(0, Math.min(2, seconds - 38));
    const stop: number = seconds < 38 ? seconds : 38 + b - b * b / 4;
    const sd: number = seconds < 38 ? 1 : seconds < 40 ? 1 - b / 2 : 0;
    const sdd: number = seconds >= 38 && seconds < 40 ? -0.5 : 0;
    const angle: number = stop * 0.25 + n;
    position = new THREE.Vector3(role[0] === "C" ? [-52, -44, -60][n - 1]! + (green ? 0 : 4) + Math.sin(angle) * 4 : -30 - n * 35 + (green ? 0 : 7), 32 + n * 2, role[0] === "C" ? 8 + n * 5 + (green ? 0 : 3) : 28 + n * 4);
    if (role[0] === "C") { velocity.x = Math.cos(angle) * sd; acceleration.x = -0.25 * Math.sin(angle) * sd * sd + Math.cos(angle) * sdd; }
    if (id === "G-C2") {
      const first: Phase = smooth(seconds, 19, 21);
      const second: Phase = smooth(seconds, 21, 23);
      position.z += 0.8 * (first.p - second.p); velocity.z += 0.8 * (first.v - second.v); acceleration.z += 0.8 * (first.a - second.a);
    }
    if (id === "R-C2") {
      const mark: Phase = smooth(seconds, 18, 21);
      position.add(new THREE.Vector3(4 * mark.p, 0, -3 * mark.p)); velocity.add(new THREE.Vector3(4 * mark.v, 0, -3 * mark.v)); acceleration.add(new THREE.Vector3(4 * mark.a, 0, -3 * mark.a));
    }
  }
  const force: THREE.Vector3 = acceleration.clone().add(new THREE.Vector3(0, 9.81, 0));
  const up: THREE.Vector3 = force.clone().normalize();
  const forward: THREE.Vector3 = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  forward.addScaledVector(up, -forward.dot(up)).normalize();
  const quaternion: THREE.Quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(forward, up, forward.clone().cross(up)));
  return { position, velocity, acceleration, quaternion, forcePerKg: force.length() };
}

/** Quintic metric time phase and its derivatives. */
interface Phase { p: number; v: number; a: number; }

/** Maintain zero endpoint velocity and acceleration for the aid/marking phases. */
function smooth(t: number, start: number, end: number): Phase {
  if (t <= start) return { p: 0, v: 0, a: 0 };
  if (t >= end) return { p: 1, v: 0, a: 0 };
  const d: number = end - start; const u: number = (t - start) / d;
  return { p: u ** 3 * (10 - 15 * u + 6 * u * u), v: 30 * u * u * (1 - u) ** 2 / d, a: 60 * u * (1 - u) * (1 - 2 * u) / (d * d) };
}
