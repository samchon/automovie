import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMeshConstraints,
} from "@automovie/interface";

import { AutoMovieEngineSolidMeshConstraints } from "../../AutoMovieEngineSolidMeshConstraints";

/*
 * Assemble finite domain sides without subdividing an authoritative trim edge.
 *
 * Existing points on each side are retained in order. A new sampling point
 * inside a trim segment is omitted; it would otherwise split one side of a
 * shared seam with an index that its neighbour never received. An exact
 * existing boundary point is reused before requesting a new grid point. The
 * callback extends only the caller's local point catalogue, not a mesh.
 */
export function domainSolidMesh(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  trim: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  stations: readonly number[],
  phases: readonly number[],
  at: (i: number, j: number) => number,
  period?: number,
): IAutoMovieSolidMeshConstraints.ISegment[] | string {
  if (period !== undefined && !(period > 0))
    return "domain period must be finite and positive";
  if (
    stations.some(
      (value: number, k: number): boolean =>
        k > 0 && !(value > stations[k - 1]!),
    ) ||
    phases.some(
      (value: number, k: number): boolean => k > 0 && !(value > phases[k - 1]!),
    )
  )
    return "domain grid needs finite strictly increasing coordinates";
  if (stations.length < 2 || phases.length < 2) return [];
  const sides: Side[] = [
    { axis: 0, index: 0 },
    { axis: 0, index: stations.length - 1 },
  ];
  if (period === undefined)
    sides.push({ axis: 1, index: 0 }, { axis: 1, index: phases.length - 1 });
  const result: IAutoMovieSolidMeshConstraints.ISegment[] = [];
  for (const side of sides) {
    const made: IAutoMovieSolidMeshConstraints.ISegment[] | string = row(
      vertices,
      trim,
      stations,
      phases,
      at,
      side.axis,
      side.index,
      period,
    );
    if (typeof made === "string") return made;
    result.push(...made);
  }
  return result;
}

/*
 * Original identity and its temporary ordered domain-cover occurrence.
 */
interface Node {
  /*
   * Existing source or newly reserved grid ID.
   */ id: number;
  /*
   * Lifted coordinate used only to order one domain side.
   */ point: Readonly<AutoMovieVector2Tuple>;
}

/*
 * One fixed coordinate of a finite rectangular domain side.
 */
interface Side {
  /*
   * Coordinate held fixed on this side.
   */ axis: 0 | 1;
  /*
   * Index of that coordinate in its source grid.
   */ index: number;
}

/*
 * Order one finite side; its stored point values are never normalized or
 * overwritten.
 */
function row(
  vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
  trim: readonly IAutoMovieSolidMeshConstraints.ISegment[],
  stations: readonly number[],
  phases: readonly number[],
  at: (i: number, j: number) => number,
  axis: 0 | 1,
  index: number,
  period: number | undefined,
): IAutoMovieSolidMeshConstraints.ISegment[] | string {
  const variable: 0 | 1 = axis === 0 ? 1 : 0;
  const fixed: number = axis === 0 ? stations[index]! : phases[index]!;
  const first: number = axis === 0 ? phases[0]! : stations[0]!;
  const last: number =
    axis === 0
      ? period === undefined
        ? phases[phases.length - 1]!
        : first + period
      : stations[stations.length - 1]!;
  const nodes: Node[] = [];
  for (const entry of vertices) {
    const [id, point]: [number, Readonly<AutoMovieVector2Tuple>] = entry;
    if (point[axis] !== fixed) continue;
    let value: number = point[variable];
    if (period !== undefined) {
      const lift: number = -Math.floor((value - first) / period);
      value += lift * period;
      if (value === last) value = first;
    }
    if (value < first || value > last) continue;
    nodes.push({ id, point: axis === 0 ? [fixed, value] : [value, fixed] });
  }
  const count: number = axis === 0 ? phases.length : stations.length;
  for (let k: number = 0; k < count; k++) {
    const point: Readonly<AutoMovieVector2Tuple> =
      axis === 0 ? [fixed, phases[k]!] : [stations[k]!, fixed];
    if (
      nodes.some(
        (node: Node): boolean =>
          node.point[0] === point[0] && node.point[1] === point[1],
      )
    )
      continue;
    const covered: boolean | string = AutoMovieEngineSolidMeshConstraints.contains(
      vertices,
      trim,
      point,
      period,
    );
    if (typeof covered === "string") return covered;
    if (covered) continue;
    const id: number = axis === 0 ? at(index, k) : at(k, index);
    if (!vertices.has(id))
      return "domain grid callback did not publish its local point";
    nodes.push({ id, point });
  }
  nodes.sort(
    (a: Node, b: Node): number => a.point[variable] - b.point[variable],
  );
  for (let k: number = 1; k < nodes.length; k++)
    if (nodes[k - 1]!.point[variable] === nodes[k]!.point[variable]) {
      if (nodes[k - 1]!.id !== nodes[k]!.id)
        return "domain has coincident authoritative identities";
      nodes.splice(k--, 1);
    }
  const edges: IAutoMovieSolidMeshConstraints.ISegment[] = [];
  const end: number = period === undefined ? nodes.length - 1 : nodes.length;
  for (let k: number = 0; k < end; k++) {
    const a: Node = nodes[k]!;
    const b: Node = nodes[(k + 1) % nodes.length]!;
    const storedA: Readonly<AutoMovieVector2Tuple> = vertices.get(a.id)!;
    const storedB: Readonly<AutoMovieVector2Tuple> = vertices.get(b.id)!;
    const liftA: number =
      period === undefined ? 0 : Math.round((a.point[1] - storedA[1]) / period);
    const liftB: number =
      period === undefined
        ? 0
        : Math.round(
            (b.point[1] + (k + 1 === nodes.length ? period : 0) - storedB[1]) /
              period,
          );
    const turn: number = liftB - liftA;
    edges.push({ a: a.id, b: b.id, turn });
  }
  return edges;
}
