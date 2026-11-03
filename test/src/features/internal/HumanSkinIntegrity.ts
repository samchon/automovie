import type { IAutoMovieHumanLoftAperture } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyPose } from "./HumanAnatomyPose";
import { HumanPeople } from "./HumanPeople";

/**
 * Integrity of a closed skin as a triangle mesh: whether it passes through
 * itself, and whether it is the oriented two-manifold a renderer, a ray caster
 * and an inside test all assume.
 *
 * Every orientation is decided in floating point with Shewchuk's error bound,
 * and an outcome within the bound counts as contact, not crossing. Where edges
 * meet edges exactly, so that no orientation is strict, the overlap of the two
 * triangles along their planes' common line decides, and must exceed a
 * billionth of the coordinates: far above double rounding, far below any
 * modelled feature. No limit comes from the figure. Findings are grouped into connected patches and
 * each is named by the chains its triangles belong to.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres.
 */
export namespace HumanSkinIntegrity {
  /** A point or a direction. */
  export type V3 = HumanAnatomy.V3;

  /** A labelled triangle mesh: a generated skin, a reference body or a made control. */
  export interface IMesh {
    /** Name in findings. */
    name: string;

    /** Flat vertex positions, mm. */
    P: Float64Array;

    /** Flat triangle vertex indices, counter-clockwise from outside. */
    I: Uint32Array;

    /** Chain each triangle belongs to, an index into `chains`, or -1. */
    tri: Int32Array;

    /** Chain names. */
    chains: string[];
  }

  /**
   * An opening the body declares open: a margin the skin ends at, such as an
   * eyelid round its globe. An opening closed by a pocket is not one.
   */
  export interface IOpening {
    /** Name, such as `eye.left`. */
    name: string;

    /** Centroid of the margin, mm. */
    centre: V3;

    /** Unit direction the opening faces. */
    forward: V3;

    /** Largest distance of the margin from its axis through the centre, mm. */
    radius: number;
  }

  /** What is wrong with a patch. */
  export type Kind =
    | "invalid index"
    | "non-finite vertex"
    | "self-intersection"
    | "non-manifold edge"
    | "non-manifold vertex"
    | "open boundary"
    | "inconsistent winding"
    | "inverted"
    | "zero-area triangle"
    | "needle triangle"
    | "duplicate triangle"
    | "unreferenced vertex";

  /** One connected patch of one kind of defect. */
  export interface IFinding {
    /** Person, reference or control. */
    person: string;

    /** Chains the patch's triangles belong to, most triangles first. */
    region: string;

    /** What is wrong. */
    kind: Kind;

    /** Triangles in the patch. */
    triangles: number;

    /** Edges in the patch, for the edge kinds; else zero. */
    edges: number;

    /** Vertices in the patch, for the vertex kinds; else zero. */
    vertices: number;

    /** Crossing triangle pairs, for a self-intersection; else zero. */
    pairs: number;

    /** Total area of the patch's triangles, mm². */
    area: number;

    /** A point of the patch on the skin, mm. */
    at: V3;
  }

  /**
   * The openings a body declares open, from its apertures: every aperture
   * without a closing pocket. Each margin is its own harmonic series,
   * evaluated here at 256 points.
   */
  export function openings(apertures: readonly IAutoMovieHumanLoftAperture[]): IOpening[] {
    return apertures
      .filter((a: IAutoMovieHumanLoftAperture): boolean => !((a.pocket ?? 0) > 0))
      .map((a: IAutoMovieHumanLoftAperture): IOpening => {
        const width: number = 2 * a.order + 1;
        const margin: V3[] = [];
        for (let s: number = 0; s < 256; s++) {
          const theta: number = (2 * Math.PI * s) / 256;
          const p: V3 = [0, 0, 0];
          for (let axis: number = 0; axis < 3; axis++) {
            const c: number[] = a.coefficients.slice(axis * width, (axis + 1) * width);
            let v: number = c[0]!;
            for (let k: number = 1; k <= a.order; k++)
              v += c[2 * k - 1]! * Math.cos(k * theta) + c[2 * k]! * Math.sin(k * theta);
            p[axis] = v;
          }
          margin.push(p);
        }
        const centre: V3 = [0, 1, 2].map(
          (axis: number): number => margin.reduce((s: number, p: V3): number => s + p[axis]!, 0) / margin.length,
        ) as V3;
        const length: number = Math.hypot(...a.forward);
        const forward: V3 = [a.forward[0] / length, a.forward[1] / length, a.forward[2] / length];
        const radius: number = Math.max(...margin.map((p: V3): number => radial(p, centre, forward)));
        return { name: a.name, centre, forward, radius };
      });
  }

