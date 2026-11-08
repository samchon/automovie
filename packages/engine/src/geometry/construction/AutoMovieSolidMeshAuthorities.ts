import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { AutoMovieSolidMeshConstraints } from "./AutoMovieSolidMeshConstraints";

/** One actual face-chart address, independent of its shared vertex's original owner. */
type Point = readonly [number, number];

/**
 * Admit authoritative indexed trim and original-domain chart occurrences.
 *
 * Shared IDs keep their own face charts and exact integer periodic lifts.
 * Original domain authorities seed and protect the real rectangular sides; they are
 * never cutting loops. This distinction lets open-boundary provenance retain
 * a genuine source end while a coincident actual trim remains uncappable.
 *
 * @evidence contracts/common.md#principled-implementation Preserves the existing indexed/lift validation verbatim, then requires every declared domain segment to lie exactly on one actual grid side before domain assembly reuses its IDs.
 * @evidence contracts/common.md#clear-and-simple-design One authority owner separates shared-point validation from Grid's source sampling and keeps domain roles distinct from original trim constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positional weld, chart tolerance, input normalization or changed trim/end policy appears. Authorities cannot draw a new interior domain boundary or replace missing physical2.
 * @evidence contracts/common.md#meaningful-documentation States original IDs, foreign-owner charts, exact lift reconstruction, domain-only roles and local-map mutation before mesh publication.
 * @evidence contracts/performance.md#efficient-algorithms Validates B indexed occurrences/segments in expected O(B) Map work with constant numeric work per entry; original source evaluation remains in Grid and no triangle scan is added.
 * @evidence contracts/performance.md#reuse-equivalent-work Both roles share one face-local chart map and the unchanged collect implementation; actual domain assembly reuses those IDs and the returned segments prevent one-sided grid subdivision rather than inventing coincident vertices.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the local chart map and returned segments until face planning settles; no mesh mutation, global cache or handle is acquired here.
 */
export namespace AutoMovieSolidMeshAuthorities {
  /**
   * An exact cell side consumes both authority endpoints through the existing grid lookup.
   *
   * @evidence contracts/common.md#principled-implementation Distinguishes an identical grid side or an isolated shared grid corner from every partial, longer or nonaligned authority segment. The caller still resolves the original IDs at those exact corners.
   * @evidence contracts/common.md#clear-and-simple-design One exact chart predicate lets Grid retain its cells beside aligned original domain authorities; actual cutting loops never use this exception.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no tolerance, new vertex, weld or segment subdivision. An authority knot inside a cell side and a coarse authority spanning several cells remain residual constraints.
   * @evidence contracts/common.md#meaningful-documentation A true result describes consumption in this finite grid cell, not a source membership, surface chord certificate or arbitrary trim exemption. Inputs are the admitted face's finite lifted chart values.
   * @evidence contracts/performance.md#efficient-algorithms Constant exact endpoint and interval comparisons per already-overlapping authority occurrence.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pure predicate coordinates no requests or preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no arrays, mesh or source; the caller owns the supplied endpoint values.
   */
  export function consumedByCell(a: Point, b: Point, u: Point, v: Point): boolean {
    if (a[0] === b[0] && (a[0] === u[0] || a[0] === u[1]) &&
      Math.min(a[1], b[1]) === v[0] && Math.max(a[1], b[1]) === v[1]) return true;
    if (a[1] === b[1] && (a[1] === v[0] || a[1] === v[1]) &&
      Math.min(a[0], b[0]) === u[0] && Math.max(a[0], b[0]) === u[1]) return true;
    const lowU: number = Math.max(Math.min(a[0], b[0]), u[0]);
    const highU: number = Math.min(Math.max(a[0], b[0]), u[1]);
    const lowV: number = Math.max(Math.min(a[1], b[1]), v[0]);
    const highV: number = Math.min(Math.max(a[1], b[1]), v[1]);
    return lowU === highU && lowV === highV &&
      (lowU === u[0] || lowU === u[1]) && (lowV === v[0] || lowV === v[1]);
  }

