import type {
  AutoMovieVector2Tuple,
  IAutoMovieSolidMesh,
  IAutoMovieSolidMeshConstraints,
} from "@automovie/interface";

/**
 * Admit authoritative indexed trim and original-domain chart occurrences.
 *
 * Shared IDs keep their own face charts and exact integer periodic lifts.
 * Original domain authorities seed and protect the real rectangular sides; they
 * are never cutting loops. This distinction lets open-boundary provenance
 * retain a genuine source end while a coincident actual trim remains
 * uncappable.
 */
export namespace AutoMovieSolidMeshAuthorities {
  /**
   * An exact cell side consumes both authority endpoints through the existing
   * grid lookup.
   */
  export function consumedByCell(
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
    u: Readonly<AutoMovieVector2Tuple>,
    v: Readonly<AutoMovieVector2Tuple>,
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
   * Seed actual rectangular domain points; return a named premise before any
   * source or mesh write.
   */
  export function domainSegments(
    mesh: IAutoMovieSolidMesh.IMesh,
    input: IAutoMovieSolidMesh.IFace,
    chart: Map<number, Readonly<AutoMovieVector2Tuple>>,
    period: number | undefined,
  ): IAutoMovieSolidMeshConstraints.ISegment[] | string {
    const declared: IAutoMovieSolidMesh.ILoop[] | undefined = input.domainLoops;
    if (declared === undefined) return [];
    const loops: readonly IAutoMovieSolidMesh.ILoop[] = declared;
    if (loops.length === 0) return [];
    const segments: IAutoMovieSolidMeshConstraints.ISegment[] | string =
      collect(mesh, loops, chart, period);
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
      const a: Readonly<AutoMovieVector2Tuple> = chart.get(edge.a)!;
      const b: Readonly<AutoMovieVector2Tuple> = chart.get(edge.b)!;
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
   * Preserve original IDs; every repeated phase must equal the first authority
   * plus its explicit integer period in binary64. Original loops remain
   * unchanged for membership, so no near-coordinate canonicalization replaces
   * their input.
   */
  export function collect(
    mesh: IAutoMovieSolidMesh.IMesh,
    loops: readonly IAutoMovieSolidMesh.ILoop[],
    chart: Map<number, Readonly<AutoMovieVector2Tuple>>,
    period: number | undefined,
  ): IAutoMovieSolidMeshConstraints.ISegment[] | string {
    const result: IAutoMovieSolidMeshConstraints.ISegment[] = [];
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
        const point: Readonly<AutoMovieVector2Tuple> = loop.chart[k]!;
        if (id < 0 || 3 * id + 2 >= mesh.positions.length)
          return "face trim has an unavailable authoritative vertex";
        const known: Readonly<AutoMovieVector2Tuple> | undefined =
          chart.get(id);
        if (known === undefined) chart.set(id, [point[0], point[1]]);
        else {
          const turn: number =
            period === undefined
              ? 0
              : Math.round((point[1] - known[1]) / period);
          const rebuilt: number = known[1] + turn * (period ?? 0);
          if (known[0] !== point[0] || point[1] !== rebuilt)
            return "one authoritative vertex has inconsistent face charts; phase lifts must reproduce the original authority exactly";
        }
      }
      let winding: number = 0;
      for (let k: number = 0; k < loop.vertices.length; k++) {
        const next: number = (k + 1) % loop.vertices.length;
        const a: Readonly<AutoMovieVector2Tuple> = loop.chart[k]!;
        const raw: Readonly<AutoMovieVector2Tuple> = loop.chart[next]!;
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