  /**
   * Every finding on a mesh: crossings, topology, orientation and triangle
   * shape, grouped into patches.
   *
   * @param openings Openings the mesh may end at; each accounts for one
   *   closed boundary loop that winds once round its axis inside its margin.
   */
  export function audit(mesh: IMesh, openings: readonly IOpening[]): IFinding[] {
    const n: number = mesh.P.length / 3;
    const T: number = mesh.I.length / 3;
    const out: IFinding[] = [];
    const bad: number[] = [];
    for (let t: number = 0; t < T; t++)
      for (let k: number = 0; k < 3; k++) {
        const v: number = mesh.I[3 * t + k]!;
        if (!(v < n)) {
          bad.push(t);
          break;
        }
      }
    if (bad.length)
      return [
        {
          person: mesh.name,
          region: region(mesh, bad),
          kind: "invalid index",
          triangles: bad.length,
          edges: 0,
          vertices: 0,
          pairs: 0,
          area: 0,
          at: [NaN, NaN, NaN],
        },
      ];
    const finite: number[] = [];
    for (let v: number = 0; v < n; v++)
      if (!Number.isFinite(mesh.P[3 * v]!) || !Number.isFinite(mesh.P[3 * v + 1]!) || !Number.isFinite(mesh.P[3 * v + 2]!))
        finite.push(v);
    if (finite.length) {
      out.push({
        person: mesh.name,
        region: "vertices",
        kind: "non-finite vertex",
        triangles: 0,
        edges: 0,
        vertices: finite.length,
        pairs: 0,
        area: 0,
        at: [NaN, NaN, NaN],
      });
      return out;
    }
    const topo: Topology = new Topology(mesh);
    const areas: Float64Array = triangleAreas(mesh);

    // Triangle shape.
    const zero: number[] = [];
    const needle: number[] = [];
    for (let t: number = 0; t < T; t++) {
      const shape: Shape = triangleShape(mesh, t);
      if (shape === Shape.Zero) zero.push(t);
      else if (shape === Shape.Needle) needle.push(t);
    }
    for (const patch of patches(topo, zero, [])) out.push(finding(mesh, areas, "zero-area triangle", patch));
    for (const patch of patches(topo, needle, [])) out.push(finding(mesh, areas, "needle triangle", patch));

    // Duplicates: triangles on the same three vertices.
    const seen: Map<number, number> = new Map();
    const duplicate: number[] = [];
    const twins: [number, number][] = [];
    for (let t: number = 0; t < T; t++) {
      const v: number[] = [mesh.I[3 * t]!, mesh.I[3 * t + 1]!, mesh.I[3 * t + 2]!].sort((x: number, y: number): number => x - y);
      if (v[0] === v[1] || v[1] === v[2]) continue;
      const key: number = topo.edge(v[0]!, v[1]!) * n + v[2]!;
      const first: number | undefined = seen.get(key);
      if (first === undefined) seen.set(key, t);
      else {
        duplicate.push(first, t);
        twins.push([first, t]);
      }
    }
    for (const patch of patches(topo, [...new Set(duplicate)], twins))
      out.push(finding(mesh, areas, "duplicate triangle", patch));

    // Edges.
    const nonManifold: number[] = [];
    const inconsistent: number[] = [];
    const boundary: number[] = [];
    for (let e: number = 0; e < topo.edges; e++) {
      const users: number = topo.offset[e + 1]! - topo.offset[e]!;
      if (users === 1) boundary.push(e);
      else if (users > 2) nonManifold.push(e);
      else if (!topo.consistent(e)) inconsistent.push(e);
    }
    for (const group of edgeGroups(topo, nonManifold))
      out.push(edgeFinding(mesh, topo, areas, "non-manifold edge", group));
    for (const group of edgeGroups(topo, inconsistent))
      out.push(edgeFinding(mesh, topo, areas, "inconsistent winding", group));
    const used: Set<number> = new Set();
    for (const group of edgeGroups(topo, boundary)) {
      const k: number = declared(mesh, topo, group, openings, used);
      if (k >= 0) used.add(k);
      else out.push(edgeFinding(mesh, topo, areas, "open boundary", group));
    }

    // Vertices.
    const pinched: number[] = topo.pinched();
    if (pinched.length) {
      const tris: number[] = [];
      for (const v of pinched) for (let j: number = topo.vstart[v]!; j < topo.vstart[v + 1]!; j++) tris.push(topo.vtri[j]!);
      for (const patch of patches(topo, [...new Set(tris)], [])) {
        const f: IFinding = finding(mesh, areas, "non-manifold vertex", patch);
        f.vertices = pinched.filter((v: number): boolean => patch.some((t: number): boolean => touches(mesh, t, v))).length;
        out.push(f);
      }
    }
    const unreferenced: number[] = [];
    for (let v: number = 0; v < n; v++) if (topo.vstart[v] === topo.vstart[v + 1]) unreferenced.push(v);
    if (unreferenced.length) {
      const c: V3 = [0, 0, 0];
      for (const v of unreferenced) for (let a: number = 0; a < 3; a++) c[a] += mesh.P[3 * v + a]! / unreferenced.length;
      let best: number = unreferenced[0]!;
      let bestD: number = Infinity;
      for (const v of unreferenced) {
        const d: number = dist(point(mesh, v), c);
        if (d < bestD) {
          bestD = d;
          best = v;
        }
      }
      out.push({
        person: mesh.name,
        region: "unused positions",
        kind: "unreferenced vertex",
        triangles: 0,
        edges: 0,
        vertices: unreferenced.length,
        pairs: 0,
        area: 0,
        at: point(mesh, best),
      });
    }

    // Crossings.
    const bvh: Bvh = new Bvh(mesh);
    out.push(...crossingFindings(mesh, topo, areas, crossings(mesh, bvh)));

    // Orientation: each consistently wound patch faces out by ray parity.
    for (const patch of topo.orientationPatches()) {
      if (inward(mesh, bvh, areas, patch)) out.push(finding(mesh, areas, "inverted", patch));
    }
    return sort(out);
  }

  /** Only the crossings of a mesh, as findings. */
  export function intersections(mesh: IMesh): IFinding[] {
    const topo: Topology = new Topology(mesh);
    return sort(crossingFindings(mesh, topo, triangleAreas(mesh), crossings(mesh, new Bvh(mesh))));
  }

  /**
   * Every pair of triangles that cross, each as `[t, u]` with `t < u`, found
   * through a bounding volume hierarchy or, `exhaustive`, over all pairs.
   */
  export function pairs(mesh: IMesh, exhaustive: boolean = false): [number, number][] {
    if (!exhaustive) return crossings(mesh, new Bvh(mesh));
    const out: [number, number][] = [];
    const T: number = mesh.I.length / 3;
    for (let t: number = 0; t < T; t++)
      for (let u: number = t + 1; u < T; u++) if (shared(mesh.I, t, u) < 2 && cross(mesh.P, mesh.I, t, u)) out.push([t, u]);
    return out;
  }

  /** A generated person's bind skin against the openings its body declares. */
  export function person(name: string): IFinding[] {
    return audit(HumanAnatomy.bind(name), openings(HumanPeople.person(name).body.apertures));
  }

  /**
   * Crossings of a generated person's skin in every pose the pose audit
   * reads, each finding's person named with its pose.
   */
  export function posed(name: string): IFinding[] {
    const out: IFinding[] = [];
    // The poses `HumanAnatomyAudit.POSES` names, read from their owner.
    for (const [pose, value] of Object.entries(HumanAnatomyPose.POSES)) {
      const skin: HumanAnatomy.ISkin = HumanAnatomy.posed(name, value as IAutoMovieHumanPose);
      out.push(...intersections({ ...skin, name: `${name} ${pose}` }));
    }
    return sort(out);
  }

