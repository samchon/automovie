import type { IAutoMovieHumanLoftAperture } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanSkinIntegrityBvh as Bvh } from "./HumanSkinIntegrityBvh";
import { HumanSkinIntegrityDecomposition as Decomposition } from "./HumanSkinIntegrityDecomposition";
import { HumanSkinIntegrityOpening as Opening } from "./HumanSkinIntegrityOpening";
import { HumanSkinIntegrityPatch as Patch } from "./HumanSkinIntegrityPatch";
import { HumanSkinIntegrityPredicate as Predicate } from "./HumanSkinIntegrityPredicate";
import { HumanSkinIntegrityShape as Shape } from "./HumanSkinIntegrityShape";
import { HumanSkinIntegrityTopology as Topology } from "./HumanSkinIntegrityTopology";
import { HumanSkinIntegrityVector as Vec } from "./HumanSkinIntegrityVector";

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
 * modelled feature. No limit comes from the figure. Findings are grouped into
 * connected patches and each is named by the chains its triangles belong to.
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
    | "unreferenced vertex"
    | "handle"
    | "pinched seam"
    | "separate component"
    | "seam crease";

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

    /** A measurement of the kind: handles for a `handle`, degrees of turn for a `seam crease`; else zero. */
    measure: number;

    /** A point of the patch on the skin, mm. */
    at: V3;
  }

  /** The openings a body declares open, from its apertures. */
  export function openings(apertures: readonly IAutoMovieHumanLoftAperture[]): IOpening[] {
    return Opening.evaluate(apertures);
  }

  /**
   * Every finding on a mesh: crossings, topology, orientation and triangle
   * shape, grouped into patches.
   *
   * @param openings Openings the mesh may end at; each accounts for one
   *   closed boundary loop that winds once round its axis inside its margin.
   */
  export function audit(mesh: IMesh, openings: readonly IOpening[]): IFinding[] {
    // Data no later step can read is reported alone.
    const broken: IFinding[] | null = unreadable(mesh);

    if (broken !== null) return broken;

    const topo: Topology = new Topology(mesh);
    const areas: Float64Array = Shape.areas(mesh);
    const out: IFinding[] = [...shapes(mesh, topo, areas), ...duplicates(mesh, topo, areas), ...edges(mesh, topo, areas, openings)];

    // Corners where two sheets meet, positions no triangle uses, and the skin read along the seams of its regions.
    out.push(...corners(mesh, topo, areas), ...unused(mesh, topo), ...Decomposition.findings(mesh, topo, areas));

    // Crossings, and the facing of each consistently wound sheet by ray parity.
    const bvh: Bvh = new Bvh(mesh);

    out.push(...Patch.crossingFindings(mesh, topo, areas, bvh.crossings(mesh)));

    for (const patch of topo.orientationPatches())
      if (Shape.inward(mesh, bvh, areas, patch)) out.push(Patch.finding(mesh, areas, "inverted", patch));

    return sort(out);
  }

  /** Only the crossings of a mesh, as findings. */
  export function intersections(mesh: IMesh): IFinding[] {
    const topo: Topology = new Topology(mesh);
    const found: [number, number][] = new Bvh(mesh).crossings(mesh);

    return sort(Patch.crossingFindings(mesh, topo, Shape.areas(mesh), found));
  }

  /**
   * Every pair of triangles that cross, each as `[t, u]` with `t < u`, found
   * through a bounding volume hierarchy or, `exhaustive`, over all pairs.
   */
  export function pairs(mesh: IMesh, exhaustive: boolean = false): [number, number][] {
    if (!exhaustive) return new Bvh(mesh).crossings(mesh);

    // The oracle the hierarchy is checked against: every pair, no pruning.
    const out: [number, number][] = [];
    const T: number = mesh.I.length / 3;

    for (let t: number = 0; t < T; t++)
      for (let u: number = t + 1; u < T; u++)
        if (Predicate.shared(mesh.I, t, u) < 2 && Predicate.crosses(mesh.P, mesh.I, t, u)) out.push([t, u]);

    return out;
  }

  /** One line per finding. */
  export function format(f: IFinding): string {
    const parts: string[] = [`${f.triangles} triangles`];

    if (f.edges) parts.push(`${f.edges} edges`);

    if (f.vertices) parts.push(`${f.vertices} vertices`);

    if (f.pairs) parts.push(`${f.pairs} crossing pairs`);

    if (f.measure) parts.push(f.kind === "handle" ? `${f.measure} handles` : `${f.measure.toFixed(1)} deg`);

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

  /** A finding that names no triangles, only a count of what is wrong. */
  function summary(mesh: IMesh, region: string, kind: Kind, patch: Partial<IFinding>): IFinding {
    return {
      person: mesh.name,
      region,
      kind,
      triangles: 0,
      edges: 0,
      vertices: 0,
      pairs: 0,
      area: 0,
      measure: 0,
      at: [NaN, NaN, NaN],
      ...patch,
    };
  }

  /** The finding that stops the audit when an index or a position cannot be read, or null. */
  function unreadable(mesh: IMesh): IFinding[] | null {
    const n: number = mesh.P.length / 3;
    const T: number = mesh.I.length / 3;
    const bad: number[] = [];

    // A triangle naming a vertex past the positions.
    for (let t: number = 0; t < T; t++)
      for (let k: number = 0; k < 3; k++)
        if (!(mesh.I[3 * t + k]! < n)) {
          bad.push(t);
          break;
        }

    if (bad.length)
      return [summary(mesh, Patch.region(mesh, bad), "invalid index", { triangles: bad.length })];

    // A position that is not a number.
    let nonFinite: number = 0;

    for (let v: number = 0; v < n; v++)
      if (!Number.isFinite(mesh.P[3 * v]!) || !Number.isFinite(mesh.P[3 * v + 1]!) || !Number.isFinite(mesh.P[3 * v + 2]!))
        nonFinite++;

    return nonFinite ? [summary(mesh, "vertices", "non-finite vertex", { vertices: nonFinite })] : null;
  }

  /** Triangles with no area or too thin to keep it in single precision, as patches. */
  function shapes(mesh: IMesh, topo: Topology, areas: Float64Array): IFinding[] {
    const zero: number[] = [];
    const needle: number[] = [];

    for (let t: number = 0; t < mesh.I.length / 3; t++) {
      const kind: Shape.Class = Shape.classify(mesh, t);

      if (kind === "zero") zero.push(t);
      else if (kind === "needle") needle.push(t);
    }

    return [
      ...Patch.patches(topo, zero, []).map((patch: number[]): IFinding => Patch.finding(mesh, areas, "zero-area triangle", patch)),
      ...Patch.patches(topo, needle, []).map((patch: number[]): IFinding => Patch.finding(mesh, areas, "needle triangle", patch)),
    ];
  }

  /** Triangles on the same three vertices, as patches. */
  function duplicates(mesh: IMesh, topo: Topology, areas: Float64Array): IFinding[] {
    const n: number = mesh.P.length / 3;
    const seen: Map<number, number> = new Map();
    const flagged: number[] = [];
    const twins: [number, number][] = [];

    for (let t: number = 0; t < mesh.I.length / 3; t++) {
      // Sorted corners name the triangle whatever its winding or starting corner.
      const v: number[] = [mesh.I[3 * t]!, mesh.I[3 * t + 1]!, mesh.I[3 * t + 2]!].sort((x: number, y: number): number => x - y);

      if (v[0] === v[1] || v[1] === v[2]) continue;

      const key: number = topo.edge(v[0]!, v[1]!) * n + v[2]!;
      const first: number | undefined = seen.get(key);

      if (first === undefined) seen.set(key, t);
      else {
        flagged.push(first, t);
        twins.push([first, t]);
      }
    }

    return Patch.patches(topo, [...new Set(flagged)], twins).map(
      (patch: number[]): IFinding => Patch.finding(mesh, areas, "duplicate triangle", patch),
    );
  }

  /** Edges shared by more than two triangles, wound the same way twice, or open without being a declared margin. */
  function edges(mesh: IMesh, topo: Topology, areas: Float64Array, openings: readonly IOpening[]): IFinding[] {
    const nonManifold: number[] = [];
    const inconsistent: number[] = [];
    const boundary: number[] = [];

    for (let e: number = 0; e < topo.edges; e++) {
      const users: number = topo.uses(e);

      if (users === 1) boundary.push(e);
      else if (users > 2) nonManifold.push(e);
      else if (!topo.consistent(e)) inconsistent.push(e);
    }

    const out: IFinding[] = [
      ...Patch.edgeGroups(topo, nonManifold).map(
        (group: number[]): IFinding => Patch.edgeFinding(mesh, topo, areas, "non-manifold edge", group),
      ),
      ...Patch.edgeGroups(topo, inconsistent).map(
        (group: number[]): IFinding => Patch.edgeFinding(mesh, topo, areas, "inconsistent winding", group),
      ),
    ];

    // A boundary loop is allowed once for each declared opening it is the margin of.
    const used: Set<number> = new Set();

    for (const group of Patch.edgeGroups(topo, boundary)) {
      const opening: number = Opening.declared(mesh, topo, group, openings, used);

      if (opening >= 0) used.add(opening);
      else out.push(Patch.edgeFinding(mesh, topo, areas, "open boundary", group));
    }

    return out;
  }

  /** Vertices where two sheets meet at a point, as patches of the triangles at them. */
  function corners(mesh: IMesh, topo: Topology, areas: Float64Array): IFinding[] {
    const pinched: number[] = topo.pinched();
    const triangles: number[] = [];

    for (const v of pinched)
      for (let j: number = topo.vstart[v]!; j < topo.vstart[v + 1]!; j++) triangles.push(topo.vtri[j]!);

    return Patch.patches(topo, [...new Set(triangles)], []).map((patch: number[]): IFinding => {
      const out: IFinding = Patch.finding(mesh, areas, "non-manifold vertex", patch);

      out.vertices = pinched.filter((v: number): boolean => patch.some((t: number): boolean => Patch.touches(mesh, t, v))).length;

      return out;
    });
  }

  /** Positions no triangle uses, as one finding at the one nearest their centre. */
  function unused(mesh: IMesh, topo: Topology): IFinding[] {
    const n: number = mesh.P.length / 3;
    const loose: number[] = [];

    for (let v: number = 0; v < n; v++) if (topo.vstart[v] === topo.vstart[v + 1]) loose.push(v);

    if (!loose.length) return [];

    // The reported point is a real position, the one nearest the loose positions' centre.
    const centre: Vec.V3 = [0, 0, 0];

    for (const v of loose) for (let a: number = 0; a < 3; a++) centre[a] = centre[a]! + mesh.P[3 * v + a]! / loose.length;

    let best: number = loose[0]!;

    for (const v of loose) if (Vec.dist(Vec.at(mesh.P, v), centre) < Vec.dist(Vec.at(mesh.P, best), centre)) best = v;

    return [summary(mesh, "unused positions", "unreferenced vertex", { vertices: loose.length, at: Vec.at(mesh.P, best) })];
  }
}
