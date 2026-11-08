import { projectileAt, resolveImpact, type IAutoMovieImpact, type IAutoMovieProjectileState } from "@automovie/engine";
import * as THREE from "three";

/**
 * Prepare the released invitation's gravity, first paving contact and rest.
 *
 * @evidence contracts/common.md#implementation-and-ownership Copies the actual rectangular sheet's release transform, velocity and eight geometry-box corners. Engine projectileAt owns constant9.81m/s² gravity; angular flutter is art direction, not aerodynamics. First lower-corner crossing is bracketed at200Hz then bisected48times. Engine resolveImpact supplies the4g paper/effectively immobile1e12kg paving normal impulse. An authored200ms constant horizontal deceleration through projectileAt and floor-constrained angular settle stop the sheet flat without a lateral reset; no measured material-friction coefficient is claimed. No ownership or grip is inferred here.
 * @evidence contracts/common.md#authoring-interface Supply the actual rigid2mm sheet at a finite above-floor release and optional measured world velocity, default zero. Returns a stateless local-second sampler and measured contact time/impact. Negative time clamps to release. The caller owns the exact release event and retained source transform; later pickup must replace this floor owner explicitly. This helper owns no mesh, material, history or external resource.
 */
export function createPaperFall(paper: THREE.Mesh, velocity: THREE.Vector3 = new THREE.Vector3()): {
  contactSeconds: number; impact: IAutoMovieImpact;
  at: (seconds: number) => { position: THREE.Vector3; quaternion: THREE.Quaternion; floorMinimum: number; state: "falling" | "settling" | "resting" };
} {
  paper.updateWorldMatrix(true, false);
  paper.geometry.computeBoundingBox();
  const bounds: THREE.Box3 | null = paper.geometry.boundingBox;
  if (paper.geometry.type !== "BoxGeometry" || bounds === null || bounds.isEmpty()) throw new Error("Paper release needs the actual rectangular BoxGeometry sheet");
  const origin: THREE.Vector3 = paper.getWorldPosition(new THREE.Vector3());
  const release: THREE.Quaternion = paper.getWorldQuaternion(new THREE.Quaternion());
  const scale: THREE.Vector3 = paper.getWorldScale(new THREE.Vector3());
  const initialVelocity: THREE.Vector3 = velocity.clone();
  if (![...origin.toArray(), ...release.toArray(), ...bounds.min.toArray(), ...bounds.max.toArray(), ...velocity.toArray()].every(Number.isFinite) || scale.toArray().some((value: number): boolean => Math.abs(value - 1) > 1e-6))
    throw new Error("Paper release must use a finite rigid metre transform");
  const corners: THREE.Vector3[] = [];
  for (let index: number = 0; index < 8; index++) corners.push(new THREE.Vector3(index & 1 ? bounds.max.x : bounds.min.x, index & 2 ? bounds.max.y : bounds.min.y, index & 4 ? bounds.max.z : bounds.min.z));
  const flat: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);

  /** Use Engine's closed-form metre/second state without integrating prior frames. */
  function flight(seconds: number): IAutoMovieProjectileState {
    return projectileAt({ origin: { x: origin.x, y: origin.y, z: origin.z }, velocity: { x: initialVelocity.x, y: initialVelocity.y, z: initialVelocity.z }, gravity: { x: 0, y: -9.81, z: 0 } }, seconds);
  }

  /** Art-directed angular flutter accompanies, but never replaces, gravity. */
  function orientation(seconds: number): THREE.Quaternion {
    const phase: number = Math.min(1, Math.max(0, seconds / 0.5));
    const rotation: THREE.Quaternion = release.clone().slerp(flat, phase * phase * (3 - 2 * phase));
    return rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0.25 * Math.sin(22 * seconds) * Math.sin(Math.PI * phase)));
  }

  /** Lowest transformed corner is exact for this real rectangular box. */
  function bottom(position: THREE.Vector3, quaternion: THREE.Quaternion): number {
    return Math.min(...corners.map((point: THREE.Vector3): number => point.clone().applyQuaternion(quaternion).add(position).y));
  }

  /** Evaluate the lower sheet surface on the unimpeded gravity trajectory. */
  function fallingBottom(seconds: number): number {
    const value: IAutoMovieProjectileState = flight(seconds);
    return bottom(new THREE.Vector3(value.position.x, value.position.y, value.position.z), orientation(seconds));
  }
  if (!(fallingBottom(0) > 0)) throw new Error("Released paper already touches the paving");
  let low: number = 0;
  let high: number = 0.005;
  while (high <= 2 && fallingBottom(high) > 0) { low = high; high += 0.005; }
  if (high > 2) throw new Error("This courtyard paper fall has no contact within its two-second budget");
  for (let index: number = 0; index < 48; index++) { const middle: number = (low + high) / 2; if (fallingBottom(middle) > 0) low = middle; else high = middle; }
  const contactSeconds: number = high;
  const contact: IAutoMovieProjectileState = flight(contactSeconds);
  const impact: IAutoMovieImpact = resolveImpact({ mass: 0.004, velocity: contact.velocity, restitution: 0, hardness: 0.1, penetrability: 0 },
    { mass: 1e12, velocity: { x: 0, y: 0, z: 0 }, restitution: 0, hardness: 1, penetrability: 0 }, { x: 0, y: -1, z: 0 });
  const contactRotation: THREE.Quaternion = orientation(contactSeconds);
  return { contactSeconds, impact, at: (seconds: number): { position: THREE.Vector3; quaternion: THREE.Quaternion; floorMinimum: number; state: "falling" | "settling" | "resting" } => {
    if (!Number.isFinite(seconds)) throw new Error("Paper fall time must be finite");
    const time: number = Math.max(0, seconds);
    if (time < contactSeconds) {
      const value: IAutoMovieProjectileState = flight(time);
      const position: THREE.Vector3 = new THREE.Vector3(value.position.x, value.position.y, value.position.z);
      const quaternion: THREE.Quaternion = orientation(time);
      return { position, quaternion, floorMinimum: bottom(position, quaternion), state: "falling" };
    }
    const after: number = time - contactSeconds;
    const phase: number = Math.min(1, after / 0.2);
    const quaternion: THREE.Quaternion = contactRotation.clone().slerp(flat, phase * phase * (3 - 2 * phase));
    const slide: IAutoMovieProjectileState = projectileAt({ origin: { x: contact.position.x, y: 0, z: contact.position.z }, velocity: { x: impact.velocityA.x, y: 0, z: impact.velocityA.z }, gravity: { x: -impact.velocityA.x / 0.2, y: 0, z: -impact.velocityA.z / 0.2 } }, Math.min(after, 0.2));
    const position: THREE.Vector3 = new THREE.Vector3(slide.position.x, 0, slide.position.z);
    position.y = -bottom(position, quaternion);
    return { position, quaternion, floorMinimum: bottom(position, quaternion), state: phase < 1 ? "settling" : "resting" };
  } };
}
