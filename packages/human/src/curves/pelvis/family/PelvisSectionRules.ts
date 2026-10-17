import { AutoMovieCurveMath64 as M } from "@automovie/engine";

import type { PelvisMeasurements as P } from "./PelvisMeasurements";

/** Epoch-specific cardinal support placement, waist subdivision and merged-course construction. R6b uses fourteen lanes; V17 introduces sixteen explicit anterior lanes. These rules derive handles from physical supports without a reference lookup.
 *
 * @author Samchon
 */
export namespace PelvisSectionRules {
  /** Fourteen R6b support names in periodic traversal order, starting at left lateral; indices identify the actual expanded waist chart.
   */
  export const lanes14: readonly string[] = [
    "leftLateral",
    "leftAnteriorRootInner",
    "leftAnteriorRootOuter",
    "leftAnteriorLane",
    "leftAnteriorArchLane",
    "anteriorMedian",
    "rightAnteriorArchLane",
    "rightAnteriorLane",
    "rightAnteriorRootOuter",
    "rightAnteriorRootInner",
    "rightLateral",
    "rightPosteriorLane",
    "posteriorMedian",
    "leftPosteriorLane",
  ];

  /** Sixteen V17 support names in periodic traversal order, including explicit inner-front and outer-transition lanes on both sides.
   */
  export const lanes16: readonly string[] = [
    "leftLateral",
    "leftAnteriorRootInner",
    "leftAnteriorRootOuter",
    "leftAnteriorLane",
    "leftAnteriorOuterTransition",
    "leftAnteriorInnerLane",
    "anteriorMedian",
    "rightAnteriorInnerLane",
    "rightAnteriorOuterTransition",
    "rightAnteriorLane",
    "rightAnteriorRootOuter",
    "rightAnteriorRootInner",
    "rightLateral",
    "rightPosteriorLane",
    "posteriorMedian",
    "leftPosteriorLane",
  ];

  /** Bilateral cubic X fields connecting the actual anterior thigh support to the upstream anterior waist support over physical Y.
   */
  export type Fan = Record<
    P.Side,
    {
      /** Cubic Bernstein coefficients of the anterior fan X curve; unused components are zero.
       */
      controls: M.Span;

      /** Lower physical Y endpoint of the anterior fan in millimetres.
       */
      lowerY: number;

      /** Upper physical Y endpoint of the anterior fan in millimetres; must exceed lowerY.
       */
      upperY: number;
    }
  >;

  /** Construct four cardinal thigh supports in native millimetres from full breadth/depth, center and dimensionless phase offsets; nonpositive breadth or depth rejects.
   */
  export function paired(station: P.PairedStation, frame: P.Frame): M.V[] {
    if (!(station.breadth_mm > 0 && station.depth_mm > 0))
      throw new Error("Positive physical paired breadth/depth required");
    const center: M.V = M.add(frame.origin_mm, [
      station.centerLateralFromFrame_mm,
      station.heightFromFrame_mm,
      station.centerFrontFromFrame_mm,
    ]);
    const rx: number = station.breadth_mm / 2,
      rz: number = station.depth_mm / 2,
      sign: number = station.sideSign;
    return [
      [sign * rx, 0, station.outerDepthPhase * rz],
      [station.frontLateralPhase * rx, 0, rz],
      [-sign * rx, 0, station.innerDepthPhase * rz],
      [station.backLateralPhase * rx, 0, -rz],
    ].map((v: number[]): M.V => M.add(center, v));
  }

  /** Resolve four cardinal handle multipliers. Quadrant fullness takes precedence, then separate incoming/outgoing arrays, then shared station rounding, then defaults; incoming fullness uses the preceding quadrant's arrival.
   */
  export function gains(
    station: P.PairedStation,
    defaults: number[],
    incoming: boolean = false,
  ): number[] {
    if (station.quadrantFullness === undefined)
      return (
        station[incoming ? "roundingIn" : "roundingOut"] ??
        station.rounding ??
        defaults
      );
    const names: readonly (keyof NonNullable<
      P.PairedStation["quadrantFullness"]
    >)[] = [
      "outerToAnterior",
      "anteriorToInner",
      "innerToPosterior",
      "posteriorToOuter",
    ];
    return names.map(
      (_name: string, i: number): number =>
        station.quadrantFullness![names[(i + (incoming ? 3 : 0)) % 4]!]![
          incoming ? "arrival" : "departure"
        ],
    );
  }

