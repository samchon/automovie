import type {
  AutoMovieVector3Tuple,
  IAutoMovieMillimeterMesh,
} from "@automovie/interface";

/** A box over the mesh triangles in a contiguous range of the spatial order. */
interface INode {
  /** Componentwise corners in world coordinates, millimetres. */
  min: AutoMovieVector3Tuple;
  max: AutoMovieVector3Tuple;
  /** Half-open range over the prepared triangle order. */
  from: number;
  to: number;
  /** Child ranges, absent at a leaf. */
  children: readonly [INode, INode] | null;
}

/** Mesh geometry and integer edge incidence shared by its plane queries. */
interface IOutlineIndex {
  /** Copy of the input's positions and triangle order. */
  mesh: IAutoMovieMillimeterMesh;
  /** One edge ID per triangle side, in triangle and winding order. */
  edges: Uint32Array;
  /** Original ordinals of every triangle in a box that can cross the plane. */
  candidates(
    origin: AutoMovieVector3Tuple,
    axis: AutoMovieVector3Tuple,
    station: number,
  ): number[];
}

/**
 * Build the spatial order and shared-edge incidence of a triangle mesh once.
 * Vertex indices determine incidence: coincident positions with different
 * indices remain separate. A box's signed height bounds are the heights of its
 * two extreme corners along the plane normal. Only boxes which can have
 * vertices on both sides enter the narrow phase. Its triangle predicate is the
 * interval test of Minetto et al. (Computer-Aided Design 92, 2017, §3.1) with
 * the extractor's convention that on-plane vertices are above.
 *
 * @param input The mesh, in millimetres. Its buffers are snapshotted.
 * @returns The prepared mesh and its candidate query for differently oriented
 *   planes.
 */
export function prepareAutoMovieMeshOutline(
  input: IAutoMovieMillimeterMesh,
): IOutlineIndex {
  const positions: Float64Array = Float64Array.from(input.positions);
  const indices: Float64Array = Float64Array.from(input.indices);
  const count: number = Math.floor(indices.length / 3);
  const edges: Uint32Array = new Uint32Array(3 * count);

  // Intern undirected endpoint pairs during preparation and retain their IDs only.
  const aliases: Map<number, Map<number, number>> = new Map();
  let next: number = 0;
  for (let i: number = 0; i < edges.length; ++i) {
    const j: number = i % 3 === 2 ? i - 2 : i + 1;
    const a: number = Math.min(indices[i]!, indices[j]!);
    const b: number = Math.max(indices[i]!, indices[j]!);
    let row: Map<number, number> | undefined = aliases.get(a);
    if (row === undefined) aliases.set(a, (row = new Map()));
    let id: number | undefined = row.get(b);
    if (id === undefined) row.set(b, (id = next++));
    edges[i] = id;
  }

  const order: number[] = Array.from(
    { length: count },
    (_, i: number): number => i,
  );
  const root: INode | null =
    count === 0 ? null : buildTree(positions, indices, order);

  return {
    mesh: { positions, indices },
    edges,
    candidates: (origin, axis, station): number[] => {
      const found: number[] = [];
      if (root === null) return found;

      /** Match the narrow phase's subtraction and dot-product order. */
      const height = (
        low: AutoMovieVector3Tuple,
        high: AutoMovieVector3Tuple,
      ): number =>
        ((axis[0] < 0 ? high[0] : low[0]) - origin[0]) * axis[0] +
        ((axis[1] < 0 ? high[1] : low[1]) - origin[1]) * axis[1] +
        ((axis[2] < 0 ? high[2] : low[2]) - origin[2]) * axis[2] -
        station;

      /** Project each box before visiting its child boxes or triangles. */
      const visit = (node: INode): void => {
        const low: number = height(node.min, node.max);
        const high: number = height(node.max, node.min);
        if (
          Number.isFinite(low) &&
          Number.isFinite(high) &&
          (low >= 0 || high < 0)
        )
          return;
        if (node.children === null)
          for (let i: number = node.from; i < node.to; ++i)
            found.push(order[i]!);
        else {
          visit(node.children[0]);
          visit(node.children[1]);
        }
      };
      visit(root);

      // Chaining and equal-extreme ties both use the original triangle order.
      return found.sort((a: number, b: number): number => a - b);
    },
  };
}

/** Build a balanced hierarchy and leave the triangle bounds with its builder. */
function buildTree(
  positions: Float64Array,
  indices: Float64Array,
  order: number[],
): INode {
  const count: number = order.length;
  const bounds: Float64Array = new Float64Array(6 * count);
  for (let i: number = 0; i < count; ++i)
    for (let k: number = 0; k < 3; ++k) {
      const a: number = positions[3 * indices[3 * i]! + k]!;
      const b: number = positions[3 * indices[3 * i + 1]! + k]!;
      const c: number = positions[3 * indices[3 * i + 2]! + k]!;
      bounds[6 * i + k] = Math.min(a, b, c);
      bounds[6 * i + 3 + k] = Math.max(a, b, c);
    }

  /** Split the longest extent at the median of its triangle box midpoints. */
  const build = (from: number, to: number): INode => {
    const min: AutoMovieVector3Tuple = [Infinity, Infinity, Infinity];
    const max: AutoMovieVector3Tuple = [-Infinity, -Infinity, -Infinity];
    for (let i: number = from; i < to; ++i) {
      const offset: number = 6 * order[i]!;
      for (let k: number = 0; k < 3; ++k) {
        min[k] = Math.min(min[k]!, bounds[offset + k]!);
        max[k] = Math.max(max[k]!, bounds[offset + 3 + k]!);
      }
    }

    // Use the same four-triangle leaf size as the engine's mesh ray caster.
    // This bounds the narrow phase at a leaf while amortizing its two bounds.
    if (to - from <= 4) return { min, max, from, to, children: null };
    const extent: number[] = max.map(
      (v: number, k: number): number => v - min[k]!,
    );
    const axis: number = extent.indexOf(Math.max(...extent));
    const ordered: number[] = order.slice(from, to);
    const centre = (t: number): number =>
      bounds[6 * t + axis]! / 2 + bounds[6 * t + 3 + axis]! / 2;
    ordered.sort((a: number, b: number): number => centre(a) - centre(b));
    ordered.forEach((t: number, j: number): void => {
      order[from + j] = t;
    });
    const middle: number = from + Math.floor((to - from) / 2);
    return {
      min,
      max,
      from,
      to,
      children: [build(from, middle), build(middle, to)],
    };
  };
  return build(0, count);
}
