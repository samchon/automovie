import { AutoMovieBernstein64 as B, type IAutoMovieCurve64 as C } from "@automovie/engine";

import type { AutoMovieHumanSurfaceBuilder64 } from "./AutoMovieHumanSurfaceBuilder64";
import type { IAutoMovieHumanSurfaceDefinition as D } from "./IAutoMovieHumanSurfaceDefinition";

/**
 * Explicit multi-port chart incidence for the common shoulder or pelvic field.
 * Six named hub faces share symbolic cube-edge identities. A face either owns
 * one anatomical port with eight annular patches, or four filled patches. This
 * topology does not infer a branch from coincident loops or section ordering.
 * Dimensional hub axes and radii come from the common skeletal/section plan.
 *
 * A normalized-cube map supplies endpoint positions and analytic tangents, not
 * sampled reference controls. Cubic Hermite boundary curves and Coons fills
 * define the generated polynomial hub itself; they are not claimed to be exact
 * ellipsoids. Ports retain the complete owner P/fullJ with the explicit physical
 * traversal sign and phase reversal. Their first adjacent rows match those jets.
 * Collar chart width is the port-to-face-centre chord plus one quarter of the
 * hub-radius diagonal, an explicit mm parameter convention, not skin arclength.
 * Hub-internal edges share C0 coefficients; G1/twist compatibility and global
 * embedding remain unqualified until the corresponding ribbon system is solved.
 */
export class AutoMovieHumanSurfaceJunction64 {
  private readonly edges: Map<string, {points: C.Span; ids: readonly string[]}> = new Map();

  /** Every port has one explicit face and one physical owner; empty faces are filled. */
  public constructor(private readonly props: {
    id: string;
    centreMm: C.Vector;
    radiiMm: C.Vector;
    ports: Partial<Record<AutoMovieHumanSurfaceJunction64.Face, AutoMovieHumanSurfaceJunction64.Port>>;
    owner: D.Patch;
  }) {
    if (![...props.centreMm, ...props.radiiMm].every(Number.isFinite) ||
        props.radiiMm.some((x: number): boolean => x <= 0))
      throw new Error("Positive finite dimensional junction frame required");
    for (const port of Object.values(props.ports))
      if (port !== undefined && (!Number.isInteger(port.firstSpan) || port.firstSpan < 0 ||
          port.firstSpan > 7 || !port.cut.curve.closed || port.cut.curve.spans.length !== 8 ||
          port.cut.fullJ.length !== 8 || port.cut.curve.phaseIntervals.length !== 8 ||
          port.cut.curve.phaseIntervals.some((h: number): boolean => !(h > 0))))
        throw new Error("This explicit junction layout requires its eight-span generated port family");
  }

