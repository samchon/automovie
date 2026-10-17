import { AutoMovieCurveMath64 as M } from "@automovie/engine";

/** One longitudinal Hermite field for a periodic section's supports and angular handles. PCHIP station derivatives, explicit endpoint full jets and optional fan overrides generate sections and fixed-node guides from the same coefficients. Mutable derivative overrides require rebuild before evaluation. No retained state exists beyond this instance's station and coefficient arrays.
 *
 * @author Samchon
 */
export class PelvisLongitudinalFamily {
  /** Strictly ascending physical Y stations in millimetres used by longitudinal Hermite interpolation.
   */
  public readonly ys: number[];

  /** Per-station periodic support positions in millimetres; controls are derived from these supports and handle fields.
   */
  public readonly points: M.V[][];

  /** Per-station outgoing one-third angular derivatives in mm per internal phase unit, before multiplication by span width.
   */
  public readonly handles: M.V[][];

  /** Optional per-station incoming one-third angular derivatives; omission shares the outgoing field at each support.
   */
  public readonly incoming: M.V[][] | undefined;

  /** Positive angular widths of the periodic section chart; the same widths scale both incoming and outgoing handles.
   */
  public readonly widths: number[];

  /** Per-station support derivatives dP/dY in mm/mm; endpoint and branch reconciliation may override these values before rebuild().
   */
  public dp: M.V[][];

  /** Per-station d/dY of outgoing one-third angular derivatives; multiplying by angular width gives the outgoing control-jet offset.
   */
  public dh: M.V[][];

  /** Optional per-station d/dY of incoming one-third angular derivatives, corresponding to incoming handles.
   */
  public di: M.V[][] | undefined;

  /** Longitudinal Bernstein coefficients of support positions: physical interval, cubic row, then periodic node; units are millimetres.
   */
  public pfields: M.V[][][] = [];

  /** Longitudinal Bernstein coefficients of outgoing one-third angular derivatives, with the same interval/row/node layout as pfields.
   */
  public hfields: M.V[][][] = [];

  /** Optional longitudinal Bernstein coefficients of incoming one-third angular derivatives; absence shares the outgoing field.
   */
  public ifields: M.V[][][] | undefined;

  /** Clone corresponding station values and derive PCHIP longitudinal jets, then apply explicit endpoint/fan overrides and rebuild coefficient fields. Station heights must be finite and strictly ascending; supplied arrays and node layouts must correspond.
   */
  public constructor(props: {
    /** Strictly ascending physical Y stations in millimetres used by longitudinal Hermite interpolation.
     */
    ys: readonly number[];

    /** Per-station periodic support positions in millimetres; controls are derived from these supports and handle fields.
     */
    points: readonly M.V[][];

    /** Per-station outgoing one-third angular derivatives in mm per internal phase unit, before multiplication by span width.
     */
    handles: readonly M.V[][];

    /** Positive angular widths of the periodic section chart; the same widths scale both incoming and outgoing handles.
     */
    widths: readonly number[];

    /** Optional per-station incoming one-third angular derivatives; omission shares the outgoing field at each support.
     */
    incoming?: readonly M.V[][];

    /** Optional complete lower-end cubic control jet dP/dY in mm/mm, used to override support and outgoing-handle derivatives.
     */
    startJet?: readonly M.Span[];

    /** Optional complete upper-end cubic control jet dP/dY in mm/mm; it preserves the upstream waist operator.
     */
    endJet?: readonly M.Span[];

    /** Optional lower-end support dP/dY overrides indexed by semantic node, after the complete endpoint-jet override.
     */
    initialSupportJets?: ReadonlyMap<number, M.V>;

    /** Optional anterior-lane X field and dX/dY callback; replaces only the designated support coordinates and longitudinal derivatives.
     */
    fan?: {
      /** Merged support index of the left anterior lane controlled by the shared fan.
       */
      leftNode: number;

      /** Merged support index of the right anterior lane controlled by the shared fan.
       */
      rightNode: number;

      /** Evaluate native X in millimetres, or dX/dY in mm/mm when derivative is true, for the requested side and physical Y.
       */
      value: (y: number, side: "left" | "right", derivative: boolean) => number;
    };
  }) {
    this.ys = [...props.ys];
    this.points = structuredClone(props.points) as M.V[][];
    this.handles = structuredClone(props.handles) as M.V[][];
    this.widths = [...props.widths];
    this.dp = M.fieldSlopes(this.ys, this.points);
    this.dh = M.fieldSlopes(this.ys, this.handles);
    for (const [index, jet] of [
      [0, props.startJet],
      [this.ys.length - 1, props.endJet],
    ] as const)
      if (jet !== undefined)
        for (let n: number = 0; n < this.widths.length; n++) {
          this.dp[index]![n] = M.clone(jet[n]![0]);
          this.dh[index]![n] = M.scale(
            M.sub(jet[n]![1], jet[n]![0]),
            1 / this.widths[n]!,
          );
        }
    if (props.initialSupportJets !== undefined)
      for (const [n, value] of props.initialSupportJets)
        this.dp[0]![n] = M.clone(value);
    if (props.fan !== undefined)
      for (const [side, node] of [
        ["left", props.fan.leftNode],
        ["right", props.fan.rightNode],
      ] as const)
        for (let i: number = 0; i < this.ys.length; i++) {
          this.points[i]![node]![0] = props.fan.value(this.ys[i]!, side, false);
          this.dp[i]![node]![0] = props.fan.value(this.ys[i]!, side, true);
        }
    if (props.incoming !== undefined) {
      this.incoming = structuredClone(props.incoming) as M.V[][];
      this.di = M.fieldSlopes(this.ys, this.incoming);
      if (props.startJet !== undefined)
        for (let n: number = 0; n < this.widths.length; n++) {
          const prev: number =
            (n + this.widths.length - 1) % this.widths.length;
          this.di[0]![n] = M.scale(
            M.sub(props.startJet[prev]![3], props.startJet[prev]![2]),
            1 / this.widths[prev]!,
          );
        }
    }
    this.rebuild();
  }

