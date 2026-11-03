import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import type { HumanSkinIntegrityTopology } from "./HumanSkinIntegrityTopology";
import { HumanSkinIntegrityUnion as Union } from "./HumanSkinIntegrityUnion";
import { HumanSkinIntegrityVector as Vec } from "./HumanSkinIntegrityVector";

/**
 * Connected patches of flagged triangles and edges, and the findings that
 * name them: where on the body a patch lies, how large it is and one point on
 * it.
 */
export namespace HumanSkinIntegrityPatch {
  /**
   * Connected patches of flagged triangles, joined by a shared vertex or by a
   * listed pair, each as a list of triangles.
   */
  export function patches(
    topo: HumanSkinIntegrityTopology,
    flagged: number[],
    links: [number, number][],
  ): number[][] {
    if (!flagged.length) return [];

    // Triangles touching at a vertex are one patch, so join every flagged triangle to the first at each vertex.
    const union: Union = new Union(flagged.length);
    const slot: Map<number, number> = new Map();
    const byVertex: Map<number, number> = new Map();

    flagged.forEach((t: number, k: number): void => {
      slot.set(t, k);

      for (let i: number = 0; i < 3; i++) {
        const v: number = topo.I[3 * t + i]!;
        const other: number | undefined = byVertex.get(v);

        if (other === undefined) byVertex.set(v, k);
        else union.join(k, other);
      }
    });

    // A listed pair joins its triangles even when they share no vertex, such as two that cross.
    for (const [t, u] of links) union.join(slot.get(t)!, slot.get(u)!);

    return union.groups().map((group: number[]): number[] => group.map((k: number): number => flagged[k]!));
  }

  /** Connected groups of flagged edges, joined at shared vertices, each as a list of edges. */
  export function edgeGroups(topo: HumanSkinIntegrityTopology, edges: number[]): number[][] {
    if (!edges.length) return [];

    // Edges meeting at a vertex are one group.
    const union: Union = new Union(edges.length);
    const byVertex: Map<number, number> = new Map();

    edges.forEach((e: number, k: number): void => {
      for (const v of [topo.ea[e]!, topo.eb[e]!]) {
        const other: number | undefined = byVertex.get(v);

        if (other === undefined) byVertex.set(v, k);
        else union.join(k, other);
      }
    });

    return union.groups().map((group: number[]): number[] => group.map((k: number): number => edges[k]!));
  }

  /** A patch of triangles as a finding. */
  export function finding(
    mesh: HumanSkinIntegrity.IMesh,
    areas: Float64Array,
    kind: HumanSkinIntegrity.Kind,
    patch: number[],
  ): HumanSkinIntegrity.IFinding {
    // The patch's area, and its centre weighted by area; a patch with no area weighs each triangle alike.
    let area: number = 0;
    let weight: number = 0;
    const centre: Vec.V3 = [0, 0, 0];

    for (const t of patch) {
      const w: number = areas[t]! > 0 ? areas[t]! : 1e-300;
      const m: Vec.V3 = Vec.centroid(mesh, t);

      area += areas[t]!;
      weight += w;

      for (let k: number = 0; k < 3; k++) centre[k] = centre[k]! + w * m[k]!;
    }

    for (let k: number = 0; k < 3; k++) centre[k] = centre[k]! / weight;

    // The reported point lies on the skin: the triangle centroid nearest the patch's centre.
    let at: Vec.V3 = Vec.centroid(mesh, patch[0]!);

    for (const t of patch) {
      const m: Vec.V3 = Vec.centroid(mesh, t);

      if (Vec.dist(m, centre) < Vec.dist(at, centre)) at = m;
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
      measure: 0,
      at,
    };
  }

  /** A group of edges as a finding over the triangles that use them. */
  export function edgeFinding(
    mesh: HumanSkinIntegrity.IMesh,
    topo: HumanSkinIntegrityTopology,
    areas: Float64Array,
    kind: HumanSkinIntegrity.Kind,
    group: number[],
  ): HumanSkinIntegrity.IFinding {
    const triangles: Set<number> = new Set();

    for (const e of group)
      for (let j: number = topo.offset[e]!; j < topo.offset[e + 1]!; j++) triangles.add(Math.floor(topo.users[j]! / 3));

    const out: HumanSkinIntegrity.IFinding = finding(mesh, areas, kind, [...triangles]);

    out.edges = group.length;

    return out;
  }

  /** Crossing pairs as findings: a patch is the triangles a chain of crossings and shared vertices joins. */
  export function crossingFindings(
    mesh: HumanSkinIntegrity.IMesh,
    topo: HumanSkinIntegrityTopology,
    areas: Float64Array,
    found: [number, number][],
  ): HumanSkinIntegrity.IFinding[] {
    const groups: number[][] = patches(topo, [...new Set(found.flat())], found);
    const patchOf: Map<number, number> = new Map();

    groups.forEach((group: number[], k: number): void => {
      for (const t of group) patchOf.set(t, k);
    });

    // Each pair counts toward the patch of its first triangle.
    const pairs: number[] = groups.map((): number => 0);

    for (const [t] of found) pairs[patchOf.get(t)!] = pairs[patchOf.get(t)!]! + 1;

    return groups.map((group: number[], k: number): HumanSkinIntegrity.IFinding => {
      const out: HumanSkinIntegrity.IFinding = finding(mesh, areas, "self-intersection", group);

      out.pairs = pairs[k]!;

      return out;
    });
  }

  /** The chains of a patch, most triangles first, at most three. */
  export function region(mesh: HumanSkinIntegrity.IMesh, patch: number[]): string {
    const count: Map<string, number> = new Map();

    for (const t of patch) {
      const chain: number = mesh.tri[t] ?? -1;
      const name: string = chain >= 0 ? (mesh.chains[chain] ?? "unlabelled") : "unlabelled";

      count.set(name, (count.get(name) ?? 0) + 1);
    }

    const names: string[] = [...count.entries()]
      .sort((a: [string, number], b: [string, number]): number => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map((entry: [string, number]): string => entry[0]);

    return names.length > 3 ? `${names.slice(0, 3).join(" / ")} / +${names.length - 3}` : names.join(" / ");
  }

  /** Whether a triangle uses a vertex. */
  export function touches(mesh: HumanSkinIntegrity.IMesh, t: number, v: number): boolean {
    return mesh.I[3 * t] === v || mesh.I[3 * t + 1] === v || mesh.I[3 * t + 2] === v;
  }
}
