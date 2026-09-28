/** Preserve a closed source solid while giving each of its axis-facing
 * surfaces one explicit finish. Parts are material partitions, not overlapping
 * new solids. Exact source vertices, normals, winding, and UVs survive; each
 * part compacts its own vertex references so scale audits see only that face. */
import type { IAutoMovieMesh } from "@automovie/interface";

export type FaceFinishes = Partial<Record<"x-" | "x+" | "y-" | "y+" | "z-" | "z+", string>>;

export function partitionSurfaceMesh(mesh: IAutoMovieMesh, defaultFinish: string, faces: FaceFinishes): { finish: string; mesh: IAutoMovieMesh }[] {
  if (!mesh.normals || mesh.normals.length !== mesh.positions.length)
    throw new Error("Surface partition requires complete normals");
  if (mesh.skin || mesh.colors)
    throw new Error("Surface partition requires a rigid uncoloured mesh");
  const indices = mesh.indices ?? mesh.positions.map((_, i) => i).filter(i => i % 3 === 0).map(i => i / 3);
  const groups = new Map<string, number[]>();
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i]! * 3;
    const normal = mesh.normals.slice(a, a + 3);
    const axis = Math.abs(normal[0]!) >= Math.abs(normal[1]!) && Math.abs(normal[0]!) >= Math.abs(normal[2]!) ? 0 : Math.abs(normal[1]!) >= Math.abs(normal[2]!) ? 1 : 2;
    const key = (["x", "y", "z"][axis]! + (normal[axis]! < 0 ? "-" : "+")) as keyof FaceFinishes;
    const finish = faces[key] ?? defaultFinish;
    const group = groups.get(finish) ?? [];
    group.push(...indices.slice(i, i + 3)); groups.set(finish, group);
  }
  return [...groups].map(([finish, selected]) => {
    const original = [...new Set(selected)];
    const remap = new Map(original.map((index, local) => [index, local]));
    const attribute = (values: number[] | null | undefined, stride: number) => values ? original.flatMap(i => values.slice(i * stride, (i + 1) * stride)) : null;
    return { finish, mesh: { ...mesh, positions: attribute(mesh.positions, 3)!, normals: attribute(mesh.normals, 3), uvs: attribute(mesh.uvs, 2), indices: selected.map(i => remap.get(i)!) } };
  });
}
