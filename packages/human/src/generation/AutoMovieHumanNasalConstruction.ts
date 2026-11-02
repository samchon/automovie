/** Physical nasal surfaces and queries against their emitted triangle geometry. */
export namespace AutoMovieHumanNasalConstruction {

  /** World-space Cartesian coordinates in the head construction's millimetres. */
  export type Point = [number, number, number];

  /** A boundary value and its derivatives in the owner's physical parameter. */
  export interface Jet {
 
    /** The surface relief value at the shared boundary, in millimetres. */
    value: number;
 
    /** Relief derivative with respect to physical vertical station, dimensionless. */
    first: number;
 
    /** Second relief derivative with respect to vertical station, in inverse millimetres. */
    second: number; 
  }

  /** The physical origin and orthonormal directions of a nasal construction. */
  export interface Frame {
 
    /** The physical world-space origin of this frame or ray. */
    origin: Point;
 
    /** The unit direction of increasing forward coordinates in the source frame. */
    forward: Point;
 
    /** The unit direction used to project positive lateral dimensions. */
    lateral: Point;
 
    /** The source surface normal or cutting-plane normal in world coordinates. */
    normal: Point; 
  }

  /** An emitted physical surface, indexed by triangles into its vertex array. */
  export interface Mesh {
 
    /** Ordered physical surface vertices; paths retain their actual world heights. */
    points: Point[];
 
    /** Three vertex indices per face, referring to the same emitted point array. */
    triangles: [number, number, number][]; 
  }

  /** The nasal bridge surface and its shared frontal boundary. */
  export interface Bridge {

    /** Physical vertical station of the shared frontal and nasal boundary. */
    root: number;

    /** Physical station where the existing dorsum supplies its endpoint jets. */
    join: number;

    /** Physical relief, with a shared zero-height, zero-jet frontal seam. */
    height: (station: number, across: number) => number;

    /** The transverse boundary actually used by both patches. */
    seam: Point[];

    /** The anatomical junction's outward ray, never a deepest-point result. */
    junction: {
 
    /** The physical world-space origin of this frame or ray. */
    origin: Point;
 
    /** The world-space ray direction used to observe the physical surface. */
    direction: Point };

    /** The actual emitted vertices and triangles used by geometric observers. */
    mesh: Mesh;
  }

  /** Adjacent face geometry and existing dorsum jets used to close the bridge. */
  export interface BridgeInputs {

    /** Physical vertical station of the shared frontal and nasal boundary. */
    root: number;

    /** Last existing dorsum knot below the root, in physical coordinates. */
    join: number;

    /** Physical lower bridge station at the nasal tip. */
    tip: number;

    /** Positive lateral nasal extent in physical millimetres. */
    halfWidth: number;

    /** Existing dorsum profile's physical value and derivatives at join. */
    jet: Jet | ((across: number) => Jet);

    /** The existing dorsum relief below the endpoint-jet replacement span. */
    profile: (station: number, across: number) => number;

    /** Existing physical dorsum width at a vertical station. */
    width: (station: number) => number;

    /** Frontal surface at and above the shared junction. */
    face: (station: number, across: number) => number;

    /** The physical frontonasal frame point from which the observation ray starts. */
    boneJoint: Point;

    /** The source surface normal or cutting-plane normal in world coordinates. */
    normal: Point;
  }

  /** Replace only the last existing profile span by an endpoint-jet span. */
  export function bridge(input: BridgeInputs): Bridge {
    const run: number = input.root - input.join;
    if (!(run > 0) || !(input.join > input.tip) || !(input.halfWidth > 0))
      throw new Error("The nasal bridge requires ordered physical boundaries.");
    const height = (station: number, across: number): number => {
      if (station >= input.root) return 0;
      const jet: Jet = typeof input.jet === "function" ? input.jet(across) : input.jet;
      const a0: number = jet.value;
      const a1: number = jet.first * run;
      const a2: number = jet.second * run * run / 2;
      const a3: number = -10 * a0 - 6 * a1 - 3 * a2;
      const a4: number = 15 * a0 + 8 * a1 + 3 * a2;
      const a5: number = -6 * a0 - 3 * a1 - a2;
      const t: number = (station - input.join) / run;
      const h: number = station <= input.join ? input.profile(station, across)
        : a0 + t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
      const u: number = across / input.width(station);
      return typeof input.jet === "function" ? h : h * Math.exp(-u * u / 2);
    };
    const columns: number = 32;
    const rows: number = 64;
    const points: Point[] = [];
    const triangles: [number, number, number][] = [];
    for (let row: number = 0; row <= rows; row++) {
      const y: number = input.tip + (input.root - input.tip) * row / rows;
      for (let column: number = 0; column <= columns; column++) {
        const z: number = input.halfWidth * (2 * column / columns - 1);
        points.push([input.face(y, z) + height(y, z), y, z]);
        if (row < rows && column < columns) {
          const a: number = row * (columns + 1) + column;
          triangles.push([a, a + columns + 1, a + 1], [a + 1, a + columns + 1, a + columns + 2]);
        }
      }
    }
    return {
      root: input.root, join: input.join, height,
      seam: points.slice(rows * (columns + 1)),
      junction: { origin: input.boneJoint, direction: normalized(input.normal) },
      mesh: { points, triangles },
    };
  }