  /** One line per finding. */
  export function format(f: IFinding): string {
    const parts: string[] = [`${f.triangles} triangles`];
    if (f.edges) parts.push(`${f.edges} edges`);
    if (f.vertices) parts.push(`${f.vertices} vertices`);
    if (f.pairs) parts.push(`${f.pairs} crossing pairs`);
    parts.push(`${f.area.toFixed(3)} mm2`);
    return `${f.person} | ${f.region} | ${f.kind}: ${parts.join(", ")}, at (${f.at.map((c: number): string => c.toFixed(1)).join(", ")}) mm`;
  }

  /** Findings sorted by person, region and kind. */
  export function sort(findings: IFinding[]): IFinding[] {
    return findings.sort(
      (a: IFinding, b: IFinding): number =>
        a.person.localeCompare(b.person) ||
        a.region.localeCompare(b.region) ||
        a.kind.localeCompare(b.kind) ||
        b.area - a.area,
    );
  }
}

type V3 = HumanSkinIntegrity.V3;
type IMesh = HumanSkinIntegrity.IMesh;
type IFinding = HumanSkinIntegrity.IFinding;

/** Unit roundoff of a double. */
const EPSILON: number = 2 ** -53;

/** Shewchuk's error bound on the 3D orientation determinant, as a multiple of its permanent. */
const ORIENT3: number = (7 + 56 * EPSILON) * EPSILON;

/** Shewchuk's error bound on the 2D orientation determinant. */
const ORIENT2: number = (3 + 16 * EPSILON) * EPSILON;

/** Unit roundoff of a single-precision float, the precision a renderer draws in. */
const EPSILON32: number = 2 ** -24;

/**
 * Sign of the orientation of `d` against the plane of `a, b, c`, or zero when
 * the determinant lies within its floating-point error bound (Shewchuk 1997).
 */
function o3(P: Float64Array, a: number, b: number, c: number, d: number): number {
  const dx: number = P[3 * d]!;
  const dy: number = P[3 * d + 1]!;
  const dz: number = P[3 * d + 2]!;
  const adx: number = P[3 * a]! - dx;
  const ady: number = P[3 * a + 1]! - dy;
  const adz: number = P[3 * a + 2]! - dz;
  const bdx: number = P[3 * b]! - dx;
  const bdy: number = P[3 * b + 1]! - dy;
  const bdz: number = P[3 * b + 2]! - dz;
  const cdx: number = P[3 * c]! - dx;
  const cdy: number = P[3 * c + 1]! - dy;
  const cdz: number = P[3 * c + 2]! - dz;
  const bdxcdy: number = bdx * cdy;
  const cdxbdy: number = cdx * bdy;
  const cdxady: number = cdx * ady;
  const adxcdy: number = adx * cdy;
  const adxbdy: number = adx * bdy;
  const bdxady: number = bdx * ady;
  const det: number = adz * (bdxcdy - cdxbdy) + bdz * (cdxady - adxcdy) + cdz * (adxbdy - bdxady);
  const permanent: number =
    (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz) +
    (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz) +
    (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz);
  const bound: number = ORIENT3 * permanent;
  return det > bound ? 1 : det < -bound ? -1 : 0;
}

/** Sign of the 2D orientation of `a, b, c`, or zero within its error bound. */
function o2(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  const left: number = (ax - cx) * (by - cy);
  const right: number = (ay - cy) * (bx - cx);
  const det: number = left - right;
  const bound: number = ORIENT2 * (Math.abs(left) + Math.abs(right));
  return det > bound ? 1 : det < -bound ? -1 : 0;
}

/** Vertices two triangles share. */
function shared(I: Uint32Array, t: number, u: number): number {
  let k: number = 0;
  for (let i: number = 0; i < 3; i++)
    for (let j: number = 0; j < 3; j++) if (I[3 * t + i] === I[3 * u + j]) k++;
  return k;
}

/**
 * Whether two triangles cross: some edge of one passes strictly through the
 * other's interior; or, edges meeting edges exactly, their chords on the
 * planes' common line overlap; or, both lying in one plane within rounding,
 * their interiors overlap. Touching at a shared vertex, along an edge, or
 * within the predicates' error bound is contact, not crossing.
 */
function cross(P: Float64Array, I: Uint32Array, t: number, u: number): boolean {
  const a: number = I[3 * t]!;
  const b: number = I[3 * t + 1]!;
  const c: number = I[3 * t + 2]!;
  const d: number = I[3 * u]!;
  const e: number = I[3 * u + 1]!;
  const f: number = I[3 * u + 2]!;
  const sd: number = o3(P, a, b, c, d);
  const se: number = o3(P, a, b, c, e);
  const sf: number = o3(P, a, b, c, f);
  if (sd !== 0 && sd === se && se === sf) return false;
  const sa: number = o3(P, d, e, f, a);
  const sb: number = o3(P, d, e, f, b);
  const sc: number = o3(P, d, e, f, c);
  if (sa !== 0 && sa === sb && sb === sc) return false;
  if (sd === 0 && se === 0 && sf === 0 && sa === 0 && sb === 0 && sc === 0) return coplanar(P, a, b, c, d, e, f);
  return (
    pierces(P, d, e, sd, se, a, b, c) ||
    pierces(P, e, f, se, sf, a, b, c) ||
    pierces(P, f, d, sf, sd, a, b, c) ||
    pierces(P, a, b, sa, sb, d, e, f) ||
    pierces(P, b, c, sb, sc, d, e, f) ||
    pierces(P, c, a, sc, sa, d, e, f) ||
    chordsOverlap(P, [a, b, c], [sa, sb, sc], [d, e, f], [sd, se, sf])
  );
}

/**
 * Whether two triangles, each with vertices strictly either side of the
 * other's plane, overlap along the line their planes share by more than a
 * billionth of their coordinates. It decides the degenerate crossings no edge
 * pierces strictly, where an edge of one passes exactly through an edge or a
 * vertex of the other, as a mirror-symmetric skin can place them.
 */
