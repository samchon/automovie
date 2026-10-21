import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import { HumanLimbRules } from "./HumanLimbRules";

/** Generate limb shafts from physical inputs and jointly identified shape laws.
 * The shared skeleton owns supports and the assembly owns proximal branches,
 * shared boundaries and joint transitions. Radial Fourier principal curves
 * are a fitted common family, not an exact conversion of recovered Hermite.
 */
export namespace HumanLimbCurves {
  /** A source-observed or unrepresented normalized directed support interval. */
  export interface Coverage {
    /** Region identity remains stable across input changes. */
    id: string;

    /** Normalized proximal-to-distal support interval. */
    domain: [number, number];

    /** Skin is generated only for fitted independent shaft domains. */
    status: "generated-shaft" | "shared-branch-owner-required" | "terminal-owner-required";

    /** The geometric boundary or parameter limitation requiring another owner. */
    reason: string;
  }

  /** One curve authority supplies generated skin and construction together. */
  export interface Region {
    /** Named side and limb segment, independent of the reference people. */
    id: string;

    /** The same principal curves are consumed by the family and displayed construction. */
    sections: readonly HumanCurve.Section[];

    /** Evaluate a planar Fourier descriptor from the same analytic skin authority.
     * The physical support station is unchanged; origin offsets stay in its
     * normal plane. The common terminal owner may integrate its exact area
     * and area centroid without substituting the descriptor's radial origin.
     */
    sectionAt: (stationMm: number) => HumanCurve.Section;

    /** Exact shank area polynomials from the same physical channel authority.
     * Other shaft representations leave this metadata absent rather than
     * declaring an unsupported polynomial degree for an opaque family.
     */
    areaSpans?: readonly AreaSpan[];

    /** Recursively restrictable world-space surface authority. */
    family: HumanCurveFamily.Family;

    /** Surface-normal sign for dP/ds cross dP/dphase in this mirrored chart. */
    outwardSign: 1 | -1;

    /** Explicit supported and missing physical domains. */
    coverage: Coverage[];

    /** Geometric interpolation limits, separate from clinical anatomy. */
    limitations: string[];
  }

  /** Area on one actual polynomial interval, with no sampled curve refit. */
  export interface AreaSpan {
    /** Physical support station at normalized local coordinate u=0, mm. */
    startMm: number;

    /** Physical support station at normalized local coordinate u=1, mm. */
    endMm: number;

    /** Ascending power coefficients of A(u), mm squared, retaining degree ten. */
    coefficientsMm2: readonly number[];
  }

  /** Caller-owned regional families; they contain no reference mesh or curve table. */
  export interface Result {
    /** Four directed shafts on each side, in a stable assembly order. */
    regions: Region[];

    /** All regional supported and missing domains, including branch ownership. */
    coverage: Coverage[];

    /** Independent input and source-domain qualifications. */
    limitations: string[];
  }

  /** Compatibility input for the earlier cubic interpolation path.
   * Nonempty prescribed end jets are refused: this analytic regional law
   * cannot acquire them without changing its identified coefficients. The
   * common boundary owner constructs its constrained joining spans separately.
   */
  export type EndpointConditions = ReadonlyMap<string, HumanCurveFamily.Endpoints>;