  /** Publish one connected symbolic layout into the same atlas as its incident fields. */
  public emit(builder: AutoMovieHumanSurfaceBuilder64): void {
    for (const face of ["x+", "x-", "y+", "y-", "z+", "z-"] as const) {
      const basis: readonly [C.Vector,C.Vector,C.Vector] = this.basis(face);
      const normal: C.Vector = basis[0];
      const ring: C.Vector[] = [[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1],[1,1]].map(
        (uv: number[]): C.Vector => normal.map((x: number, k: number): number =>
          x+basis[1][k]!*uv[0]!+basis[2][k]!*uv[1]!) as unknown as C.Vector);
      const outside: {points: C.Span; ids: readonly string[]}[] = ring.map(
        (p: C.Vector, i: number): {points: C.Span; ids: readonly string[]} =>
          this.edge(p, ring[(i+1)%8]!));
      const port: AutoMovieHumanSurfaceJunction64.Port | undefined = this.props.ports[face];
      if (port === undefined) {
        for (let panel: number = 0; panel < 4; ++panel) {
          const i: number = panel*2;
          const bottom: ReturnType<AutoMovieHumanSurfaceJunction64["edge"]> = this.edge(normal, ring[(i+2)%8]!);
          const right: ReturnType<AutoMovieHumanSurfaceJunction64["edge"]> = this.reverse(outside[(i+1)%8]!);
          const top: ReturnType<AutoMovieHumanSurfaceJunction64["edge"]> = outside[i]!;
          const left: ReturnType<AutoMovieHumanSurfaceJunction64["edge"]> = this.edge(normal, ring[i]!);
          const grid: C.Vector[][] = [];
          const ids: string[][] = [];
          for (let v: number = 0; v < 4; ++v) {
            const row: C.Vector[] = [];
            const names: string[] = [];
            for (let u: number = 0; u < 4; ++u) {
              if (v === 0) {row.push(bottom.points[u]!); names.push(bottom.ids[u]!);}
              else if (v === 3) {row.push(top.points[u]!); names.push(top.ids[u]!);}
              else if (u === 0) {row.push(left.points[v]!); names.push(left.ids[v]!);}
              else if (u === 3) {row.push(right.points[v]!); names.push(right.ids[v]!);}
              else {
                const s: number = u/3;
                const t: number = v/3;
                row.push([0,1,2].map((axis: number): number =>
                  (1-t)*bottom.points[u]![axis]!+t*top.points[u]![axis]!+
                  (1-s)*left.points[v]![axis]!+s*right.points[v]![axis]!-
                  ((1-s)*(1-t)*bottom.points[0][axis]!+s*(1-t)*bottom.points[3][axis]!+
                    (1-s)*t*top.points[0][axis]!+s*t*top.points[3][axis]!),
                ) as unknown as C.Vector);
                names.push(`${this.props.id}/${face}/${panel}/${v}/${u}`);
              }
            }
            grid.push(row); ids.push(names);
          }
          builder.patch({id: `${this.props.id}/${face}/fill${panel}`, grid, identities: ids,
            owner: this.props.owner});
        }
        continue;
      }
      const centre: C.Vector = port.cut.curve.spans.reduce(
        (sum: C.Vector, span: C.Span): C.Vector => sum.map(
          (x: number, k: number): number => x+span[0][k]/8,
        ) as unknown as C.Vector, [0,0,0]);
      const outerCentre: C.Vector = this.value(normal);
      const lengthMm: number = Math.hypot(...centre.map(
        (x: number, k: number): number => x-outerCentre[k]!),
      ) + Math.hypot(...this.props.radiiMm)/4;
      for (let span: number = 0; span < 8; ++span) {
        const reversed: boolean = port.reversePhase;
        const first: number = port.firstSpan;
        const source: number = ((reversed ? first+7-span : first+span)%8+8)%8;
        const order: readonly number[] = reversed ? [3,2,1,0] : [0,1,2,3];
        const start: B.Poly = order.map((k: number): B.Vec => [...port.cut.curve.spans[source]![k]!]);
        const startJ: B.Poly = order.map((k: number): B.Vec => port.cut.fullJ[source]![k]!.map(
          (x: number): number => -port.outwardSign*x,
        ) as B.Vec);
        const end: B.Poly = outside[span]!.points.map((p: C.Vector): B.Vec => [...p]);
        const endJ: B.Poly = this.radialJet(ring[span]!, ring[(span+1)%8]!, normal, lengthMm);
        const grid: B.Grid = B.hermite(start, end, startJ, endJ, lengthMm);
        const names: string[][] = grid.map((_row: B.Poly, row: number): string[] => [0,1,2,3].map(
          (column: number): string => {
            if (row === 0) return this.portIdentity(port.cut.id, source, order[column]!);
            if (row === 3) return outside[span]!.ids[column]!;
            const node: string = column === 3 ? `${(span+1)%8}/0` : `${span}/${column}`;
            return `${this.props.id}/${face}/row${row}/${node}`;
          },
        ));
        builder.patch({id: `${this.props.id}/${face}/collar${span}`, grid,
          identities: names, owner: this.props.owner});
      }
    }
  }

  /** Same coefficient address convention as the owning strip, with exact closure. */
  private portIdentity(id: string, span: number, column: number): string {
    return column === 3 ? `${id}/${(span+1)%8}/0` : `${id}/${span}/${column}`;
  }

  /** The normalized-cube map defines endpoints; the published patch is polynomial. */
  private value(p: C.Vector): C.Vector {
    const length: number = Math.hypot(...p);
    return p.map((x: number, k: number): number =>
      this.props.centreMm[k]!+this.props.radiiMm[k]!*x/length,
    ) as unknown as C.Vector;
  }

  /** Analytic first variation of the dimensional normalized-cube map. */
  private derivative(p: C.Vector, d: C.Vector): C.Vector {
    const length: number = Math.hypot(...p);
    const dot: number = p.reduce((sum: number, x: number, k: number): number => sum+x*d[k]!, 0);
    return p.map((x: number, k: number): number =>
      this.props.radiiMm[k]!*(d[k]!/length-x*dot/length**3),
    ) as unknown as C.Vector;
  }