  /** Seed actual rectangular domain points; return a named premise before any source or mesh write. */
  export function domainSegments(
    mesh: AutoMovieSolidMesh.IMesh,
    input: AutoMovieSolidMesh.IFace,
    chart: Map<number, Point>,
    period: number | undefined,
  ): AutoMovieSolidMeshConstraints.ISegment[] | string {
    const declared: AutoMovieSolidMesh.ILoop[] | undefined = input.domainLoops;
    if (declared === undefined) return [];
    if (!Array.isArray(declared))
      return "face domain authorities must be an array, or omitted";
    const loops: readonly AutoMovieSolidMesh.ILoop[] = declared;
    if (loops.length === 0) return [];
    const segments: AutoMovieSolidMeshConstraints.ISegment[] | string = collect(
      mesh,
      loops,
      chart,
      period,
    );
    if (typeof segments === "string")
      return "face domain authorities: " + segments;
    const low: number = input.stations[0]!;
    const high: number = input.stations[input.stations.length - 1]!;
    const first: number = input.phases[0]!;
    const last: number = input.phases[input.phases.length - 1]!;
    for (const loop of loops) {
      if (
        period === undefined
          ? loop.kind !== "island"
          : loop.kind !== "start" && loop.kind !== "end"
      )
        return "face domain authorities need a rectangle perimeter or actual periodic start/end role";
      for (const p of loop.chart)
        if (
          p[0] < low ||
          p[0] > high ||
          (period === undefined && (p[1] < first || p[1] > last)) ||
          (period !== undefined &&
            p[0] !== (loop.kind === "start" ? low : high))
        )
          return "face domain authority is outside its declared sampling side";
    }
    for (const edge of segments) {
      const a: Point = chart.get(edge.a)!;
      const b: Point = chart.get(edge.b)!;
      if (
        !(
          (a[0] === low && b[0] === low) ||
          (a[0] === high && b[0] === high) ||
          (period === undefined &&
            ((a[1] === first && b[1] === first) ||
              (a[1] === last && b[1] === last)))
        )
      )
        return "face domain authority segment crosses the original domain interior";
    }
    return segments;
  }
  /** Preserve original IDs; every repeated phase must equal the first authority plus its explicit integer period in binary64. Original loops remain unchanged for membership, so no near-coordinate canonicalization replaces their input. */
  export function collect(
    mesh: AutoMovieSolidMesh.IMesh,
    loops: readonly AutoMovieSolidMesh.ILoop[],
    chart: Map<number, Point>,
    period: number | undefined,
  ): AutoMovieSolidMeshConstraints.ISegment[] | string {
    const result: AutoMovieSolidMeshConstraints.ISegment[] = [];
    for (const loop of loops) {
      if (
        loop.vertices.length !== loop.chart.length ||
        loop.vertices.length < 2 ||
        ((loop.kind === "hole" || loop.kind === "island") &&
          loop.vertices.length < 3) ||
        ((loop.kind === "start" || loop.kind === "end") && period === undefined)
      )
        return "face trim needs matching nondegenerate indices/charts and a periodic winding kind";
      for (let k: number = 0; k < loop.vertices.length; k++) {
        const id: number = loop.vertices[k]!;
        const point: Point = loop.chart[k]!;
        if (
          !Number.isSafeInteger(id) ||
          id < 0 ||
          3 * id + 2 >= mesh.positions.length ||
          point.length !== 2 ||
          !point.every(Number.isFinite) ||
          !mesh.positions.slice(3 * id, 3 * id + 3).every(Number.isFinite)
        )
          return "face trim has an unavailable authoritative vertex or nonfinite chart";
        const known: Point | undefined = chart.get(id);
        if (known === undefined) chart.set(id, [point[0], point[1]]);
        else {
          const turn: number =
            period === undefined
              ? 0
              : Math.round((point[1] - known[1]) / period);
          const rebuilt: number = known[1] + turn * (period ?? 0);
          if (
            known[0] !== point[0] ||
            !Number.isSafeInteger(turn) ||
            point[1] !== rebuilt
          )
            return "one authoritative vertex has inconsistent face charts; phase lifts must reproduce the original authority exactly";
        }
      }
      let winding: number = 0;
      for (let k: number = 0; k < loop.vertices.length; k++) {
        const next: number = (k + 1) % loop.vertices.length;
        const a: Point = loop.chart[k]!;
        const raw: Point = loop.chart[next]!;
        const closing: boolean =
          next === 0 && (loop.kind === "start" || loop.kind === "end");
        if (
          period !== undefined &&
          !closing &&
          Math.abs(raw[1] - a[1]) > period / 2
        )
          return "face trim primitive exceeds the local half-period family";
        const target: number = closing
          ? raw[1] + Math.round((a[1] - raw[1]) / period!) * period!
          : raw[1];
        const liftA: number =
          period === undefined
            ? 0
            : Math.round((a[1] - chart.get(loop.vertices[k]!)![1]) / period);
        const liftB: number =
          period === undefined
            ? 0
            : Math.round(
                (target - chart.get(loop.vertices[next]!)![1]) / period,
              );
        const turn: number = liftB - liftA;
        if (!Number.isSafeInteger(turn))
          return "face trim turn is not representable";
        winding += turn;
        result.push({ a: loop.vertices[k]!, b: loop.vertices[next]!, turn });
      }
      if (
        (loop.kind === "start" || loop.kind === "end") &&
        Math.abs(winding) !== 1
      )
        return "face winding trim must make exactly one period turn";
    }
    return result;
  }
}
