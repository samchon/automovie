/** Compare every exterior standing patch with the opaque mesh below it. */
import * as engineNamespace from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieSurface, IAutoMovieVector3, IAutoMovieWorldSurface } from "@automovie/interface";
import type { IHouse } from "../spaces/house";
import type { IHousePart } from "../spaces/solids";

const { worldSurfaceHeight } = (engineNamespace as typeof engineNamespace & { default?: typeof engineNamespace }).default ?? engineNamespace;
const standingHeight = (surface: IAutoMovieSurface, x: number, z: number): number =>
  worldSurfaceHeight(surface as unknown as IAutoMovieWorldSurface, { x, z });

interface ITriangle {
  a: IAutoMovieVector3;
  b: IAutoMovieVector3;
  c: IAutoMovieVector3;
  x: readonly [number, number];
  z: readonly [number, number];
}

const triangles = (part: IHousePart): ITriangle[] => {
  const mesh = part.mesh;
  if (mesh.indices === null) throw new Error(`${part.id}: support mesh has no indices`);
  const point = (i: number): IAutoMovieVector3 => ({ x: mesh.positions[3 * i]!, y: mesh.positions[3 * i + 1]!, z: mesh.positions[3 * i + 2]! });
  const result: ITriangle[] = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const a = point(mesh.indices[i]!);
    const b = point(mesh.indices[i + 1]!);
    const c = point(mesh.indices[i + 2]!);
    result.push({ a, b, c, x: [Math.min(a.x, b.x, c.x), Math.max(a.x, b.x, c.x)], z: [Math.min(a.z, b.z, c.z), Math.max(a.z, b.z, c.z)] });
  }
  return result;
};

const meshTop = (faces: readonly ITriangle[], x: number, z: number, standing: number): number | null => {
  let nearest: number | null = null;
  for (const { a, b, c, x: xr, z: zr } of faces) {
    if (x < xr[0] - 1e-8 || x > xr[1] + 1e-8 || z < zr[0] - 1e-8 || z > zr[1] + 1e-8) continue;
    const d = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    if (Math.abs(d) < 1e-10) continue;
    const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / d;
    const v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / d;
    if (u < -1e-7 || v < -1e-7 || u + v > 1 + 1e-7) continue;
    const y = u * a.y + v * b.y + (1 - u - v) * c.y;
    if (nearest === null || Math.abs(y - standing) < Math.abs(nearest - standing)) nearest = y;
  }
  return nearest;
};

const inPolygon = (polygon: readonly IAutoMovieVector3[], x: number, z: number): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
};

/** Check a 0.05 m grid and every shared straight seam to 1 mm. */
export const verifyExteriorSupport = (house: IHouse, environment: IAutoMovieBuiltEnvironment): number => {
  const zones = new Map(house.zones.map((zone) => [zone.id, zone]));
  const byOwner = new Map<string, ITriangle[]>();
  for (const part of house.parts.filter((p) => p.role === "paving" || p.role === "porch")) {
    const list = byOwner.get(part.owner) ?? [];
    list.push(...triangles(part));
    byOwner.set(part.owner, list);
  }
  const exterior = environment.surfaces.filter((entry) => zones.has(entry.space));
  let sampled = 0;
  for (const { space, surface } of exterior) {
    const zone = zones.get(space)!;
    const owner = zone.owner;
    const faces = byOwner.get(owner) ?? [];
    const xs = surface.polygon.map((p) => p.x);
    const zs = surface.polygon.map((p) => p.z);
    for (let x = Math.min(...xs) + 0.025; x < Math.max(...xs); x += 0.05)
      for (let z = Math.min(...zs) + 0.025; z < Math.max(...zs); z += 0.05) {
        if (!inPolygon(surface.polygon, x, z)) continue;
        const declared = standingHeight(surface, x, z);
        const actual = meshTop(faces, x, z, declared);
        if (actual === null || Math.abs(actual - declared) > 0.001)
          throw new Error(`${surface.id}: standing ${declared.toFixed(4)} differs from opaque paving ${actual?.toFixed(4) ?? "absent"} at (${x.toFixed(3)}, ${z.toFixed(3)})`);
        if (zone.groundAt !== undefined && Math.abs(zone.groundAt(x, z) - declared) > 0.001)
          throw new Error(`${surface.id}: groundAt ${zone.groundAt(x, z).toFixed(4)} differs from standing ${declared.toFixed(4)} at (${x.toFixed(3)}, ${z.toFixed(3)})`);
        sampled++;
      }
  }
  for (let i = 0; i < exterior.length; i++) {
    const a = exterior[i]!;
    for (let j = i + 1; j < exterior.length; j++) {
      const b = exterior[j]!;
      for (let ai = 0; ai < a.surface.polygon.length; ai++) {
        const p = a.surface.polygon[ai]!;
        const q = a.surface.polygon[(ai + 1) % a.surface.polygon.length]!;
        for (let bi = 0; bi < b.surface.polygon.length; bi++) {
          const r = b.surface.polygon[bi]!;
          const s = b.surface.polygon[(bi + 1) % b.surface.polygon.length]!;
          const vertical = Math.abs(p.x - q.x) < 1e-8 && Math.abs(r.x - s.x) < 1e-8 && Math.abs(p.x - r.x) < 1e-8;
          const horizontal = Math.abs(p.z - q.z) < 1e-8 && Math.abs(r.z - s.z) < 1e-8 && Math.abs(p.z - r.z) < 1e-8;
          if (!vertical && !horizontal) continue;
          const start = vertical ? Math.max(Math.min(p.z, q.z), Math.min(r.z, s.z)) : Math.max(Math.min(p.x, q.x), Math.min(r.x, s.x));
          const end = vertical ? Math.min(Math.max(p.z, q.z), Math.max(r.z, s.z)) : Math.min(Math.max(p.x, q.x), Math.max(r.x, s.x));
          if (end - start < 0.05) continue;
          for (let t = start + 0.025; t < end; t += 0.05) {
            const x = vertical ? p.x : t;
            const z = vertical ? t : p.z;
            const ay = standingHeight(a.surface, x, z);
            const by = standingHeight(b.surface, x, z);
            if (Math.abs(ay - by) > 0.001)
              throw new Error(`${a.surface.id}/${b.surface.id}: standing seam differs by ${Math.abs(ay - by).toFixed(4)} at (${x.toFixed(3)}, ${z.toFixed(3)})`);
          }
        }
      }
    }
  }
  return sampled;
};
