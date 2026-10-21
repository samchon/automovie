import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { HumanHandFrame } from "../internal/HumanHandFrame";
import { HumanHandFeatureKernel } from "./HumanHandFeatureKernel";
import type { HumanThumbContours } from "./HumanThumbContours";

/** Smooth terminal hypothesis retaining an actual generated thumb port and jet.
 * This owner neither changes the shared support budget nor repairs source PL
 * topology. Skin and construction consume the returned analytic family. */
export namespace HumanThumbTerminal {
  /** The exact existing thumb support chart, supplied by its common owner. */
  export interface Chart {
    /** Caller-owned thumb_03 support in world millimetres. */
    originMm: HumanCurve.Vector;
    /** Unit direction from thumb_01 to thumb_03. */
    axis: HumanCurve.Vector;
    /** Existing geometric feature-zero direction. */
    axisU: HumanCurve.Vector;
    /** Existing positive feature-quarter direction, including side orientation. */
    axisV: HumanCurve.Vector;
    /** Actual thumb_01-to-03 support chord, millimetres. */
    thumbChordMm: number;
  }

  /** A root owner supplies geometry and the independent semantic reach budget. */
  export interface Input {
    /** Unique generated region identity. */
    id: string;
    /** The same hand frame consumed by the adjoining thumb and palm. */
    handFrame: HumanHandFrame.Result;
    /** The actual existing thumb_03 boundary object, retained without copying. */
    boundary: HumanThumbContours.Port;
    /** The actual adjoining thumb evaluator restricted to that boundary. */
    boundaryJet: (featurePhase: number) => HumanThumbContours.Jet;
    /** Existing support chart; this method constructs no replacement frame. */
    chart: Chart;
    /** Positive existing hand-circumference dimension, millimetres. */
    handCircumferenceMm: number;
    /** Positive axial reach beyond thumb_03, millimetres; owned by the caller. */
    reachMm: number;
    /** Optional exact d3P/(ds dfeaturePhase2) from the actual boundary owner.
     * Without it, interior angular second jets remain unsupported. */
    boundarySlopePhaseSecondDerivative?: (featurePhase: number) => HumanCurve.Vector;
  }

  /** Explicit observational scope, separate from the smooth terminal hypothesis. */
  export interface Coverage {
    /** Number of preserved original source terminal regions across five digits. */
    originalTerminalRegions: number;
    /** Original regions with a saddle and two distinct terminal maxima. */
    originalMultiplePeakRegions: number;
    /** Actual thumb source sides used by this conditional common fit. */
    fittedThumbSides: number;
    /** True only for the new smooth hypothesis, never a source topology claim. */
    smoothSinglePoleHypothesis: true;
    /** No source material or nail correspondence has been identified. */
    sourceMaterialCorrespondence: false;
  }

  /** One independent terminal family and its unchanged attachment authority. */
  export interface Result {
    /** Sole analytic authority for both skin and visible construction. */
    family: HumanCurveFamily.Family;
    /** The exact input object, including the same four arc objects and dP/ds. */
    boundary: HumanThumbContours.Port;
    /** Explicit collapsed endpoint position; no artificial terminal ring. */
    poleMm: HumanCurve.Vector;
    /** Orientation relative to physical-station derivative cross phase derivative. */
    outwardSign: 1 | -1;
    /** Physical model station domain, ending two axial reaches beyond its start. */
    domainMm: [number, number];
    /** Source observations and the intentionally separate smooth hypothesis. */
    coverage: Coverage;
    /** Unidentified source relations and limits of the conditional fit. */
    limitations: string[];
  }