  /** Derive anterior-lane cubic X fields from placed thigh supports, distal finite-difference dX/dY and the actual waist full jet. A nonpositive thigh-to-waist height interval rejects.
   */
  export function fan(
    p: P.Input,
    waist: readonly M.Span[],
    jet: readonly M.Span[],
    sidePoint: (point: M.V, side: P.Side) => M.V,
  ): Fan {
    const result: Partial<Fan> = {};
    for (const [side, node] of [
      ["left", 3],
      ["right", 5],
    ] as const) {
      const sourceA: M.V = paired(p.pairedStations[side][0]!, p.frame)[1]!,
        sourceB: M.V = paired(p.thighDerivativeContext[side], p.frame)[1]!;
      const a: M.V = sidePoint(sourceA, side),
        b: M.V = sidePoint(sourceB, side),
        upper: M.V = waist[node]![0];
      const lowerDerivative: number = (a[0] - b[0]) / (sourceA[1] - sourceB[1]);
      const length: number = upper[1] - sourceA[1];
      if (!(length > 0))
        throw new Error(
          "The physical anterior fan has no positive height domain",
        );
      result[side] = {
        controls: [
          [a[0], 0, 0],
          [a[0] + (lowerDerivative * length) / 3, 0, 0],
          [upper[0] - (jet[node]![0][0] * length) / 3, 0, 0],
          [upper[0], 0, 0],
        ],
        lowerY: sourceA[1],
        upperY: upper[1],
      };
    }
    return result as Fan;
  }

  /** Evaluate fan X in millimetres or dX/dY in mm/mm at a physical Y; callers own the admitted height domain.
   */
  export function fanValue(
    fan: Fan,
    y: number,
    side: P.Side,
    derivative: boolean = false,
  ): number {
    const length: number = fan[side].upperY - fan[side].lowerY,
      t: number = (y - fan[side].lowerY) / length;
    return (
      derivative
        ? M.derivative(fan[side].controls, t, length)
        : M.cubic(fan[side].controls, t)
    )[0];
  }

  /** Subdivide the actual twelve-span waist and every coefficient of its full dP/dY jet with the same angular widths. R6b splits two spans in two; V17 splits them in three. Other source layouts reject.
   */
  export function expand(
    waist: readonly M.Span[],
    widths: readonly number[],
    jet: readonly M.Span[],
    epoch: P.Epoch,
  ): {
    /** Ordered cubic Bernstein coefficients; positions use millimetres and derivative fields use their enclosing declared units.
     */
    spans: M.Span[];

    /** Positive angular widths of the periodic section chart; the same widths scale both incoming and outgoing handles.
     */
    widths: number[];

    /** Complete cubic coefficient derivative dP/dY in mm/mm, partitioned with exactly the same angular chart as positions.
     */
    jet: M.Span[];
  } {
    if (waist.length !== 12 || widths.length !== 12 || jet.length !== 12)
      throw new Error(
        "This epoch requires the actual canonical twelve-span waist and full J",
      );
    const out: M.Span[] = [],
      ws: number[] = [],
      js: M.Span[] = [];
    waist.forEach((span: M.Span, i: number): void => {
      const count: number =
        i === 3 || i === 4 ? (epoch === "interior-v17" ? 3 : 2) : 1;
      out.push(
        ...M.partition(
          span,
          new Array(count).fill(1),
          epoch === "interior-v17",
        ),
      );
      js.push(
        ...M.partition(
          jet[i]!,
          new Array(count).fill(1),
          epoch === "interior-v17",
        ),
      );
      ws.push(...new Array(count).fill(widths[i]! / count));
    });
    return { spans: out, widths: ws, jet: js };
  }