  /** Build eight independent shafts from the current user dimensions.
   * Physical support distance is longitudinal s; phase remains radians.
   * Pooled dimensionless centre/radial laws multiply the region's physical
   * girth equation. Declared principal layers mark measured volume, offset,
   * width/depth and terminal changes. The same continuous regional polynomial
   * law supplies all values and exact first, second and mixed derivatives; principal
   * descriptors and recursive restriction do not replace it by cubic splines.
   */
  export function build(
    parameters: IAutoMovieHumanBodyParameters,
    skeleton: HumanSkeleton.Result,
    endpointConditions: EndpointConditions = new Map(),
  ): Result {
    for (const [id, conditions] of endpointConditions)
      if (conditions.start !== undefined || conditions.end !== undefined)
        throw new Error("Prescribed endpoint jets would change the identified analytic limb law; the common boundary owner must construct the constrained join: " + id);
    const q: Dimensions = {
      bicep: dimension("bicep"), elbow: dimension("elbow"),
      forearm: dimension("forearm"), wrist: dimension("wrist"), thigh: dimension("thigh"),
      knee: dimension("knee"), calf: dimension("calf"),
    };
    const regions: Region[] = [];
    const definitions: Array<[HumanLimbRules.Region, string, string]> = [
      ["upper-arm", "upperarm", "lowerarm"], ["forearm", "lowerarm", "hand"],
      ["thigh", "thigh", "calf"], ["shank", "calf", "foot"],
    ];
    for (const side of ["l", "r"] as const)
      for (const [name, proximal, distal] of definitions) {
        const id: string = name + "-" + side;
        const rule: HumanLimbRules.Rule = HumanLimbRules.rules[name];
        const a: HumanCurve.Vector = support(proximal + "_" + side);
        const b: HumanCurve.Vector = support(distal + "_" + side);
        const chord: HumanCurve.Vector = subtract(b, a);
        const length: number = Math.hypot(...chord);
        if (!(length > 0 && Number.isFinite(length))) throw new Error("A generated limb support chord is unresolved: " + id);
        const n: HumanCurve.Vector = scale(chord, 1 / length);
        const projected: HumanCurve.Vector = [1 - n[0] * n[0], -n[0] * n[1], -n[0] * n[2]];
        const referenceLength: number = Math.hypot(...projected);
        if (!(referenceLength >= 1e-6 && Number.isFinite(referenceLength))) throw new Error("Forward cannot define the generated limb section roll: " + id);
        const axisV: HumanCurve.Vector = scale(projected, 1 / referenceLength);
        // Reflection reverses a cross product. Reversing the right U axis
        // restores the same physical angular correspondence on both sides.
        const axisU: HumanCurve.Vector = scale(cross(axisV, n), side === "l" ? 1 : -1);
        const polynomialSpans: ChannelSpan[] | undefined = rule.knots === undefined ? undefined : quinticChannels(rule, q);
        const areaSpans: readonly AreaSpan[] | undefined = polynomialSpans === undefined ? undefined : Object.freeze(polynomialSpans.map((span: ChannelSpan): AreaSpan => {
          const coefficientsMm2: number[] = new Array<number>(11).fill(0);
          for (let channel: number = 2; channel < span.channelsMm.length; channel++) {
            const polynomial: number[] = span.channelsMm[channel]!;
            const weight: number = channel === 2 ? Math.PI : Math.PI / 2;
            for (let i: number = 0; i < polynomial.length; i++)
              for (let j: number = 0; j < polynomial.length; j++) coefficientsMm2[i + j]! += weight * polynomial[i]! * polynomial[j]!;
          }
          return Object.freeze({ startMm: span.startFraction * length, endMm: span.endFraction * length, coefficientsMm2: Object.freeze(coefficientsMm2) });
        }));
        const channelsAt: (t: number) => Channels = (t: number): Channels => {
          if (polynomialSpans !== undefined) {
            const span: ChannelSpan | undefined = polynomialSpans.find((candidate: ChannelSpan): boolean => t >= candidate.startFraction && (t < candidate.endFraction || (t === 1 && candidate.endFraction === 1)));
            if (span === undefined) throw new Error("Polynomial limb station is outside its exact interval authority: " + id);
            const width: number = span.endFraction - span.startFraction;
            const u: number = (t - span.startFraction) / width, physicalWidth: number = width * length;
            const values: number[] = [], derivativesPerMm: number[] = [], secondDerivativesPerMmSquared: number[] = [];
            for (const polynomial of span.channelsMm) {
              let value: number = 0, derivative: number = 0, second: number = 0;
              for (let degree: number = polynomial.length - 1; degree >= 0; degree--) value = value * u + polynomial[degree]!;
              for (let degree: number = polynomial.length - 1; degree >= 1; degree--) derivative = derivative * u + degree * polynomial[degree]!;
              for (let degree: number = polynomial.length - 1; degree >= 2; degree--) second = second * u + degree * (degree - 1) * polynomial[degree]!;
              values.push(value); derivativesPerMm.push(derivative / physicalWidth); secondDerivativesPerMmSquared.push(second / (physicalWidth * physicalWidth));
            }
            return { values, derivativesPerMm, secondDerivativesPerMmSquared };
          }
          const physical: Girth = girth(name, t, q);
          if (!(physical.value > 0 && Number.isFinite(physical.value) && Number.isFinite(physical.derivativePerT) && Number.isFinite(physical.secondDerivativePerTSquared))) throw new Error("Independent limb inputs leave no positive supported section: " + id);
          const longitudinal: Basis = legendreBasis(t, rule.domain);
          const basis: number[] = longitudinal.values;
          const basisDerivativePerT: number[] = longitudinal.derivatives;
          const basisSecondDerivativePerTSquared: number[] = longitudinal.secondDerivatives;
          const values: number[] = [], derivativesPerMm: number[] = [], secondDerivativesPerMmSquared: number[] = [];
          for (const theta of rule.theta) {
            let shape: number = 0, shapeDerivativePerT: number = 0, shapeSecondDerivativePerTSquared: number = 0;
            for (let degree: number = 0; degree < theta.length; degree++) {
              shape += theta[degree]! * basis[degree]!;
              shapeDerivativePerT += theta[degree]! * basisDerivativePerT[degree]!;
              shapeSecondDerivativePerTSquared += theta[degree]! * basisSecondDerivativePerTSquared[degree]!;
            }
            values.push(physical.value * shape);
            // s=t*L uses the actual support-chord length, independently of
            // circumferential phase. The product has degree up to seven.
            derivativesPerMm.push((physical.derivativePerT * shape + physical.value * shapeDerivativePerT) / length);
            secondDerivativesPerMmSquared.push((physical.secondDerivativePerTSquared * shape + 2 * physical.derivativePerT * shapeDerivativePerT + physical.value * shapeSecondDerivativePerTSquared) / (length * length));
          }
          return { values, derivativesPerMm, secondDerivativesPerMmSquared };
        };
        const sectionAt: (stationMm: number) => HumanCurve.Section = (stationMm: number): HumanCurve.Section => {
          if (!Number.isFinite(stationMm) || stationMm < rule.domain[0] * length || stationMm > rule.domain[1] * length)
            throw new Error("Requested limb section is outside its observed physical support domain: " + id);
          const t: number = stationMm / length;
          const channels: number[] = channelsAt(t).values;
          const originMm: HumanCurve.Vector = add(add(add(a, chord, t), axisU, channels[0]!), axisV, channels[1]!);
          const coefficientsMm: number[] = channels.slice(2);
          for (let sample: number = 0; sample < 192; sample++) {
            const phase: number = sample * 2 * Math.PI / 192;
            let radius: number = coefficientsMm[0]!;
            for (let harmonic: number = 1; harmonic <= 6; harmonic++) radius += coefficientsMm[2 * harmonic - 1]! * Math.cos(harmonic * phase) + coefficientsMm[2 * harmonic]! * Math.sin(harmonic * phase);
            if (!(radius > 0 && Number.isFinite(radius))) throw new Error("The fitted limb family has no positive radial section for these inputs: " + id);
          }
          return { id: id + ".section-at-" + stationMm, stationMm, originMm, axisU: [...axisU], axisV: [...axisV], coefficientsMm };
        };
        const sections: HumanCurve.Section[] = rule.principal.map((t: number, index: number): HumanCurve.Section => ({ ...sectionAt(t * length), id: id + "." + featureNames[name][index]! }));
        const analyticJet: (stationMm: number, phaseRadians: number) => HumanCurveFamily.Jet = (stationMm: number, phaseRadians: number): HumanCurveFamily.Jet => {
          const t: number = stationMm / length;
          const channels: Channels = channelsAt(t);
          const cosine: number = Math.cos(phaseRadians), sine: number = Math.sin(phaseRadians);
          const radialDirection: HumanCurve.Vector = add(scale(axisU, cosine), axisV, sine);
          const phaseDirection: HumanCurve.Vector = add(scale(axisU, -sine), axisV, cosine);
          let radius: number = channels.values[2]!, radiusDerivative: number = channels.derivativesPerMm[2]!;
          let radiusSecondDerivative: number = channels.secondDerivativesPerMmSquared[2]!;
          let phaseRadius: number = 0, mixedRadius: number = 0;
          let phaseSecondRadius: number = 0;
          for (let harmonic: number = 1; harmonic <= 6; harmonic++) {
            const aIndex: number = 2 * harmonic + 1, bIndex: number = aIndex + 1;
            const c: number = Math.cos(harmonic * phaseRadians), s: number = Math.sin(harmonic * phaseRadians);
            radius += channels.values[aIndex]! * c + channels.values[bIndex]! * s;
            radiusDerivative += channels.derivativesPerMm[aIndex]! * c + channels.derivativesPerMm[bIndex]! * s;
            radiusSecondDerivative += channels.secondDerivativesPerMmSquared[aIndex]! * c + channels.secondDerivativesPerMmSquared[bIndex]! * s;
            phaseRadius += harmonic * (-channels.values[aIndex]! * s + channels.values[bIndex]! * c);
            phaseSecondRadius -= harmonic * harmonic * (channels.values[aIndex]! * c + channels.values[bIndex]! * s);
            mixedRadius += harmonic * (-channels.derivativesPerMm[aIndex]! * s + channels.derivativesPerMm[bIndex]! * c);
          }
          if (!(radius > 0 && Number.isFinite(radius))) throw new Error("The analytic limb family has no positive radial section for these inputs: " + id);
          const centre: HumanCurve.Vector = add(add(add(a, chord, t), axisU, channels.values[0]!), axisV, channels.values[1]!);
          const centreDerivative: HumanCurve.Vector = add(add(n, axisU, channels.derivativesPerMm[0]!), axisV, channels.derivativesPerMm[1]!);
          const centreSecondDerivative: HumanCurve.Vector = add(scale(axisU, channels.secondDerivativesPerMmSquared[0]!), axisV, channels.secondDerivativesPerMmSquared[1]!);
          return {
            positionMm: add(centre, radialDirection, radius),
            longitudinalDerivative: add(centreDerivative, radialDirection, radiusDerivative),
            phaseDerivativeMmPerRadian: add(scale(phaseDirection, radius), radialDirection, phaseRadius),
            longitudinalPhaseDerivativePerRadian: add(scale(phaseDirection, radiusDerivative), radialDirection, mixedRadius),
            longitudinalSecondDerivative: add(centreSecondDerivative, radialDirection, radiusSecondDerivative),
            phaseSecondDerivativeMmPerRadianSquared: add(scale(radialDirection, phaseSecondRadius - radius), phaseDirection, 2 * phaseRadius),
          };
        };
        const coverage: Coverage[] = [{ id, domain: [...rule.domain], status: "generated-shaft", reason: "Jointly fitted independent-shaft radial family; neither topology nor source material correspondence is certified" }];
        if (rule.domain[0] > 0) coverage.push({ id, domain: [0, rule.domain[0]], status: "shared-branch-owner-required", reason: "Source sections merge with torso or pelvis proximally; the common assembly owns the observed branch and one boundary" });
        if (rule.domain[1] < 1) coverage.push({ id, domain: [rule.domain[1], 1], status: "terminal-owner-required", reason: "The wrist or ankle transition belongs to the common terminal boundary owner; no cap or tube extension is invented" });
        regions.push({ id, sections, sectionAt, ...(areaSpans === undefined ? {} : { areaSpans }), family: HumanCurveFamily.fromFunction(sections, analyticJet, [
          name === "shank" ? "Source-observed full-domain quintic channels use common physical Knee/Calf coefficients with C4 feature joins; no terminal ankle-girth field or extension is invented" : "The identified degree-five Legendre channels multiply the actual linear/quadratic physical girth law; their degree-six/seven surface is evaluated without cubic refitting",
          "Principal layers and recursive interval restriction preserve the same analytic value, longitudinal, phase, second and mixed derivatives",
          "Analytic end jets follow this regional law; a common-owner boundary and constrained joining span remain separate geometric work",
        ]), outwardSign: side === "l" ? -1 : 1, coverage, limitations: [
          "Source Hermite curves retain their original degree, physical phase and lineage separately; this Fourier family is a fitted common candidate",
          "The current neutral bone-chain frame supplies orientation; clinical joints and independent morphology-driven axis rotation are unqualified",
          "Analytic endpoint conditions supply no anatomical or cross-region continuity guarantee; prescribed external endpoint jets are explicitly unsupported by this regional law",
          "Common girth equations expose independent dimensions; their finite parameter responses are generative hypotheses rather than observed one-cause native responses",
        ] });
      }
    return { regions, coverage: regions.flatMap((region: Region): Coverage[] => region.coverage), limitations: [
      "Compact shared coefficients fit four reference shapes and both sides, without person selection or original mesh/normal fallback",
      "Shank Knee/Calf effects are conditional correlated-cohort rules; independent native causal responses and unseen parameter ratios remain unqualified",
      "Fat, muscularity and masculine/feminine shape responses were not independently identified for these regional curves",
      "Generation outside observed reference ranges has not established unseen-shape prediction, and source radial approximations retain measured residuals",
    ] };

    function dimension(name: keyof Dimensions): number {
      const value: number | null = parameters.controls[name].value;
      if (value === null || !Number.isFinite(value) || value <= 0) throw new Error("A positive physical Human limb dimension is required: " + name);
      return value;
    }

    function support(name: string): HumanCurve.Vector {
      const value: HumanCurve.Vector | undefined = skeleton.supports.get(name);
      if (value === undefined || !value.every(Number.isFinite)) throw new Error("Missing generated limb support: " + name);
      return value;
    }
  }