  /** A planar inner rim and the physical clearance available for cartilage. */
  export interface AlaInputs {

    /** The source frame locating the rim and its positive lateral direction. */
    frame: Frame;

    /** Actual inner nostril curve in the nasal-base plane, counterclockwise. */
    rim: readonly [number, number][];

    /** Cartilage's positive lateral boundary in that plane. */
    outerHalfWidth: number;

    /** Physical attachment depth; it changes the crease, not cartilage. */
    attachmentDepth: number;
  }

  /** Swept cartilage geometry with queries against its emitted triangles. */
  export interface Ala {

    /** The source frame locating the rim and its positive lateral direction. */
    frame: Frame;

    /** Cartilage radius derived from positive available lateral clearance, in millimetres. */
    radius: number;

    /** Inner opening, outer cartilage and posterior facial attachment. */
    inner: Point[];

    /** The outer cartilage boundary; final visibility requires assembled-skin verification. */
    crest: Point[];

    /** Posterior attachment reference points; this swept mesh does not include a facial joining patch. */
    attachment: Point[];

    /** The actual emitted vertices and triangles used by geometric observers. */
    mesh: Mesh;

    /** Signed distance to the swept cartilage, for radial composition. */
    field: (point: Point) => number;

    /** Furthest positive intersection with the emitted cartilage, or undefined when no triangle is hit. */
    front: (origin: Point, direction: Point) => Point | undefined;
  }

  /**
   * A swept cartilage tube starts exactly at the existing inner rim. Its
   * thickness is the available clearance to the outer nasal dimension.
   * The emitted surface is a full tube. Attachment points are returned separately and do not add a facial joining surface.
   */
  export function ala(input: AlaInputs): Ala {
    const count: number = input.rim.length;
    if (count < 8) throw new Error("The alar rim needs a closed physical curve.");
    const outer: number = Math.max(...input.rim.map((p: readonly number[]): number => p[1]!));
    const radius: number = (input.outerHalfWidth - outer) / 2;
    if (!(radius > 0) || !(input.attachmentDepth >= 0))
      throw new Error("The nostril and outer ala have no positive cartilage clearance.");
    const centers: Point[] = [];
    const normals: Point[] = [];
    const inner: Point[] = [];
    const crest: Point[] = [];
    const attachment: Point[] = [];
    const map = (p: readonly number[]): Point => add(input.frame.origin,
      add(scale(input.frame.forward, p[0]!), scale(input.frame.lateral, p[1]!)));
    for (let i: number = 0; i < count; i++) {
      const p: readonly number[] = input.rim[i]!;
      const a: readonly number[] = input.rim[(i + count - 1) % count]!;
      const b: readonly number[] = input.rim[(i + 1) % count]!;
      const tangent: Point = normalized(add(scale(input.frame.forward, b[0]! - a[0]!), scale(input.frame.lateral, b[1]! - a[1]!)));
      const outward: Point = normalized(cross(tangent, input.frame.normal));
      const point: Point = map(p);
      const center: Point = add(point, scale(outward, radius));
      centers.push(center); normals.push(outward); inner.push(point);
      crest.push(add(center, scale(outward, radius)));
      attachment.push(add(add(center, scale(outward, radius)), scale(input.frame.normal, -input.attachmentDepth)));
    }
    const columns: number = 24;
    const points: Point[] = [];
    const triangles: [number, number, number][] = [];
    for (let i: number = 0; i < count; i++) {
      for (let j: number = 0; j < columns; j++) {
        const angle: number = 2 * Math.PI * j / columns;
        points.push(add(centers[i]!, add(scale(normals[i]!, radius * Math.cos(angle)), scale(input.frame.normal, radius * Math.sin(angle)))));
        const a: number = i * columns + j;
        const b: number = (i + 1) % count * columns + j;
        const nextA: number = i * columns + (j + 1) % columns;
        const nextB: number = (i + 1) % count * columns + (j + 1) % columns;
        triangles.push([a, b, nextA], [nextA, b, nextB]);
      }
    }
    const index: MeshIndex = new MeshIndex({ points, triangles });
    const field = (point: Point): number => index.signedDistance(point);
    const front = (origin: Point, direction: Point): Point | undefined => {
      let result: Point | undefined;
      let furthest: number = -Infinity;
      for (const t of index.intersections(origin, direction))
        if (t >= 0 && t > furthest) { furthest = t; result = add(origin, scale(direction, t)); }
      return result;
    };
    return { frame: input.frame, radius, inner, crest, attachment, mesh: { points, triangles }, field, front };
  }