  /** Recover the original twelve-span chart from the known epoch subdivisions using endpoint coefficients and width-scaled endpoint handles. Inputs must originate from that compatible subdivision; this is not a fit of arbitrary curves.
   */
  export function coalesce(
    controls: readonly M.Span[],
    widths: readonly number[],
    epoch: P.Epoch,
  ): M.Span[] {
    const groups: number[][] =
      epoch === "interior-v17"
        ? [
            [0],
            [1],
            [2],
            [3, 4, 5],
            [6, 7, 8],
            [9],
            [10],
            [11],
            [12],
            [13],
            [14],
            [15],
          ]
        : [
            [0],
            [1],
            [2],
            [3, 4],
            [5, 6],
            [7],
            [8],
            [9],
            [10],
            [11],
            [12],
            [13],
          ];
    return groups.map((group: number[]): M.Span => {
      if (group.length === 1)
        return controls[group[0]!]!.map(M.clone) as M.Span;
      const first: M.Span = controls[group[0]!]!,
        last: M.Span = controls[group.at(-1)!]!;
      const total: number = group.reduce(
        (s: number, i: number): number => s + widths[i]!,
        0,
      );
      return [
        M.clone(first[0]),
        M.add(
          first[0],
          M.scale(M.sub(first[1], first[0]), total / widths[group[0]!]!),
        ),
        M.add(
          last[3],
          M.scale(M.sub(last[2], last[3]), total / widths[group.at(-1)!]!),
        ),
        M.clone(last[3]),
      ];
    });
  }

