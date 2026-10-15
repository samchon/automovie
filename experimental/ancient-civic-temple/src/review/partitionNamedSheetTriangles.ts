import type { IAutoMovieMesh } from "@automovie/interface";
import { NamedSheet } from "./NamedSheet";

const onSheet = (sheets: readonly NamedSheet[], points: ReadonlyArray<readonly [number, number, number]>): boolean => sheets.some((sheet) => points.every((point) => sheet.corners.some((corner) => Math.hypot(point[0] - corner.x, point[1] - corner.y, point[2] - corner.z) < 1e-6)));
/** Measurement mesh retaining only vertices referenced by selected triangles and all their static attributes. */
const selectTriangles = (mesh: IAutoMovieMesh, triangles: readonly number[]): IAutoMovieMesh | null => {
  if (triangles.length === 0) return null;
  if (mesh.skin !== null) throw new Error("Named closure-sheet accounts require rigid meshes.");
  const oldToNew = new Map<number, number>();
  const positions: number[] = [];
  const normals: number[] | null = mesh.normals === null ? null : [];
  const uvs: number[] | null = mesh.uvs === null ? null : [];
  const colors: number[] | undefined = mesh.colors === undefined ? undefined : [];
  const indices = triangles.map((old) => {
    let next = oldToNew.get(old);
    if (next === undefined) {
      next = oldToNew.size;
      oldToNew.set(old, next);
      positions.push(...mesh.positions.slice(old * 3, old * 3 + 3));
      if (normals !== null) normals.push(...mesh.normals!.slice(old * 3, old * 3 + 3));
      if (uvs !== null) uvs.push(...mesh.uvs!.slice(old * 2, old * 2 + 2));
      if (colors !== undefined) colors.push(...mesh.colors!.slice(old * 3, old * 3 + 3));
    }
    return next;
  });
  return { positions, normals, uvs, ...(colors === undefined ? {} : { colors }), indices, skin: null };
};
/** Separates actual mesh triangles into named double-sided sheets and the remainder, preserving their attributes and bounds. */

export const partitionNamedSheetTriangles = (
  mesh: IAutoMovieMesh, sheets: readonly NamedSheet[]
): { body: IAutoMovieMesh | null; sheet: IAutoMovieMesh | null; removed: number; } => {
  const p = mesh.positions;
  const indices = mesh.indices ?? Array.from({ length: p.length / 3 }, (_, i) => i);
  const kept: number[] = [];
  const removed: number[] = [];
  for (let t = 0; t + 2 < indices.length; t += 3) {
    const tri = [0, 1, 2].map((k) => [p[indices[t + k]! * 3]!, p[indices[t + k]! * 3 + 1]!, p[indices[t + k]! * 3 + 2]!] as const);
    const target = onSheet(sheets, tri) ? removed : kept;
    target.push(indices[t]!, indices[t + 1]!, indices[t + 2]!);
  }
  return { body: selectTriangles(mesh, kept), sheet: selectTriangles(mesh, removed), removed: removed.length / 3 };
};
