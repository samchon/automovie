/** Samples emitted wall triangles from the geometry side, including faces without any boundary address. */
import { Quaternion, tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import type { WallSpec } from "../geometry/wall-solids";

type Point = IAutoMovieVector3;
export interface Triangle { a: Point; b: Point; c: Point; element: string; part: string; minY: number; maxY: number; minX: number; maxX: number; minZ: number; maxZ: number }
export interface AddressCoverageRow { wall: string; face: number; emitted: number; covered: number; uncovered: number; skyOpen: number; surfaces: string[] }
export interface AddressCoverage { step: number; emitted: number; covered: number; uncovered: number; skyOpen: number; rows: AddressCoverageRow[] }

export const rayTriangle = (o: Point, d: Point, { a, b, c }: Pick<Triangle, "a" | "b" | "c">): number | null => {
  const e1 = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const e2 = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const cross = (u: Point, v: Point) => ({ x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x });
  const dot = (u: Point, v: Point) => u.x * v.x + u.y * v.y + u.z * v.z;
  const p = cross(d, e2);
  const det = dot(e1, p);
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  const s = { x: o.x - a.x, y: o.y - a.y, z: o.z - a.z };
  const u = dot(s, p) * inv;
  if (u < 0 || u > 1) return null;
  const q = cross(s, e1);
  const v = dot(d, q) * inv;
  if (v < 0 || u + v > 1) return null;
  const distance = dot(e2, q) * inv;
  return distance > 1e-7 ? distance : null;
};

export const pointInOutline = (polygon: readonly { x: number; y: number }[], x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!, b = polygon[j]!;
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

export const emittedTriangles = (environment: IAutoMovieBuiltEnvironment): Triangle[] => {
  const models = new Map(environment.models.map((model) => [model.id, model]));
  const result: Triangle[] = [];
  for (const element of environment.elements) {
    const model = element.model === null ? undefined : models.get(element.model);
    if (model === undefined) continue;
    for (const part of model.parts) {
      const mesh = part.geometry.type === "mesh" ? part.geometry.mesh : tessellateToMesh(part.geometry.shape);
      if (mesh.positions.length % 9 !== 0 && mesh.indices === null) throw new Error(`address coverage: non-indexed triangle count for ${part.id}`);
      const indices = mesh.indices ?? Array.from({ length: mesh.positions.length / 3 }, (_, i) => i);
      if (indices.length % 3 !== 0) throw new Error(`address coverage: incomplete triangle for ${part.id}`);
      const vertex = (index: number): Point => ({ x: mesh.positions[3 * index]!, y: mesh.positions[3 * index + 1]!, z: mesh.positions[3 * index + 2]! });
      for (let index = 0; index < indices.length; index += 3) {
        const a = vertex(indices[index]!), b = vertex(indices[index + 1]!), c = vertex(indices[index + 2]!);
        result.push({ a, b, c, element: element.id, part: part.id,
          minY: Math.min(a.y, b.y, c.y), maxY: Math.max(a.y, b.y, c.y),
          minX: Math.min(a.x, b.x, c.x), maxX: Math.max(a.x, b.x, c.x),
          minZ: Math.min(a.z, b.z, c.z), maxZ: Math.max(a.z, b.z, c.z),
        });
      }
    }
  }
  return result;
};

/** Every emitted wall plan edge is sampled, even if the authored boundary collection omits it. */
export const addressCoverageCensus = (environment: IAutoMovieBuiltEnvironment, walls: readonly WallSpec[], step = 0.1): AddressCoverage => {
  if (!(step > 0 && step <= 0.1)) throw new Error("address coverage: step must be in (0, 0.1] m");
  const tris = emittedTriangles(environment);
  const bucketSize = 0.5;
  const buckets = new Map<string, Triangle[]>();
  const byElement = new Map<string, Triangle[]>();
  for (const triangle of tris) {
    (byElement.get(triangle.element) ?? byElement.set(triangle.element, []).get(triangle.element)!).push(triangle);
    for (let x = Math.floor(triangle.minX / bucketSize); x <= Math.floor(triangle.maxX / bucketSize); x++) {
      for (let z = Math.floor(triangle.minZ / bucketSize); z <= Math.floor(triangle.maxZ / bucketSize); z++) {
        const key = `${x},${z}`;
        (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(triangle);
      }
    }
  }
  const skyBlocked = (point: Point): boolean => (buckets.get(`${Math.floor(point.x / bucketSize)},${Math.floor(point.z / bucketSize)}`) ?? [])
    .some((triangle) => triangle.maxY >= point.y && rayTriangle(point, { x: 0, y: 1, z: 0 }, triangle) !== null);
  const rows: AddressCoverageRow[] = [];
  let emitted = 0, covered = 0, skyOpen = 0;
  for (const wall of walls) {
    const element = `element.${wall.id}`;
    const own = byElement.get(element) ?? [];
    if (own.length === 0) continue;
    const boundaries = environment.boundaries.filter((boundary) => boundary.elements.includes(element) && boundary.face !== undefined).map((boundary) => {
      const face = boundary.face!;
      return { face, normal: Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 }), axis: Quaternion.rotateVector(face.rotation, { x: 1, y: 0, z: 0 }) };
    });
    const cx = wall.plan.reduce((sum, point) => sum + point.x, 0) / wall.plan.length;
    const cz = wall.plan.reduce((sum, point) => sum + point.z, 0) / wall.plan.length;
    const minY = Math.min(...own.map((t) => t.minY));
    const maxY = Math.max(...own.map((t) => t.maxY));
    for (let faceIndex = 0; faceIndex < wall.plan.length; faceIndex++) {
      const a = wall.plan[faceIndex]!, b = wall.plan[(faceIndex + 1) % wall.plan.length]!;
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      if (length < 1e-6) continue;
      const direction = { x: (b.x - a.x) / length, z: (b.z - a.z) / length };
      let normal = { x: direction.z, z: -direction.x };
      const midpoint = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
      if ((midpoint.x - cx) * normal.x + (midpoint.z - cz) * normal.z < 0) normal = { x: -normal.x, z: -normal.z };
      const candidates = own.filter((t) => Math.abs(((t.a.x + t.b.x + t.c.x) / 3 - a.x) * normal.x + ((t.a.z + t.b.z + t.c.z) / 3 - a.z) * normal.z) < 0.02);
      let faceEmitted = 0, faceCovered = 0, faceSky = 0;
      const surfaces = new Set<string>();
      for (let distance = step / 2; distance < length; distance += step) {
        for (let height = Math.ceil(minY / step) * step + step / 2; height < maxY; height += step) {
          const point = { x: a.x + direction.x * (distance + 0.000137), y: height + 0.000211, z: a.z + direction.z * (distance + 0.000137) };
          const outside = { x: point.x + normal.x * 0.004, y: point.y, z: point.z + normal.z * 0.004 };
          const emittedPart = candidates.find((triangle) => {
            const hit = rayTriangle(outside, { x: -normal.x, y: 0, z: -normal.z }, triangle);
            return hit !== null && hit < 0.008;
          });
          if (emittedPart === undefined) continue;
          emitted++; faceEmitted++;
          const addressed = boundaries.some(({ face, normal: faceNormal, axis }) => {
            const dx = point.x - face.origin.x, dy = point.y - face.origin.y, dz = point.z - face.origin.z;
            const offset = Math.abs(dx * faceNormal.x + dy * faceNormal.y + dz * faceNormal.z);
            return Math.abs(offset - face.thickness / 2) <= 0.01 && pointInOutline(face.outline, dx * axis.x + dy * axis.y + dz * axis.z, point.y);
          });
          if (addressed) { covered++; faceCovered++; continue; }
          surfaces.add(emittedPart.part);
          if (!skyBlocked({ x: point.x + normal.x * 0.1, y: point.y, z: point.z + normal.z * 0.1 })) { skyOpen++; faceSky++; }
        }
      }
      rows.push({ wall: wall.id, face: faceIndex, emitted: faceEmitted, covered: faceCovered,
        uncovered: faceEmitted - faceCovered, skyOpen: faceSky, surfaces: [...surfaces].sort((a, b) => a.localeCompare(b)) });
    }
  }
  return { step, emitted, covered, uncovered: emitted - covered, skyOpen, rows };
};
