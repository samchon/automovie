import * as THREE from "three";

/**
 * Select three actual vertices spanning the flat supporting face of a shoe.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reads every original vertex through its real mesh-to-Foot transform, keeps the lowest coplanar face and chooses its largest-area original-vertex triangle. No synthesized box corner, skin minimum or altered shoe geometry becomes contact. The first point is the most anterior of the selected vertices; the other two preserve a nondegenerate support plane. Source vertex indices remain attributable.
 * @evidence contracts/common.md#authoring-interface Supply the actual flat shoe mesh and its Foot carrier in the neutral model. Returns Foot-local metre coordinates and source vertex indices. The original triangle is unchanged; forefoot additionally returns the maximum-width actual anterior face edge when it exists, independently of which triangle won the area tie. No extra point is synthesized. The1e-7m plane equality only groups Float32 face samples; it is not a physical contact allowance. A missing/degenerate flat supporting face refuses. Actual full foot/shoe floor remains independently mandatory.
 */
export function selectSoleContacts(mesh: THREE.Mesh, foot: THREE.Object3D): { points: [THREE.Vector3, THREE.Vector3, THREE.Vector3]; vertices: [number, number, number]; forefoot?: { points: [THREE.Vector3, THREE.Vector3]; vertices: [number, number] } } {
  mesh.updateWorldMatrix(true, false); foot.updateWorldMatrix(true, false);
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
  const values: { point: THREE.Vector3; index: number }[] = [];
  let minimum: number = Infinity;
  for (let index: number = 0; index < attribute.count; index++) {
    const point: THREE.Vector3 = foot.worldToLocal(mesh.localToWorld(new THREE.Vector3(attribute.getX(index), attribute.getY(index), attribute.getZ(index))));
    if (!point.toArray().every(Number.isFinite)) throw new Error("Shoe support needs finite actual vertices");
    values.push({ point, index }); minimum = Math.min(minimum, point.y);
  }
  const unique: Map<string, (typeof values)[number]> = new Map();
  for (const value of values) if (Math.abs(value.point.y - minimum) <= 1e-7) unique.set(value.point.toArray().join(","), value);
  const candidates: typeof values = [...unique.values()];
  let best: [number, number, number] | undefined;
  let area: number = 0;
  for (let a: number = 0; a < candidates.length; a++) for (let b: number = a + 1; b < candidates.length; b++) for (let c: number = b + 1; c < candidates.length; c++) {
    const squared: number = new THREE.Vector3().crossVectors(candidates[b]!.point.clone().sub(candidates[a]!.point), candidates[c]!.point.clone().sub(candidates[a]!.point)).lengthSq();
    if (squared > area) { area = squared; best = [a, b, c]; }
  }
  if (best === undefined || area <= 1e-12) throw new Error("The actual shoe has no nondegenerate flat supporting face");
  const selected: typeof values = best.map((index: number): (typeof values)[number] => candidates[index]!).sort((a: (typeof values)[number], b: (typeof values)[number]): number => b.point.x - a.point.x);
  const anterior: number = Math.max(...candidates.map((row: (typeof values)[number]): number => row.point.x));
  const edge: typeof values = candidates.filter((row: (typeof values)[number]): boolean => Math.abs(row.point.x - anterior) <= 1e-7).sort((a: (typeof values)[number], b: (typeof values)[number]): number => a.point.z - b.point.z);
  const forefoot: { points: [THREE.Vector3, THREE.Vector3]; vertices: [number, number] } | undefined = edge.length >= 2 && edge.at(-1)!.point.distanceToSquared(edge[0]!.point) > 1e-12 ? { points: [edge[0]!.point.clone(), edge.at(-1)!.point.clone()], vertices: [edge[0]!.index, edge.at(-1)!.index] } : undefined;
  return { points: selected.map((row: (typeof values)[number]): THREE.Vector3 => row.point.clone()) as [THREE.Vector3, THREE.Vector3, THREE.Vector3], vertices: selected.map((row: (typeof values)[number]): number => row.index) as [number, number, number], ...(forefoot === undefined ? {} : { forefoot }) };
}
