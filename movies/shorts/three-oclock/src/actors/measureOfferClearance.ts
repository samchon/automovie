import * as THREE from "three";
import { createAutoMovieMeshSeparationQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Admit a deliberately untouched offer from the actual sheet and both hand trees.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses current real paper and all ancestry-selected hand/finger meshes. Positive bounding-box gaps prove separation; ambiguous pairs use the installed original-surface query with each individual rigid part's convex feature in BOTH directions. That is conservative, never a hand-wide replacement or a penetration verdict on failure. One shared work budget retains exhaustion as unresolved. No-touch applies throughout approach/withdrawal; only the settled hover additionally needs30mm vertical margin,60mm horizontal alignment and actual normalY at least0.94. Source geometry and2mm clearance are unchanged.
 * @evidence contracts/common.md#authoring-interface Inputs are the displayed objects and matching current world-metre witnesses/normal. Returns raw bounds gaps, vertical/horizontal relation and honest admission; no target coordinate substitutes for FK. Giver's separate finite-paper pinch owns attachment. This only judges an intentionally untouching hover, never a completed handover or whole-hand friction.
 */
export function measureOfferClearance(paper: THREE.Object3D, giver: readonly THREE.Object3D[], receiver: readonly THREE.Object3D[], edge: THREE.Vector3, palm: THREE.Vector3, normal: THREE.Vector3): {
  admitted: boolean; untouched: boolean; paperHandGap: number; handHandGap: number; above: number; horizontal: number; upward: number; method: string; queryWork: number; error?: string;
} {
  const sheet: THREE.Box3 = new THREE.Box3().setFromObject(paper);
  const giving: THREE.Box3 = new THREE.Box3();
  const receiving: THREE.Box3 = new THREE.Box3();
  for (const part of giver) giving.expandByObject(part);
  for (const part of receiver) receiving.expandByObject(part);
  const valid: boolean = [sheet, giving, receiving].every((box: THREE.Box3): boolean => !box.isEmpty() && [...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite))
    && [...edge.toArray(), ...palm.toArray(), ...normal.toArray()].every(Number.isFinite) && Math.abs(normal.length() - 1) < 1e-6;
  const paperHandGap: number = gap(sheet, receiving);
  const handHandGap: number = gap(giving, receiving);
  const above: number = edge.y - palm.y;
  const horizontal: number = Math.hypot(edge.x - palm.x, edge.z - palm.z);
  const upward: number = normal.y;
  const budget: { remaining: number } = { remaining: 2_000_000 };
  let untouched: boolean = valid && paperHandGap >= 0.002 && handHandGap >= 0.002;
  let error: string | undefined;
  let method: string = "union-bounds";
  if (valid && !untouched) {
    method = "individual-part-bounds-and-bidirectional-source-query";
    const resident: Map<THREE.Object3D, { mesh: IAutoMovieMesh; vertices: { x: number; y: number; z: number }[]; query: ReturnType<typeof createAutoMovieMeshSeparationQuery> }> = new Map();

    /** Snapshot the current actual mesh, not a bone centre or hand-wide hull. */
    function snapshot(object: THREE.Object3D): NonNullable<ReturnType<typeof resident.get>> {
      const prior: ReturnType<typeof resident.get> = resident.get(object);
      if (prior !== undefined) return prior;
      if (!(object instanceof THREE.Mesh)) throw new Error("Contact requires original displayed meshes");
      const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = object.geometry.getAttribute("position");
      const indices: THREE.BufferAttribute | null = object.geometry.getIndex();
      const positions: number[] = [];
      const unique: Map<string, { x: number; y: number; z: number }> = new Map();
      for (let index: number = 0; index < attribute.count; index++) {
        const point: THREE.Vector3 = object.localToWorld(new THREE.Vector3(attribute.getX(index), attribute.getY(index), attribute.getZ(index)));
        positions.push(...point.toArray()); unique.set(point.toArray().join(","), { x: point.x, y: point.y, z: point.z });
      }
      const mesh: IAutoMovieMesh = { positions, indices: indices === null ? null : Array.from(indices.array), normals: null, uvs: null, skin: null };
      const value: NonNullable<ReturnType<typeof resident.get>> = { mesh, vertices: [...unique.values()], query: createAutoMovieMeshSeparationQuery(mesh, "source") };
      resident.set(object, value); return value;
    }

    /** Conservative refusal stays unknown; it is never relabelled collision. */
    function separated(a: THREE.Object3D, b: THREE.Object3D): boolean {
      if (gap(new THREE.Box3().setFromObject(a), new THREE.Box3().setFromObject(b)) >= 0.002) return true;
      const first: ReturnType<typeof snapshot> = snapshot(a);
      const second: ReturnType<typeof snapshot> = snapshot(b);
      return second.query.separated(first.vertices, { clearance: 0.002, budget }).certified && first.query.separated(second.vertices, { clearance: 0.002, budget }).certified;
    }
    try { untouched = receiver.every((receiving: THREE.Object3D): boolean => separated(paper, receiving) && giver.every((giving: THREE.Object3D): boolean => separated(giving, receiving))); }
    catch (failure) { untouched = false; error = failure instanceof Error ? failure.message : String(failure); }
  }
  return { admitted: untouched && above >= 0.03 && horizontal <= 0.06 && upward >= 0.94, untouched,
    paperHandGap, handHandGap, above, horizontal, upward, method, queryWork: 2_000_000 - budget.remaining, ...(error === undefined ? {} : { error }) };
}

/** Exact Euclidean distance between two world-axis bounding boxes. */
function gap(a: THREE.Box3, b: THREE.Box3): number {
  return Math.hypot(Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x), Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y), Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z));
}