  /** Generate a boundary-constrained vector terminal, never a source cap.
   * Its quartic longitudinal law retains the caller's P and physical Ds exactly.
   * A quadratic axial approach and a positive common quarter-Hermite first-pole
   * direction give the smooth hypothesis a nonzero limiting tangent plane.
   * Four feature arcs retain the shared quintic kernel and C1 phase joins.
   *
   * Thirty-two regular source contours precede the first critical event; three
   * have unresolved feature ordering. The remaining 29 contours supply 2784
   * corresponding-feature observations. Thirty-two common scalar coefficients
   * fit 2.185 mm RMS and 4.967 mm maximum with measured axial reach supplied.
   * Conditional terminal-only person-held-out maximum is 5.678 mm: the inherited
   * thumb root was fitted to all four people, so this is not end-to-end LOPO.
   * Original cubic Hermite widths, PL contacts and failed fits remain preserved.
   */
  export function build(input: Input): Result {
    const { chart, boundary }: Input = input;
    const G: number = input.handCircumferenceMm, R: number = input.reachMm;
    const ratio: number = R / chart.thumbChordMm;
    const vectors: HumanCurve.Vector[] = [chart.originMm, chart.axis, chart.axisU, chart.axisV,
      input.handFrame.originMm, input.handFrame.longitudinal, input.handFrame.across, input.handFrame.normal];
    if (!input.id || vectors.some((value: HumanCurve.Vector): boolean => !finite(value)) ||
      !(G > 0 && Number.isFinite(G)) || !(R > 0 && Number.isFinite(R)) ||
      !(chart.thumbChordMm > 0 && Number.isFinite(chart.thumbChordMm)) ||
      ratio < 0.3582876309997625 || ratio > 0.4299221364218965 ||
      (input.handFrame.side !== "l" && input.handFrame.side !== "r") ||
      boundary.arcs.length !== 4 || boundary.stationMm !== chart.thumbChordMm ||
      typeof input.boundaryJet !== "function" || typeof boundary.transverseDerivative !== "function")
      throw new Error("Thumb terminal requires the actual thumb_03 port, positive dimensions and an observed axial reach ratio");
    const axes: HumanCurve.Vector[] = [chart.axis, chart.axisU, chart.axisV];
    if (axes.some((axis: HumanCurve.Vector): boolean => Math.abs(dot(axis, axis) - 1) > 1e-10) ||
      Math.abs(dot(chart.axis, chart.axisU)) > 1e-10 || Math.abs(dot(chart.axis, chart.axisV)) > 1e-10 ||
      Math.abs(dot(chart.axisU, chart.axisV)) > 1e-10 ||
      boundary.arcs.some((arc: HumanThumbContours.Port["arcs"][number]): boolean =>
        arc.start !== 0 || arc.end !== 1 || arc.unit !== "normalized-feature-arc"))
      throw new Error("Thumb terminal retains the supplied orthonormal feature chart and the original four arc domains");
    const start: number = boundary.stationMm, width: number = 2 * R, end: number = start + width;
    if (!(end > start && Number.isFinite(end) && width * width > 0 && Number.isFinite(width * width) && G * G > 0 && Number.isFinite(G * G)))
      throw new Error("Thumb terminal dimensions exceed representable physical arithmetic");
    const domainMm: [number, number] = [start, end];
    const offset: HumanCurve.Vector = world([0.026815871822778076 * G, -0.03566486662309388 * G]);
    const poleMm: HumanCurve.Vector = combine([chart.originMm, chart.axis, offset], [1, R, 1]);
    const poleSection: number[] = new Array<number>(28).fill(0);
    const a: number = 0.0725815193626545, b: number = 0.0850111443700928;
    poleSection[0] = a; poleSection[3] = b; poleSection[4] = -a; poleSection[7] = -b;
    poleSection[8] = Math.PI * b / 2; poleSection[10] = Math.PI * b / 2;
    poleSection[9] = Math.PI * a / 2; poleSection[11] = Math.PI * a / 2;
    const limitations: string[] = [
      "Independent smooth thumb terminal candidate; no thenar, web, palm branch or wrist join is supplied",
      "Original PL/C0 terminal contacts do not identify a smooth source tangent plane; the smooth single-pole first jet is an explicit hypothesis",
      "Twenty-eight of forty original five-digit terminal regions contain a saddle and two maxima; this single pole does not reproduce those source topology events",
      "No source material transport, nail, crease or clinical skin-tip landmark correspondence is asserted",
      "Actual root boundary P and physical Ds are retained; source boundary-to-terminal phase transport and transverse source jets remain unidentified",
      "Reach/chord ratio is restricted to 0.3582876309997625..0.4299221364218965; reach semantics and clinical versus support-proxy budgets belong to the caller",
      "Measured-reach conditional fit RMS 2.185 mm, maximum 4.967 mm; terminal-only held-out maximum 5.678 mm is not end-to-end LOPO",
      "Exact-rational Bernstein analysis qualifies the intended common polynomial's local immersion before the pole for the fitted root law; arbitrary replacement roots and floating evaluation are not certified",
      "Global embedding, neighboring-skin compatibility, independent native response and unseen morphology remain unqualified",
      "Four feature arcs are C1; angular second derivatives are one-sided at their joins",
      ...(input.boundarySlopePhaseSecondDerivative === undefined ? ["The boundary owner supplies no Ds-phase-phase jet; interior angular second jets are unsupported"] : []),
    ];
    const evaluate: HumanCurveFamily.Family["jet"] = (s: number, radians: number): HumanCurveFamily.Jet => {
      if (!Number.isFinite(s) || s < start || s > end || !Number.isFinite(radians))
        throw new Error("Thumb terminal evaluation remains inside its physical station domain");
      const remainder: number = radians % (2 * Math.PI);
      const wrapped: number = remainder < 0 ? remainder + 2 * Math.PI : remainder;
      const feature: number = wrapped * 2 / Math.PI;
      const arc: number = Math.floor(feature), phase: number = feature - arc;
      const root: HumanThumbContours.Jet = input.boundaryJet(feature);
      const P: HumanCurve.Vector = boundary.arcs[arc]!.evaluate(phase);
      const D: HumanCurve.Vector = boundary.transverseDerivative(feature);
      const Pp: HumanCurve.Vector = boundary.arcs[arc]!.derivative(phase);
      const B: HumanCurve.Vector = subtract(P, chart.originMm), T: HumanCurve.Vector = subtract(D, chart.axis);
      const k: HumanCurve.Vector[] = [0, 1, 2].map((order: number): HumanCurve.Vector =>
        world(HumanHandFeatureKernel.planar(shape, arc, phase, order)));
      const e: HumanCurve.Vector[] = [0, 1, 2].map((order: number): HumanCurve.Vector =>
        world(HumanHandFeatureKernel.planar(poleSection, arc, phase, order)));
      const t: number = s === end ? 1 : (s - start) / width;
      const weights: readonly (readonly number[])[] = [
        [1, 0, -1, -2, 2], [0, width, -width, -width, width],
        [0, 0, G, -2 * G, G], [0, 0, 0, G, -G],
      ];
      const basis: HumanCurve.Vector[] = [B, T, k[0]!, e[0]!];
      const angular: HumanCurve.Vector[] = [Pp, root.longitudinalPhaseDerivative, k[1]!, e[1]!];
      const factors: number[][] = [0, 1, 2].map((order: number): number[] => weights.map(
        (coefficients: readonly number[]): number => HumanHandFeatureKernel.polynomial(coefficients, t, order) / width ** order));
      const axial: number[] = [R * (2 * t - t * t), 1 - t, -1 / width];
      const drift: number[] = [0, 1, 2].map((order: number): number =>
        HumanHandFeatureKernel.polynomial([0, 0, 4, -4, 1], t, order) / width ** order);
      const scale: number = 2 / Math.PI;
      const value: HumanCurveFamily.Jet = {
        positionMm: s === start ? P : s === end ? [...poleMm] : combine([chart.originMm, chart.axis, offset, ...basis], [1, axial[0]!, drift[0]!, ...factors[0]!]),
        longitudinalDerivative: s === start ? D : combine([chart.axis, offset, ...basis], [axial[1]!, drift[1]!, ...factors[1]!]),
        phaseDerivativeMmPerRadian: scaled(s === start ? Pp : s === end ? [0, 0, 0] : combine(angular, factors[0]!), scale),
        longitudinalPhaseDerivativePerRadian: scaled(s === start ? root.longitudinalPhaseDerivative : combine(angular, factors[1]!), scale),
        longitudinalSecondDerivative: combine([chart.axis, offset, ...basis], [axial[2]!, drift[2]!, ...factors[2]!]),
      };
      if (s === start) value.phaseSecondDerivativeMmPerRadianSquared = scaled(root.phaseSecondDerivative, scale * scale);
      else if (s === end) value.phaseSecondDerivativeMmPerRadianSquared = [0, 0, 0];
      if (input.boundarySlopePhaseSecondDerivative !== undefined) {
        const second: HumanCurve.Vector[] = [root.phaseSecondDerivative, input.boundarySlopePhaseSecondDerivative(feature), k[2]!, e[2]!];
        value.phaseSecondDerivativeMmPerRadianSquared = scaled(combine(second, factors[0]!), scale * scale);
        value.longitudinalPhaseSecondDerivativePerRadianSquared = scaled(combine(second, factors[1]!), scale * scale);
      }
      if (![value.positionMm, value.longitudinalDerivative, value.phaseDerivativeMmPerRadian, value.longitudinalPhaseDerivativePerRadian,
        value.longitudinalSecondDerivative!].every(finite)) throw new Error("Thumb terminal analytic evaluation exceeds finite arithmetic");
      return value;
    };
    // An empty regular descriptor is metadata only: fromFunction evaluates the
    // actual vector authority and performs no radial approximation of the root.
    const principal: HumanCurve.Section[] = [
      { id: input.id + ".root", stationMm: start, originMm: chart.originMm, axisU: chart.axisU, axisV: chart.axisV, coefficientsMm: [] },
      { id: input.id + ".pole", stationMm: end, originMm: poleMm, axisU: chart.axisU, axisV: chart.axisV, coefficientsMm: [0], topology: "pole" },
    ];
    return { family: HumanCurveFamily.fromFunction(principal, evaluate, limitations), boundary, poleMm: [...poleMm],
      outwardSign: input.handFrame.side === "l" ? -1 : 1, domainMm,
      coverage: { originalTerminalRegions: 40, originalMultiplePeakRegions: 28, fittedThumbSides: 8,
        smoothSinglePoleHypothesis: true, sourceMaterialCorrespondence: false }, limitations };

    /** Preserve existing transverse axes without normalizing or correcting them. */
    function world(pair: HumanHandFeatureKernel.Pair): HumanCurve.Vector {
      return combine([chart.axisU, chart.axisV], pair);
    }
  }

