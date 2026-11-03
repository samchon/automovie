import type { AutoMovieHumanBodySurface as Surface } from "./AutoMovieHumanBodySurface";
import type { AutoMovieHumanSkinCorridor as Corridor } from "./AutoMovieHumanSkinCorridor";
import type { AutoMovieHumanThoracicCourse as Source } from "./AutoMovieHumanThoracicCourse";

/** A physical norm-dual certificate over every original portal fraction, including material-constrained paths. */
export namespace AutoMovieHumanSkinLowerBound {
  /** Conservative physical lower bound and its explicit floating-point subtraction budget, mm. */
  export interface IReading {
    /** Certified lower length after subtracting its arithmetic budget, mm. */
    lower: number;
    /** Minimum of the chosen physical affine dual over the original portal box, mm. */
    affine: number;
    /** Floating-point subtraction budget for this certificate only, mm. */
    arithmetic: number;
    /** Number of original physical segments whose dual vectors were evaluated. */
    segments: number;
  }

  /**
   * For each physical segment choose a vector t inside the unit ball, so
   * |d| >= t.d by Cauchy–Schwarz. Sum these affine forms and minimize each
   * original edge fraction independently over [0,1]. Material-monotone
   * paths are a subset, so the same lower bound holds without solving them.
   * The certificate uses original physical edge displacements and never an
   * assumption that a funnel or a coarse route was already shortest.
   */
  export function read(skin: Surface.IGeometry, course: Pick<Corridor.IReading, "bindings" | "points">): IReading {
    if (course.bindings.length < 2 || course.bindings.length !== course.points.length) throw new Error("A physical norm-dual certificate omitted its original portals");
    const bases: Source.Point[] = [];
    const deltas: Source.Point[] = [];
    const points: Source.Point[] = [];
    let magnitude: number = 1;
    for (let index: number = 0; index < course.bindings.length; index++) {
      const binding: Corridor.IReading["bindings"][number] = course.bindings[index]!;
      if (index === 0 || index === course.bindings.length - 1) {
        if ("edge" in binding) throw new Error("A physical norm-dual certificate needs fixed triangle endpoints", { cause: { index, binding } });
        endpoint(skin, course.points[index]!, binding.triangle);
        bases.push(course.points[index]!); deltas.push([0, 0, 0]); points.push(course.points[index]!);
      }
      else {
        if (!("edge" in binding)) throw new Error("A physical norm-dual certificate omitted an interior original portal", { cause: { index, binding } });
        if (binding.edge.length !== 2 || !binding.edge.every((vertex: number): boolean => Number.isInteger(vertex) && vertex >= 0 && vertex * 3 + 2 < skin.mesh.positions.length) || !Number.isFinite(binding.unit)) throw new Error("A physical norm-dual certificate has an unavailable original edge", { cause: { index, binding } });
        const a: Source.Point = skin.mesh.positions.slice(3 * binding.edge[0], 3 * binding.edge[0] + 3) as Source.Point;
        const b: Source.Point = skin.mesh.positions.slice(3 * binding.edge[1], 3 * binding.edge[1] + 3) as Source.Point;
        const delta: Source.Point = b.map((value: number, axis: number): number => value - a[axis]!) as Source.Point;
        bases.push(a); deltas.push(delta); points.push(a.map((value: number, axis: number): number => value + binding.unit * delta[axis]!) as Source.Point);
      }
      if (bases[index]!.length !== 3 || deltas[index]!.length !== 3 || points[index]!.length !== 3 || ![...bases[index]!, ...deltas[index]!, ...points[index]!].every(Number.isFinite)) throw new Error("A physical norm-dual certificate has unavailable original coordinates", { cause: { index, binding, units: "mm" } });
      magnitude += bases[index]!.reduce((sum: number, value: number): number => sum + Math.abs(value), 0) + deltas[index]!.reduce((sum: number, value: number): number => sum + Math.abs(value), 0);
    }
    const chosen: (Source.Point | undefined)[] = [];
    let previous: Source.Point | undefined;
    for (let index: number = 1; index < points.length; index++) {
      const displacement: Source.Point = points[index]!.map((value: number, axis: number): number => value - points[index - 1]![axis]!) as Source.Point;
      const resolution: number = 512 * Number.EPSILON * Math.max(1, ...points[index]!.map(Math.abs), ...points[index - 1]!.map(Math.abs));
      if (Math.hypot(...displacement) > resolution) previous = displacement;
      chosen.push(previous);
    }
    let following: Source.Point | undefined;
    for (let index: number = chosen.length - 1; index >= 0; index--) {
      if (chosen[index] !== undefined) following = chosen[index];
      else chosen[index] = following;
    }
    const tangents: Source.Point[] = [[0, 0, 0]];
    let affine: number = 0;
    for (let index: number = 1; index < points.length; index++) {
      // Any unit-ball vector certifies the norm. On an unresolved tiny or
      // duplicate segment, use a resolved neighboring direction instead of
      // amplifying its coordinate noise into a nearly arbitrary unit vector.
      // Original endpoints, edge fractions and physical segments do not move.
      const displacement: Source.Point = chosen[index - 1] ?? [0, 0, 0];
      const scale: number = Math.max(...displacement.map(Math.abs));
      const scaled: Source.Point = scale === 0 ? [0, 0, 0] : displacement.map((value: number): number => value / scale) as Source.Point;
      const norm: number = Math.sqrt(scaled.reduce((sum: number, value: number): number => sum + value * value, 0));

      // Thirty-two binary64 epsilons keep a three-component normalized
      // direction inside the unit ball after norm/division rounding.
      const tangent: Source.Point = norm === 0 ? [0, 0, 0] : scaled.map((value: number): number => value / norm / (1 + 32 * Number.EPSILON)) as Source.Point;
      tangents.push(tangent);
      affine += tangent.reduce((sum: number, value: number, axis: number): number => sum + value * (bases[index]![axis]! - bases[index - 1]![axis]!), 0);
    }
    tangents.push([0, 0, 0]);
    for (let index: number = 1; index < points.length - 1; index++) {
      const coefficient: number = deltas[index]!.reduce((sum: number, value: number, axis: number): number => sum + value * (tangents[index]![axis]! - tangents[index + 1]![axis]!), 0);
      affine += Math.min(0, coefficient);
    }
    const operations: number = 256 * points.length;
    const gamma: number = operations * Number.EPSILON / (1 - operations * Number.EPSILON);
    const arithmetic: number = gamma * magnitude;
    const lower: number = affine - arithmetic;
    if (![lower, arithmetic, affine].every(Number.isFinite) || !(operations * Number.EPSILON < 1)) throw new Error("A physical norm-dual certificate has unresolved arithmetic", { cause: { lower, affine, arithmetic, magnitude, operations, units: "mm and operation count" } });
    return { lower, affine, arithmetic, segments: points.length - 1 };
  }

