import { AutoMoviePchip64, type IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * One physical longitudinal field over generated sections in a common frame.
 * Interpolate angular nodes and shared phase derivatives, then derive both
 * incident cubic coefficients. This preserves each supplied course and its
 * angular tangent relation without independently limiting four control points.
 * Each incident handle uses its own phase width; unequal widths do not share
 * an unscaled handle. This owner is for generated phase-C1 sections, not curves
 * with intentionally independent incoming and outgoing corner derivatives.
 * World-vector station jets include centre and frame changes already present in
 * those coefficients. They are dX/ds in physical mm, not cross-course derivatives.
 * Intermediate tissue shape is a declared PCHIP convention, not a measured pose
 * transfer. One field owns the courses and jets consumed by every incident strip.
 */
export class AutoMovieHumanSectionField64 {
  /** Generated closed sections in their original phase units and physical mm. */
  public readonly courses: readonly C.Cubic[];
  /** Complete world-vector dP/ds coefficient nets, with station s in mm. */
  public readonly fullJ: readonly (readonly C.Span[])[];

  /** Own ordered physical stations and equal-topology generated closed courses. */
  public constructor(stationsMm: readonly number[], courses: readonly C.Cubic[]) {
    const count: number = courses[0]?.spans.length ?? 0;
    if (stationsMm.length !== courses.length || courses.length < 2 || count === 0 ||
        stationsMm.some((s: number, i: number): boolean => !Number.isFinite(s) ||
          (i > 0 && s <= stationsMm[i-1]!)) ||
        courses.some((c: C.Cubic): boolean => !c.closed || c.spans.length !== count ||
          c.phaseUnit !== courses[0]!.phaseUnit ||
          c.phaseIntervals.length !== count || c.phaseIntervals.some(
            (h: number, i: number): boolean => h !== courses[0]!.phaseIntervals[i] || !(h > 0))))
      throw new Error("Ordered physical stations and compatible closed courses required");
    const nodes: C.Vector[][] = courses.map((c: C.Cubic): C.Vector[] =>
      c.spans.map((span: C.Span): C.Vector => [...span[0]]));
    const angularDerivatives: C.Vector[][] = courses.map((c: C.Cubic): C.Vector[] =>
      c.spans.map((span: C.Span, i: number): C.Vector => [
        3*(span[1][0]-span[0][0])/c.phaseIntervals[i]!,
        3*(span[1][1]-span[0][1])/c.phaseIntervals[i]!,
        3*(span[1][2]-span[0][2])/c.phaseIntervals[i]!,
      ]));
    const nodeJets: [number,number,number][][] = AutoMoviePchip64.fieldSlopes(stationsMm, nodes);
    const derivativeJets: [number,number,number][][] = AutoMoviePchip64.fieldSlopes(stationsMm, angularDerivatives);
    this.courses = courses.map((c: C.Cubic, i: number): C.Cubic => ({
      ...structuredClone(c), spans: AutoMovieHumanSectionField64.spans(
        nodes[i]!, angularDerivatives[i]!, c.phaseIntervals),
    }));
    this.fullJ = nodeJets.map((row: C.Vector[], i: number): C.Span[] =>
      AutoMovieHumanSectionField64.spans(row, derivativeJets[i]!, courses[i]!.phaseIntervals));
  }

  /** Derive the incident handles from one physical phase derivative and each width. */
  private static spans(points: readonly C.Vector[], derivatives: readonly C.Vector[], widths: readonly number[]): C.Span[] {
    return points.map((p: C.Vector, i: number): C.Span => {
      const next: number = (i+1)%points.length;
      const q: C.Vector = points[next]!;
      const h: C.Vector = derivatives[i]!;
      const k: C.Vector = derivatives[next]!;
      const factor: number = widths[i]!/3;
      return [p, [p[0]+factor*h[0], p[1]+factor*h[1], p[2]+factor*h[2]],
        [q[0]-factor*k[0], q[1]-factor*k[1], q[2]-factor*k[2]], q];
    });
  }
}