function chordsOverlap(P: Float64Array, A: number[], sA: number[], B: number[], sB: number[]): boolean {
  const straddles = (s: number[]): boolean => s.includes(1) && s.includes(-1);
  if (!straddles(sA) || !straddles(sB)) return false;
  const nA: V3 = normal(P, A[0]!, A[1]!, A[2]!);
  const nB: V3 = normal(P, B[0]!, B[1]!, B[2]!);
  const line: V3 = crossV(nA, nB);
  const length: number = Math.hypot(...line);
  if (length === 0) return false;
  const u: V3 = [line[0] / length, line[1] / length, line[2] / length];
  const at = (v: number): V3 => [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
  const chord = (T: number[], s: number[], n: V3, origin: number): [number, number] => {
    const o: V3 = at(origin);
    const h: number[] = T.map((v: number): number => dot(n, sub(at(v), o)));
    const along: number[] = [];
    for (let k: number = 0; k < 3; k++) {
      if (s[k] === 0) along.push(dot(u, at(T[k]!)));
      const j: number = (k + 1) % 3;
      if (s[k]! * s[j]! < 0) {
        const t: number = h[k]! / (h[k]! - h[j]!);
        const p: V3 = at(T[k]!);
        const q: V3 = at(T[j]!);
        along.push(dot(u, [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), p[2] + t * (q[2] - p[2])]));
      }
    }
    return [Math.min(...along), Math.max(...along)];
  };
  const [a0, a1] = chord(A, sA, nB, B[0]!);
  const [b0, b1] = chord(B, sB, nA, A[0]!);
  let scale: number = 0;
  for (const v of [...A, ...B]) for (let k: number = 0; k < 3; k++) scale = Math.max(scale, Math.abs(P[3 * v + k]!));
  return Math.min(a1, b1) - Math.max(a0, b0) > 1e-9 * (1 + scale);
}

/** Whether segment `p q`, its ends strictly either side of the plane, passes through the interior of `a b c`. */
function pierces(P: Float64Array, p: number, q: number, sp: number, sq: number, a: number, b: number, c: number): boolean {
  if (sp * sq >= 0) return false;
  const s: number = o3(P, p, q, a, b);
  if (s === 0) return false;
  return o3(P, p, q, b, c) === s && o3(P, p, q, c, a) === s;
}

/** Whether two triangles in one plane overlap in their interiors, read in the coordinate plane the normal is most along. */
function coplanar(P: Float64Array, a: number, b: number, c: number, d: number, e: number, f: number): boolean {
  const n1: V3 = normal(P, a, b, c);
  const n2: V3 = normal(P, d, e, f);
  const n: V3 = Math.hypot(...n1) >= Math.hypot(...n2) ? n1 : n2;
  const drop: number = Math.abs(n[0]) >= Math.abs(n[1]) && Math.abs(n[0]) >= Math.abs(n[2]) ? 0 : Math.abs(n[1]) >= Math.abs(n[2]) ? 1 : 2;
  const i: number = drop === 0 ? 1 : 0;
  const j: number = drop === 2 ? 1 : 2;
  const A: [number, number][] = [a, b, c].map((v: number): [number, number] => [P[3 * v + i]!, P[3 * v + j]!]);
  const B: [number, number][] = [d, e, f].map((v: number): [number, number] => [P[3 * v + i]!, P[3 * v + j]!]);
  for (let x: number = 0; x < 3; x++)
    for (let y: number = 0; y < 3; y++) {
      const p: [number, number] = A[x]!;
      const q: [number, number] = A[(x + 1) % 3]!;
      const r: [number, number] = B[y]!;
      const s: [number, number] = B[(y + 1) % 3]!;
      if (
        o2(p[0], p[1], q[0], q[1], r[0], r[1]) * o2(p[0], p[1], q[0], q[1], s[0], s[1]) < 0 &&
        o2(r[0], r[1], s[0], s[1], p[0], p[1]) * o2(r[0], r[1], s[0], s[1], q[0], q[1]) < 0
      )
        return true;
    }
  const inside = (T: [number, number][], x: number, y: number): boolean => {
    const s0: number = o2(T[0]![0], T[0]![1], T[1]![0], T[1]![1], x, y);
    const s1: number = o2(T[1]![0], T[1]![1], T[2]![0], T[2]![1], x, y);
    const s2: number = o2(T[2]![0], T[2]![1], T[0]![0], T[0]![1], x, y);
    return s0 !== 0 && s0 === s1 && s1 === s2;
  };
  const centre = (T: [number, number][]): [number, number] => [
    (T[0]![0] + T[1]![0] + T[2]![0]) / 3,
    (T[0]![1] + T[1]![1] + T[2]![1]) / 3,
  ];
  for (const p of [...B, centre(B)]) if (inside(A, p[0], p[1])) return true;
  for (const p of [...A, centre(A)]) if (inside(B, p[0], p[1])) return true;
  return false;
}

/** Every crossing pair through the hierarchy. */
function crossings(mesh: IMesh, bvh: Bvh): [number, number][] {
  const out: [number, number][] = [];
  const T: number = mesh.I.length / 3;
  // The traversal stack doubles whenever a node's two children would not
  // fit, so no subtree is ever dropped however deep the hierarchy.
  let stack: Int32Array = new Int32Array(1024);
  for (let t: number = 0; t < T; t++) {
    let top: number = 0;
    stack[top++] = 0;
    const x0: number = bvh.tlo[3 * t]!;
    const y0: number = bvh.tlo[3 * t + 1]!;
    const z0: number = bvh.tlo[3 * t + 2]!;
    const x1: number = bvh.thi[3 * t]!;
    const y1: number = bvh.thi[3 * t + 1]!;
    const z1: number = bvh.thi[3 * t + 2]!;
    while (top > 0) {
      const node: number = stack[--top]!;
      if (
        bvh.lo[3 * node]! > x1 ||
        bvh.lo[3 * node + 1]! > y1 ||
        bvh.lo[3 * node + 2]! > z1 ||
        bvh.hi[3 * node]! < x0 ||
        bvh.hi[3 * node + 1]! < y0 ||
        bvh.hi[3 * node + 2]! < z0
      )
        continue;
      const count: number = bvh.count[node]!;
      if (count === 0) {
        if (top + 2 > stack.length) {
          const grown: Int32Array = new Int32Array(2 * stack.length);
          grown.set(stack);
          stack = grown;
        }
        stack[top++] = node + 1;
        stack[top++] = bvh.right[node]!;
        continue;
      }
      const start: number = bvh.start[node]!;
      for (let k: number = start; k < start + count; k++) {
        const u: number = bvh.order[k]!;
        if (u <= t) continue;
        if (
          bvh.tlo[3 * u]! > x1 ||
          bvh.tlo[3 * u + 1]! > y1 ||
          bvh.tlo[3 * u + 2]! > z1 ||
          bvh.thi[3 * u]! < x0 ||
          bvh.thi[3 * u + 1]! < y0 ||
          bvh.thi[3 * u + 2]! < z0
        )
          continue;
        if (shared(mesh.I, t, u) >= 2) continue;
        if (cross(mesh.P, mesh.I, t, u)) out.push([t, u]);
      }
    }
  }
  return out;
}

