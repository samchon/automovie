import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import { HumanSkinIntegrityPatch as Patch } from "./HumanSkinIntegrityPatch";
import type { HumanSkinIntegrityTopology } from "./HumanSkinIntegrityTopology";
import { HumanSkinIntegrityUnion as Union } from "./HumanSkinIntegrityUnion";

/**
 * The Euler characteristic of a set of triangles and the genus it implies.
 *
 * A connected, orientable surface with `b` boundary loops and `g` handles has
 * the characteristic `V - E + F = 2 - 2 g - b`. A body's skin, like each piece
 * it is built from, is a sphere with holes and no handles: a limb is a tube
 * with two ends, a hand a cup with one, so a piece or a whole that comes out
 * with a handle has two parts fused where anatomy leaves them apart, or a hole
 * punched through where it has none.
 */
export namespace HumanSkinIntegrityEuler {
  /** One connected component of a set of triangles. */
  export interface IComponent {
    /** Triangles of the component. */
    triangles: number[];

    /** Vertices used by its triangles. */
    vertices: number;

    /** Edges used by its triangles. */
    edges: number;

    /** Number of triangles. */
    faces: number;

    /** Boundary loops: connected groups of edges with a single user in the set. */
    loops: number;

    /** Whether every edge has one or two users, wound opposite ways: a surface the formula applies to. */
    manifold: boolean;

    /** Whether every boundary group is one simple closed loop: a seam that does not pinch. */
    simple: boolean;

    /** Handles, or NaN when the component is not `manifold` and `simple`. */
    genus: number;
  }

  /**
   * The components of a set of triangles, joined across shared edges, each
   * with its characteristic and genus.
   */
  export function components(
    mesh: HumanSkinIntegrity.IMesh,
    topo: HumanSkinIntegrityTopology,
    triangles: number[],
  ): IComponent[] {
    if (!triangles.length) return [];

    // Triangles of the set that share an edge are one component.
    const slot: Map<number, number> = new Map();
    const union: Union = new Union(triangles.length);

    triangles.forEach((t: number, k: number): void => {
      slot.set(t, k);
    });

    const inside: (h: number) => number = (h: number): number => slot.get(Math.floor(h / 3)) ?? -1;

    for (let k: number = 0; k < triangles.length; k++)
      for (let corner: number = 0; corner < 3; corner++) {
        const e: number = edgeOf(topo, triangles[k]!, corner);

        for (let j: number = topo.offset[e]!; j < topo.offset[e + 1]!; j++) {
          const other: number = inside(topo.users[j]!);

          if (other >= 0) union.join(k, other);
        }
      }

    return union.groups().map((group: number[]): IComponent => describe(mesh, topo, triangles, slot, group));
  }

  /** The characteristic, boundary and genus of one group of the set's triangles. */
  function describe(
    mesh: HumanSkinIntegrity.IMesh,
    topo: HumanSkinIntegrityTopology,
    triangles: number[],
    slot: Map<number, number>,
    group: number[],
  ): IComponent {
    const members: number[] = group.map((k: number): number => triangles[k]!);
    const vertices: Set<number> = new Set();
    const edges: Set<number> = new Set();
    const boundary: number[] = [];
    let manifold: boolean = true;
    let simple: boolean = true;

    for (const t of members) {
      for (let corner: number = 0; corner < 3; corner++) vertices.add(mesh.I[3 * t + corner]!);

      for (let corner: number = 0; corner < 3; corner++) {
        const e: number = edgeOf(topo, t, corner);

        if (edges.has(e)) continue;

        edges.add(e);

        // Only users from the set count: an edge shared with another piece is this piece's boundary.
        const users: number[] = [];

        for (let j: number = topo.offset[e]!; j < topo.offset[e + 1]!; j++)
          if (slot.has(Math.floor(topo.users[j]! / 3))) users.push(topo.users[j]!);

        if (users.length === 1) boundary.push(e);
        else if (users.length > 2 || mesh.I[users[0]!] === mesh.I[users[1]!]) manifold = false;
      }
    }

    // Each boundary group must be one simple closed loop for the formula to count it once.
    const loops: number[][] = Patch.edgeGroups(topo, boundary);

    for (const loop of loops) if (topo.loop(loop) === null) simple = false;

    const characteristic: number = vertices.size - edges.size + members.length;

    return {
      triangles: members,
      vertices: vertices.size,
      edges: edges.size,
      faces: members.length,
      loops: loops.length,
      manifold,
      simple,
      genus: manifold && simple ? (2 - characteristic - loops.length) / 2 : NaN,
    };
  }

  /** The edge a triangle's corner leaves along. */
  function edgeOf(topo: HumanSkinIntegrityTopology, t: number, corner: number): number {
    return topo.edge(topo.I[3 * t + corner]!, topo.I[3 * t + ((corner + 1) % 3)]!);
  }
}
