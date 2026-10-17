import {
  type AutoMovieCurveParentContext,
  AutoMoviePchip64,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieLegMeasurements as M } from "./IAutoMovieLegMeasurements";

/**
 * Continuous cardinal-support and shared-handle fields for one leg.
 * All transverse courses, longitudinal guides and endpoint P/fullJ evaluate
 * these same cubic Hermite fields. Source derivatives are converted into the
 * longitudinal bone chart before proper parent placement; right chirality is
 * represented separately from the proper parent frame.
 *
 * @author Samchon
 */
export class AutoMovieLegFamily {
  /** Ordered course coordinates, mm in the upper-leg longitudinal chart; queries retain this chart after world placement. */
  public readonly heights: readonly number[];

  /** Semantic course labels in the same order as heights; extra mass courses are conventional proxies. */
  private readonly courseNames: readonly string[];

  /** Twelve world-coordinate support fields: four cardinal poles times XYZ. */
  private readonly p: readonly AutoMoviePchip64[];

  /** Four shared tangent-handle lengths in mm over the same physical chart. */
  private readonly h: readonly AutoMoviePchip64[];

  /** Unit pole tangents after explicit side chirality and proper parent rotation. */
  private readonly tangents: readonly C.Vector[];

  /** World direction for increasing proximal longitudinal millimetres. */
  private readonly axis: C.Vector;

  /** Positive-side outer/front/inner/back tangent directions in the local gauge. */
  private static readonly tangent: readonly C.Vector[] = [
    [0, 0, 1],
    [-1, 0, 0],
    [0, 0, -1],
    [1, 0, 0],
  ];

