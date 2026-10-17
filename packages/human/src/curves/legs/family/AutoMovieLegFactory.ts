import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { AutoMovieLegFamily } from "./AutoMovieLegFamily";
import type { IAutoMovieLegMeasurements as M } from "./IAutoMovieLegMeasurements";

/**
 * Construct two leg families from physical dimensions and pelvis-owned cuts.
 * The assembly supplies exact proximal P/fullJ. Straight rest converts source
 * height into the current bone-length chart; the horizontal diagnostic exists
 * only for calibration comparisons and does not support bent-leg conversion.
 *
 * @author Samchon
 */
export class AutoMovieLegFactory implements R.Factory {
  /** Assembly owner key for the leg groups and their two ankle operators. */
  public readonly region: string = "legs";

  /** Caller dimensions copied once so later caller edits cannot change the recipe. */
  private readonly detailed: M.Detailed;

  /** Source-height diagnostic or the actual straight-rest bone-length chart. */
  private readonly chart: M.Chart;

  /** Optional assembly namespace applied consistently to both boundary IDs. */
  private readonly prefix: string;

  /** Copy and validate physical course dimensions before any parent placement. */
  public constructor(
    detailed: M.Detailed,
    options: {
      /** Omitted means straight rest; the diagnostic chart retains source height. */
      chart?: M.Chart;

      /** Optional boundary-ID prefix, followed by a colon; empty means no prefix. */
      namespace?: string;
    } = {},
  ) {
    this.detailed = structuredClone(detailed);
    this.chart = options.chart ?? "straight-rest";
    if (!["straight-rest", "source-horizontal-diagnostic"].includes(this.chart))
      throw new Error("Unknown leg construction chart");
    this.prefix = options.namespace ? options.namespace + ":" : "";
    AutoMovieLegFactory.validate(this.detailed);
  }

