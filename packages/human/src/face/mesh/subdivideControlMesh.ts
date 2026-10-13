import { IControlMesh } from "./structures/IControlMesh";

/**
 * Loop subdivision preserving shared edges, boundary curves and face labels.
 * Optional disjoint closed curves own their one-dimensional refinement: an
 * existing vertex uses 3/4 of itself and 1/8 of each curve neighbour, and a
 * curve edge inserts its midpoint. Opposite surface triangles therefore cannot
 * pull a material/anatomical boundary into a zigzag. Both adjacent surfaces
 * still share every boundary vertex and the final normal calculation.
 *
 * These are position constraints, not a normal crease or separate overlaid
 * mesh. Their effect on the adjoining surface must be inspected in clay.
 * Omission and an empty curve list retain the original Loop calculation.
 * preparePortraitHead admits integer rounds 0 through 4 and validates cage
 * topology before calling. Other callers must supply manifold triangles,
 * aligned reference/color arrays, and an integer nonnegative round count;
 * this low-level producer validates the declared curves, not those premises.
 * Zero rounds return the original cage; positive rounds return new arrays.
 *
 * @evidence contracts/common.md#principled-implementation Shared undirected edges receive one new vertex, triangles split into four with their original label, and position/reference/color fields use identical boundary/interior masks. Explicit disjoint resident curves replace their vertex boundary neighbours and use midpoint edge refinement; manifold cages and parallel attributes are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design A round owns one edge/adjacency index used by field refinement, child topology and curve refinement, so neither optional attributes nor neighbouring faces define independent edge identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Curve length, resident indices, repeated vertices and nonexistent segments refuse before refinement. The 3/4, 1/8 boundary and valence-dependent interior coefficients define the refinement scheme; no subject-specific seam coordinates or normal crease compensates for geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment explains shared boundaries, curve constraints, unchanged normal ownership, omitted/empty curves, upstream round/topology admission, parallel attributes, zero-round identity and positive-round array ownership; resulting surface appearance remains unverified here.
 * @evidence contracts/performance.md#efficient-algorithms Each round indexes T triangles and E edges, then refines V vertices and E inserted vertices for up to three aligned fields in O(T+E+V) time/storage. T grows by four per round and curve segments double; the admitted production caller caps rounds at four, while this helper has no independent cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Triangle edge indices and one adjacency map are reused for child faces and all aligned fields within a round; no cross-call cache assumes a mutable cage or curve list is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Round-local maps/sets and prior cages are released as the synchronous call advances or throws; only the final cage is returned, with geometric growth determined by input size and rounds and no retained tasks or handles.
 */
