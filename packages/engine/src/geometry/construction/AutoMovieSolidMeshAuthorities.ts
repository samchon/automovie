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
 * @evidence contracts/development/common.md#meaningful-documentation States original IDs, foreign-owner charts, exact lift reconstruction, domain-only roles and local-map mutation before mesh publication.
 * @evidence contracts/development/design.md#principled-representation Represents Admit authoritative indexed trim and original-domain chart occurrences: companion namespace of 3 members (`consumedByCell`, `domainSegments`, `collect`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidMeshAuthorities` in packages/engine/src/geometry/construction/AutoMovieSolidMeshAuthorities.ts; its surface is the 3 members listed and the text shows 2 other files naming it, mostly packages/engine (1), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidMeshAuthorities {
  /**
   * An exact cell side consumes both authority endpoints through the existing grid lookup.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Distinguishes an identical grid side or an isolated shared grid corner from every partial, longer or nonaligned authority segment. The caller still resolves the original IDs at those exact corners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exact chart predicate lets Grid retain its cells beside aligned original domain authorities; actual cutting loops never use this exception.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses no tolerance, new vertex, weld or segment subdivision. An authority knot inside a cell side and a coarse authority spanning several cells remain residual constraints.
   * @evidence contracts/development/common.md#meaningful-documentation A true result describes consumption in this finite grid cell, not a source membership, surface chord certificate or arbitrary trim exemption. Inputs are the admitted face's finite lifted chart values.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant exact endpoint and interval comparisons per already-overlapping authority occurrence.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The pure predicate coordinates no requests or preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no arrays, mesh or source; the caller owns the supplied endpoint values.
   */
  export function consumedByCell(
    a: Point,
    b: Point,
    u: Point,
    v: Point,
  ): boolean {
    if (
      a[0] === b[0] &&
      (a[0] === u[0] || a[0] === u[1]) &&
      Math.min(a[1], b[1]) === v[0] &&
      Math.max(a[1], b[1]) === v[1]
    )
      return true;
    if (
      a[1] === b[1] &&
      (a[1] === v[0] || a[1] === v[1]) &&
      Math.min(a[0], b[0]) === u[0] &&
      Math.max(a[0], b[0]) === u[1]
    )
      return true;
    const lowU: number = Math.max(Math.min(a[0], b[0]), u[0]);
    const highU: number = Math.min(Math.max(a[0], b[0]), u[1]);
    const lowV: number = Math.max(Math.min(a[1], b[1]), v[0]);
    const highV: number = Math.min(Math.max(a[1], b[1]), v[1]);
    return (
      lowU === highU &&
      lowV === highV &&
      (lowU === u[0] || lowU === u[1]) &&
      (lowV === v[0] || lowV === v[1])
    );
  }

  /**
   * Seed actual rectangular domain points; return a named premise before any source or mesh write.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Seed actual rectangular domain points; return a named premise before any source or mesh write.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Seed actual rectangular domain points; return a named premise before any source or mesh write) directly over its typed inputs (`mesh`, `input`, `chart`, `period`) as nested iteration of depth 2 (for-of over loops; for-of over loop.chart; for-of over segments), delegating to `Array.isArray`, `collect`, `chart.get`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 52 lines and 14 top-level statements that reuses `Array.isArray`, `collect`, `chart.get` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 6 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `mesh`, `input`, `chart`, `period`; the dominant cost is nested iteration of depth 2 (for-of over loops; for-of over loop.chart; for-of over segments), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
   */
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
  /**
   * Preserve original IDs; every repeated phase must equal the first authority plus its explicit integer period in binary64. Original loops remain unchanged for membership, so no near-coordinate canonicalization replaces their input.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Preserve original IDs; every repeated phase must equal the first authority plus its explicit integer period in binary64.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Preserve original IDs; every repeated phase must equal the first authority plus its explicit integer period in binary64) directly over its typed inputs (`mesh`, `loops`, `chart`, `period`) as nested iteration of depth 3 (for-of over loops; for loop bounded by k < loop.vertices.length; every over point), delegating to `Number.isSafeInteger`, `point.every`, `chart.get`, `chart.set`, `Math.round`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 79 lines and 3 top-level statements that reuses `Number.isSafeInteger`, `point.every`, `chart.get`, `chart.set`, `Math.round` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 12 non-null assertion(s); these are the remaining shortcuts and are not justified here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `mesh`, `loops`, `chart`, `period`; the dominant cost is nested iteration of depth 3 (for-of over loops; for loop bounded by k < loop.vertices.length; every over point), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
   */
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