  /**
   * Clamp the proximal support/handle values and complete physical derivatives
   * to the actual owner. Seed remaining derivatives locally, then transport
   * their vectors through the proper parent before world Hermite construction.
   * The supported cut must belong to this fixed-cardinal shared-handle family.
   */
  public constructor(
    context: AutoMovieCurveParentContext,
    detailed: M.Detailed,
    proximal: C.Boundary,
    side: "left" | "right",
    chart: M.Chart,
  ) {
    const bone: string = side + "UpperLeg";
    const sign: number = side === "left" ? 1 : -1;
    const normalize: (v: C.Vector) => C.Vector = (v: C.Vector): C.Vector => [
      sign * v[0],
      v[1],
      v[2],
    ];
    const owner: C.Span[] = proximal.section.spans.map(
      (span: C.Span): C.Span =>
        span.map(
          (v: C.Vector): C.Vector => normalize(context.inversePoint(bone, v)),
        ) as unknown as C.Span,
    );
    const ownerJ: C.Span[] = proximal.fullJ.map(
      (span: C.Span): C.Span =>
        span.map(
          (v: C.Vector): C.Vector =>
            normalize(context.inverseDirection(bone, v)),
        ) as unknown as C.Span,
    );
    const origin: C.Vector = [
      (owner[0]![0][0] + owner[2]![0][0]) / 2,
      owner[0]![0][1],
      (owner[1]![0][2] + owner[3]![0][2]) / 2,
    ];
    const gauge: M.Calibration = detailed.calibration;
    const knee: C.Vector = context.inversePoint(
      bone,
      context.point(side + "LowerLeg", [0, 0, 0]),
    );
    const ankle: C.Vector = context.inversePoint(
      bone,
      context.point(side + "Foot", [0, 0, 0]),
    );
    const actualUpper: number = -knee[1];
    const actualLower: number = knee[1] - ankle[1];
    // The inherited native recipe is positive-side calibration. Scale it by
    // each actual side's current/source bone growth, not by a fitted residual.
    const upper: number =
      (actualUpper * gauge.sourceBoneArcLengthsMm.left[0]) /
      gauge.sourceBoneArcLengthsMm[side][0];
    const lower: number =
      (actualLower * gauge.sourceBoneArcLengthsMm.left[1]) /
      gauge.sourceBoneArcLengthsMm[side][1];
    if (chart === "straight-rest") {
      const scale: number = Math.max(
        1,
        Math.abs(actualUpper),
        Math.abs(actualLower),
      );
      // Scale the binary64 allowance by limb length for point subtraction;
      // this does not authorize an articulated or deliberately bent chain.
      if (
        !(actualUpper > 0 && actualLower > 0) ||
        [knee[0], knee[2], ankle[0], ankle[2]].some(
          (x: number): boolean => Math.abs(x) > 128 * Number.EPSILON * scale,
        )
      )
        throw new Error(
          "Straight descending rest bone chain required; bent-leg conversion is unproven",
        );
      for (const child of [side + "LowerLeg", side + "Foot"]) {
        const actual: C.Vector = context.inverseDirection(
          bone,
          context.direction(child, [0, 1, 0]),
        );
        if (
          actual.some(
            (x: number, i: number): boolean =>
              Math.abs(x - (i === 1 ? 1 : 0)) > 128 * Number.EPSILON,
          )
        )
          throw new Error("One straight rest longitudinal chart is required");
      }
    }
    const highSource: number = gauge.sourceRangeYFromHipMm[1];
    const lowSource: number = gauge.sourceRangeYFromHipMm[0];
    const sourceProximalBone: C.Vector = AutoMovieLegFamily.sourceChart(
      gauge,
      highSource,
      upper,
      lower,
    ).source;
    const sourceCut: C.Vector = AutoMovieLegFamily.minus(
      gauge.sourceFrameOriginFromHipMm,
      gauge.sourceOriginRelativeToProximalCutMm,
    );
    const proximalFlesh: C.Vector = AutoMovieLegFamily.minus(
      sourceCut,
      sourceProximalBone,
    );
    const highArc: number = AutoMovieLegFamily.sourceChart(
      gauge,
      highSource,
      upper,
      lower,
    ).arc;
    const supports: C.Vector[][] = [
      owner.map((span: C.Span): C.Vector => span[0]),
    ];
    const handles: number[][] = [
      owner.map((span: C.Span): number =>
        Math.hypot(...AutoMovieLegFamily.minus(span[1], span[0])),
      ),
    ];
    const ys: number[] = [origin[1]];
    const convertedSlopes: (M.Four | undefined)[] = [undefined];
    const completeSlopes: (readonly C.Vector[] | undefined)[] = [undefined];
    const handleSlopes: (M.Four | undefined)[] = [undefined];
    for (const row of detailed.stations) {
      const sourceY: number =
        highSource -
        row.sourceFractionProximalToDistal * (highSource - lowSource);
      const source: ReturnType<typeof AutoMovieLegFamily.sourceChart> =
        AutoMovieLegFamily.sourceChart(gauge, sourceY, upper, lower);
      const y: number =
        origin[1] -
        (chart === "straight-rest"
          ? source.arc - highArc
          : highSource - sourceY);
      let center: C.Vector;
      if (chart === "straight-rest") {
        const raw: C.Vector = AutoMovieLegFamily.sourceCenter(
          row,
          gauge.sourceFrameOriginFromHipMm,
          gauge.sourceFrameBasisColumns,
          sourceY,
        );
        const flesh: C.Vector = AutoMovieLegFamily.minus(raw, source.source);
        center = [
          origin[0] + flesh[0] - proximalFlesh[0],
          y,
          origin[2] + flesh[2] - proximalFlesh[2],
        ];
      } else
        center = AutoMovieLegFamily.sourceCenter(
          row,
          AutoMovieLegFamily.plus(
            origin,
            gauge.sourceOriginRelativeToProximalCutMm,
          ),
          gauge.sourceFrameBasisColumns,
          y,
        );
      const w: number = row.breadthMm / 2;
      const d: number = row.depthMm / 2;
      supports.push([
        [center[0] + w, y, center[2] + d * row.outerSagittalPhase],
        [center[0] + w * row.anteriorLateralPhase, y, center[2] + d],
        [center[0] - w, y, center[2] + d * row.innerSagittalPhase],
        [center[0] + w * row.posteriorLateralPhase, y, center[2] - d],
      ]);
      handles.push([...row.roundingHandleMm]);
      ys.push(y);
      // Remove the bone centre's source-height drift, then divide by the
      // positive dYrest/dYsource scale. Distal arc itself has the opposite sign.
      // The result is the flesh support derivative per proximal rest millimetre.
      convertedSlopes.push(
        row.physicalSupportDerivatives === undefined
          ? undefined
          : (row.physicalSupportDerivatives.map(
              (x: number, i: number): number =>
                chart === "straight-rest"
                  ? (x - source.derivative[i % 2 === 0 ? 0 : 2]) /
                    source.heightScale
                  : x,
            ) as unknown as M.Four),
      );
      completeSlopes.push(
        row.physicalPoleDerivatives?.map(
          (v: C.Vector): C.Vector =>
            v.map((x: number, k: number): number =>
              k === 1
                ? 1
                : chart === "straight-rest"
                  ? (x - source.derivative[k]!) / source.heightScale
                  : x,
            ) as unknown as C.Vector,
        ),
      );
      handleSlopes.push(
        row.physicalHandleDerivatives?.map((x: number): number =>
          chart === "straight-rest" ? x / source.heightScale : x,
        ) as unknown as M.Four | undefined,
      );
    }
    if (
      ys.some(
        (y: number, i: number): boolean =>
          !Number.isFinite(y) || (i > 0 && y >= ys[i - 1]!),
      )
    )
      throw new Error("Leg courses must descend in physical chart order");
    this.heights = ys;
    this.courseNames = [
      "thighNative",
      ...detailed.stations.map((row: M.Station): string => row.name),
    ];
    const xs: number[] = [...ys].reverse();
    // PCHIP is componentwise and nonlinear: resolve its seeds in the native
    // local support chart, then rotate the resulting jets before Hermite.
    const slopes: number[][] = Array.from(
      { length: 12 },
      (_: unknown, k: number): number[] =>
        AutoMoviePchip64.slopes(
          xs,
          [...supports]
            .reverse()
            .map((p: C.Vector[]): number => p[Math.floor(k / 3)]![k % 3]!),
        ),
    );
    const hSlopes: number[][] = Array.from(
      { length: 4 },
      (_: unknown, k: number): number[] =>
        AutoMoviePchip64.slopes(
          xs,
          [...handles].reverse().map((h: number[]): number => h[k]!),
        ),
    );
    for (let corner: number = 0; corner < 4; corner++) {
      // The reversed final index is always the proximal owner, including when
      // the public profile inserts optional feature courses.
      for (let k: number = 0; k < 3; k++)
        slopes[corner * 3 + k]![ys.length - 1] = ownerJ[corner]![0][k]!;
      hSlopes[corner]![ys.length - 1] = AutoMovieLegFamily.minus(
        ownerJ[corner]![1],
        ownerJ[corner]![0],
      ).reduce(
        (s: number, v: number, k: number): number =>
          s + v * AutoMovieLegFamily.tangent[corner]![k]!,
        0,
      );
    }
    for (let i: number = 1; i < ys.length - 1; i++) {
      const values: M.Four | undefined = convertedSlopes[i];
      const full: readonly C.Vector[] | undefined = completeSlopes[i];
      const at: number = ys.length - 1 - i;
      if (full !== undefined) {
        for (let corner: number = 0; corner < 4; corner++)
          for (let k: number = 0; k < 3; k++)
            slopes[corner * 3 + k]![at] = full[corner]![k]!;
      } else {
        if (values === undefined)
          throw new Error(
            "Internal courses need their physical support derivatives",
          );
        for (let k: number = 0; k < 4; k++)
          slopes[k * 3 + (k % 2 === 0 ? 0 : 2)]![at] = values[k]!;
      }
      const lengths: M.Four | undefined = handleSlopes[i];
      if (lengths !== undefined)
        for (let k: number = 0; k < 4; k++) hSlopes[k]![at] = lengths[k]!;
    }
    const kappa: number = (4 * (Math.sqrt(2) - 1)) / 3;
    // Quarter-circle kappa on each adjacent minimum support span supplies only
    // the distal handle-slope seed. Supplied station handle lengths stay intact.
    const conventional: number[][] = supports.map((p: C.Vector[]): number[] =>
      [
        Math.min(p[1]![2] - p[0]![2], p[0]![2] - p[3]![2]),
        Math.min(p[0]![0] - p[1]![0], p[1]![0] - p[2]![0]),
        Math.min(p[1]![2] - p[2]![2], p[2]![2] - p[3]![2]),
        Math.min(p[0]![0] - p[3]![0], p[3]![0] - p[2]![0]),
      ].map((x: number): number => kappa * x),
    );
    for (let k: number = 0; k < 4; k++)
      hSlopes[k]![0] = AutoMoviePchip64.slopes(
        xs,
        [...conventional].reverse().map((h: number[]): number => h[k]!),
      )[0]!;
    const distalPoles: readonly C.Vector[] | undefined = completeSlopes.at(-1);
    const distalHandles: M.Four | undefined = handleSlopes.at(-1);
    if (distalPoles !== undefined)
      for (let corner: number = 0; corner < 4; corner++)
        for (let k: number = 0; k < 3; k++)
          slopes[corner * 3 + k]![0] = distalPoles[corner]![k]!;
    if (distalHandles !== undefined)
      for (let k: number = 0; k < 4; k++) hSlopes[k]![0] = distalHandles[k]!;
    const world: C.Vector[][] = supports.map((row: C.Vector[]): C.Vector[] =>
      row.map((v: C.Vector): C.Vector => context.point(bone, normalize(v))),
    );
    const pFields: AutoMoviePchip64[] = [];
    for (let corner: number = 0; corner < 4; corner++) {
      const localD: C.Vector[] = xs.map(
        (_: number, i: number): C.Vector => [
          slopes[corner * 3]![i]!,
          slopes[corner * 3 + 1]![i]!,
          slopes[corner * 3 + 2]![i]!,
        ],
      );
      const worldD: C.Vector[] = localD.map(
        (v: C.Vector): C.Vector => context.direction(bone, normalize(v)),
      );
      for (let k: number = 0; k < 3; k++)
        pFields.push(
          new AutoMoviePchip64(
            xs,
            [...world].reverse().map((p: C.Vector[]): number => p[corner]![k]!),
            worldD.map((v: C.Vector): number => v[k]!),
          ),
        );
    }
    this.p = pFields;
    this.h = Array.from(
      { length: 4 },
      (_: unknown, k: number): AutoMoviePchip64 =>
        new AutoMoviePchip64(
          xs,
          [...handles].reverse().map((h: number[]): number => h[k]!),
          hSlopes[k]!,
        ),
    );
    this.tangents = AutoMovieLegFamily.tangent.map(
      (v: C.Vector): C.Vector => context.direction(bone, normalize(v)),
    );
    this.axis = context.direction(bone, [0, 1, 0]);
    const regenerated: C.Span[] = this.section(ys[0]!);
    const regeneratedJ: C.Span[] = this.section(ys[0]!, true);
    // Replay every owner control and full J with arithmetic-relative allowances.
    // A non-cardinal owner is rejected instead of being approximated or reshaped.
    for (let i: number = 0; i < 4; i++)
      for (let j: number = 0; j < 4; j++)
        for (let k: number = 0; k < 3; k++) {
          const expected: number = proximal.section.spans[i]![j]![k]!;
          const expectedJ: number = proximal.fullJ[i]![j]![k]!;
          if (
            Math.abs(regenerated[i]![j]![k]! - expected) >
              256 * Number.EPSILON * Math.max(1, Math.abs(expected)) ||
            Math.abs(regeneratedJ[i]![j]![k]! - expectedJ) >
              512 * Number.EPSILON * Math.max(1, Math.abs(expectedJ))
          )
            throw new Error(
              "Proximal operator is outside the shared cardinal support/handle family",
            );
        }
  }