  /** Add Cartesian vectors componentwise in their shared physical frame. */
  export function add(a: Point, b: Point): Point {
     return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; 
  }

  /** Subtract Cartesian vectors componentwise in their shared physical frame. */
  export function sub(a: Point, b: Point): Point {
     return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; 
  }

  /** Multiply each Cartesian component by the supplied scalar. */
  export function scale(a: Point, k: number): Point {
     return [a[0] * k, a[1] * k, a[2] * k]; 
  }

  /** Compute the Euclidean inner product used for projections and physical parameter changes. */
  export function dot(a: Point, b: Point): number {
     return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; 
  }

  /** Compute the oriented Cartesian cross product in the world frame. */
  export function cross(a: Point, b: Point): Point {
     return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; 
  }

  /** Normalize a nonzero Cartesian vector; a zero-length input produces nonfinite coordinates. */
  export function normalized(a: Point): Point {
     return scale(a, 1 / Math.hypot(...a)); 
  }

  /** A bounding-volume tree node over actual emitted mesh triangles. */
  interface Node {
 
    /** Componentwise lower bound of the indexed triangles in world coordinates. */
    low: Point;
 
    /** Componentwise upper bound of the indexed triangles in world coordinates. */
    high: Point;
 
    /** The first spatial child; absent when this node directly owns triangle indices. */
    left?: Node;
 
    /** The second spatial child; absent when this node directly owns triangle indices. */
    right?: Node;
 
    /** Triangle indices owned by a leaf; internal nodes instead hold children. */
    faces?: number[]; 
  }

  /** Spatial index of the actual emitted triangles, without a second surface. */
  export class MeshIndex {
    private root: Node;

    /** Index the supplied emitted mesh once for subsequent physical intersection and distance queries. */
    public constructor(private mesh: Mesh) {
      const build = (faces: number[]): Node => {
        const low: Point = [Infinity, Infinity, Infinity];
        const high: Point = [-Infinity, -Infinity, -Infinity];
        for (const face of faces) for (const vertex of mesh.triangles[face]!) for (let j: number = 0; j < 3; j++) {
          low[j] = Math.min(low[j]!, mesh.points[vertex]![j]!);
          high[j] = Math.max(high[j]!, mesh.points[vertex]![j]!);
        }
        if (faces.length <= 12) return { low, high, faces };
        let axis: number = 0;
        for (let j: number = 1; j < 3; j++) if (high[j]! - low[j]! > high[axis]! - low[axis]!) axis = j;
        const center = (face: number): number => mesh.triangles[face]!.reduce((sum: number, v: number): number => sum + mesh.points[v]![axis]!, 0);
        faces.sort((a: number, b: number): number => center(a) - center(b));
        const half: number = faces.length >>> 1;
        return { low, high, left: build(faces.slice(0, half)), right: build(faces.slice(half)) };
      };
      this.root = build(mesh.triangles.map((_: unknown, i: number): number => i));
    }