  /** One canonical Hermite boundary, reversed by coefficient order when incident charts disagree. */
  private edge(a: C.Vector, b: C.Vector): {points: C.Span; ids: readonly string[]} {
    const ai: string = a.join(",");
    const bi: string = b.join(",");
    if (ai > bi) return this.reverse(this.edge(b,a));
    const key: string = `${ai}:${bi}`;
    let edge: {points: C.Span; ids: readonly string[]} | undefined = this.edges.get(key);
    if (edge === undefined) {
      const d: C.Vector = b.map((x: number, k: number): number => x-a[k]!) as unknown as C.Vector;
      const p: C.Vector = this.value(a);
      const q: C.Vector = this.value(b);
      const dp: C.Vector = this.derivative(a,d);
      const dq: C.Vector = this.derivative(b,d);
      edge = {points: [p, p.map((x: number, k: number): number => x+dp[k]!/3) as unknown as C.Vector,
        q.map((x: number, k: number): number => x-dq[k]!/3) as unknown as C.Vector, q],
        ids: [`${this.props.id}/node/${ai}`, `${this.props.id}/edge/${key}/1`,
          `${this.props.id}/edge/${key}/2`, `${this.props.id}/node/${bi}`]};
      this.edges.set(key, edge);
    }
    return edge;
  }

  /** Reverse an incident edge without regenerating or rounding its coefficients. */
  private reverse(edge: {points: C.Span; ids: readonly string[]}): {points: C.Span; ids: readonly string[]} {
    return {points: [edge.points[3],edge.points[2],edge.points[1],edge.points[0]],
      ids: [...edge.ids].reverse()};
  }

  /** Cubic Hermite field for the analytic outer radial derivative, per physical mm. */
  private radialJet(a: C.Vector, b: C.Vector, normal: C.Vector, lengthMm: number): B.Poly {
    const d: C.Vector = b.map((x: number, k: number): number => x-a[k]!) as unknown as C.Vector;
    const evaluate: (p: C.Vector) => {value: C.Vector; tangent: C.Vector} =
      (p: C.Vector): {value: C.Vector; tangent: C.Vector} => {
        const r: C.Vector = p.map((x: number, k: number): number => x-normal[k]!) as unknown as C.Vector;
        const q: number = Math.hypot(...p);
        const pr: number = p.reduce((sum: number, x: number, k: number): number => sum+x*r[k]!,0);
        const pd: number = p.reduce((sum: number, x: number, k: number): number => sum+x*d[k]!,0);
        const dr: number = d.reduce((sum: number, x: number, k: number): number => sum+x*r[k]!,0);
        const first: C.Vector = this.derivative(p,d);
        return {
          value: this.derivative(p,r).map((x: number): number => x/lengthMm) as unknown as C.Vector,
          tangent: p.map((x: number, k: number): number =>
            (this.props.radiiMm[k]!*(-(d[k]!*pr+r[k]!*pd+x*dr)/q**3+
              3*x*pd*pr/q**5)+first[k]!)/lengthMm,
          ) as unknown as C.Vector,
        };
      };
    const p: ReturnType<typeof evaluate> = evaluate(a);
    const q: ReturnType<typeof evaluate> = evaluate(b);
    return [[...p.value], p.value.map((x: number,k: number): number => x+p.tangent[k]!/3) as B.Vec,
      q.value.map((x: number,k: number): number => x-q.tangent[k]!/3) as B.Vec, [...q.value]];
  }

  /** Proper face frame, with breadth cross anterior equal to the outward face normal. */
  private basis(face: AutoMovieHumanSurfaceJunction64.Face): readonly [C.Vector,C.Vector,C.Vector] {
    const sign: number = face[1] === "+" ? 1 : -1;
    if (face[0] === "x") return [[sign,0,0],[0,sign,0],[0,0,1]];
    if (face[0] === "y") return [[0,sign,0],[-sign,0,0],[0,0,1]];
    return [[0,0,sign],[sign,0,0],[0,1,0]];
  }
}

/** Explicit named faces of the generated hub chart. */
export namespace AutoMovieHumanSurfaceJunction64 {
  /** One anatomical port at most per declared face in this layout revision. */
  export type Face = "x+" | "x-" | "y+" | "y-" | "z+" | "z-";

  /**
   * One exact owner cut and the sign of its physical coordinate leaving the hub.
   *
   * @author Samchon
   */
  export interface Port {
    /** Same generated coefficients as the incident field. */
    cut: D.Boundary;
    /** +1 when the owner's increasing physical coordinate leaves this hub. */
    outwardSign: 1 | -1;
    /** Exact angular-node registration in the generated eight-span owner family. */
    firstSpan: number;
    /** Angular traversal, independent of the physical transverse derivative sign. */
    reversePhase: boolean;
  }
}