  /** Common dimensionless quintic vector correction; no person-indexed records. */
  const shape: readonly number[] = [
    -0.09625172439126603, -0.11311447545825974, 0.13523906294305227, -0.23304196908521368,
    0.16703747252739706, -0.24219459404177066, 0.18141746314091917, -0.016672216391378548,
    -0.4643137156418442, -0.10676518795275693, -0.17491909741543252, -0.15206604198184062,
    0.041591445857815705, -0.008559427216452697, -0.9321754827990697, -0.2898570486397076,
    0.021545578264558073, 0.11935367038039205, 0.009752103851973259, 0.4987624886215936,
    -0.2937227261923471, -0.9791114838023967, -0.11202554944539955, 0.29793590951581894,
    -0.13897605406233554, -0.48927274004327104, -0.013241580132764547, -0.5733820334209698,
  ];

  /** Linear combinations retain all supplied world components and units. */
  function combine(vectors: readonly HumanCurve.Vector[], factors: readonly number[]): HumanCurve.Vector {
    const result: HumanCurve.Vector = [0, 0, 0];
    for (let j: number = 0; j < vectors.length; j++)
      for (let i: number = 0; i < 3; i++) result[i] = result[i]! + vectors[j]![i]! * factors[j]!;
    return result;
  }

  /** Derivative unit conversion uses the exact declared feature-phase scale. */
  function scaled(vector: HumanCurve.Vector, factor: number): HumanCurve.Vector {
    return [vector[0] * factor, vector[1] * factor, vector[2] * factor];
  }

  /** Vector subtraction introduces no placement correction. */
  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Admission rejects nonfinite triples without substituting another vector. */
  function finite(value: HumanCurve.Vector): boolean {
    return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
  }

  /** Already admitted chart axes retain their actual dot products. */
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