  /**
   * Return four world cubic spans at a longitudinal height in the closed range.
   * With derivative=true, every returned control is dP/d(proximal mm), including
   * handle variation. Both forms evaluate the same support and handle fields.
   */
  public section(height: number, derivative: boolean = false): C.Span[] {
    const p: C.Vector[] = Array.from(
      { length: 4 },
      (_: unknown, i: number): C.Vector => [
        this.p[i * 3]!.at(height, derivative),
        this.p[i * 3 + 1]!.at(height, derivative),
        this.p[i * 3 + 2]!.at(height, derivative),
      ],
    );
    const h: number[] = this.h.map((field: AutoMoviePchip64): number =>
      field.at(height, derivative),
    );
    return p.map((v: C.Vector, i: number): C.Span => {
      const j: number = (i + 1) % 4;
      return [
        v,
        v.map(
          (x: number, k: number): number => x + this.tangents[i]![k]! * h[i]!,
        ) as unknown as C.Vector,
        p[j]!.map(
          (x: number, k: number): number => x - this.tangents[j]![k]! * h[j]!,
        ) as unknown as C.Vector,
        p[j]!,
      ];
    });
  }

  /**
   * Publish the distal ankle cut, or the proximal thigh cut when requested.
   * The result carries actual P/fullJ, quarter-turn phase widths and world axis.
   * The assembly owns ID admission and binding to the neighboring region.
   */
  public boundary(id: string, proximal: boolean = false): C.Boundary {
    const y: number = proximal ? this.heights[0]! : this.heights.at(-1)!;
    return {
      id,
      section: {
        type: "cubicBezier",
        name: id,
        closed: true,
        unit: "mm",
        phaseUnit: "turn",
        phaseIntervals: [0.25, 0.25, 0.25, 0.25],
        spans: this.section(y),
      },
      fullJ: this.section(y, true),
      longitudinalUnit: "mm",
      longitudinalAxis: this.axis,
    };
  }

