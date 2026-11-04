import type { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import type { AutoMovieHumanOralCavity } from "./AutoMovieHumanOralCavity";

/**
 * The mesh mathematics of the oral cavity's parts: grids of rings, end caps,
 * winding toward or away from a point or per connected piece, area-weighted
 * normals, the centripetal Catmull-Rom curve of the lining's meridians and the
 * super-ellipse coordinate of the crowns' and tongue's sections. Positions are
 * flat millimetre triples, triangles counter-clockwise from their visible side.
 */
export namespace AutoMovieHumanOralCavityMesh {
  /**
   * Quads of a grid of rings, each `around` long, appended as triangles.
   *
   * @param indices Triangle list to append to.
   * @param base Index of the first ring's first vertex.
   * @param rings Number of rings.
   * @param around Vertices per ring.
   * @param wrap Whether each ring closes on itself.
   */
  export function grid(indices: number[], base: number, rings: number, around: number, wrap: boolean): void {
    for (let i: number = 0; i + 1 < rings; i++)
      for (let j: number = 0; j < (wrap ? around : around - 1); j++) {
        const a: number = base + i * around + j;
        const b: number = base + i * around + ((j + 1) % around);
        const c: number = a + around;
        const d: number = b + around;
        indices.push(a, b, c, b, d, c);
      }
  }

  /**
   * Close a tube's two end rings, each by a fan at its centroid.
   *
   * @param mesh The mesh, extended in place.
   * @param base Index of the first ring's first vertex.
   * @param rings Number of rings.
   * @param around Vertices per ring.
   */
  export function capEnds(mesh: AutoMovieHumanOralCavity.IMesh, base: number, rings: number, around: number): void {
    for (const [ring, flip] of [[0, true], [rings - 1, false]] as [number, boolean][]) {
      const start: number = base + ring * around;
      const centre: number[] = [0, 1, 2].map(
        (k: number): number =>
          Array.from({ length: around }, (_: unknown, j: number): number => mesh.positions[3 * (start + j) + k]!).reduce(
            (a: number, b: number): number => a + b,
            0,
          ) / around,
      );
      const apex: number = mesh.positions.length / 3;
      mesh.positions.push(...centre);
      mesh.colors.push(...mesh.colors.slice(3 * start, 3 * start + 3));
      for (let j: number = 0; j < around; j++) {
        const a: number = start + j;
        const b: number = start + ((j + 1) % around);
        mesh.indices.push(...(flip ? [b, a, apex] : [a, b, apex]));
      }
    }
  }

  /**
   * Wind a closed or open mesh so its normals face away from (`away`) or
   * toward a point, by the sign of the summed agreement of its faces.
   *
   * @param mesh The mesh, rewound in place.
   * @param centre The point, mm.
   * @param away Whether the faces turn away from the point.
   * @returns The same mesh.
   */
  export function orient(mesh: AutoMovieHumanOralCavity.IMesh, centre: readonly number[], away: boolean): AutoMovieHumanOralCavity.IMesh {
    let sum: number = 0;
    const p: number[] = mesh.positions;
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      const [a, b, c] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      const u: Vec3 = [p[3 * b]! - p[3 * a]!, p[3 * b + 1]! - p[3 * a + 1]!, p[3 * b + 2]! - p[3 * a + 2]!];
      const w: Vec3 = [p[3 * c]! - p[3 * a]!, p[3 * c + 1]! - p[3 * a + 1]!, p[3 * c + 2]! - p[3 * a + 2]!];
      const n: Vec3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      sum +=
        n[0] * (p[3 * a]! - centre[0]!) + n[1] * (p[3 * a + 1]! - centre[1]!) + n[2] * (p[3 * a + 2]! - centre[2]!);
    }
    if (sum < 0 === away)
      for (let t: number = 0; t < mesh.indices.length; t += 3) {
        const b: number = mesh.indices[t + 1]!;
        mesh.indices[t + 1] = mesh.indices[t + 2]!;
        mesh.indices[t + 2] = b;
      }
    return mesh;
  }

  /**
   * The lining faces into the cavity; a closed body faces out from its centre.
   *
   * @param mesh The mesh, rewound in place.
   * @param centre A point inside the cavity or the body, mm.
   * @param body Whether the mesh is a closed body rather than the lining.
   */
  export function inward(mesh: AutoMovieHumanOralCavity.IMesh, centre: readonly number[], body: boolean = false): AutoMovieHumanOralCavity.IMesh {
    return orient(mesh, centre, body);
  }

  /**
   * Teeth and gums face away from the middle of their own arch.
   *
   * @param mesh The jaw's crowns or gum, rewound in place.
   * @param mouth The mouth the jaw belongs to.
   * @param jaw Which jaw.
   */
  export function outward(mesh: AutoMovieHumanOralCavity.IMesh, mouth: AutoMovieHumanMouth.IMouth, jaw: "upper" | "lower"): AutoMovieHumanOralCavity.IMesh {
    // Each crown is closed, and its own centre lies inside it, so each is
    // wound from its first ring's centroid: a sum over the whole arch would
    // let the long side outvote a short one.
    void mouth;
    void jaw;
    return orientPieces(mesh);
  }

  /**
   * Area-weighted vertex normals.
   *
   * @param mesh Positions and triangles.
   * @returns Flat unit normals, one triple per vertex.
   */
  export function normals(mesh: Pick<AutoMovieHumanOralCavity.IMesh, "positions" | "indices">): number[] {
    const out: number[] = new Array<number>(mesh.positions.length).fill(0);
    const p: number[] = mesh.positions;
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      const [a, b, c] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      const u: Vec3 = [p[3 * b]! - p[3 * a]!, p[3 * b + 1]! - p[3 * a + 1]!, p[3 * b + 2]! - p[3 * a + 2]!];
      const w: Vec3 = [p[3 * c]! - p[3 * a]!, p[3 * c + 1]! - p[3 * a + 1]!, p[3 * c + 2]! - p[3 * a + 2]!];
      const n: Vec3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      for (const v of [a, b, c]) for (let k: number = 0; k < 3; k++) out[3 * v + k]! += n[k]!;
    }
    for (let v: number = 0; v < out.length; v += 3) {
      const l: number = Math.hypot(out[v]!, out[v + 1]!, out[v + 2]!) || 1;
      out[v]! /= l;
      out[v + 1]! /= l;
      out[v + 2]! /= l;
    }
    return out;
  }

  /**
   * Centripetal Catmull-Rom point on span `s` of a control list (Yuksel et
   * al. 2011), its missing end neighbours reflected through the end points.
   *
   * @param points Control points, mm.
   * @param s Span index, from `points[s]` to `points[s + 1]`.
   * @param f Place in the span, 0 to 1.
   */
  export function catmull(points: readonly Vec3[], s: number, f: number): Vec3 {
    const p0: Vec3 = points[Math.max(0, s - 1)]!;
    const p1: Vec3 = points[s]!;
    const p2: Vec3 = points[s + 1]!;
    const p3: Vec3 = points[Math.min(points.length - 1, s + 2)]!;
    const knot = (a: Vec3, b: Vec3): number => Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) ** 0.5);
    const t0: number = 0;
    const t1: number = t0 + (s === 0 ? knot(p1, p2) : knot(p0, p1));
    const t2: number = t1 + knot(p1, p2);
    const t3: number = t2 + (s + 2 >= points.length ? knot(p1, p2) : knot(p2, p3));
    const q0: Vec3 = s === 0 ? sub(scale3(p1, 2), p2) : p0;
    const q3: Vec3 = s + 2 >= points.length ? sub(scale3(p2, 2), p1) : p3;
    const t: number = t1 + (t2 - t1) * f;
    const lerp = (a: Vec3, b: Vec3, ta: number, tb: number): Vec3 =>
      [0, 1, 2].map((k: number): number => ((tb - t) * a[k]! + (t - ta) * b[k]!) / (tb - ta)) as Vec3;
    const a1: Vec3 = lerp(q0, p1, t0, t1);
    const a2: Vec3 = lerp(p1, p2, t1, t2);
    const a3: Vec3 = lerp(p2, q3, t2, t3);
    const b1: Vec3 = lerp(a1, a2, t0, t2);
    const b2: Vec3 = lerp(a2, a3, t1, t3);
    return lerp(b1, b2, t1, t2);
  }

  /**
   * Signed power of a super-ellipse's coordinate.
   *
   * @param c Cosine or sine of the section's angle.
   * @param power Super-ellipse exponent.
   */
  export function superellipse(c: number, power: number): number {
    return Math.sign(c) * Math.abs(c) ** (2 / power);
  }

  /**
   * Cubic smoothstep clamped to [0, 1].
   *
   * @param x Argument.
   */
  export function smooth(x: number): number {
    const t: number = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  }

  /** Wind each connected piece of a mesh outward from its own centroid. */
  function orientPieces(mesh: AutoMovieHumanOralCavity.IMesh): AutoMovieHumanOralCavity.IMesh {
    const count: number = mesh.positions.length / 3;
    const parent: Int32Array = Int32Array.from({ length: count }, (_: unknown, i: number): number => i);
    const find = (v: number): number => {
      while (parent[v] !== v) {
        parent[v] = parent[parent[v]!]!;
        v = parent[v]!;
      }
      return v;
    };
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      parent[find(mesh.indices[t]!)] = find(mesh.indices[t + 1]!);
      parent[find(mesh.indices[t + 1]!)] = find(mesh.indices[t + 2]!);
    }
    const groups: Map<number, number[]> = new Map();
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      const root: number = find(mesh.indices[t]!);
      const list: number[] = groups.get(root) ?? [];
      list.push(t);
      groups.set(root, list);
    }
    const out: number[] = [];
    for (const triangles of groups.values()) {
      const vertices: number[] = [...new Set(triangles.flatMap((t: number): number[] => [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!]))];
      const centre: number[] = [0, 1, 2].map(
        (k: number): number => vertices.reduce((a: number, v: number): number => a + mesh.positions[3 * v + k]!, 0) / vertices.length,
      );
      const piece: AutoMovieHumanOralCavity.IMesh = {
        positions: mesh.positions,
        colors: mesh.colors,
        indices: triangles.flatMap((t: number): number[] => [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!]),
      };
      out.push(...orient(piece, centre, true).indices);
    }
    mesh.indices = out;
    return mesh;
  }

  /** Difference of two points. */
  function sub(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** A point scaled about the origin. */
  function scale3(a: Vec3, s: number): Vec3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }
}

/** A point, mm. */
type Vec3 = [number, number, number];
