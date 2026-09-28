import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

/** The design's grain direction is local, so a door rotation rotates its grain.
 * Cabinet horizontal shelves choose their long axis, while jambs and leaves
 * keep Y. Board and stair end faces are partitioned by the assembly consumer. */
export function woodGrainAxis(role: string, host: string, scale: IAutoMovieVector3): "x" | "y" | "z" {
  if (role === "oak-floor") return "z";
  if (role === "oak-stair") return host.includes("landing") ? "z" : "x";
  if (role === "oak-joinery") {
    if (/(head|threshold|shelf|top)/.test(host)) return scale.x >= scale.z ? "x" : "z";
    if (host.includes("back")) return scale.y >= scale.x ? "y" : "x";
    return "y";
  }
  if (/head|leg|support-(left|right)/.test(host)) return "y";
  return scale.x >= scale.z ? "x" : "z";
}

/** Member-local phase in image turns, fixed by the authored seed and ID. */
export function memberTexturePhase(id: string): [number, number] {
  let hash = 2166136261 ^ 2080;
  for (const point of id) { hash ^= point.codePointAt(0) ?? 0; hash = Math.imul(hash, 16777619) >>> 0; }
  return [(hash & 3) / 4, ((hash >>> 2) & 1) / 2];
}

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