  /** Build one merged XZ course at its physical height, deriving anterior X from the shared fan and handles from the angular chart. R6b applies optional arch recesses; V17 requires ordered inner/outer anterior supports and preserves their tangent slopes.
   */
  export function station(
    p: P.Input,
    station: P.MergedStation,
    widths: number[],
    fan: Fan,
    epoch: P.Epoch,
  ): M.Span[] {
    const [x, y, z]: M.V = p.frame.origin_mm,
      cy: number = y + station.heightFromFrame_mm,
      cx: number = x + station.centerLateralFromFrame_mm;
    const wl: number = station.leftHalfBreadth_mm,
      wr: number = station.rightHalfBreadth_mm;
    const dx: number[] = [
      wl,
      0,
      0,
      0,
      -wr,
      -wr * p.lanes.posterior[1],
      0,
      wl * p.lanes.posterior[0],
    ];
    const dz: number[] = [
      station.leftLateralFrontOffset_mm,
      station.leftAnteriorFrontOffset_mm,
      station.medianFrontOffset_mm,
      station.rightAnteriorFrontOffset_mm,
      station.rightLateralFrontOffset_mm,
      station.rightPosteriorFrontOffset_mm,
      station.medianPosteriorFrontOffset_mm,
      station.leftPosteriorFrontOffset_mm,
    ];
    const points: M.V[] = dx.map(
      (v: number, i: number): M.V => [cx + v, cy, z + dz[i]!],
    );
    const medianX: number = x + p.frame.medianLateralFromOrigin_mm;
    points[2]![0] = medianX;
    points[6]![0] = medianX;
    points[1]![0] = fanValue(fan, cy, "left");
    points[3]![0] = fanValue(fan, cy, "right");
    const groups: number[] =
      epoch === "interior-v17"
        ? [3, 3, 3, 3, 1, 1, 1, 1]
        : [3, 2, 2, 3, 1, 1, 1, 1];
    const starts: number[] = [0];
    groups.forEach((n: number): void => {
      starts.push(starts.at(-1)! + n);
    });
    const baseWidths: number[] = groups.map((_g: number, i: number): number =>
      widths
        .slice(starts[i], starts[i + 1])
        .reduce((s: number, w: number): number => s + w, 0),
    );

    /** Periodic scalar PCHIP over the supplied angular widths, using one wrapped neighbor on each end. Returns one-third angular derivatives so multiplying by a span width produces a cubic handle offset.
     */
    const angular: M.V[] = M.angular(points, baseWidths).map(
      (v: M.V, i: number): M.V =>
        M.scale(v, p.sectionRounding[[0, 1, 2, 1, 0, 3, 4, 3][i]!]!),
    );
    const controls: M.Span[] = M.spans(points, angular, baseWidths).flatMap(
      (span: M.Span, i: number): M.Span[] =>
        M.partition(
          span,
          widths.slice(starts[i], starts[i + 1]),
          epoch === "interior-v17",
        ),
    );
    if (epoch === "external-r6b") {
      if (station.anteriorArchRecess_mm !== undefined)
        for (const [side, node] of [
          ["left", 4],
          ["right", 6],
        ] as const) {
          const delta: number = station.anteriorArchRecess_mm[side];
          controls[node - 1]![2][2] += delta;
          controls[node - 1]![3][2] += delta;
          controls[node]![0][2] += delta;
          controls[node]![1][2] += delta;
        }
      return controls;
    }
    if (
      station.innerAnteriorSupport === undefined ||
      station.outerAnteriorTransition === undefined
    )
      throw new Error("The V17 inner-front support measurements are required");
    const pp: M.V[] = controls.map((s: M.Span): M.V => M.clone(s[0]));
    const hh: M.V[] = controls.map(
      (s: M.Span, i: number): M.V => M.scale(M.sub(s[1], s[0]), 1 / widths[i]!),
    );
    const mx: number = pp[6]![0];
    for (const [side, lane, inner, outer] of [
      ["left", 3, 5, 4],
      ["right", 9, 7, 8],
    ] as const) {
      const ratio: number =
        station.innerAnteriorSupport[side].lateralFractionMedianToAnteriorLane!;
      const tr: number =
        ratio +
        (1 - ratio) *
          station.outerAnteriorTransition[side]
            .lateralFractionInnerToAnteriorLane!;
      if (!(0 < ratio && ratio < tr && tr < 1))
        throw new Error("Ordered semantic anterior widths required");
      pp[inner]![0] = mx + ratio * (pp[lane]![0] - mx);
      pp[outer]![0] = mx + tr * (pp[lane]![0] - mx);
      pp[inner]![2] =
        z + station.innerAnteriorSupport[side].frontOffsetFromFrame_mm!;
      pp[outer]![2] = (pp[inner]![2] + pp[lane]![2]) / 2;
    }
    const kappa: number = (4 * (Math.sqrt(2) - 1)) / 3;
    const tx: number[] = pp.map((): number => 0);
    for (let n: number = 3; n < 10; n++)
      tx[n] =
        -kappa *
        Math.min(
          (pp[n - 1]![0] - pp[n]![0]) / widths[n - 1]!,
          (pp[n]![0] - pp[n + 1]![0]) / widths[n]!,
        );
    hh[3] = [-Math.min(-hh[3]![0], -tx[3]!), 0, 0];
    hh[9] = [-Math.min(-hh[9]![0], -tx[9]!), 0, 0];
    hh[6] = [tx[6]!, 0, 0];
    for (const [side, n, kind] of [
      ["left", 4, "outerAnteriorTransition"],
      ["left", 5, "innerAnteriorSupport"],
      ["right", 7, "innerAnteriorSupport"],
      ["right", 8, "outerAnteriorTransition"],
    ] as const) {
      const t: number =
        kind === "outerAnteriorTransition" ? tx[n]! : tx[n]! / (3 * kappa);
      hh[n] = [t, 0, t * station[kind]![side].depthSlope_dZ_dX];
    }
    const result: M.Span[] = M.spans(pp, hh, widths);
    for (const start of [0, 9]) {
      const end: number = start + 3;
      const ws: number[] = widths.slice(start, end);
      const total: number = ws.reduce(
        (s: number, w: number): number => s + w,
        0,
      );
      const coarse: M.Span = [
        pp[start]!,
        M.add(pp[start]!, M.scale(hh[start]!, total)),
        M.sub(pp[end]!, M.scale(hh[end]!, total)),
        pp[end]!,
      ];
      result.splice(start, 3, ...M.partition(coarse, ws, true));
    }
    return result;
  }
}