  /** Physical primary body inputs used by the regional girth equations, mm. */
  interface Dimensions { bicep: number; elbow: number; forearm: number; wrist: number; thigh: number; knee: number; calf: number; }

  /** Physical channels with their exact first and second station derivatives. */
  interface Channels { values: number[]; derivativesPerMm: number[]; secondDerivativesPerMmSquared: number[]; }

  /** Physical girth and its derivatives with respect to dimensionless support t. */
  interface Girth { value: number; derivativePerT: number; secondDerivativePerTSquared: number; }

  /** Exact longitudinal polynomial basis derivatives with respect to support fraction t. */
  interface Basis { values: number[]; derivatives: number[]; secondDerivatives: number[]; }

  /** One degree-five physical channel polynomial in normalized local coordinate. */
  interface ChannelSpan { startFraction: number; endFraction: number; channelsMm: number[][]; }

  const featureNames: Record<HumanLimbRules.Region, string[]> = {
    "upper-arm": ["independent-shaft", "bicep-course", "depth-width-transition", "distal-volume-minimum", "elbow-support"],
    forearm: ["elbow-support", "proximal-volume", "posterior-offset", "wrist-flattening", "terminal-shaft"],
    thigh: ["independent-shaft", "thigh-course", "volume-transition", "distal-offset", "knee-support"],
    shank: ["knee-support", "calf-volume-feature", "anterior-profile-transition", "distal-area-minimum", "ankle-incoming-support"],
  };