  /** Admit a fixed physical endpoint only on its original nondegenerate triangle, at coordinate arithmetic resolution. */
  function endpoint(skin: Surface.IGeometry, point: Source.Point, face: number): void {
    const ids: number[] = skin.mesh.indices.slice(face, face + 3);
    if (!Number.isInteger(face) || face < 0 || face % 3 !== 0 || ids.length !== 3 || ids.some((vertex: number): boolean => !Number.isInteger(vertex) || vertex < 0 || 3 * vertex + 2 >= skin.mesh.positions.length)) throw new Error("A physical norm-dual certificate has an unavailable endpoint triangle", { cause: { face, ids } });
    const vertices: Source.Point[] = ids.map((vertex: number): Source.Point => skin.mesh.positions.slice(3 * vertex, 3 * vertex + 3) as Source.Point);
    if (point.length !== 3 || ![...point, ...vertices.flat()].every(Number.isFinite)) throw new Error("A physical norm-dual certificate has unavailable original coordinates", { cause: { face, point, vertices, units: "mm" } });
    const a: Source.Point = vertices[1]!.map((value: number, axis: number): number => value - vertices[0]![axis]!) as Source.Point;
    const b: Source.Point = vertices[2]!.map((value: number, axis: number): number => value - vertices[0]![axis]!) as Source.Point;
    const normal: Source.Point = cross(a, b);
    const magnitude: number = Math.hypot(...normal);
    const scale: number = Math.max(1, ...point.map(Math.abs), ...vertices.flat().map(Math.abs));
    const plane: number = normal.reduce((sum: number, value: number, axis: number): number => sum + value * (point[axis]! - vertices[0]![axis]!), 0);
    if (!(magnitude > 0) || !Number.isFinite(magnitude) || Math.abs(plane) > 512 * Number.EPSILON * scale * magnitude) throw new Error("A physical norm-dual endpoint leaves its original triangle", { cause: { face, point, vertices, plane, magnitude, units: "mm and mm^3" } });
    for (let edge: number = 0; edge < 3; edge++) {
      const start: Source.Point = vertices[edge]!;
      const delta: Source.Point = vertices[(edge + 1) % 3]!.map((value: number, axis: number): number => value - start[axis]!) as Source.Point;
      const displacement: Source.Point = point.map((value: number, axis: number): number => value - start[axis]!) as Source.Point;
      const side: number = cross(delta, displacement).reduce((sum: number, value: number, axis: number): number => sum + value * normal[axis]!, 0);
      const arithmetic: number = 1024 * Number.EPSILON * scale * magnitude * Math.hypot(...delta);
      if (side < -arithmetic) throw new Error("A physical norm-dual endpoint leaves its original triangle", { cause: { face, point, vertices, edge, side, arithmetic, units: "mm and mm^4" } });
    }
  }

  /** Original physical oriented area vector, mm squared. */
  function cross(a: Source.Point, b: Source.Point): Source.Point { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
}
