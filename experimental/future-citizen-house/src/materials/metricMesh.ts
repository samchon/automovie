import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { woodGrainAxis } from "./woodGrainAxis";
import { memberTexturePhase } from "./memberTexturePhase";

/** Physical U/V coordinates are authored on the same mesh consumed by the
 * compiler. Its positions, normals, triangles, and part scale remain intact. */
export function metricMesh(
  mesh: IAutoMovieMesh,
  scale: IAutoMovieVector3,
  role: string,
  host: string,
  tile: { u: number; v: number },
): IAutoMovieMesh {
  if (![scale.x, scale.y, scale.z, tile.u, tile.v].every(Number.isFinite) ||
      Math.min(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z), tile.u, tile.v) <= 0)
    throw new Error(`${host}: invalid metric texture dimensions`);
  if (!mesh.normals || mesh.normals.length !== mesh.positions.length)
    throw new Error(`${host}: metric texture requires face normals`);
  const sx = Math.abs(scale.x), sy = Math.abs(scale.y), sz = Math.abs(scale.z);
  const phase = /stone-panels|floor-boards/.test(host) ? memberTexturePhase(host) : [0, 0];
  const uvs: number[] = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const nx = Math.abs(mesh.normals[i]!), ny = Math.abs(mesh.normals[i + 1]!), nz = Math.abs(mesh.normals[i + 2]!);
    if (![nx, ny, nz].every(Number.isFinite) || Math.hypot(nx, ny, nz) < .5)
      throw new Error(`${host}: invalid face normal for metric texture`);
    const axis = ny >= nx && ny >= nz ? "y" : nx >= nz ? "x" : "z";
    const x = mesh.positions[i]! * sx, y = mesh.positions[i + 1]! * sy, z = mesh.positions[i + 2]! * sz;
    const coordinates = { x, y, z };
    const dimensions = { x: sx, y: sy, z: sz };
    const tangent = (["x", "z", "y"] as const).filter(a => a !== axis);
    const grain = role.startsWith("oak-") ? woodGrainAxis(role, host, scale) : null;
    const vertical = grain && grain !== axis ? grain : grain ? tangent.slice().sort((a, b) => dimensions[b] - dimensions[a])[0]! : axis === "y" ? "z" : "y";
    const horizontal = tangent.find(a => a !== vertical)!;
    const normalAxis = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    const u = coordinates[horizontal] * (mesh.normals[i + normalAxis]! < 0 ? -1 : 1);
    const v = coordinates[vertical];
    uvs.push(u + phase[0]! * tile.u, v + phase[1]! * tile.v);
  }
  return { ...mesh, uvs };
}