export function subdivideControlMesh(
  input: IControlMesh,
  rounds: number,
  inputCurves: readonly (readonly number[])[] = [],
): IControlMesh {
  const key: (a: number, b: number) => string = (a: number, b: number): string =>
    a < b ? `${a}/${b}` : `${b}/${a}`;
  let curves: number[][] = inputCurves.map((curve: readonly number[]): number[] => [...curve]);
  const occupied: Set<number> = new Set<number>();
  const resident: Set<string> = new Set<string>();
  if (curves.length !== 0)
    for (let i: number = 0; i < input.indices.length; i += 3)
      for (let j: number = 0; j < 3; j++)
        resident.add(
          key(input.indices[i + j], input.indices[i + ((j + 1) % 3)]),
        );
  for (const curve of curves) {
    if (curve.length < 3)
      throw new Error(
        "A subdivision curve needs at least three distinct vertices.",
      );
    for (let i: number = 0; i < curve.length; i++) {
      const vertex: number = curve[i];
      if (
        !Number.isInteger(vertex) ||
        vertex < 0 ||
        vertex >= input.positions.length
      )
        throw new Error("A subdivision curve must name resident vertices.");
      if (occupied.has(vertex))
        throw new Error(
          "Subdivision curves must be simple and mutually disjoint.",
        );
      occupied.add(vertex);
      if (!resident.has(key(vertex, curve[(i + 1) % curve.length])))
        throw new Error(
          "Every subdivision curve segment must be a resident edge.",
        );
    }
  }
  let mesh: IControlMesh = input;
  for (let round: number = 0; round < rounds; round++) {
    const neighbours: Set<number>[] = mesh.positions.map((): Set<number> => new Set<number>());
    const boundary: Set<number>[] = mesh.positions.map((): Set<number> => new Set<number>());
    const edges: Map<
      string,
      { a: number; b: number; opposite: number[]; index: number }
    > = new Map();
    const curveEdges: Set<string> = new Set<string>();
    // Face corners retain their edge identities for the refinement pass. This
    // avoids rebuilding the same string keys and looking up every edge twice.
    const triangleEdges: number[] = [];
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      for (let j: number = 0; j < 3; j++) {
        const a: number = mesh.indices[i + j];
        const b: number = mesh.indices[i + ((j + 1) % 3)];
        const c: number = mesh.indices[i + ((j + 2) % 3)];
        neighbours[a].add(b);
        neighbours[b].add(a);
        const id: string = key(a, b);
        let edge: { a: number; b: number; opposite: number[]; index: number } | undefined = edges.get(id);
        if (edge === undefined) {
          edge = {
            a,
            b,
            opposite: [],
            index: mesh.positions.length + edges.size,
          };
          edges.set(id, edge);
        }
        edge.opposite.push(c);
        triangleEdges.push(edge.index);
      }
    }
    for (const edge of edges.values())
      if (edge.opposite.length === 1) {
        boundary[edge.a].add(edge.b);
        boundary[edge.b].add(edge.a);
      }
    for (const curve of curves)
      for (let i: number = 0; i < curve.length; i++) {
        const a: number = curve[i],
          b: number = curve[(i + 1) % curve.length];
        // A declared loop replaces, rather than adds to, any open-boundary
        // neighbours at this vertex. Exactly two neighbours own its curve.
        boundary[a] = new Set([
          curve[(i + curve.length - 1) % curve.length],
          b,
        ]);
        curveEdges.add(key(a, b));
      }
    const refine: (values: number[][]) => number[][] = (values: number[][]): number[][] => {
      const positions: number[][] = values.map((point: number[], i: number): number[] => {
        if (boundary[i].size !== 0)
          return point.map(
            (value: number, axis: number): number =>
              0.75 * value +
              0.125 *
                [...boundary[i]].reduce(
                  (sum: number, next: number): number => sum + values[next][axis],
                  0,
                ),
          );
        const count: number = neighbours[i].size;
        if (count === 0) return [...point];
        const beta: number = count === 3 ? 3 / 16 : 3 / (8 * count);
        return point.map(
          (value: number, axis: number): number =>
            (1 - count * beta) * value +
            beta *
              [...neighbours[i]].reduce(
                (sum: number, next: number): number => sum + values[next][axis],
                0,
              ),
        );
      });
      for (const edge of edges.values())
        positions.push(
          values[edge.a].map((a: number, axis: number): number =>
            edge.opposite.length === 1 || curveEdges.has(key(edge.a, edge.b))
              ? (a + values[edge.b][axis]) / 2
              : (a + values[edge.b][axis]) * 0.375 +
                edge.opposite.reduce(
                  (sum: number, next: number): number => sum + values[next][axis],
                  0,
                ) *
                  0.125,
          ),
        );
      return positions;
    };
    const positions: number[][] = refine(mesh.positions);
    const indices: number[] = [];
    const groups: number[] = [];
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const a: number = mesh.indices[i],
        b: number = mesh.indices[i + 1],
        c: number = mesh.indices[i + 2];
      const ab: number = triangleEdges[i],
        bc: number = triangleEdges[i + 1],
        ca: number = triangleEdges[i + 2];
      indices.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      const group: number = mesh.groups[i / 3];
      groups.push(group, group, group, group);
    }
    curves = curves.map((curve: number[]): number[] =>
      curve.flatMap((a: number, i: number): number[] => [
        a,
        edges.get(key(a, curve[(i + 1) % curve.length]))!.index,
      ]),
    );
    mesh = {
      positions,
      indices,
      groups,
      ...(mesh.reference === undefined
        ? {}
        : { reference: refine(mesh.reference) }),
      ...(mesh.colors === undefined ? {} : { colors: refine(mesh.colors) }),
    };
  }
  return mesh;
}
