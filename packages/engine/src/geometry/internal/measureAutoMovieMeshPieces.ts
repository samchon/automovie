import type { IAutoMovieMesh, IAutoMovieMeshPiece } from "@automovie/interface";

import { createMeshEdgeKey } from "../../math/internal/createMeshEdgeKey";
import { weldAutoMovieMeshCorners } from "./weldAutoMovieMeshCorners";

/*
 * Report the topology of each piece of a mesh: its counts, boundary loops,
 * Euler characteristic, manifoldness, orientability, stored winding and genus.
 *
 * Corners are welded exactly as `inspectAutoMovieMeshTopology` welds them,
 * through the shared `weldAutoMovieMeshCorners`: on the `MESH_WELD_GRID`
 * lattice, or by declared physical sources. Degenerate triangles are skipped as
 * that report skips them. The remaining triangles split into pieces connected
 * through shared edges, so a cube whose faces carry their own corners is one
 * piece while two solids touching at one corner are two. Each piece reports its
 * welded vertex, undirected edge and triangle counts, its boundary loops as
 * connected components of the edges one triangle uses, and `euler = vertices -
 * edges + faces`.
 *
 * A piece is `manifold` when every edge has one or two triangles and each
 * vertex's triangles in the piece form one fan, joined through edges at that
 * vertex. Orientability is asked of the triangles, not of their stored order: a
 * manifold piece is orientable when its triangles can be flipped so every
 * two-triangle edge is traversed oppositely, which a breadth-first
 * two-colouring decides, and it is null for a piece that is not manifold.
 * `consistentlyWound` asks whether the stored order already does so: every edge
 * shared by several triangles is traversed as often in each direction. The
 * genus, `(2 - euler - boundaryLoops) / 2` by the classification of compact
 * surfaces, is reported only for a manifold orientable piece and is null
 * otherwise.
 *
 * Pieces are ordered by their lowest triangle ordinal. A mesh without
 * non-degenerate triangles has no piece. The mesh is only read. A malformed
 * index buffer and invalid physical correspondence throw the same refusals as
 * `inspectAutoMovieMeshTopology`.
 * Parameter mesh: Mesh to measure.
 * Returns: One record per piece, in first-triangle order.
 */