    /** Return sorted positive ray parameters against emitted triangles, merging shared-edge duplicates. */
    public intersections(origin: Point, direction: Point): number[] {
      const result: number[] = [];
      const intersects = (node: Node): boolean => {
        let low: number = 0;
        let high: number = Infinity;
        for (let j: number = 0; j < 3; j++) {
          if (Math.abs(direction[j]!) < 1e-14) {
            if (origin[j]! < node.low[j]! || origin[j]! > node.high[j]!) return false;
          } else {
            const a: number = (node.low[j]! - origin[j]!) / direction[j]!;
            const b: number = (node.high[j]! - origin[j]!) / direction[j]!;
            low = Math.max(low, Math.min(a, b)); high = Math.min(high, Math.max(a, b));
            if (low > high) return false;
          }
        }
        return true;
      };
      const visit = (node: Node): void => {
        if (!intersects(node)) return;
        if (node.faces !== undefined) for (const face of node.faces) {
          const indices: [number, number, number] = this.mesh.triangles[face]!;
          const t: number | undefined = ray(origin, direction, this.mesh.points[indices[0]]!, this.mesh.points[indices[1]]!, this.mesh.points[indices[2]]!);
          if (t !== undefined && t >= 0) result.push(t);
        } else { visit(node.left!); visit(node.right!); }
      };
      visit(this.root);
      result.sort((a: number, b: number): number => a - b);
      return result.filter((t: number, i: number): boolean => i === 0 || t - result[i - 1]! > 1e-8);
    }

    /** Measure the nearest actual triangle and use ray parity for the interior sign; closed geometry is required. */
    public signedDistance(point: Point): number {
      let best: number = Infinity;
      const boxDistance = (node: Node): number => {
        let sum: number = 0;
        for (let j: number = 0; j < 3; j++) sum += Math.max(node.low[j]! - point[j]!, 0, point[j]! - node.high[j]!) ** 2;
        return Math.sqrt(sum);
      };
      const segment = (a: Point, b: Point): number => {
        const span: Point = sub(b, a);
        const length: number = dot(span, span);
        const t: number = length > 0 ? Math.max(0, Math.min(1, dot(sub(point, a), span) / length)) : 0;
        return Math.hypot(...sub(point, add(a, scale(span, t))));
      };
      const triangleDistance = (a: Point, b: Point, c: Point): number => {
        const ab: Point = sub(b, a);
        const ac: Point = sub(c, a);
        const ap: Point = sub(point, a);
        const aa: number = dot(ab, ab); const bb: number = dot(ab, ac); const cc: number = dot(ac, ac);
        const denominator: number = aa * cc - bb * bb;
        if (denominator > 1e-20) {
          const u: number = (cc * dot(ap, ab) - bb * dot(ap, ac)) / denominator;
          const v: number = (aa * dot(ap, ac) - bb * dot(ap, ab)) / denominator;
          if (u >= 0 && v >= 0 && u + v <= 1) return Math.hypot(...sub(ap, add(scale(ab, u), scale(ac, v))));
        }
        return Math.min(segment(a, b), segment(b, c), segment(c, a));
      };
      const visit = (node: Node): void => {
        if (boxDistance(node) > best) return;
        if (node.faces !== undefined) for (const face of node.faces) {
          const indices: [number, number, number] = this.mesh.triangles[face]!;
          best = Math.min(best, triangleDistance(this.mesh.points[indices[0]]!, this.mesh.points[indices[1]]!, this.mesh.points[indices[2]]!));
        } else {
          const a: Node = boxDistance(node.left!) < boxDistance(node.right!) ? node.left! : node.right!;
          const b: Node = a === node.left ? node.right! : node.left!;
          visit(a); visit(b);
        }
      };
      visit(this.root);
      if (best < 1e-10) return 0;
      return this.intersections(point, normalized([1, Math.SQRT2, Math.sqrt(3)])).length % 2 === 0 ? best : -best;
    }
  }
  function ray(origin: Point, direction: Point, a: Point, b: Point, c: Point): number | undefined {
    const e1: Point = sub(b, a);
    const e2: Point = sub(c, a);
    const h: Point = cross(direction, e2);
    const denominator: number = dot(e1, h);
    if (Math.abs(denominator) < 1e-12) return undefined;
    const s: Point = sub(origin, a);
    const u: number = dot(s, h) / denominator;
    const q: Point = cross(s, e1);
    const v: number = dot(direction, q) / denominator;
    if (u < -1e-10 || v < -1e-10 || u + v > 1 + 1e-10) return undefined;
    return dot(e2, q) / denominator;
  }
}
