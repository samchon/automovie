/** Independent Euclidean observations of raw millimetre triangles; no Human code is imported. */
export namespace HumanRawGeometry {
  /** Coordinates in the fixed source frame: forward X, up Y, lateral Z. */
  export type Point = readonly [number, number, number];
  /** Plain output buffers, copied from the producer without evaluating its construction. */
  export interface Mesh {
    /** Original XYZ triples in millimetres. */
    positions: ArrayLike<number>;
    /** Original zero-based triangle vertex indices. */
    indices: ArrayLike<number>;
  }
  /** A geometric nearest point and the independently derived triangle normal. */
  export interface Hit {
    /** Closest point on the actual target triangle, in mm. */
    point: Point;
    /** Unsigned Euclidean separation, in mm. */
    distance: number;
    /** Original target face index. */
    triangle: number;
    /** Unit cross-product normal from the target face's own winding. */
    normal: Point;
  }
  /** An area quadrature address, retaining the original face and barycentric location. */
  export interface Sample {
    /** Actual quadrature coordinate in millimetres. */
    point: Point;
    /** Original face's geometric unit normal. */
    normal: Point;
    /** Positive quadrature area weight, in square millimetres. */
    area: number;
    /** Original input face index. */
    triangle: number;
    /** Degree-two barycentric quadrature address. */
    barycentric: Point;
  }
  /** A malformed raw observation retains its actual address instead of a fabricated origin. */
  export interface Issue {
    /** Original face index; null for a buffer/vertex-level failure. */
    triangle: number | null;

    /** Original material vertex index; null without an attributable vertex. */
    vertex: number | null;

    /** Actual raw coordinate; null when no such coordinate exists. */
    coordinate: Point | null;

    /** Exact finite/domain/area refusal and original buffer index where applicable. */
    reason: string;
  }
  /** Axis-aligned hierarchy node. */
  interface Node { low: Point; high: Point; faces: number[]; left?: Node; right?: Node; }