export const measureAutoMovieMeshPieces: (
  mesh: IAutoMovieMesh,
) => IAutoMovieMeshPiece[] = (mesh: IAutoMovieMesh): IAutoMovieMeshPiece[] => {
  const { indices, corners, identities }: weldAutoMovieMeshCorners.IResult =
    weldAutoMovieMeshCorners(mesh, "mesh topology");
  const triangles: number = indices.length / 3;
  const live: (triangle: number) => boolean = (triangle: number): boolean =>
    corners[triangle * 3]! >= 0;

  // Every undirected edge with the triangles that use it, in ordinal order.
  const edgeKey: (from: number, to: number) => number | string =
    createMeshEdgeKey(identities);
  const edges: Map<number | string, IEdge> = new Map();
  for (let triangle: number = 0; triangle < triangles; ++triangle) {
    if (!live(triangle)) continue;
    for (let corner: number = 0; corner < 3; ++corner) {
      const from: number = corners[triangle * 3 + corner]!;
      const to: number = corners[triangle * 3 + ((corner + 1) % 3)]!;
      const low: number = Math.min(from, to);
      const high: number = Math.max(from, to);
      const key: number | string = edgeKey(low, high);
      let edge: IEdge | undefined = edges.get(key);
      if (edge === undefined) {
        edge = { low, high, uses: [], forward: [] };
        edges.set(key, edge);
      }
      edge.uses.push(triangle);
      edge.forward.push(from === low);
    }
  }

  // Triangles joined through an edge are one piece. Corner slots, three per
  // triangle, joined through an edge at their vertex are one fan of it.
  const piece: UnionFind = new UnionFind(triangles);
  const fan: UnionFind = new UnionFind(triangles * 3);
  const slot: (triangle: number, vertex: number) => number = (
    triangle: number,
    vertex: number,
  ): number => {
    for (let corner: number = 0; corner < 3; ++corner)
      if (corners[triangle * 3 + corner] === vertex)
        return triangle * 3 + corner;
    throw new Error("A mesh piece edge must name its triangle's corners.");
  };
  for (const edge of edges.values())
    for (let use: number = 1; use < edge.uses.length; ++use) {
      const before: number = edge.uses[use - 1]!;
      const after: number = edge.uses[use]!;
      piece.join(before, after);
      fan.join(slot(before, edge.low), slot(after, edge.low));
      fan.join(slot(before, edge.high), slot(after, edge.high));
    }

  // Pieces in first-triangle order, each with its vertices numbered locally.
  const order: Map<number, number> = new Map();
  const pieces: IPieceTally[] = [];
  for (let triangle: number = 0; triangle < triangles; ++triangle) {
    if (!live(triangle)) continue;
    const root: number = piece.find(triangle);
    let at: number | undefined = order.get(root);
    if (at === undefined) {
      at = pieces.length;
      order.set(root, at);
      pieces.push({
        firstTriangle: triangle,
        triangles: [],
        vertices: new Map(),
        edges: [],
        fanless: false,
      });
    }
    const tally: IPieceTally = pieces[at]!;
    tally.triangles.push(triangle);
    for (let corner: number = 0; corner < 3; ++corner) {
      const vertex: number = corners[triangle * 3 + corner]!;
      const root: number = fan.find(triangle * 3 + corner);
      const seen: IVertexTally | undefined = tally.vertices.get(vertex);
      if (seen === undefined)
        tally.vertices.set(vertex, { local: tally.vertices.size, fan: root });
      else if (seen.fan !== root) tally.fanless = true;
    }
  }
  for (const edge of edges.values())
    pieces[order.get(piece.find(edge.uses[0]!))!]!.edges.push(edge);
  return pieces.map(summarize);
};

/*
 * One undirected welded edge: its lower and higher vertex identities, the
 * triangles using it in ordinal order, and whether each of them traverses it
 * from low to high.
 */
interface IEdge {
  /*
   * The lower welded vertex identity.
   */
  low: number;

  /*
   * The higher welded vertex identity.
   */
  high: number;

  /*
   * The triangles using the edge, in ordinal order.
   */
  uses: number[];

  /*
   * Per use, whether that triangle traverses the edge from low to high.
   */
  forward: boolean[];
}

/*
 * One vertex of a piece: its piece-local number and the fan of its first slot.
 */
interface IVertexTally {
  /*
   * The vertex's number within its piece, in first-use order.
   */
  local: number;

  /*
   * The fan root of the corner slot that first used the vertex.
   */
  fan: number;
}

/*
 * What one piece gathers before it is summarized: its first ordinal, its
 * triangles in ordinal order, its vertices, its edges, and whether some vertex
 * carries more than one fan.
 */
interface IPieceTally {
  /*
   * The piece's lowest triangle ordinal.
   */
  firstTriangle: number;

  /*
   * The piece's triangles, in ordinal order.
   */
  triangles: number[];

  /*
   * The piece's vertices, by welded identity.
   */
  vertices: Map<number, IVertexTally>;

  /*
   * The piece's undirected edges.
   */
  edges: IEdge[];

  /*
   * Whether some vertex's triangles in the piece form more than one fan.
   */
  fanless: boolean;
}

/*
 * The record of one gathered piece.
 */