  /**
   * Emit both legs' resolved courses and longitudinal guides, plus the two
   * ankle P/fullJ operators owned by the lower-leg bones. All geometry is world
   * millimetres; upstream thigh operators must already be bound by the assembly.
   */
  public construct(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result {
    const families: ReadonlyMap<"left" | "right", AutoMovieLegFamily> =
      this.families(context, upstream);
    const groups: R.Result["groups"][number][] = [];
    const boundaries: R.Result["boundaries"][number][] = [];
    for (const [side, family] of families) {
      groups.push({ part: "leg", side, primitives: family.curves(side) });
      boundaries.push({
        bone: side + "LowerLeg",
        value: family.boundary(this.prefix + side + ".ankle.midTube"),
      });
    }
    return { groups, boundaries };
  }

  /**
   * Resolve the actual continuous fields from exactly two canonical thigh cuts.
   * Each cut must have four quarter-turn spans, complete physical J and a +Y
   * chart travelling with its proper upper-leg frame. Unsupported cardinal
   * geometry, chart mismatch or a bent straight-rest chain throws.
   */
  public families(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReadonlyMap<"left" | "right", AutoMovieLegFamily> {
    if (upstream.size !== 2)
      throw new Error("Two actual pelvis-owned thigh operators required");
    const families: Map<"left" | "right", AutoMovieLegFamily> = new Map();
    for (const side of ["left", "right"] as const) {
      const id: string = this.prefix + side + ".thigh.midTube";
      const proximal: C.Boundary | undefined = upstream.get(id);
      if (
        proximal === undefined ||
        proximal.id !== id ||
        proximal.section.name !== id ||
        proximal.section.type !== "cubicBezier" ||
        !proximal.section.closed ||
        proximal.section.unit !== "mm" ||
        proximal.section.phaseUnit !== "turn" ||
        proximal.longitudinalUnit !== "mm" ||
        proximal.section.spans.length !== 4 ||
        proximal.fullJ.length !== 4 ||
        proximal.section.phaseIntervals.length !== 4 ||
        proximal.section.phaseIntervals.some((x: number): boolean => x !== 0.25)
      )
        throw new Error(
          "Uniform four-span, one-turn physical thigh operator required",
        );
      const numbers: number[] = [
        ...proximal.section.spans.flat(2),
        ...proximal.fullJ.flat(2),
        ...proximal.longitudinalAxis,
      ];
      if (
        !numbers.every(Number.isFinite) ||
        [...proximal.section.spans, ...proximal.fullJ].some(
          (span: C.Span): boolean =>
            span.length !== 4 ||
            span.some((v: C.Vector): boolean => v.length !== 3),
        )
      )
        throw new Error(
          "Finite full thigh section and longitudinal control field required",
        );
      const axis: C.Vector = context.inverseDirection(
        side + "UpperLeg",
        proximal.longitudinalAxis,
      );
      // Dimensionless binary64 frame-composition allowance, not a skin-fit or
      // clinical positional tolerance. The same chart must accompany full J.
      if (
        axis.some(
          (x: number, k: number): boolean =>
            Math.abs(x - (k === 1 ? 1 : 0)) > 128 * Number.EPSILON,
        )
      )
        throw new Error(
          "The proximal longitudinal chart must travel with the actual leg frame",
        );
      families.set(
        side,
        new AutoMovieLegFamily(
          context,
          this.detailed,
          proximal,
          side,
          this.chart,
        ),
      );
    }
    return families;
  }
  /** Check finite registration, proper source gauge and ordered semantic courses. */
  private static validate(d: M.Detailed): void {
    const g: M.Calibration = d.calibration;
    if (
      [
        ...g.sourceBoneArcLengthsMm.left,
        ...g.sourceBoneArcLengthsMm.right,
      ].some((x: number): boolean => !Number.isFinite(x) || x <= 0) ||
      g.sourceBoneArcLengthsMm.left.length !== 2 ||
      g.sourceBoneArcLengthsMm.right.length !== 2
    )
      throw new Error("Positive measured bilateral bone arc lengths required");
    const vectors: readonly (readonly number[])[] = [
      g.sourceHipToKneeMm,
      g.sourceHipToAnkleMm,
      g.sourceFrameOriginFromHipMm,
      ...g.sourceFrameBasisColumns,
      g.sourceOriginRelativeToProximalCutMm,
    ];
    if (
      vectors.some(
        (v: readonly number[]): boolean =>
          v.length !== 3 || !v.every(Number.isFinite),
      ) ||
      !g.sourceRangeYFromHipMm.every(Number.isFinite) ||
      g.sourceRangeYFromHipMm.length !== 2 ||
      !(
        g.sourceHipToKneeMm[1] < 0 &&
        g.sourceHipToAnkleMm[1] < g.sourceHipToKneeMm[1]
      ) ||
      !(
        g.sourceRangeYFromHipMm[0] < g.sourceRangeYFromHipMm[1] &&
        g.sourceRangeYFromHipMm[1] <= 0 &&
        g.sourceRangeYFromHipMm[0] >= g.sourceHipToAnkleMm[1]
      )
    )
      throw new Error("Finite descending source measurement gauge required");
    const basis: C.Matrix = g.sourceFrameBasisColumns;
    // Dot-product roundoff is checked in a dimensionless proper source gauge.
    for (let i: number = 0; i < 3; i++)
      for (let j: number = 0; j < 3; j++) {
        const dot: number = basis[i]!.reduce(
          (s: number, x: number, k: number): number => s + x * basis[j]![k]!,
          0,
        );
        if (Math.abs(dot - (i === j ? 1 : 0)) > 128 * Number.EPSILON)
          throw new Error("Proper source registration gauge required");
      }
    const det: number =
      basis[0][0] * (basis[1][1] * basis[2][2] - basis[1][2] * basis[2][1]) -
      basis[0][1] * (basis[1][0] * basis[2][2] - basis[1][2] * basis[2][0]) +
      basis[0][2] * (basis[1][0] * basis[2][1] - basis[1][1] * basis[2][0]);
    if (det <= 0 || Math.abs(basis[1][1]) < Number.EPSILON)
      throw new Error("Resolved proper source height gauge required");
    const names: readonly M.StationName[] = [
      "thighLower",
      "aboveKnee",
      "kneeNative",
      "belowKnee",
      "calfNative",
      "lowerCalf",
      "ankleAbove",
    ];
    const allowed: readonly M.StationName[] = [
      ...names,
      "vastusLateralisProxy",
      "vastusMedialisProxy",
      "patellaInferior",
      "calfLateralProxy",
      "calfMedialProxy",
    ];
    const required: M.StationName[] = d.stations
      .map((row: M.Station): M.StationName => row.name)
      .filter((name: M.StationName): boolean => names.includes(name));
    if (
      d.stations.length < names.length ||
      d.stations.length > allowed.length ||
      required.some(
        (name: M.StationName, i: number): boolean => name !== names[i],
      ) ||
      required.length !== names.length ||
      new Set(d.stations.map((row: M.Station): M.StationName => row.name))
        .size !== d.stations.length
    )
      throw new Error(
        "Ordered mandatory courses and unique optional feature courses required",
      );
    for (let i: number = 0; i < d.stations.length; i++) {
      const row: M.Station = d.stations[i]!;
      const values: number[] = [
        row.sourceFractionProximalToDistal,
        row.breadthMm,
        row.depthMm,
        ...row.centerSourceFrameTransverseMm,
        row.outerSagittalPhase,
        row.anteriorLateralPhase,
        row.innerSagittalPhase,
        row.posteriorLateralPhase,
        ...row.roundingHandleMm,
        ...(row.physicalSupportDerivatives ?? []),
        ...(row.physicalPoleDerivatives?.flat() ?? []),
        ...(row.physicalHandleDerivatives ?? []),
      ];
      if (
        !allowed.includes(row.name) ||
        !values.every(Number.isFinite) ||
        row.breadthMm <= 0 ||
        row.depthMm <= 0 ||
        row.centerSourceFrameTransverseMm.length !== 2 ||
        row.roundingHandleMm.length !== 4 ||
        row.roundingHandleMm.some((x: number): boolean => x <= 0) ||
        [
          row.outerSagittalPhase,
          row.anteriorLateralPhase,
          row.innerSagittalPhase,
          row.posteriorLateralPhase,
        ].some((x: number): boolean => Math.abs(x) >= 1) ||
        !(
          row.sourceFractionProximalToDistal >
            (i === 0 ? 0 : d.stations[i - 1]!.sourceFractionProximalToDistal) &&
          row.sourceFractionProximalToDistal <= 1
        ) ||
        (i < d.stations.length - 1 &&
          row.physicalSupportDerivatives?.length !== 4 &&
          row.physicalPoleDerivatives === undefined) ||
        (row.physicalPoleDerivatives !== undefined &&
          (row.physicalPoleDerivatives.length !== 4 ||
            row.physicalPoleDerivatives.some(
              (v: C.Vector): boolean => v.length !== 3 || v[1] !== 1,
            ))) ||
        (row.physicalHandleDerivatives !== undefined &&
          row.physicalHandleDerivatives.length !== 4)
      )
        throw new Error(
          "Ordered finite named leg dimensions and complete physical derivatives required",
        );
    }
    if (d.stations.at(-1)!.sourceFractionProximalToDistal !== 1)
      throw new Error(
        "The ankle cut must terminate the declared physical range",
      );
  }
}