  /** Preserve the original degree-five Legendre law and both exact derivatives. */
  function legendreBasis(t: number, domain: [number, number]): Basis {
    const z: number = 2 * (t - domain[0]) / (domain[1] - domain[0]) - 1;
    const dzPerT: number = 2 / (domain[1] - domain[0]);
    const values: number[] = [1, z], derivatives: number[] = [0, dzPerT], secondDerivatives: number[] = [0, 0];
    for (let degree: number = 2; degree < 6; degree++) {
      values.push(((2 * degree - 1) * z * values[degree - 1]! - (degree - 1) * values[degree - 2]!) / degree);
      derivatives.push(((2 * degree - 1) * (dzPerT * values[degree - 1]! + z * derivatives[degree - 1]!) - (degree - 1) * derivatives[degree - 2]!) / degree);
      secondDerivatives.push(((2 * degree - 1) * (2 * dzPerT * derivatives[degree - 1]! + z * secondDerivatives[degree - 1]!) - (degree - 1) * secondDerivatives[degree - 2]!) / degree);
    }
    return { values, derivatives, secondDerivatives };
  }

  /** Convert the original Cox–de Boor recurrence algebraically on each real knot span.
   * Skin, jets, section descriptors and area convolution consume these same
   * physical polynomials. Repeated knots skip zero denominators; no sample,
   * longitudinal refit or independent second implementation of the basis exists.
   */
  function quinticChannels(rule: HumanLimbRules.Rule, q: Dimensions): ChannelSpan[] {
    const knots: readonly number[] | undefined = rule.knots;
    const contrastTheta: readonly number[][] | undefined = rule.kneeContrastTheta;
    if (knots === undefined || contrastTheta === undefined) throw new Error("Exact shank polynomial metadata requires its identified knots and physical contrast");
    const contrastMm: number = (q.knee - HumanLimbRules.shankKneeOverCalfReference * q.calf) / HumanLimbRules.shankKneeCalfContrastScale;
    const spans: ChannelSpan[] = [];
    for (let spanIndex: number = 0; spanIndex < knots.length - 1; spanIndex++) {
      const a: number = knots[spanIndex]!, b: number = knots[spanIndex + 1]!, width: number = b - a;
      if (width === 0) continue;
      let basis: number[][] = [];
      for (let index: number = 0; index < knots.length - 1; index++) basis.push([index === spanIndex ? 1 : 0]);
      for (let degree: number = 1; degree <= 5; degree++) {
        const next: number[][] = [];
        for (let index: number = 0; index < basis.length - 1; index++) {
          const polynomial: number[] = new Array<number>(degree + 1).fill(0);
          const left: number = knots[index + degree]! - knots[index]!;
          const right: number = knots[index + degree + 1]! - knots[index + 1]!;
          for (let power: number = 0; power < degree; power++) {
            if (left !== 0) {
              polynomial[power]! += (a - knots[index]!) * basis[index]![power]! / left;
              polynomial[power + 1]! += width * basis[index]![power]! / left;
            }
            if (right !== 0) {
              polynomial[power]! += (knots[index + degree + 1]! - a) * basis[index + 1]![power]! / right;
              polynomial[power + 1]! -= width * basis[index + 1]![power]! / right;
            }
          }
          next.push(polynomial);
        }
        basis = next;
      }
      const channelsMm: number[][] = rule.theta.map((theta: number[], channel: number): number[] => {
        if (theta.length !== basis.length || contrastTheta[channel]?.length !== basis.length) throw new Error("Shank coefficient count disagrees with its exact polynomial basis");
        const polynomial: number[] = new Array<number>(6).fill(0);
        for (let index: number = 0; index < basis.length; index++) {
          const physical: number = q.calf * theta[index]! + contrastMm * contrastTheta[channel]![index]!;
          for (let power: number = 0; power <= 5; power++) polynomial[power]! += physical * basis[index]![power]!;
        }
        return polynomial;
      });
      spans.push({ startFraction: a, endFraction: b, channelsMm });
    }
    return spans;
  }

