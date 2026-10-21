import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";

/** Regular oblique neck domains identified from recovered physical sections. */
export namespace HumanNeckCurves {
  /** One common feature location; endpoints retain fractions zero and one. */
  export interface Principal {
    /** Geometric feature identity, independent of a source person. */
    name: string;
    /** Constant and shape-coordinate terms for the identified feature station. */
    fraction: readonly [number, number];
  }

  /** Compact shared coefficients supplied by the regional identification owner. */
  export interface Rule {
    /** Relative rotation from the current support chord towards projected forward, radians. */
    rotationRadians: number;
    /** Base normal offset divided by current support length: constant, shape terms. */
    baseOffsetOverChord: readonly [number, number];
    /** Native base-to-girth physical span divided by the anterior neckLength input. */
    spanOverNeckLength: number;
    /** Actual silhouette, volume and boundary features; not a tessellation schedule. */
    principal: readonly Principal[];
    /** Locate supported perimeter turns of the same analytic family for these inputs. */
    identifyPerimeterExtrema: boolean;
    /** Forward centre Legendre coefficients multiplying physical chord length. */
    centreChord: readonly number[];
    /** Forward centre Legendre coefficients multiplying the physical girth equation. */
    centreGirth: readonly number[];
    /** Constant and shape populations of lateral-centre and radial Fourier channels.
     * Each channel contains its longitudinal Legendre coefficients. Channel zero
     * is lateral centre; remaining channels are c0, cos1, sin1, ... .
     */
    theta: readonly [readonly (readonly number[])[], readonly (readonly number[])[]];
    /** Identification residuals and source/parameter qualifications. */
    limitations: readonly string[];
  }

  /** Independent regional authority; the main assembly owns both adjacent joins. */
  export interface Result {
    /** Stable regional identity for generated skin and construction. */
    id: "neck.regular-oblique";
    /** Actual common principal curves, in physical normal-station millimetres. */
    sections: readonly HumanCurve.Section[];
    /** Exact identified analytic values and longitudinal/phase/mixed jets. */
    family: HumanCurveFamily.Family;
    /** Directed normal coordinate and phase convention give outward first-jet normals. */
    outwardSign: 1;
    /** Source correspondence, unsupported neighboring domains and parameter scope. */
    limitations: string[];
  }

