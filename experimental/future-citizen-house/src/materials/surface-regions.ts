/** Partition planar triangle surfaces by a local XYZ box and normal direction.
 * Convex half-space clipping emits the selected material patch and disjoint
 * remainders. It changes no occupied solid, position basis, source normal, or
 * interpolated UV. Inputs are rigid, unskinned flat-shaded architecture. */
import type { IAutoMovieMesh } from "@automovie/interface";
export type SurfaceRegion = { finish: string; normal: "x-" | "x+" | "y-" | "y+" | "z-" | "z+"; min: [number, number, number]; max: [number, number, number] };
type Vertex = { p: number[]; n: number[]; uv: number[] | null };

export function partitionSurfaceRegions(mesh: IAutoMovieMesh, finish: string, regions: readonly SurfaceRegion[]): { finish: string; mesh: IAutoMovieMesh }[] {
  if (!mesh.normals || mesh.normals.length !== mesh.positions.length || mesh.skin || mesh.colors)
    throw new Error("Surface regions require rigid flat normals without skin or vertex colors");
  const indices = mesh.indices ?? Array.from({ length: mesh.positions.length / 3 }, (_, i) => i);
  const triangles: { finish: string; polygon: Vertex[] }[] = [];
  for (let i = 0; i < indices.length; i += 3) triangles.push({ finish, polygon: indices.slice(i, i + 3).map(index => ({ p: mesh.positions.slice(index * 3, index * 3 + 3), n: mesh.normals!.slice(index * 3, index * 3 + 3), uv: mesh.uvs ? mesh.uvs.slice(index * 2, index * 2 + 2) : null })) });
  let current = triangles;
  for (const region of regions) {
    const axis = "xyz".indexOf(region.normal[0]!);
    const sign = region.normal[1] === "+" ? 1 : -1;
    current = current.flatMap(item => {
      if (item.finish !== finish || item.polygon[0]!.n[axis]! * sign < .99) return [item];
      let inside = item.polygon;
      const outside: Vertex[][] = [];
      for (let a = 0; a < 3; a++) for (const side of [-1, 1]) {
        if (!inside.length) continue;
        const bound = side === -1 ? region.min[a]! : region.max[a]!;
        const yes: Vertex[] = [], no: Vertex[] = [];
        for (let j = 0; j < inside.length; j++) {
          const u = inside[j]!, v = inside[(j + 1) % inside.length]!;
          const du = side * (bound - u.p[a]!), dv = side * (bound - v.p[a]!);
          (du >= -1e-10 ? yes : no).push(u);
          if (du > 1e-10 && dv < -1e-10 || du < -1e-10 && dv > 1e-10) {
            const t = du / (du - dv);
            const lerp = (left: number[], right: number[]) => left.map((value, k) => value + t * (right[k]! - value));
            const intersection: Vertex = { p: lerp(u.p, v.p), n: lerp(u.n, v.n), uv: u.uv && v.uv ? lerp(u.uv, v.uv) : null };
            yes.push(intersection); no.push(intersection);
          }
        }
        if (no.length >= 3) outside.push(no);
        inside = yes.length >= 3 ? yes : [];
      }
      return [...outside.map(polygon => ({ finish: item.finish, polygon })), ...(inside.length ? [{ finish: region.finish, polygon: inside }] : [])];
    });
  }
  const groups = new Map<string, IAutoMovieMesh>();
  for (const item of current) {
    const out: IAutoMovieMesh = groups.get(item.finish) ?? { positions: [], normals: [], uvs: mesh.uvs ? [] : null, indices: [], skin: null };
    groups.set(item.finish, out);
    for (let i = 1; i + 1 < item.polygon.length; i++) {
      const vertices = [item.polygon[0]!, item.polygon[i]!, item.polygon[i + 1]!];
      const a = vertices[0]!.p, b = vertices[1]!.p, c = vertices[2]!.p;
      const ab = b.map((v, k) => v - a[k]!), ac = c.map((v, k) => v - a[k]!);
      if (Math.hypot(ab[1]! * ac[2]! - ab[2]! * ac[1]!, ab[2]! * ac[0]! - ab[0]! * ac[2]!, ab[0]! * ac[1]! - ab[1]! * ac[0]!) < 1e-12) continue;
      for (const vertex of vertices) {
        out.indices!.push(out.positions.length / 3);
        out.positions.push(...vertex.p); out.normals!.push(...vertex.n);
        if (out.uvs && vertex.uv) out.uvs.push(...vertex.uv);
      }
    }
  }
  return [...groups].filter(([, value]) => value.positions.length).map(([material, value]) => ({ finish: material, mesh: value }));
}
