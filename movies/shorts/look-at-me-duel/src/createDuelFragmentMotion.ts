import { projectileAt } from "@automovie/engine";
import * as THREE from "three";

import type { DuelFragmentMotion } from "./DuelFragmentMotion";

/**
 * Solve the three finite impact fragments against the actual placed shield triangles.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Engine projectileAt advances the fixed authored impact fan; its starting velocities are not derived fracture energy. Actual triangle/box contact uses a240Hz bracket and binary refinement. The explicitly magical dissipative ward removes horizontal and upward velocity, retaining downward motion; three fragments drop on its stone-facing side and stop at their measured half height. This is not ordinary elastic restitution, force or energy calibration. No proxy, flash or principal-block interception substitutes for actual geometry.
 * @evidence contracts/common.md#authoring-interface Supply the actual three BoxGeometry fragments, stationary placed oval shield and main-block impact centre/time. Preparation changes no displayed object. Missing interception, an above-centre contact requiring a different drop plan, invalid population or nonfinite time refuses. Returned evaluators are pure and recreate for any changed geometry/placement/initial motion. Source240Hz bounds and post-impact separation must also be inspected by the consumer.
 */
export function createDuelFragmentMotion(fragments: readonly THREE.Mesh[], shield: THREE.Mesh, impactCentre: THREE.Vector3, impactSeconds: number): DuelFragmentMotion[] {
  if (fragments.length !== 3 || !Number.isFinite(impactSeconds) || !impactCentre.toArray().every(Number.isFinite)) throw new Error("Fragment preparation requires the three actual finite impact pieces");
  shield.updateWorldMatrix(true, false);
  const shieldBounds: THREE.Box3 = new THREE.Box3().setFromObject(shield);
  const shieldCentre: THREE.Vector3 = shield.getWorldPosition(new THREE.Vector3());
  const positions: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = shield.geometry.getAttribute("position");
  const indices: THREE.BufferAttribute | null = shield.geometry.index;
  if (indices === null) throw new Error("Actual shield requires indexed triangles");
  const triangles: THREE.Triangle[] = [];
  for (let index: number = 0; index < indices.count; index += 3) {
    const points: THREE.Vector3[] = [0, 1, 2].map((offset: number): THREE.Vector3 => {
      const vertex: number = indices.getX(index + offset);
      return new THREE.Vector3(positions.getX(vertex), positions.getY(vertex), positions.getZ(vertex)).applyMatrix4(shield.matrixWorld);
    });
    triangles.push(new THREE.Triangle(points[0]!, points[1]!, points[2]!));
  }
  const failures: string[] = [];
  const results: (DuelFragmentMotion | undefined)[] = fragments.map((fragment: THREE.Mesh, index: number): DuelFragmentMotion | undefined => {
    try {
    fragment.parent?.updateWorldMatrix(true, false);
    if (!(fragment.geometry instanceof THREE.BoxGeometry) || !fragment.scale.equals(new THREE.Vector3(1, 1, 1)) || (fragment.parent !== null && !fragment.parent.matrixWorld.equals(new THREE.Matrix4()))) throw new Error("Fragment motion requires the actual unit-scale boxes in the world-aligned court");
    fragment.geometry.computeBoundingBox();
    const localBox: THREE.Box3 = fragment.geometry.boundingBox!.clone();
    const size: THREE.Vector3 = localBox.getSize(new THREE.Vector3());
    if (Math.max(size.x, size.y, size.z) > 0.08 || fragment.rotation.x !== 0 || fragment.rotation.z !== 0) throw new Error("Impact fragments require actual sub8cm rigid boxes with horizontal yaw only");
    const halfHeight: number = size.y / 2;
    const velocityX: number = [-1.2, -0.9, -0.7][index]!;
    const origin: THREE.Vector3 = new THREE.Vector3(impactCentre.x - 0.4 - size.x / 2 - 0.002, halfHeight + 0.005, impactCentre.z + (index - 1) * 0.12);
    if (!(origin.x > shieldBounds.max.x)) throw new Error("Fragment spawn must lie east of the actual shield");
    // Impact owns the fixed fan; moving a shield cannot re-aim incoming debris.
    const velocity: { x: number; y: number; z: number } = { x: velocityX, y: [2.5, 2.8, 3.1][index]!, z: [0.25, 0, -0.2][index]! };

    /** Evaluate the unchanged incoming ballistic centre in local impact seconds. */
    function incoming(seconds: number): ReturnType<typeof projectileAt> {
      return projectileAt({ origin: { x: origin.x, y: origin.y, z: origin.z }, velocity, gravity: { x: 0, y: -9.81, z: 0 } }, seconds);
    }

    /** Exact triangle/box narrow phase at one requested centre; no drawing is modified. */
    function overlap(seconds: number): number {
      const state: ReturnType<typeof incoming> = incoming(seconds);
      const centre: THREE.Vector3 = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
      const matrix: THREE.Matrix4 = new THREE.Matrix4().compose(centre, fragment.quaternion, new THREE.Vector3(1, 1, 1));
      if (!new THREE.Box3().copy(localBox).applyMatrix4(matrix).intersectsBox(shieldBounds)) return -1;
      const inverse: THREE.Matrix4 = matrix.clone().invert();
      for (let row: number = 0; row < triangles.length; row++) {
        const triangle: THREE.Triangle = triangles[row]!;
        if (localBox.intersectsTriangle(new THREE.Triangle(triangle.a.clone().applyMatrix4(inverse), triangle.b.clone().applyMatrix4(inverse), triangle.c.clone().applyMatrix4(inverse)))) return row;
      }
      return -1;
    }

    let high: number = 0;
    let triangleIndex: number = -1;
    for (let step: number = 1; step <= 240; step++) {
      high = step / 240;
      triangleIndex = overlap(high);
      if (triangleIndex !== -1) break;
      if (incoming(high).position.y < halfHeight) break;
    }
    if (triangleIndex === -1) throw new Error(`Actual fragment${index + 1} never meets the actual shield`);
    let low: number = high - 1 / 240;
    for (let refinement: number = 0; refinement < 24; refinement++) {
      const middle: number = (low + high) / 2;
      const hit: number = overlap(middle);
      if (hit === -1) low = middle;
      else { high = middle; triangleIndex = hit; }
    }
    const state: ReturnType<typeof incoming> = incoming(low);
    const contactCentre: THREE.Vector3 = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
    if (contactCentre.y + halfHeight >= shieldCentre.y) throw new Error("This fragment requires a different post-contact fall plan");
    const downwardSpeed: number = Math.min(0, state.velocity.y);
    const floorFlight: number = (downwardSpeed + Math.sqrt(downwardSpeed * downwardSpeed + 2 * 9.81 * (contactCentre.y - halfHeight))) / 9.81;
    const contactSeconds: number = impactSeconds + low;
    const floorSeconds: number = contactSeconds + floorFlight;
    return {
      contact: { seconds: contactSeconds, firstIntersectionSeconds: impactSeconds + high, centre: contactCentre, triangle: triangleIndex }, floorSeconds,
      at: (seconds: number): { visible: boolean; centre: THREE.Vector3; stoppedByShield: boolean; settled: boolean } => {
        if (!Number.isFinite(seconds)) throw new Error("Fragment time must be finite");
        if (seconds < impactSeconds) return { visible: false, centre: origin.clone(), stoppedByShield: false, settled: false };
        if (seconds < contactSeconds) {
          const current: ReturnType<typeof incoming> = incoming(seconds - impactSeconds);
          return { visible: true, centre: new THREE.Vector3(current.position.x, current.position.y, current.position.z), stoppedByShield: false, settled: false };
        }
        const elapsed: number = seconds >= floorSeconds ? floorFlight : seconds - contactSeconds;
        const current: ReturnType<typeof projectileAt> = projectileAt({ origin: { x: contactCentre.x, y: contactCentre.y, z: contactCentre.z }, velocity: { x: 0, y: downwardSpeed, z: 0 }, gravity: { x: 0, y: -9.81, z: 0 } }, elapsed);
        return { visible: true, centre: new THREE.Vector3(current.position.x, seconds >= floorSeconds ? halfHeight : current.position.y, current.position.z), stoppedByShield: true, settled: seconds >= floorSeconds };
      },
    };
    } catch (error: unknown) {
      failures.push(`Fragment${index + 1}:${String(error)}`);
      return undefined;
    }
  });
  if (failures.length !== 0) throw new Error(`Actual fragment preparation failed after all3were inspected: ${failures.join("; ")}`);
  return results.map((result: DuelFragmentMotion | undefined): DuelFragmentMotion => result!);
}