/** Crossing pairs as patches: a crossing joins its two triangles, and a shared vertex joins flagged neighbours. */
function crossingFindings(mesh: IMesh, topo: Topology, areas: Float64Array, found: [number, number][]): IFinding[] {
  const flagged: number[] = [...new Set(found.flat())];
  const out: IFinding[] = [];
  const groups: number[][] = patches(topo, flagged, found);
  const group: Map<number, number> = new Map();
  groups.forEach((g: number[], k: number): void => {
    for (const t of g) group.set(t, k);
  });
  const count: number[] = groups.map((): number => 0);
  for (const [t] of found) count[group.get(t)!]!++;
  groups.forEach((g: number[], k: number): void => {
    const f: IFinding = finding(mesh, areas, "self-intersection", g);
    f.pairs = count[k]!;
    out.push(f);
  });
  return out;
}

/** Triangle shape against the arithmetic it is computed and drawn in. */
const enum Shape {
  Fine,
  /** The cross product of its edges lies within its rounding error: no plane, no normal. */
  Zero,
  /**
   * Its least altitude is within twice the displacement single-precision
   * rounding gives a vertex, so the triangle a renderer draws may lose its
   * area or turn over.
   */
  Needle,
}

/** A triangle's shape class. */
function triangleShape(mesh: IMesh, t: number): Shape {
  const a: V3 = point(mesh, mesh.I[3 * t]!);
  const b: V3 = point(mesh, mesh.I[3 * t + 1]!);
  const c: V3 = point(mesh, mesh.I[3 * t + 2]!);
  const u: V3 = sub(b, a);
  const v: V3 = sub(c, a);
  const w: V3 = sub(c, b);
  const area2: number = Math.hypot(...crossV(u, v));
  const lu: number = Math.hypot(...u);
  const lv: number = Math.hypot(...v);
  const lw: number = Math.hypot(...w);
  // Each cross-product component is two rounded products of rounded
  // differences, each within a few roundoffs of |u||v|.
  if (area2 <= 8 * EPSILON * lu * lv || area2 === 0) return Shape.Zero;
  const altitude: number = area2 / Math.max(lu, lv, lw);
  const m: number = Math.max(...a.map(Math.abs), ...b.map(Math.abs), ...c.map(Math.abs));
  // Rounding each coordinate to single precision moves a vertex by at most
  // sqrt(3) half-units in the last place of the largest coordinate.
  const shift: number = Math.sqrt(3) * EPSILON32 * m;
  return altitude <= 2 * shift ? Shape.Needle : Shape.Fine;
}

/** Every triangle's area, mm². */
function triangleAreas(mesh: IMesh): Float64Array {
  const T: number = mesh.I.length / 3;
  const out: Float64Array = new Float64Array(T);
  for (let t: number = 0; t < T; t++)
    out[t] = 0.5 * Math.hypot(...normal(mesh.P, mesh.I[3 * t]!, mesh.I[3 * t + 1]!, mesh.I[3 * t + 2]!));
  return out;
}

/**
 * Whether a consistently wound patch faces into the body: a ray along each
 * sampled triangle's normal from its centroid crosses the skin an odd number
 * of times. Up to 15 triangles are sampled across the patch and the majority
 * decides, so a ray through an opening or along an edge cannot.
 */
function inward(mesh: IMesh, bvh: Bvh, areas: Float64Array, patch: number[]): boolean {
  const usable: number[] = patch.filter((t: number): boolean => areas[t]! > 0);
  if (!usable.length) return false;
  const samples: number = Math.min(15, usable.length);
  let odd: number = 0;
  for (let s: number = 0; s < samples; s++) {
    const t: number = usable[Math.floor(((s + 0.5) * usable.length) / samples)]!;
    const a: number = mesh.I[3 * t]!;
    const b: number = mesh.I[3 * t + 1]!;
    const c: number = mesh.I[3 * t + 2]!;
    const nrm: V3 = normal(mesh.P, a, b, c);
    const len: number = Math.hypot(...nrm);
    const dir: V3 = [nrm[0] / len, nrm[1] / len, nrm[2] / len];
    const o: V3 = [0, 1, 2].map(
      (k: number): number => (mesh.P[3 * a + k]! + mesh.P[3 * b + k]! + mesh.P[3 * c + k]!) / 3,
    ) as V3;
    if (bvh.hits(mesh, o, dir, t) % 2 === 1) odd++;
  }
  return 2 * odd > samples;
}

/** Whether a boundary loop is an opening's margin; the opening's index, or -1. */
function declared(
  mesh: IMesh,
  topo: Topology,
  group: number[],
  openings: readonly HumanSkinIntegrity.IOpening[],
  used: Set<number>,
): number {
  const loop: number[] | null = topo.loop(group);
  if (loop === null) return -1;
  for (let k: number = 0; k < openings.length; k++) {
    if (used.has(k)) continue;
    const o: HumanSkinIntegrity.IOpening = openings[k]!;
    const points: V3[] = loop.map((v: number): V3 => point(mesh, v));
    if (points.some((p: V3): boolean => radial(p, o.centre, o.forward) > o.radius)) continue;
    if (points.some((p: V3): boolean => Math.abs(dot(sub(p, o.centre), o.forward)) > o.radius)) continue;
    if (Math.abs(Math.round(winding(points, o.centre, o.forward))) === 1) return k;
  }
  return -1;
}

/** Turns of a closed polygon round an axis. */
function winding(points: V3[], centre: V3, axis: V3): number {
  const [u, w] = basis(axis);
  let total: number = 0;
  let previous: number = NaN;
  for (let k: number = 0; k <= points.length; k++) {
    const r: V3 = sub(points[k % points.length]!, centre);
    const angle: number = Math.atan2(dot(r, w), dot(r, u));
    if (!Number.isNaN(previous)) {
      let d: number = angle - previous;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      total += d;
    }
    previous = angle;
  }
  return total / (2 * Math.PI);
}