  /** Recompute longitudinal cubic Bernstein fields from the current support/handle values and d/dY arrays. Call after derivative overrides; this replaces instance-owned coefficient arrays without changing the stations.
   */
  public rebuild(): void {
    const build: (values: M.V[][], jets: M.V[][]) => M.V[][][] = (
      values: M.V[][],
      jets: M.V[][],
    ): M.V[][][] =>
      this.ys.slice(1).map((y: number, i: number): M.V[][] => {
        const each: M.Span[] = values[i]!.map(
          (v: M.V, n: number): M.Span =>
            M.hermite(
              v,
              values[i + 1]![n]!,
              jets[i]![n]!,
              jets[i + 1]![n]!,
              y - this.ys[i]!,
            ),
        );
        return [0, 1, 2, 3].map((k: number): M.V[] =>
          each.map((s: M.Span): M.V => M.clone(s[k]!)),
        );
      });
    this.pfields = build(this.points, this.dp);
    this.hfields = build(this.handles, this.dh);
    if (this.incoming !== undefined && this.di !== undefined)
      this.ifields = build(this.incoming, this.di);
  }

  /** Evaluate all cubic section coefficients at physical Y in millimetres. With derivative=true, return the complete coefficient dP/dY field in mm/mm, including tangential motion. Nonfinite or out-of-domain Y rejects; no clamping or extrapolation is performed.
   */
  public controls(y: number, derivative: boolean = false): M.Span[] {
    if (!Number.isFinite(y) || y < this.ys[0]! || y > this.ys.at(-1)!)
      throw new Error("Outside the actual physical longitudinal family");
    let i: number = this.ys.findIndex((h: number): boolean => h > y) - 1;
    if (i < 0) i = this.ys.length - 2;
    const dy: number = this.ys[i + 1]! - this.ys[i]!,
      t: number = (y - this.ys[i]!) / dy;
    const evaluate: (fields: M.V[][][]) => M.V[] = (fields: M.V[][][]): M.V[] =>
      fields[i]![0]!.map((_v: M.V, n: number): M.V => {
        const controls: M.V[] = fields[i]!.map((row: M.V[]): M.V => row[n]!);
        return derivative
          ? M.derivative(controls, t, dy)
          : M.cubic(controls, t);
      });
    const points: M.V[] = evaluate(this.pfields),
      handles: M.V[] = evaluate(this.hfields);
    const out: M.Span[] = M.spans(points, handles, this.widths);
    if (this.ifields !== undefined) {
      const incoming: M.V[] = evaluate(this.ifields);
      out.forEach((s: M.Span, n: number): void => {
        s[2] = M.sub(
          s[3],
          M.scale(incoming[(n + 1) % incoming.length]!, this.widths[n]!),
        );
      });
    }
    return out;
  }

  /** Return the longitudinal cubic support path of one corresponding semantic node, in millimetres and the physical-Y interval layout; it is extracted from pfields rather than fitted separately.
   */
  public guide(node: number): M.Span[] {
    return this.pfields.map(
      (g: M.V[][]): M.Span =>
        g.map((row: M.V[]): M.V => M.clone(row[node]!)) as M.Span,
    );
  }

  /** Return each section span's four control trajectories over all physical-Y intervals. Outgoing and optional incoming fields use the same angular widths as controls(), preserving the full generating tensor.
   */
  public controlFields(): M.Span[][][] {
    return this.widths.map((w: number, node: number): M.Span[][] =>
      [0, 1, 2, 3].map((ci: number): M.Span[] =>
        this.pfields.map(
          (p: M.V[][], i: number): M.Span =>
            p.map((row: M.V[], k: number): M.V => {
              const next: number = (node + 1) % this.widths.length;
              return ci === 0
                ? M.clone(row[node]!)
                : ci === 1
                  ? M.add(row[node]!, M.scale(this.hfields[i]![k]![node]!, w))
                  : ci === 2
                    ? M.sub(
                        row[next]!,
                        M.scale(
                          (this.ifields ?? this.hfields)[i]![k]![next]!,
                          w,
                        ),
                      )
                    : M.clone(row[next]!);
            }) as M.Span,
        ),
      ),
    );
  }
}