  /**
   * Emit the resolved closed courses and exact longitudinal Hermite guides.
   * Guides evaluate cardinal phases and half-quarter phases of this same field;
   * their anatomical labels are broad direction cues, not muscle boundaries.
   * Closed phases use turns; descending open spans carry positive mm widths.
   */
  public curves(side: "left" | "right"): C.Cubic[] {
    const curves: C.Cubic[] = this.heights.map(
      (y: number, i: number): C.Cubic => ({
        type: "cubicBezier",
        name: "legs." + side + ".section." + this.courseNames[i]!,
        closed: true,
        unit: "mm",
        phaseUnit: "turn",
        phaseIntervals: [0.25, 0.25, 0.25, 0.25],
        spans: this.section(y),
      }),
    );
    const labels: string[] = [
      "lateralThighToFibularSide",
      "anteriorQuadricepsToShin",
      "medialThighToMedialCalf",
      "posteriorHamstringToCalf",
    ];
    for (let q: number = 0; q < 4; q++)
      for (const t of [0, 0.5]) {
        const spans: C.Span[] = [];
        for (let i: number = 0; i < this.heights.length - 1; i++) {
          const a: number = this.heights[i]!;
          const b: number = this.heights[i + 1]!;
          const p: C.Vector = AutoMovieLegFamily.bezier(this.section(a)[q]!, t);
          const z: C.Vector = AutoMovieLegFamily.bezier(this.section(b)[q]!, t);
          const dp: C.Vector = AutoMovieLegFamily.bezier(
            this.section(a, true)[q]!,
            t,
          );
          const dz: C.Vector = AutoMovieLegFamily.bezier(
            this.section(b, true)[q]!,
            t,
          );
          // J is per increasing longitudinal mm. This guide travels downward,
          // so its signed integration step is negative although phase width >0.
          spans.push([
            p,
            p.map(
              (x: number, k: number): number => x + (dp[k]! * (b - a)) / 3,
            ) as unknown as C.Vector,
            z.map(
              (x: number, k: number): number => x - (dz[k]! * (b - a)) / 3,
            ) as unknown as C.Vector,
            z,
          ]);
        }
        const append: (name: string, first: string, last: string) => void = (
          name: string,
          first: string,
          last: string,
        ): void => {
          const start: number = this.courseNames.indexOf(first);
          const end: number = this.courseNames.indexOf(last);
          if (start < 0 || end <= start)
            throw new Error("Resolved anatomical guide range required");
          curves.push({
            type: "cubicBezier",
            name: "legs." + side + "." + name,
            closed: false,
            unit: "mm",
            phaseUnit: "mm",
            phaseIntervals: this.heights
              .slice(start + 1, end + 1)
              .map(
                (y: number, i: number): number => this.heights[start + i]! - y,
              ),
            spans: spans.slice(start, end),
          });
        };
        if (
          this.courseNames.includes("patellaInferior") &&
          t === 0 &&
          q === 1
        ) {
          // These are actual portions of the same anterior surface meridian,
          // not bone primitives or independently placed anatomical sketches.
          append("anteriorThighSurfaceAxis", "thighNative", "aboveKnee");
          append("patellarSurfaceAxis", "aboveKnee", "patellaInferior");
          append("patellarTendonSurfaceAxis", "patellaInferior", "belowKnee");
          append("tibialAnteriorSurfaceAxis", "belowKnee", "ankleAbove");
        } else if (this.courseNames.includes("patellaInferior") && t === 0.5) {
          const thighNames: readonly string[] = [
            "vastusLateralisSurfaceGuide",
            "vastusMedialisSurfaceGuide",
            "medialHamstringSurfaceGuide",
            "lateralHamstringSurfaceGuide",
          ];
          const shankNames: readonly string[] = [
            "anteriorLateralShinSurfaceGuide",
            "medialShinSurfaceGuide",
            "medialGastrocnemiusSurfaceGuide",
            "lateralGastrocnemiusSurfaceGuide",
          ];
          append(thighNames[q]!, "thighNative", "belowKnee");
          append(shankNames[q]!, "belowKnee", "ankleAbove");
        } else
          curves.push({
            type: "cubicBezier",
            name:
              "legs." + side + "." + (t === 0 ? "cardinal" + q : labels[q]!),
            closed: false,
            unit: "mm",
            phaseUnit: "mm",
            phaseIntervals: this.heights
              .slice(1)
              .map((y: number, i: number): number => this.heights[i]! - y),
            spans,
          });
      }
    return curves;
  }
  /** Source-bone point, positive distal arc and positive dYrest/dYsource scale. */
  private static sourceChart(
    g: M.Calibration,
    y: number,
    upper: number,
    lower: number,
  ): {
    source: C.Vector;
    arc: number;
    derivative: C.Vector;
    heightScale: number;
  } {
    const isUpper: boolean = y >= g.sourceHipToKneeMm[1];
    const a: C.Vector = isUpper ? [0, 0, 0] : g.sourceHipToKneeMm;
    const b: C.Vector = isUpper ? g.sourceHipToKneeMm : g.sourceHipToAnkleMm;
    const drop: number = a[1] - b[1];
    if (!(drop > 0) || y > 0 || y < g.sourceHipToAnkleMm[1])
      throw new Error(
        "Source station is outside its declared descending bone chart",
      );
    const fraction: number = (a[1] - y) / drop;
    return {
      source: a.map(
        (x: number, k: number): number => x + fraction * (b[k]! - x),
      ) as unknown as C.Vector,
      arc: (isUpper ? 0 : upper) + fraction * (isUpper ? upper : lower),
      derivative: a.map(
        (x: number, k: number): number => (x - b[k]!) / drop,
      ) as unknown as C.Vector,
      heightScale: (isUpper ? upper : lower) / drop,
    };
  }
  /** Solve the gauge's longitudinal coordinate so the centre lies at source Y. */
  private static sourceCenter(
    row: M.Station,
    origin: C.Vector,
    basis: C.Matrix,
    y: number,
  ): C.Vector {
    const x: number = row.centerSourceFrameTransverseMm[0];
    const z: number = row.centerSourceFrameTransverseMm[1];
    const longitudinal: number =
      (y - origin[1] - basis[0][1] * x - basis[2][1] * z) / basis[1][1];
    return origin.map(
      (v: number, k: number): number =>
        v + basis[0][k]! * x + basis[1][k]! * longitudinal + basis[2][k]! * z,
    ) as unknown as C.Vector;
  }
  private static plus(a: C.Vector, b: C.Vector): C.Vector {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }
  private static minus(a: C.Vector, b: C.Vector): C.Vector {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  private static bezier(p: C.Span, t: number): C.Vector {
    return [0, 1, 2].map(
      (k: number): number =>
        (1 - t) ** 3 * p[0][k]! +
        3 * (1 - t) ** 2 * t * p[1][k]! +
        3 * (1 - t) * t ** 2 * p[2][k]! +
        t ** 3 * p[3][k]!,
    ) as unknown as C.Vector;
  }
}