/** Connected patches of flagged triangles: joined by a shared vertex or by a listed pair. */
function patches(topo: Topology, flagged: number[], links: [number, number][]): number[][] {
  if (!flagged.length) return [];
  const id: Map<number, number> = new Map();
  flagged.forEach((t: number, k: number): void => {
    id.set(t, k);
  });
  const parent: Int32Array = Int32Array.from(flagged, (_: number, k: number): number => k);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  };
  const join = (x: number, y: number): void => {
    const a: number = find(x);
    const b: number = find(y);
    if (a !== b) parent[a] = b;
  };
  const byVertex: Map<number, number> = new Map();
  flagged.forEach((t: number, k: number): void => {
    for (let i: number = 0; i < 3; i++) {
      const v: number = topo.I[3 * t + i]!;
      const other: number | undefined = byVertex.get(v);
      if (other === undefined) byVertex.set(v, k);
      else join(k, other);
    }
  });
  for (const [t, u] of links) join(id.get(t)!, id.get(u)!);
  const groups: Map<number, number[]> = new Map();
  flagged.forEach((t: number, k: number): void => {
    const r: number = find(k);
    const g: number[] | undefined = groups.get(r);
    if (g === undefined) groups.set(r, [t]);
    else g.push(t);
  });
  return [...groups.values()];
}

/** Connected groups of flagged edges, joined at shared vertices. */
function edgeGroups(topo: Topology, edges: number[]): number[][] {
  if (!edges.length) return [];
  const parent: Int32Array = Int32Array.from(edges, (_: number, k: number): number => k);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  };
  const byVertex: Map<number, number> = new Map();
  edges.forEach((e: number, k: number): void => {
    for (const v of [topo.ea[e]!, topo.eb[e]!]) {
      const other: number | undefined = byVertex.get(v);
      if (other === undefined) byVertex.set(v, k);
      else {
        const a: number = find(k);
        const b: number = find(other);
        if (a !== b) parent[a] = b;
      }
    }
  });
  const groups: Map<number, number[]> = new Map();
  edges.forEach((e: number, k: number): void => {
    const r: number = find(k);
    const g: number[] | undefined = groups.get(r);
    if (g === undefined) groups.set(r, [e]);
    else g.push(e);
  });
  return [...groups.values()];
}

/** A patch of triangles as a finding. */
function finding(mesh: IMesh, areas: Float64Array, kind: HumanSkinIntegrity.Kind, patch: number[]): IFinding {
  let area: number = 0;
  const c: V3 = [0, 0, 0];
  let weight: number = 0;
  for (const t of patch) {
    area += areas[t]!;
    const w: number = areas[t]! > 0 ? areas[t]! : 1e-300;
    const m: V3 = centroid(mesh, t);
    for (let k: number = 0; k < 3; k++) c[k] += w * m[k]!;
    weight += w;
  }
  for (let k: number = 0; k < 3; k++) c[k] /= weight;
  let at: V3 = centroid(mesh, patch[0]!);
  for (const t of patch) {
    const m: V3 = centroid(mesh, t);
    if (dist(m, c) < dist(at, c)) at = m;
  }
  return {
    person: mesh.name,
    region: region(mesh, patch),
    kind,
    triangles: patch.length,
    edges: 0,
    vertices: 0,
    pairs: 0,
    area,
    at,
  };
}

/** A group of edges as a finding over the triangles that use them. */
function edgeFinding(mesh: IMesh, topo: Topology, areas: Float64Array, kind: HumanSkinIntegrity.Kind, group: number[]): IFinding {
  const tris: Set<number> = new Set();
  for (const e of group) for (let j: number = topo.offset[e]!; j < topo.offset[e + 1]!; j++) tris.add(Math.floor(topo.users[j]! / 3));
  const f: IFinding = finding(mesh, areas, kind, [...tris]);
  f.edges = group.length;
  return f;
}

