import * as THREE from "three";

/**
 * Evaluate the two metric broom trajectories and their common force/frame law.
 * Magic supplies controllable forward thrust and lift normal to the tangent;
 * it is not an aerodynamic claim. Derivatives are analytic, including the
 * integrated recovery slowdown. The adopted design budgets are12m/s,5m/s²
 * and0.45rad bank, not human strength or injury limits.
 *
 * @evidence contracts/common.md#implementation-and-ownership Owns actual curved pursuit, matched approach, rear-load yield, finite-acceleration recovery and riderless tangent/drag. Position derivatives determine heading and required lift; props, seats and contacts consume the same quaternion.
 * @evidence contracts/common.md#authoring-interface Finite global seconds and carina/old identity are required. Returns owned metre/second vectors, radian attitude and force per unit mass with gravity9.81m/s². The caller must still verify actual Human contacts, support loads and pixels.
 */
export function sampleBroomPath(kind: "carina" | "old", seconds: number): {
  position: THREE.Vector3; velocity: THREE.Vector3; acceleration: THREE.Vector3;
  quaternion: THREE.Quaternion; pitch: number; bank: number;
  thrustPerKg: number; liftPerKg: number;
} {
  if (!Number.isFinite(seconds)) throw new Error("Broom path requires finite seconds");
  const t: number = Math.max(0, Math.min(60, seconds));
  let x: Scalar = sum({ p: -80 + 7 * t, v: 7, a: 0 }, pulse(t, 6, 12, 18, 3.2));
  let y: Scalar = { p: 32.2, v: 0, a: 0 };
  let z: Scalar = { p: kind === "carina" ? -5.15 : -6, v: 0, a: 0 };
  const delay: number = kind === "carina" ? 0.5 : 0;
  z = sum(z, scaled(step(t - delay, 8, 10.5), -1.8), scaled(step(t - delay, 10.5, 13.5), 2.8), scaled(step(t - delay, 13.5, 17), -1));

  if (kind === "old" && t >= 44.3) {
    x = sum({ p: -80 + 7 * t, v: 7, a: 0 }, scaled(integral(t, 44.3, 49.3), -5.5));
    // No autonomous climb/sideways steering after the last rider releases it.
    z = { p: -6, v: 0, a: 0 };
  }
  if (kind === "carina") {
    x = sum(x, scaled(integral(t, 49.5, 53), -4));
    if (t < 23) {
      x = sum(x, pulse(t, 3.5, 5, 8, 1.2), scaled(step(t, 8, 14), -1.1));
    } else {
      const approach: Scalar = step(t, 35, 40.5);
      const load: Scalar = step(t, 43, 45.2);
      const recovery: Scalar = step(t, 49.5, 53);
      x = sum(x, { p: -1.1, v: 0, a: 0 }, scaled(approach, 1.6));
      y = sum(y, scaled(approach, -0.75), scaled(load, -0.23), scaled(recovery, 0.65));
      z = sum(z, scaled(approach, -0.35), scaled(step(t, 44.3, 46.5), 0.4));
    }
  }
  const position: THREE.Vector3 = new THREE.Vector3(x.p, y.p, z.p);
  const velocity: THREE.Vector3 = new THREE.Vector3(x.v, y.v, z.v);
  const acceleration: THREE.Vector3 = new THREE.Vector3(x.a, y.a, z.a);
  const forward: THREE.Vector3 = velocity.clone().normalize();
  const force: THREE.Vector3 = acceleration.clone().add(new THREE.Vector3(0, 9.81, 0));
  const thrustPerKg: number = force.dot(forward);
  const lift: THREE.Vector3 = force.addScaledVector(forward, -thrustPerKg);
  const liftPerKg: number = lift.length();
  if (velocity.length() < 0.1 || liftPerKg < 0.1) throw new Error("Flight frame is undefined");
  const up: THREE.Vector3 = lift.normalize();
  const side: THREE.Vector3 = forward.clone().cross(up).normalize();
  const quaternion: THREE.Quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(forward, up, side));
  return { position, velocity, acceleration, quaternion, pitch: Math.asin(forward.y), bank: Math.atan2(up.z, up.y), thrustPerKg, liftPerKg };
}

/** Scalar position and its first two time derivatives. */
interface Scalar { p: number; v: number; a: number; }

/** A clamped quintic has zero velocity and acceleration at both endpoints. */
function step(t: number, start: number, end: number): Scalar {
  if (t <= start) return { p: 0, v: 0, a: 0 };
  if (t >= end) return { p: 1, v: 0, a: 0 };
  const d: number = end - start;
  const u: number = (t - start) / d;
  return { p: u ** 3 * (10 - 15 * u + 6 * u * u), v: 30 * u * u * (1 - u) ** 2 / d, a: 60 * u * (1 - u) * (1 - 2 * u) / (d * d) };
}

/** Integrate the same velocity transition; after its end, continue linearly. */
function integral(t: number, start: number, end: number): Scalar {
  const d: number = end - start;
  const u: number = Math.max(0, Math.min(1, (t - start) / d));
  const s: Scalar = step(t, start, end);
  return { p: d * (u ** 6 - 3 * u ** 5 + 2.5 * u ** 4) + Math.max(0, t - end), v: s.p, a: s.v };
}

/** A finite bump with the same zero endpoint derivatives. */
function pulse(t: number, start: number, peak: number, end: number, amount: number): Scalar {
  return sum(scaled(step(t, start, peak), amount), scaled(step(t, peak, end), -amount));
}

/** Combine independent analytic coordinates without numerical differentiation. */
function sum(...values: Scalar[]): Scalar {
  return values.reduce((a: Scalar, b: Scalar): Scalar => ({ p: a.p + b.p, v: a.v + b.v, a: a.a + b.a }), { p: 0, v: 0, a: 0 });
}

/** Scale a displacement and its derivatives together. */
function scaled(value: Scalar, factor: number): Scalar {
  return { p: value.p * factor, v: value.v * factor, a: value.a * factor };
}
