import type {
  IAutoMovieSolidMeshConstraints,
  IAutoMovieSolidMeshPlan,
} from "@automovie/interface";

/**
 * Label each triangle with its region: the triangles joined across sides that are no source constraint.
 *
 * A planned face's residual membership is constant on each face of its
 * constraint arrangement, because the constraints are the partition's trim,
 * domain and retained-cell boundaries (`AutoMovieSolidMeshPlan`). The regions
 * are therefore found from topology, the way Shewchuk's Triangle spreads a
 * hole or a regional attribute from a seed triangle across every edge that
 * is not a segment (Shewchuk 1996, Triangle: Engineering a 2D Quality Mesh
 * Generator and Delaunay Triangulator, Applied Computational Geometry, LNCS
 * 1148), so a triangle too thin to hold a representable interior point takes
 * its membership from the region it lies in.
 *
 * Two sides join when they have one edge identity, the original endpoint IDs
 * with their relative cover turn, the identity the insertion and legalization
 * owners read; a side whose identity is a constraint never joins. Each label
 * is the least triangle index of its region, so labels do not depend on the
 * order sides are visited.
 *
 * @param triangles Positive triangle occurrences of one face, each corner's lift relative to its first.
 * @param constraints Subdivided source constraints, which bound the regions.
 * @returns For each triangle index, the least triangle index of its region.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Shewchuk's region spreading across non-segment edges, computed as connected components by union-find over shared side identities; the premise is the planner's, that constraints bound every change of membership.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Topology only: the planner owns sampling the residual membership and its refusal, so this owner neither calls the membership nor reads a coordinate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Joins nothing across a constraint and infers no adjacency from coincident coordinates; a side held by more than two triangles joins them all, and the planner's own incidence checks own that refusal.
 * @evidence contracts/development/common.md#meaningful-documentation States the region definition, its literature basis, the side identity, the label convention and the nonmanifold behaviour.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the 3T sides with a map of side identities and union by least index with path halving: O(T + S) keys and near-linear union work for T triangles and S constraints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure call-local labelling that coordinates no requests or phases.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The side map, constraint set and parent array are call-local O(T + S); only the returned label array survives, owned by the caller.
 */
export function regionAutoMovieSolidMesh(
  triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
  constraints: readonly IAutoMovieSolidMeshConstraints.ISegment[],
): number[] {
  const fixed: Set<string> = new Set(
    constraints.map((edge: IAutoMovieSolidMeshConstraints.ISegment): string =>
      key(edge.a, edge.b, edge.turn),
    ),
  );
  const parent: number[] = triangles.map((_: IAutoMovieSolidMeshPlan.ITriangle, index: number): number => index);

  /** The region's least index, halving the path on the way. */
  const find: (index: number) => number = (index: number): number => {
    let at: number = index;
    while (parent[at] !== at) {
      parent[at] = parent[parent[at]!]!;
      at = parent[at]!;
    }
    return at;
  };
  const first: Map<string, number> = new Map();
  for (let index: number = 0; index < triangles.length; index++)
    for (let corner: number = 0; corner < 3; corner++) {
      const triangle: IAutoMovieSolidMeshPlan.ITriangle = triangles[index]!;
      const next: number = (corner + 1) % 3;
      const name: string = key(
        triangle.vertices[corner]!,
        triangle.vertices[next]!,
        triangle.lifts[next]! - triangle.lifts[corner]!,
      );
      if (fixed.has(name)) continue;
      const other: number | undefined = first.get(name);
      if (other === undefined) {
        first.set(name, index);
        continue;
      }
      const a: number = find(index);
      const b: number = find(other);
      if (a < b) parent[b] = a;
      else parent[a] = b;
    }
  return triangles.map((_: IAutoMovieSolidMeshPlan.ITriangle, index: number): number => find(index));
}

/** Canonical indexed edge identity retaining the relative period turn, as the insertion and legalization owners read it. */
function key(a: number, b: number, turn: number): string {
  return a === b
    ? `${a}/${b}/${Math.abs(turn)}`
    : a < b
      ? `${a}/${b}/${turn}`
      : `${b}/${a}/${-turn}`;
}