  /** The actual source courses define the normalization sites; this equation
   * does not assert that their nonplanar course equals the generated perimeter.
   * Common fitted channels preserve that independently observed discrepancy.
   */
  function girth(region: HumanLimbRules.Region, t: number, q: Dimensions): Girth {
    if (region === "shank") return { value: q.calf, derivativePerT: 0, secondDerivativePerTSquared: 0 };
    if (region === "upper-arm") return { value: q.bicep + (q.elbow - q.bicep) * (t - 0.46) / 0.54, derivativePerT: (q.elbow - q.bicep) / 0.54, secondDerivativePerTSquared: 0 };
    if (region === "thigh") return { value: q.thigh + (q.knee - q.thigh) * (t - 0.4) / 0.6, derivativePerT: (q.knee - q.thigh) / 0.6, secondDerivativePerTSquared: 0 };
    const middle: number = 0.2;
    const first: number = q.elbow;
    const centre: number = q.forearm;
    const last: number = q.wrist;
    return {
      value: first * (t - middle) * (t - 1) / middle + centre * t * (t - 1) / (middle * (middle - 1)) + last * t * (t - middle) / (1 - middle),
      derivativePerT: first * (2 * t - middle - 1) / middle + centre * (2 * t - 1) / (middle * (middle - 1)) + last * (2 * t - middle) / (1 - middle),
      secondDerivativePerTSquared: 2 * first / middle + 2 * centre / (middle * (middle - 1)) + 2 * last / (1 - middle),
    };
  }

  function add(a: HumanCurve.Vector, b: HumanCurve.Vector, amount: number): HumanCurve.Vector { return [a[0] + amount * b[0], a[1] + amount * b[1], a[2] + amount * b[2]]; }
  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(a: HumanCurve.Vector, amount: number): HumanCurve.Vector { return [amount * a[0], amount * a[1], amount * a[2]]; }
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
}
