import * as THREE from "three";

import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Select an actual shin triangle point at a declared distal anatomical station.
 *
 * @evidence contracts/common.md#implementation-and-ownership Intersects every actual displayed triangle with the plane normal to knee-to-ankle at the requested fraction. The forward-facing intersection is retained with its exact bone-local binding, preventing a nearest-point search from silently selecting the proximal calf.
 * @evidence contracts/common.md#authoring-interface Knee, ankle and aim are world metres; fraction is an authored shaft station in (0,1). Missing surface at that station throws instead of inventing an interior point or borrowing ankle reach.
 */
export function labShinWitness(
  mesh: THREE.Mesh,
  knee: THREE.Vector3,
  ankle: THREE.Vector3,
  aim: THREE.Vector3,
  fraction: number,
): {
  world: MotionAction.Vec3;
  local: MotionAction.Vec3;
  fraction: number;
  triangle: number;
} {
  if (!(fraction > 0 && fraction < 1))
    throw new Error("Shin station must be inside the knee-to-ankle segment");
  mesh.updateWorldMatrix(true, false);
  const axis: THREE.Vector3 = ankle.clone().sub(knee);
  const length: number = axis.length();
  if (length < 1e-6) throw new Error("Actual shin segment is degenerate");
  axis.divideScalar(length);
  const center: THREE.Vector3 = knee
    .clone()
    .addScaledVector(axis, length * fraction);
  const outward: THREE.Vector3 = aim.clone().sub(center);
  outward.addScaledVector(axis, -outward.dot(axis)).normalize();
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    mesh.geometry.getAttribute("position");
  const indices: number[] = mesh.geometry.index
    ? Array.from(mesh.geometry.index.array)
    : Array.from(
        { length: attribute.count },
        (_: unknown, index: number): number => index,
      );
  let chosen:
    | { point: THREE.Vector3; triangle: number; projection: number }
    | undefined;
  for (let offset: number = 0; offset < indices.length; offset += 3) {
    const vertices: THREE.Vector3[] = [0, 1, 2].map(
      (slot: number): THREE.Vector3 =>
        new THREE.Vector3()
          .fromBufferAttribute(attribute, indices[offset + slot]!)
          .applyMatrix4(mesh.matrixWorld),
    );
    for (const edge of [
      [0, 1],
      [1, 2],
      [2, 0],
    ] as const) {
      const a: THREE.Vector3 = vertices[edge[0]]!;
      const b: THREE.Vector3 = vertices[edge[1]]!;
      const da: number = a.clone().sub(center).dot(axis);
      const db: number = b.clone().sub(center).dot(axis);
      if (da * db > 0 || Math.abs(da - db) < 1e-12) continue;
      const point: THREE.Vector3 = a.clone().lerp(b, da / (da - db));
      const projection: number = point.clone().sub(center).dot(outward);
      if (!chosen || projection > chosen.projection)
        chosen = { point, triangle: offset / 3, projection };
    }
  }
  if (!chosen)
    throw new Error(
      `Actual shin mesh has no surface at the requested ${fraction} shaft station`,
    );
  return {
    world: chosen.point.toArray(),
    local: mesh.worldToLocal(chosen.point.clone()).toArray(),
    fraction,
    triangle: chosen.triangle,
  };
}