  /** Subtract points without depending on production vector or measurement helpers. */
  export function sub(a: Point, b: Point): Point { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** Euclidean scalar product in the registered frame. */
  export function dot(a: Point, b: Point): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Oriented cross product; triangle winding determines the normal sign. */
  export function cross(a: Point, b: Point): Point { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  /** Read an indexed point; input validation occurs once before constructing the hierarchy. */
  export function vertex(mesh: Mesh, index: number): Point { return [mesh.positions[index * 3]!, mesh.positions[index * 3 + 1]!, mesh.positions[index * 3 + 2]!]; }
  /** Return the original triangle's three vertices. */
  export function triangle(mesh: Mesh, face: number): readonly [Point, Point, Point] { return [vertex(mesh, mesh.indices[face * 3]!), vertex(mesh, mesh.indices[face * 3 + 1]!), vertex(mesh, mesh.indices[face * 3 + 2]!)]; }

  /** Collect every malformed buffer or triangle; an absent observation is never zero error. */
  export function invalid(mesh: Mesh): string[] {
    return inspect(mesh).map((issue: Issue): string => issue.reason);
  }
  /** Collect every invalid raw coordinate/index/face with its original physical address. */
  export function inspect(mesh: Mesh): Issue[] {
    const issues: Issue[] = [];
    if (mesh?.positions === undefined || mesh.positions === null || mesh?.indices === undefined || mesh.indices === null) return [{ triangle: null, vertex: null, coordinate: null, reason: "Raw positions and indices buffers are required" }];
    if (![mesh.positions.length, mesh.indices.length].every((length: number): boolean => Number.isSafeInteger(length) && length >= 0)) return [{ triangle: null, vertex: null, coordinate: null, reason: "Raw buffer lengths must be finite nonnegative safe integers" }];
    if (mesh.positions.length === 0 || mesh.positions.length % 3 !== 0) issues.push({ triangle: null, vertex: null, coordinate: null, reason: "positions must contain nonempty XYZ triples" });
    if (mesh.indices.length === 0 || mesh.indices.length % 3 !== 0) issues.push({ triangle: null, vertex: null, coordinate: null, reason: "indices must contain nonempty triangle triples" });
    for (let i: number = 0; i < mesh.positions.length; i++) if (!Number.isFinite(mesh.positions[i])) { const index: number = Math.floor(i / 3); issues.push({ triangle: null, vertex: index, coordinate: vertex(mesh, index), reason: `coordinate ${i}: non-finite ${String(mesh.positions[i])}` }); }
    for (let i: number = 0; i < mesh.indices.length; i++) if (!Number.isInteger(mesh.indices[i]) || mesh.indices[i]! < 0 || mesh.indices[i]! * 3 + 2 >= mesh.positions.length) issues.push({ triangle: Math.floor(i / 3), vertex: null, coordinate: null, reason: `index ${i}: missing vertex ${String(mesh.indices[i])}` });
    if (issues.length !== 0) return issues;
    for (let face: number = 0; face < mesh.indices.length / 3; face++) {
      const [a, b, c]: readonly [Point, Point, Point] = triangle(mesh, face);
      const normal: Point = cross(sub(b, a), sub(c, a));
      const twiceArea: number = Math.hypot(...normal);
      if (!Number.isFinite(twiceArea) || twiceArea <= 0) issues.push({ triangle: face, vertex: mesh.indices[face * 3]!, coordinate: a, reason: `triangle ${face}: non-positive or non-finite area; vertices ${JSON.stringify([a, b, c])}` });
    }
    return issues;
  }

  /** Three degree-two barycentric quadrature points per actual triangle, with positive area weights. */
  export function samples(mesh: Mesh): Sample[] {
    const result: Sample[] = [];
    const barycentric: Point[] = [[2 / 3, 1 / 6, 1 / 6], [1 / 6, 2 / 3, 1 / 6], [1 / 6, 1 / 6, 2 / 3]];
    for (let face: number = 0; face < mesh.indices.length / 3; face++) {
      const [a, b, c]: readonly [Point, Point, Point] = triangle(mesh, face);
      const raw: Point = cross(sub(b, a), sub(c, a));
      const length: number = Math.hypot(...raw);
      const normal: Point = [raw[0] / length, raw[1] / length, raw[2] / length];
      for (const weights of barycentric) result.push({ point: [0, 1, 2].map((axis: number): number => a[axis]! * weights[0] + b[axis]! * weights[1] + c[axis]! * weights[2]) as unknown as Point, normal, area: length / 6, triangle: face, barycentric: weights });
    }
    return result;
  }

  /** Exact nearest triangle and normal-line observations accelerated only by Euclidean box bounds. */
  export class Index {
    /** Frozen defensive copies prevent mutation from invalidating the hierarchy. */
    public readonly mesh: Mesh;
    /** Immutable geometry and its hierarchy, prepared only after all validity findings are known. */
    private readonly root: Node;
    /** Refuse malformed input explicitly instead of dropping bad faces. */
    public constructor(mesh: Mesh) {
      const issues: string[] = invalid(mesh);
      if (issues.length !== 0) throw new Error(issues.join("\n"));
      this.mesh = Object.freeze({ positions: Object.freeze(Array.from(mesh.positions)), indices: Object.freeze(Array.from(mesh.indices)) });
      const centres: Float64Array = new Float64Array(this.mesh.indices.length);
      for (let face: number = 0; face < this.mesh.indices.length / 3; face++) for (let axis: number = 0; axis < 3; axis++) centres[face * 3 + axis] = this.mesh.positions[this.mesh.indices[face * 3]! * 3 + axis]! + this.mesh.positions[this.mesh.indices[face * 3 + 1]! * 3 + axis]! + this.mesh.positions[this.mesh.indices[face * 3 + 2]! * 3 + axis]!;
      this.root = build(this.mesh, Array.from({ length: this.mesh.indices.length / 3 }, (_: unknown, index: number): number => index), centres);
    }
    /** Closest point across all triangles; no spatial cutoff can hide a distant spike. */
    public nearest(point: Point): Hit {
      if (!point.every(Number.isFinite)) throw new Error("query has a non-finite coordinate");
      let best: Hit | undefined;
      const visit: (node: Node) => void = (node: Node): void => {
        if (boxDistance(point, node) > (best?.distance ?? Infinity)) return;
        if (node.left !== undefined && node.right !== undefined) {
          const ordered: Node[] = [node.left, node.right].sort((a: Node, b: Node): number => boxDistance(point, a) - boxDistance(point, b));
          visit(ordered[0]!); visit(ordered[1]!); return;
        }
        for (const face of node.faces) {
          const [a, b, c]: readonly [Point, Point, Point] = triangle(this.mesh, face);
          const candidate: Point = closest(point, a, b, c);
          const distance: number = Math.hypot(...sub(point, candidate));
          if (!candidate.every(Number.isFinite) || !Number.isFinite(distance)) throw new Error(`triangle ${face}: unresolved nearest arithmetic at ${JSON.stringify(point)}`);
          if (best === undefined || distance < best.distance) {
            const raw: Point = cross(sub(b, a), sub(c, a));
            const length: number = Math.hypot(...raw);
            best = { point: candidate, distance, triangle: face, normal: [raw[0] / length, raw[1] / length, raw[2] / length] };
          }
        }
      };
      visit(this.root);
      if (best === undefined) throw new Error("nonempty geometry supplied no nearest point");
      return best;
    }
    /** Nearest signed intersection on the full source-normal line, or explicit unavailable. */
    public normalDistance(point: Point, direction: Point): number | undefined {
      if (![...point, ...direction].every(Number.isFinite) || Math.abs(Math.hypot(...direction) - 1) > 1e-10) throw new Error("normal query requires finite point and unit direction");
      let best: number | undefined;
      const visit: (node: Node) => void = (node: Node): void => {
        if (!lineBox(point, direction, node, Math.abs(best ?? Infinity))) return;
        if (node.left !== undefined && node.right !== undefined) {
          const ordered: Node[] = [node.left, node.right].sort((a: Node, b: Node): number => lineBoxDistance(point, direction, a) - lineBoxDistance(point, direction, b));
          visit(ordered[0]!); visit(ordered[1]!); return;
        }
        for (const face of node.faces) {
          const [a, b, c]: readonly [Point, Point, Point] = triangle(this.mesh, face);
          const u: Point = sub(b, a); const v: Point = sub(c, a);
          const h: Point = cross(direction, v); const determinant: number = dot(u, h);
          if (Math.abs(determinant) <= Number.EPSILON * Math.hypot(...u) * Math.hypot(...v) * 16) continue;
          const offset: Point = sub(point, a); const first: number = dot(offset, h) / determinant;
          const q: Point = cross(offset, u); const second: number = dot(direction, q) / determinant;
          if (first < -1e-12 || second < -1e-12 || first + second > 1 + 1e-12) continue;
          const distance: number = dot(v, q) / determinant;
          if (!Number.isFinite(distance)) throw new Error(`triangle ${face}: unresolved normal intersection arithmetic at ${JSON.stringify(point)}`);
          if (best === undefined || Math.abs(distance) < Math.abs(best)) best = distance;
        }
      };
      visit(this.root); return best;
    }
  }

  /** Median hierarchy construction; it changes search order only, never the target surface. */
  function build(mesh: Mesh, faces: number[], centres: Float64Array): Node {
    const low: number[] = [Infinity, Infinity, Infinity]; const high: number[] = [-Infinity, -Infinity, -Infinity];
    for (const face of faces) for (let corner: number = 0; corner < 3; corner++) for (let axis: number = 0; axis < 3; axis++) { const value: number = mesh.positions[mesh.indices[face * 3 + corner]! * 3 + axis]!; low[axis] = Math.min(low[axis]!, value); high[axis] = Math.max(high[axis]!, value); }
    const node: Node = { low: low as unknown as Point, high: high as unknown as Point, faces: [] };
    if (faces.length <= 8) { node.faces = faces; return node; }
    const axis: number = [0, 1, 2].sort((a: number, b: number): number => high[b]! - low[b]! - (high[a]! - low[a]!))[0]!;
    const centre: (face: number) => number = (face: number): number => centres[face * 3 + axis]!;
    faces.sort((a: number, b: number): number => centre(a) - centre(b));
    const middle: number = Math.floor(faces.length / 2);
    node.left = build(mesh, faces.slice(0, middle), centres); node.right = build(mesh, faces.slice(middle), centres); return node;
  }
  /** Exact point-to-box lower bound in millimetres. */
  function boxDistance(point: Point, node: Node): number { return Math.hypot(...point.map((value: number, axis: number): number => Math.max(0, node.low[axis]! - value, value - node.high[axis]!))); }
  /** Slab test handles exactly zero direction components without Infinity-times-zero NaNs. */
  function lineBox(point: Point, direction: Point, node: Node, reach: number): boolean {
    let low: number = -reach; let high: number = reach;
    for (let axis: number = 0; axis < 3; axis++) {
      if (direction[axis] === 0) { if (point[axis]! < node.low[axis]! || point[axis]! > node.high[axis]!) return false; continue; }
      const a: number = (node.low[axis]! - point[axis]!) / direction[axis]!; const b: number = (node.high[axis]! - point[axis]!) / direction[axis]!;
      low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b)); if (low > high) return false;
    }
    return true;
  }
  /** Minimum possible absolute ray parameter for a child; this changes visitation order only. */
  function lineBoxDistance(point: Point, direction: Point, node: Node): number {
    let low: number = -Infinity; let high: number = Infinity;
    for (let axis: number = 0; axis < 3; axis++) {
      if (direction[axis] === 0) { if (point[axis]! < node.low[axis]! || point[axis]! > node.high[axis]!) return Infinity; continue; }
      const a: number = (node.low[axis]! - point[axis]!) / direction[axis]!; const b: number = (node.high[axis]! - point[axis]!) / direction[axis]!;
      low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b)); if (low > high) return Infinity;
    }
    return low <= 0 && high >= 0 ? 0 : Math.min(Math.abs(low), Math.abs(high));
  }
  /** Closest point from the triangle's seven Voronoi regions (Ericson, Real-Time Collision Detection, section 5.1.5). */
  function closest(p: Point, a: Point, b: Point, c: Point): Point {
    const ab: Point = sub(b, a); const ac: Point = sub(c, a); const ap: Point = sub(p, a);
    const d1: number = dot(ab, ap); const d2: number = dot(ac, ap); if (d1 <= 0 && d2 <= 0) return a;
    const bp: Point = sub(p, b); const d3: number = dot(ab, bp); const d4: number = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return b;
    const vc: number = d1 * d4 - d3 * d2;
    const interpolate: (origin: Point, delta: Point, t: number) => Point = (origin: Point, delta: Point, t: number): Point => [origin[0] + delta[0] * t, origin[1] + delta[1] * t, origin[2] + delta[2] * t];
    if (vc <= 0 && d1 >= 0 && d3 <= 0) return interpolate(a, ab, d1 / (d1 - d3));
    const cp: Point = sub(p, c); const d5: number = dot(ab, cp); const d6: number = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return c;
    const vb: number = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) return interpolate(a, ac, d2 / (d2 - d6));
    const va: number = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return interpolate(b, sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6));
    const denominator: number = 1 / (va + vb + vc); const v: number = vb * denominator; const w: number = vc * denominator;
    return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
  }
}
