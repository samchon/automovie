import {
  AutoMovieIllinois,
  AutoMovieSolidHeightMesh as HeightMesh,
  AutoMovieSolidSectionRows as SectionRows,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionSplitBand,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { AutoMovieHumanPelvicSplit as Pelvis } from "./AutoMovieHumanPelvicSplit";

/** Direct triangulation of one pelvic band on the same indexed source wires. */
export namespace AutoMovieHumanPelvicMesh {
  /** One exact first-order point in an explicit subchart. */
  export interface IVertex {
    /** World point in millimetres. */
    point: P3;

    /** Unit outward normal from the same analytic source. */
    normal: P3;
  }

  /** Complete local plan with direct global-index occurrences. */
  export interface IPlan {
    /** New vertices, in their exact contiguous global-ID order. */
    vertices: IVertex[];

    /** Outward triangle triples on the actual existing boundary IDs. */
    triangles: [number, number, number][];
  }

  /**
   * Build the exterior, physical fore and posterior grids before writing a
   * vertex. The three actual transverse curves are read once and each has the
   * same incidence in both adjacent portions of this band.
   */
  export function prepare(input: {
    side: number;
    geometry: Pelvis.IPhysical;
    band: IAutoMovieConstructionSplitBand.IPreparedStrip;
    wire: Pelvis.IPhysicalWire;
    parent: readonly number[];
    child: readonly number[];
    firstId: number;
  }): IPlan | string {
    const { side, geometry, band, wire, parent, child, firstId } = input;
    const chord = geometry.charts[side]!;
    const fore = geometry.fore[side]!;
    const count = wire.child.length;
    const quarter = count / 4;
    const middle = quarter / 2;
    if (
      !(
        parent.length === count &&
        child.length === count &&
        Number.isInteger(middle)
      )
    )
      return "The physical pelvic band does not have its complete shared source wires";
    const stations = Array.from(
      { length: chord.rows + 1 },
      (_, i) => i / chord.rows,
    );
    const stationAt = chord.prepareRows(stations);
    const [front, center, back] = wire.transverse;
    const sense = chord.reverse ? -1 : 1;
    const physicalSign = band.surface.orientation * sense;
    const vertex: IVertex[] = [];
    const add = (point: P3, normal: P3): number => {
      const id = firstId + vertex.length;
      vertex.push({ point, normal });
      return id;
    };
    const atID = (id: number): P3 => {
      if (id >= firstId) return vertex[id - firstId]!.point;
      const a = parent.indexOf(id);
      return a >= 0 ? wire.parent[a]! : wire.child[child.indexOf(id)]!;
    };
    const normal = (u: P3, v: P3, sign: number): P3 =>
      Vec.scale(Vec.unit(Vec.cross(u, v))!, sign);
    const times = [0, 0.5, 1];
    const cross = [front, center, back].map((index, k) => {
      const v = times[k]!;
      const at = stationAt(v);
      return [
        parent[index]!,
        ...stations.slice(1, -1).map((_, i) => {
          const q = at(i + 1);
          return add(q.point, normal(q.du, q.dv, physicalSign));
        }),
        child[index]!,
      ];
    });
    const [F, C, R] = cross as [number[], number[], number[]];
    const angles = (first: number) =>
      Array.from(
        { length: middle + 1 },
        (_, j) => (first + sense * j + count) % count,
      );
    const frontArc = angles(front);
    const rearArc = angles(center);
    const outline = [
      ...F.slice(0, -1),
      ...frontArc.slice(0, -1).map((i) => child[i]!),
      ...[...C].reverse().slice(0, -1),
      ...[...frontArc]
        .reverse()
        .slice(0, -1)
        .map((i) => parent[i]!),
    ].map((id): HeightMesh.IBoundary => {
      const p = atID(id);
      return { id, chart: [Vec.dot(p, fore.section), Vec.dot(p, fore.span)] };
    });
    const extent = outline.map(({ chart }) => chart[0]);
    const lo = Math.min(...extent);
    const hi = Math.max(...extent);
    const anterior = HeightMesh.prepare({
      boundary: outline,
      height: fore.height,
      section: fore.section,
      span: fore.span,
      stations: stations.map((u) => lo + (hi - lo) * u),
      columns: middle,
      firstId: firstId + vertex.length,
      row: fore.row,
    });
    if (typeof anterior === "string") return anterior;
    for (const sample of anterior.vertices)
      add(sample.point, Vec.scale(sample.normal, physicalSign));
    const triangles = anterior.triangles;
    const insert = (rows: readonly (readonly number[])[], sign: number) => {
      for (const [a, b, c] of SectionRows.triangulate(rows))
        triangles.push(sign > 0 ? [a, b, c] : [a, c, b]);
    };
    if (physicalSign < 0)
      for (const triangle of triangles)
        [triangle[1], triangle[2]] = [triangle[2], triangle[1]];

    const rearPhases = rearArc.map((_, j) => 0.5 + j / (2 * middle));
    const rear = geometry.rear(side, stations, rearPhases);
    const posterior = stations.map((_, i) =>
      rearArc.map((index, j) => {
        if (i === 0) return parent[index]!;
        if (i === stations.length - 1) return child[index]!;
        if (j === 0) return C[i]!;
        if (j === middle) return R[i]!;
        const q = rear[j]!(i);
        return add(q.point, normal(q.du, q.dv, physicalSign));
      }),
    );
    insert(posterior, physicalSign);

    const start = front === 0 ? F : R;
    const end = front === 0 ? R : F;
    const startMap = chord.nativeProgress[front === 0 ? 0 : 1]!;
    const endMap = chord.nativeProgress[front === 0 ? 1 : 0]!;
    const inverse = (read: (u: number) => number, h: number) =>
      h === 0 || h === 1
        ? h
        : AutoMovieIllinois.root(
            (u) => read(u) - h,
            0,
            1,
            16 * Number.EPSILON,
            53,
          );
    const startU = stations.map((h) => inverse(startMap, h));
    const endU = stations.map((h) => inverse(endMap, h));
    if (startU.some((u) => u === null) || endU.some((u) => u === null))
      return "The physical exterior has no bounded inverse to the held transverse curve";
    const tangent = band.surface.tangentAlong;
    if (tangent === undefined)
      return "The physical exterior needs its actual first-order source";
    const turns = Array.from(
      { length: 3 * quarter + 1 },
      (_, i) => (2 * Math.PI * i) / count,
    );
    const exterior = turns.map((v) => tangent(v));
    const outer = stations.map((_, i) =>
      turns.map((_, j) => {
        const index = j % count;
        if (i === 0) return parent[index]!;
        if (i === stations.length - 1) return child[index]!;
        if (j === 0) return start[i]!;
        if (j === turns.length - 1) return end[i]!;
        const fraction = j / (3 * quarter);
        const u =
          band.length * ((1 - fraction) * startU[i]! + fraction * endU[i]!);
        const q = exterior[j]!(u);
        return add(q.p, normal(q.u, q.v, band.surface.orientation));
      }),
    );
    insert(outer, band.surface.orientation);
    return { vertices: vertex, triangles };
  }
}