/** Chains of a patch, most triangles first, at most three. */
function region(mesh: IMesh, patch: number[]): string {
  const count: Map<string, number> = new Map();
  for (const t of patch) {
    const c: number = mesh.tri[t] ?? -1;
    const name: string = c >= 0 ? (mesh.chains[c] ?? "unlabelled") : "unlabelled";
    count.set(name, (count.get(name) ?? 0) + 1);
  }
  const names: string[] = [...count.entries()]
    .sort((a: [string, number], b: [string, number]): number => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map((e: [string, number]): string => e[0]);
  return names.length > 3 ? `${names.slice(0, 3).join(" / ")} / +${names.length - 3}` : names.join(" / ");
}

/** Whether a triangle uses a vertex. */
function touches(mesh: IMesh, t: number, v: number): boolean {
  return mesh.I[3 * t] === v || mesh.I[3 * t + 1] === v || mesh.I[3 * t + 2] === v;
}

/** Edges, their users and each vertex's triangles. */
class Topology {
  public readonly I: Uint32Array;
  /** Edge count. */
  public readonly edges: number;
  /** Lower and upper vertex of each edge. */
  public readonly ea: Int32Array;
  public readonly eb: Int32Array;
  /** Half-edges using each edge, `3 t + k` for the edge from corner k to corner k + 1. */
  public readonly offset: Int32Array;
  public readonly users: Int32Array;
  /** Triangles at each vertex. */
  public readonly vstart: Int32Array;
  public readonly vtri: Int32Array;
  private readonly ids: Map<number, number> = new Map();
  private readonly n: number;

  public constructor(mesh: IMesh) {
    this.I = mesh.I;
    const n: number = mesh.P.length / 3;
    this.n = n;
    const T: number = mesh.I.length / 3;
    const half: Int32Array = new Int32Array(3 * T);
    const ea: number[] = [];
    const eb: number[] = [];
    for (let t: number = 0; t < T; t++)
      for (let k: number = 0; k < 3; k++) {
        const a: number = mesh.I[3 * t + k]!;
        const b: number = mesh.I[3 * t + ((k + 1) % 3)]!;
        const lo: number = Math.min(a, b);
        const hi: number = Math.max(a, b);
        const key: number = lo * n + hi;
        let e: number | undefined = this.ids.get(key);
        if (e === undefined) {
          e = ea.length;
          this.ids.set(key, e);
          ea.push(lo);
          eb.push(hi);
        }
        half[3 * t + k] = e;
      }
    this.edges = ea.length;
    this.ea = Int32Array.from(ea);
    this.eb = Int32Array.from(eb);
    this.offset = new Int32Array(this.edges + 1);
    for (const e of half) this.offset[e + 1]!++;
    for (let e: number = 0; e < this.edges; e++) this.offset[e + 1]! += this.offset[e]!;
    this.users = new Int32Array(3 * T);
    const fill: Int32Array = this.offset.slice(0, this.edges);
    for (let h: number = 0; h < 3 * T; h++) this.users[fill[half[h]!]!++] = h;
    this.vstart = new Int32Array(n + 1);
    for (const v of mesh.I) this.vstart[v + 1]!++;
    for (let v: number = 0; v < n; v++) this.vstart[v + 1]! += this.vstart[v]!;
    this.vtri = new Int32Array(3 * T);
    const vfill: Int32Array = this.vstart.slice(0, n);
    for (let t: number = 0; t < T; t++) for (let k: number = 0; k < 3; k++) this.vtri[vfill[mesh.I[3 * t + k]!]!++] = t;
  }

  /** The edge between two vertices, or -1. */
  public edge(a: number, b: number): number {
    return this.ids.get(Math.min(a, b) * this.n + Math.max(a, b)) ?? -1;
  }

  /** The vertex a half-edge leaves. */
  public from(h: number): number {
    return this.I[h]!;
  }

  /** Whether an edge's two users traverse it in opposite directions. */
  public consistent(e: number): boolean {
    const h1: number = this.users[this.offset[e]!]!;
    const h2: number = this.users[this.offset[e]! + 1]!;
    return this.from(h1) !== this.from(h2);
  }

  /** Triangles joined across every manifold, consistently wound edge. */
  public orientationPatches(): number[][] {
    const T: number = this.I.length / 3;
    const parent: Int32Array = Int32Array.from({ length: T }, (_: unknown, k: number): number => k);
    const find = (x: number): number => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]!]!;
        x = parent[x]!;
      }
      return x;
    };
    for (let e: number = 0; e < this.edges; e++) {
      if (this.offset[e + 1]! - this.offset[e]! !== 2 || !this.consistent(e)) continue;
      const a: number = find(Math.floor(this.users[this.offset[e]!]! / 3));
      const b: number = find(Math.floor(this.users[this.offset[e]! + 1]! / 3));
      if (a !== b) parent[a] = b;
    }
    const groups: Map<number, number[]> = new Map();
    for (let t: number = 0; t < T; t++) {
      const r: number = find(t);
      const g: number[] | undefined = groups.get(r);
      if (g === undefined) groups.set(r, [t]);
      else g.push(t);
    }
    return [...groups.values()];
  }

  /**
   * Vertices whose triangles fall into more than one fan: two sheets meeting
   * at a point. Triangles at a vertex join through the edges they share there.
   */
  public pinched(): number[] {
    const out: number[] = [];
    const n: number = this.vstart.length - 1;
    for (let v: number = 0; v < n; v++) {
      const s: number = this.vstart[v]!;
      const m: number = this.vstart[v + 1]! - s;
      if (m < 2) continue;
      const local: number[] = [];
      for (let j: number = 0; j < m; j++) local.push(this.vtri[s + j]!);
      const parent: number[] = local.map((_: number, k: number): number => k);
      const find = (x: number): number => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]!]!;
          x = parent[x]!;
        }
        return x;
      };
      for (let j: number = 0; j < m; j++) {
        const t: number = local[j]!;
        for (let k: number = 0; k < 3; k++) {
          const w: number = this.I[3 * t + k]!;
          if (w === v) continue;
          const e: number = this.edge(v, w);
          for (let q: number = this.offset[e]!; q < this.offset[e + 1]!; q++) {
            const u: number = local.indexOf(Math.floor(this.users[q]! / 3));
            if (u >= 0) {
              const a: number = find(j);
              const b: number = find(u);
              if (a !== b) parent[a] = b;
            }
          }
        }
      }
      let roots: number = 0;
      for (let j: number = 0; j < m; j++) if (find(j) === j) roots++;
      if (roots > 1) out.push(v);
    }
    return out;
  }

  /** A group of boundary edges as one closed simple loop of vertices, or null. */
  public loop(group: number[]): number[] | null {
    const next: Map<number, number[]> = new Map();
    for (const e of group)
      for (const [a, b] of [
        [this.ea[e]!, this.eb[e]!],
        [this.eb[e]!, this.ea[e]!],
      ] as [number, number][]) {
        const list: number[] | undefined = next.get(a);
        if (list === undefined) next.set(a, [b]);
        else list.push(b);
      }
    for (const list of next.values()) if (list.length !== 2) return null;
    if (next.size !== group.length) return null;
    const start: number = this.ea[group[0]!]!;
    const out: number[] = [start];
    let previous: number = -1;
    let current: number = start;
    for (;;) {
      const [x, y] = next.get(current)!;
      const step: number = x !== previous ? x! : y!;
      if (step === start) break;
      out.push(step);
      previous = current;
      current = step;
      if (out.length > group.length) return null;
    }
    return out.length === group.length ? out : null;
  }
}

/** Bounding volume hierarchy over triangles, split at the centroid midpoint of the longest axis. */
class Bvh {
  /** Triangle boxes. */
  public readonly tlo: Float64Array;
  public readonly thi: Float64Array;
  /** Node boxes. */
  public readonly lo: Float64Array;
  public readonly hi: Float64Array;
  /** Right child of an inner node; the left child follows the node. */
  public readonly right: Int32Array;
  /** Leaf range in `order`; count zero for an inner node. */
  public readonly start: Int32Array;
  public readonly count: Int32Array;
  public readonly order: Int32Array;