  /** Build the identified common family without altering shared supports.
   * Longitudinal station is native-oblique normal distance in mm; phase is
   * radians from projected forward towards signed +Z. The physical girth
   * equation normalizes jointly identified intermediate shape coefficients;
   * it does not interpolate two endpoint curves or equate a tape measurement
   * with the generated perimeter. Degree and derivatives of the identified
   * Legendre-times-girth law are retained by the common analytic authority.
   */
  export function build(parameters: IAutoMovieHumanBodyParameters, skeleton: HumanSkeleton.Result, rule: Rule): Result {
    const baseGirth: number = length("neckBase"), upperGirth: number = length("neck");
    const neckLength: number = length("neckLength");
    const requestedShape: number | null = parameters.controls.masculineFeminine.value;
    if (requestedShape === null || !Number.isFinite(requestedShape)) throw new Error("Neck construction requires a finite shape coordinate");
    const shape: number = requestedShape;
    const a: HumanCurve.Vector = support("neck_01"), b: HumanCurve.Vector = support("head");
    const chord: HumanCurve.Vector = subtract(b, a), chordLength: number = Math.hypot(...chord);
    const supportAxis: HumanCurve.Vector = unit(chord);
    const supportForward: HumanCurve.Vector = unit([1 - supportAxis[0] * supportAxis[0], -supportAxis[0] * supportAxis[1], -supportAxis[0] * supportAxis[2]]);
    const axis: HumanCurve.Vector = add(scale(supportAxis, Math.cos(rule.rotationRadians)), supportForward, Math.sin(rule.rotationRadians));
    const forward: HumanCurve.Vector = unit([1 - axis[0] * axis[0], -axis[0] * axis[1], -axis[0] * axis[2]]);
    const lateral: HumanCurve.Vector = cross(forward, axis);
    const span: number = neckLength * rule.spanOverNeckLength;
    const offset: number = chordLength * (rule.baseOffsetOverChord[0] + rule.baseOffsetOverChord[1] * shape);
    if (!(Number.isFinite(span) && span > 0 && Number.isFinite(offset) && Number.isFinite(rule.rotationRadians)))
      throw new Error("Neck identification leaves no finite directed physical span");
    const channelCount: number = rule.theta[0].length;
    if (channelCount < 2 || channelCount % 2 !== 0 || rule.theta[1].length !== channelCount)
      throw new Error("Neck rules require matching lateral-centre and odd radial Fourier populations");
    const channels: readonly (readonly number[])[] = [rule.centreChord, rule.centreGirth, ...rule.theta[0], ...rule.theta[1]];
    if (channels.some((channel: readonly number[]): boolean => channel.length === 0 || !channel.every(Number.isFinite)))
      throw new Error("Neck longitudinal coefficients must be nonempty and finite");
    const degree: number = Math.max(...channels.map((channel: readonly number[]): number => channel.length)) - 1;

    function values(fraction: number): { centre: HumanCurve.Vector; centreDerivative: HumanCurve.Vector; centreSecondDerivative: HumanCurve.Vector; radial: number[]; radialDerivative: number[]; radialSecondDerivative: number[] } {
      const x: number = 2 * fraction - 1, basis: number[] = [1], derivative: number[] = [0], secondDerivative: number[] = [0];
      if (degree > 0) { basis.push(x); derivative.push(2); secondDerivative.push(0); }
      for (let k: number = 2; k <= degree; k++) {
        basis.push(((2 * k - 1) * x * basis[k - 1]! - (k - 1) * basis[k - 2]!) / k);
        derivative.push(((2 * k - 1) * (2 * basis[k - 1]! + x * derivative[k - 1]!) - (k - 1) * derivative[k - 2]!) / k);
        secondDerivative.push(((2 * k - 1) * (4 * derivative[k - 1]! + x * secondDerivative[k - 1]!) - (k - 1) * secondDerivative[k - 2]!) / k);
      }
      const evaluate: (coefficients: readonly number[]) => [number, number, number] = (coefficients: readonly number[]): [number, number, number] => {
        let value: number = 0, slope: number = 0, curvature: number = 0;
        for (let k: number = 0; k < coefficients.length; k++) { value += coefficients[k]! * basis[k]!; slope += coefficients[k]! * derivative[k]!; curvature += coefficients[k]! * secondDerivative[k]!; }
        return [value, slope, curvature];
      };
      const girth: number = baseGirth + (upperGirth - baseGirth) * fraction, girthSlope: number = upperGirth - baseGirth;
      const chordForward: [number, number, number] = evaluate(rule.centreChord), girthForward: [number, number, number] = evaluate(rule.centreGirth);
      const forwardOffset: number = chordLength * chordForward[0] + girth * girthForward[0];
      const forwardDerivative: number = (chordLength * chordForward[1] + girthSlope * girthForward[0] + girth * girthForward[1]) / span;
      const forwardSecondDerivative: number = (chordLength * chordForward[2] + 2 * girthSlope * girthForward[1] + girth * girthForward[2]) / (span * span);
      const physical: number[] = [], slopes: number[] = [], curvatures: number[] = [];
      for (let channel: number = 0; channel < channelCount; channel++) {
        const common: [number, number, number] = evaluate(rule.theta[0][channel]!), shapeTerm: [number, number, number] = evaluate(rule.theta[1][channel]!);
        const value: number = common[0] + shape * shapeTerm[0], slope: number = common[1] + shape * shapeTerm[1];
        physical.push(girth * value); slopes.push((girthSlope * value + girth * slope) / span);
        curvatures.push((2 * girthSlope * slope + girth * (common[2] + shape * shapeTerm[2])) / (span * span));
      }
      return {
        centre: add(add(add(a, axis, offset + fraction * span), forward, forwardOffset), lateral, physical[0]!),
        centreDerivative: add(add([...axis], forward, forwardDerivative), lateral, slopes[0]!),
        centreSecondDerivative: add(scale(forward, forwardSecondDerivative), lateral, curvatures[0]!),
        radial: physical.slice(1), radialDerivative: slopes.slice(1), radialSecondDerivative: curvatures.slice(1),
      };
    }

    const locations: Array<{ name: string; fraction: number }> = rule.principal.map((feature: Principal, index: number): { name: string; fraction: number } => {
      const fraction: number = feature.fraction[0] + shape * feature.fraction[1];
      const previous: Principal | undefined = rule.principal[index - 1];
      const previousFraction: number = previous ? previous.fraction[0] + shape * previous.fraction[1] : -1;
      if (!feature.name || !(Number.isFinite(fraction) && fraction >= 0 && fraction <= 1 && fraction > previousFraction))
        throw new Error("Neck principal features have no ordered physical domain for these inputs");
      return { name: feature.name, fraction };
    });
    if (rule.identifyPerimeterExtrema) {
      // An observed neck constriction can disappear under independent girth
      // changes. Its station is solved from this same fitted curve authority,
      // rather than forcing a fixed intermediate section into every input.
      const perimeterDerivative: (fraction: number) => number = (fraction: number): number => {
        const value: ReturnType<typeof values> = values(fraction);
        let sum: number = 0;
        for (let sample: number = 0; sample < 128; sample++) {
          const phase: number = sample * 2 * Math.PI / 128;
          let r: number = value.radial[0]!, rs: number = value.radialDerivative[0]!, rp: number = 0, rsp: number = 0;
          for (let k: number = 1; k * 2 < value.radial.length; k++) {
            const i: number = 2 * k - 1, cosine: number = Math.cos(k * phase), sine: number = Math.sin(k * phase);
            r += value.radial[i]! * cosine + value.radial[i + 1]! * sine;
            rs += value.radialDerivative[i]! * cosine + value.radialDerivative[i + 1]! * sine;
            rp += k * (-value.radial[i]! * sine + value.radial[i + 1]! * cosine);
            rsp += k * (-value.radialDerivative[i]! * sine + value.radialDerivative[i + 1]! * cosine);
          }
          if (!(Number.isFinite(r) && r > 0)) throw new Error("Neck perimeter analysis requires a positive regular radial chart");
          sum += (r * rs + rp * rsp) / Math.hypot(r, rp);
        }
        return sum * 2 * Math.PI / 128;
      };
      let left: number = 0, leftValue: number = perimeterDerivative(0), count: number = 0;
      for (let sample: number = 1; sample <= 32; sample++) {
        const right: number = sample / 32, rightValue: number = perimeterDerivative(right);
        if (leftValue * rightValue < 0) {
          let low: number = left, high: number = right, lowValue: number = leftValue;
          for (let iteration: number = 0; iteration < 48; iteration++) {
            const middle: number = (low + high) / 2, middleValue: number = perimeterDerivative(middle);
            if (middleValue === 0) { low = middle; high = middle; break; }
            if (lowValue * middleValue < 0) high = middle;
            else { low = middle; lowValue = middleValue; }
          }
          const fraction: number = (low + high) / 2;
          if (locations.every((feature: { fraction: number }): boolean => Math.abs(feature.fraction - fraction) > 1e-8))
            locations.push({ name: "perimeter-extremum-" + (++count), fraction });
        }
        left = right; leftValue = rightValue;
      }
      locations.sort((first: { fraction: number }, second: { fraction: number }): number => first.fraction - second.fraction);
    }
    const sections: HumanCurve.Section[] = locations.map((feature: { name: string; fraction: number }): HumanCurve.Section => {
      const fraction: number = feature.fraction;
      const value: ReturnType<typeof values> = values(fraction);
      return { id: "neck." + feature.name, stationMm: fraction * span, originMm: value.centre, axisU: [...forward], axisV: [...lateral], coefficientsMm: value.radial };
    });
    if (sections.length < 2 || sections[0]!.stationMm !== 0 || sections.at(-1)!.stationMm !== span)
      throw new Error("Neck principal boundaries must retain the full identified physical interval");
    const jet: (stationMm: number, phaseRadians: number) => HumanCurveFamily.Jet = (stationMm: number, phaseRadians: number): HumanCurveFamily.Jet => {
      const value: ReturnType<typeof values> = values(stationMm / span);
      const radialDirection: HumanCurve.Vector = add(scale(forward, Math.cos(phaseRadians)), lateral, Math.sin(phaseRadians));
      const phaseDirection: HumanCurve.Vector = add(scale(forward, -Math.sin(phaseRadians)), lateral, Math.cos(phaseRadians));
      let radius: number = value.radial[0]!, slope: number = value.radialDerivative[0]!, phaseSlope: number = 0, mixed: number = 0;
      let curvature: number = value.radialSecondDerivative[0]!, phaseSecond: number = 0, mixedPhaseSecond: number = 0;
      for (let harmonic: number = 1; harmonic * 2 < value.radial.length; harmonic++) {
        const i: number = harmonic * 2 - 1, cosine: number = Math.cos(harmonic * phaseRadians), sine: number = Math.sin(harmonic * phaseRadians);
        radius += value.radial[i]! * cosine + value.radial[i + 1]! * sine;
        slope += value.radialDerivative[i]! * cosine + value.radialDerivative[i + 1]! * sine;
        phaseSlope += harmonic * (-value.radial[i]! * sine + value.radial[i + 1]! * cosine);
        mixed += harmonic * (-value.radialDerivative[i]! * sine + value.radialDerivative[i + 1]! * cosine);
        curvature += value.radialSecondDerivative[i]! * cosine + value.radialSecondDerivative[i + 1]! * sine;
        phaseSecond -= harmonic * harmonic * (value.radial[i]! * cosine + value.radial[i + 1]! * sine);
        mixedPhaseSecond -= harmonic * harmonic * (value.radialDerivative[i]! * cosine + value.radialDerivative[i + 1]! * sine);
      }
      if (!(Number.isFinite(radius) && radius > 0)) throw new Error("The identified neck family has no positive regular radial section for these inputs");
      return {
        positionMm: add(value.centre, radialDirection, radius),
        longitudinalDerivative: add(value.centreDerivative, radialDirection, slope),
        phaseDerivativeMmPerRadian: add(scale(phaseDirection, radius), radialDirection, phaseSlope),
        longitudinalPhaseDerivativePerRadian: add(scale(phaseDirection, slope), radialDirection, mixed),
        longitudinalSecondDerivative: add(value.centreSecondDerivative, radialDirection, curvature),
        phaseSecondDerivativeMmPerRadianSquared: add(scale(radialDirection, phaseSecond - radius), phaseDirection, 2 * phaseSlope),
        longitudinalPhaseSecondDerivativePerRadianSquared: add(scale(radialDirection, mixedPhaseSecond - slope), phaseDirection, 2 * mixed),
      };
    };
    const limitations: string[] = [
      ...rule.limitations,
      "This regular domain spans native base-to-neck oblique planes; it does not fill the shoulder collar branch or the submandibular/occipital junction",
      "Both end functions and exact analytic jets are available to the sole common-boundary owner; no neighboring boundary or continuity is independently invented here",
      "The physical girth equation is a normalization of jointly recovered intermediate shapes, not an assertion that the native course readback equals a skin perimeter",
      "The anterior neckLength input maps to this regional normal span through a pooled common relation; it does not move shared skeleton supports or establish a native one-cause response",
      "Principal perimeter turns use 128-point angular quadrature and 32 sign brackets followed by bounded scalar root solving; even-multiplicity stationary points and a continuous extremum certificate are unsupported",
      "Reference reproduction, independent parameter behavior and unseen-shape prediction require separate actual render verification",
    ];
    return { id: "neck.regular-oblique", sections, family: HumanCurveFamily.fromFunction(sections, jet, limitations), outwardSign: 1, limitations };

    function length(name: "neckBase" | "neck" | "neckLength"): number {
      const value: number | null = parameters.controls[name].value;
      if (value === null || !Number.isFinite(value) || value <= 0) throw new Error("A positive physical Human neck input is required: " + name);
      return value;
    }
    function support(name: string): HumanCurve.Vector {
      const value: HumanCurve.Vector | undefined = skeleton.supports.get(name);
      if (!value || !value.every(Number.isFinite)) throw new Error("Missing generated neck support: " + name);
      return value;
    }
  }

  function add(a: HumanCurve.Vector, b: HumanCurve.Vector, amount: number): HumanCurve.Vector { return [a[0] + amount * b[0], a[1] + amount * b[1], a[2] + amount * b[2]]; }
  function subtract(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(a: HumanCurve.Vector, amount: number): HumanCurve.Vector { return [a[0] * amount, a[1] * amount, a[2] * amount]; }
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function unit(value: HumanCurve.Vector): HumanCurve.Vector {
    const norm: number = Math.hypot(...value);
    if (!(Number.isFinite(norm) && norm > 1e-9)) throw new Error("Neck construction has a collapsed support or parallel forward direction");
    return scale(value, 1 / norm);
  }
}