const summarize: (tally: IPieceTally) => IAutoMovieMeshPiece = (
  tally: IPieceTally,
): IAutoMovieMeshPiece => {
  // Boundary loops are the components of the edges one triangle uses.
  const loops: UnionFind = new UnionFind(tally.vertices.size);
  const rims: Set<number> = new Set();
  let manifold: boolean = !tally.fanless;
  let consistentlyWound: boolean = true;
  for (const edge of tally.edges) {
    if (edge.uses.length > 2) manifold = false;
    if (
      edge.uses.length > 1 &&
      edge.forward.filter(Boolean).length * 2 !== edge.uses.length
    )
      consistentlyWound = false;
    if (edge.uses.length !== 1) continue;
    const low: number = tally.vertices.get(edge.low)!.local;
    const high: number = tally.vertices.get(edge.high)!.local;
    loops.join(low, high);
    rims.add(low).add(high);
  }
  const boundaryLoops: number = new Set(
    [...rims].map((vertex: number): number => loops.find(vertex)),
  ).size;
  const euler: number =
    tally.vertices.size - tally.edges.length + tally.triangles.length;
  const orientable: boolean | null = manifold ? orientableOf(tally) : null;
  return {
    firstTriangle: tally.firstTriangle,
    vertices: tally.vertices.size,
    edges: tally.edges.length,
    faces: tally.triangles.length,
    boundaryLoops,
    euler,
    manifold,
    orientable,
    consistentlyWound,
    genus: orientable === true ? (2 - euler - boundaryLoops) / 2 : null,
  };
};

/*
 * Whether a manifold piece's triangles can be flipped so every two-triangle
 * edge is traversed oppositely: a breadth-first two-colouring in which a
 * triangle keeps its neighbour's flip across an edge they traverse oppositely
 * and takes the other flip across one they traverse alike.
 */
const orientableOf: (tally: IPieceTally) => boolean = (
  tally: IPieceTally,
): boolean => {
  const neighbours: Map<number, INeighbour[]> = new Map();
  const link: (here: number, other: number, alike: boolean) => void = (
    here: number,
    other: number,
    alike: boolean,
  ): void => {
    const list: INeighbour[] = neighbours.get(here) ?? [];
    list.push({ other, alike });
    neighbours.set(here, list);
  };
  for (const edge of tally.edges) {
    if (edge.uses.length !== 2) continue;
    const alike: boolean = edge.forward[0] === edge.forward[1];
    link(edge.uses[0]!, edge.uses[1]!, alike);
    link(edge.uses[1]!, edge.uses[0]!, alike);
  }
  const flip: Map<number, boolean> = new Map([[tally.firstTriangle, false]]);
  const queue: number[] = [tally.firstTriangle];
  for (let head: number = 0; head < queue.length; ++head) {
    const triangle: number = queue[head]!;
    const flipped: boolean = flip.get(triangle) === true;
    for (const { other, alike } of neighbours.get(triangle) ?? []) {
      const wanted: boolean = flipped !== alike;
      const known: boolean | undefined = flip.get(other);
      if (known === undefined) {
        flip.set(other, wanted);
        queue.push(other);
      } else if (known !== wanted) return false;
    }
  }
  return true;
};

/*
 * A triangle across a two-triangle edge, and whether both traverse that edge
 * the same way.
 */
interface INeighbour {
  /*
   * The neighbouring triangle's ordinal.
   */
  other: number;

  /*
   * Whether both triangles traverse the shared edge the same way.
   */
  alike: boolean;
}

/*
 * A disjoint-set forest over `[0, size)` with path halving, which the piece,
 * fan and loop partitions each use.
 */
class UnionFind {
  /*
   * Each element's parent; a root is its own parent.
   */
  private readonly parent: number[];

  /*
   * Parameter size: How many elements the forest holds.
   */
  public constructor(size: number) {
    this.parent = Array.from(
      { length: size },
      (_: unknown, at: number): number => at,
    );
  }

  /*
   * The root of an element's set.
   */
  public find(at: number): number {
    while (this.parent[at] !== at) {
      this.parent[at] = this.parent[this.parent[at]!]!;
      at = this.parent[at]!;
    }
    return at;
  }

  /*
   * Merge the sets of two elements.
   */
  public join(a: number, b: number): void {
    this.parent[this.find(a)] = this.find(b);
  }
}