  public constructor(mesh: IMesh) {
    const T: number = mesh.I.length / 3;
    this.tlo = new Float64Array(3 * T);
    this.thi = new Float64Array(3 * T);
    const centre: Float64Array = new Float64Array(3 * T);
    for (let t: number = 0; t < T; t++)
      for (let k: number = 0; k < 3; k++) {
        const a: number = mesh.P[3 * mesh.I[3 * t]! + k]!;
        const b: number = mesh.P[3 * mesh.I[3 * t + 1]! + k]!;
        const c: number = mesh.P[3 * mesh.I[3 * t + 2]! + k]!;
        this.tlo[3 * t + k] = Math.min(a, b, c);
        this.thi[3 * t + k] = Math.max(a, b, c);
        centre[3 * t + k] = (a + b + c) / 3;
      }
    const capacity: number = Math.max(1, 2 * T);
    this.lo = new Float64Array(3 * capacity);
    this.hi = new Float64Array(3 * capacity);
    this.right = new Int32Array(capacity);
    this.start = new Int32Array(capacity);
    this.count = new Int32Array(capacity);
    this.order = Int32Array.from({ length: T }, (_: unknown, k: number): number => k);
    let nodes: number = 0;
    const build = (begin: number, end: number): number => {
      const node: number = nodes++;
      const lo: V3 = [Infinity, Infinity, Infinity];
      const hi: V3 = [-Infinity, -Infinity, -Infinity];
      const clo: V3 = [Infinity, Infinity, Infinity];
      const chi: V3 = [-Infinity, -Infinity, -Infinity];
      for (let i: number = begin; i < end; i++) {
        const t: number = this.order[i]!;
        for (let k: number = 0; k < 3; k++) {
          lo[k] = Math.min(lo[k]!, this.tlo[3 * t + k]!);
          hi[k] = Math.max(hi[k]!, this.thi[3 * t + k]!);
          clo[k] = Math.min(clo[k]!, centre[3 * t + k]!);
          chi[k] = Math.max(chi[k]!, centre[3 * t + k]!);
        }
      }
      for (let k: number = 0; k < 3; k++) {
        this.lo[3 * node + k] = lo[k]!;
        this.hi[3 * node + k] = hi[k]!;
      }
      if (end - begin <= 4) {
        this.start[node] = begin;
        this.count[node] = end - begin;
        return node;
      }
      const axis: number = chi[0] - clo[0] >= chi[1] - clo[1] && chi[0] - clo[0] >= chi[2] - clo[2] ? 0 : chi[1] - clo[1] >= chi[2] - clo[2] ? 1 : 2;
      const mid: number = (clo[axis]! + chi[axis]!) / 2;
      let i: number = begin;
      let j: number = end - 1;
      while (i <= j) {
        if (centre[3 * this.order[i]! + axis]! < mid) i++;
        else {
          const swap: number = this.order[i]!;
          this.order[i] = this.order[j]!;
          this.order[j] = swap;
          j--;
        }
      }
      let split: number = i;
      if (split === begin || split === end) split = (begin + end) >> 1;
      this.count[node] = 0;
      build(begin, split);
      this.right[node] = build(split, end);
      return node;
    };
    if (T > 0) build(0, T);
  }

  /** Crossings of a ray with every triangle but one, beyond its origin. */
  public hits(mesh: IMesh, o: V3, d: V3, skip: number): number {
    const inv: V3 = [1 / d[0], 1 / d[1], 1 / d[2]];
    const stack: number[] = [0];
    let hits: number = 0;
    while (stack.length) {
      const node: number = stack.pop()!;
      let near: number = 0;
      let far: number = Infinity;
      for (let k: number = 0; k < 3; k++) {
        const t1: number = (this.lo[3 * node + k]! - o[k]!) * inv[k]!;
        const t2: number = (this.hi[3 * node + k]! - o[k]!) * inv[k]!;
        near = Math.max(near, Math.min(t1, t2));
        far = Math.min(far, Math.max(t1, t2));
      }
      if (!(near <= far)) continue;
      const count: number = this.count[node]!;
      if (count === 0) {
        stack.push(node + 1, this.right[node]!);
        continue;
      }
      for (let k: number = this.start[node]!; k < this.start[node]! + count; k++) {
        const t: number = this.order[k]!;
        if (t !== skip && rayHits(mesh, t, o, d)) hits++;
      }
    }
    return hits;
  }
}

/** Whether a ray crosses a triangle beyond its origin (Möller and Trumbore). */
function rayHits(mesh: IMesh, t: number, o: V3, d: V3): boolean {
  const a: V3 = point(mesh, mesh.I[3 * t]!);
  const e1: V3 = sub(point(mesh, mesh.I[3 * t + 1]!), a);
  const e2: V3 = sub(point(mesh, mesh.I[3 * t + 2]!), a);
  const p: V3 = crossV(d, e2);
  const det: number = dot(e1, p);
  if (det === 0) return false;
  const s: V3 = sub(o, a);
  const u: number = dot(s, p) / det;
  if (u < 0 || u > 1) return false;
  const q: V3 = crossV(s, e1);
  const v: number = dot(d, q) / det;
  if (v < 0 || u + v > 1) return false;
  // A crossing within a billionth of the origin's coordinates is the
  // origin's own sheet, such as a triangle lying on the sampled one.
  const reach: number = 1e-9 * (1 + Math.max(Math.abs(o[0]), Math.abs(o[1]), Math.abs(o[2])));
  return dot(e2, q) / det > reach;
}

function point(mesh: IMesh, v: number): V3 {
  return [mesh.P[3 * v]!, mesh.P[3 * v + 1]!, mesh.P[3 * v + 2]!];
}

function centroid(mesh: IMesh, t: number): V3 {
  const out: V3 = [0, 0, 0];
  for (let k: number = 0; k < 3; k++)
    for (let a: number = 0; a < 3; a++) out[a] += mesh.P[3 * mesh.I[3 * t + k]! + a]! / 3;
  return out;
}

function normal(P: Float64Array, a: number, b: number, c: number): V3 {
  const u: V3 = [P[3 * b]! - P[3 * a]!, P[3 * b + 1]! - P[3 * a + 1]!, P[3 * b + 2]! - P[3 * a + 2]!];
  const v: V3 = [P[3 * c]! - P[3 * a]!, P[3 * c + 1]! - P[3 * a + 1]!, P[3 * c + 2]! - P[3 * a + 2]!];
  return crossV(u, v);
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function crossV(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dist(a: V3, b: V3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Distance of a point from the axis through a centre along a unit direction. */
function radial(p: V3, centre: V3, axis: V3): number {
  const r: V3 = sub(p, centre);
  const along: number = dot(r, axis);
  return Math.hypot(r[0] - along * axis[0], r[1] - along * axis[1], r[2] - along * axis[2]);
}

/** Two unit vectors completing a unit axis to an orthonormal frame. */
function basis(axis: V3): [V3, V3] {
  const helper: V3 = Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u0: V3 = crossV(axis, helper);
  const lu: number = Math.hypot(...u0);
  const u: V3 = [u0[0] / lu, u0[1] / lu, u0[2] / lu];
  return [u, crossV(axis, u)];
}
