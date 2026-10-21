import { HumanTrunkRules } from "./HumanTrunkRules";
import { HumanTrunkShapeSpline } from "./HumanTrunkShapeSpline";
import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";

/** One source-gauge law identifies trunk values and longitudinal jets together.
 * Centres divided by height and radial coefficients divided by native girth
 * follow common C2 quintic fields between five native measurement planes.
 * Their pooled [1, masculineFeminine] coefficients describe four references;
 * they establish neither independent biological effects nor an exact Recovery
 * conversion. Native circumference and transverse surface arclength remain
 * distinct quantities linked by this fitted dimensionless radial field.
 */
export namespace HumanTrunkLaw {
  /** Numerical address of a feature in the common generated volume law. */
  export interface VolumeFeature {
    /** Matching principal section identity in this gauge. */
    id: string;

    /** Numerical source-gauge Y bracket, mm, without a coefficient-error guarantee. */
    stationBoundsMm: [number, number];
  }

  /** The untransported physical family shared by principal and skin consumers. */
  export interface Gauge {
    /** Native size and analytically isolated volume feature curves, mm and increasing physical Y. */
    sections: HumanCurve.Section[];

    /** Area extrema isolated from this polynomial, with numerical station brackets in mm. */
    volumeFeatures: VolumeFeature[];

    /** Analytic position, first, second and mixed jets before skeleton transport. */
    jet: (stationMm: number, phaseRadians: number) => HumanCurveFamily.Jet;

    /** Same native-girth spline's Q, dQ/dY and d²Q/dY² in mm, mm/mm and
     * inverse mm at the original physical source-gauge station. This scalar
     * is the native size input field, not the generated skin perimeter.
     */
    readonly nativeGirthJet: (stationMm: number) => readonly [number, number, number];
  }

  /** Build the common field with native girths as five independent size inputs.
   * Each dimensionless shape field has five values and five independent first
   * jets, jointly fitted to all source section values and local first jets.
   * The shared second jets minimize the integral of squared third derivative;
   * continuity of third derivative and zero endpoint third derivatives determine
   * them. Measurement planes are size controls, not all anatomical extrema.
   * A natural C2 scalar interpolant carries the five native girths. Multiplying
   * it by the fitted shape field preserves each control's linear scale at its
   * principal curve without asserting that the native value is its arclength.
   * With N=5 planes, K=10 harmonics and area degree D=16, construction costs
   * O(K*N^3+N*(K*D^2+80*D^3)) work. Polynomial storage is O(K*N+D^2);
   * each isolated feature retains one K-harmonic section. A jet costs O(K+N).
   */
  export function build(parameters: IAutoMovieHumanBodyParameters): Gauge {
    const height: number = physical(parameters.controls.height.value, "height");
    const shape: number | null = parameters.controls.masculineFeminine.value;
    if (shape === null || !Number.isFinite(shape))
      throw new Error("A finite shape coordinate is required for the trunk reference gauge");
    const stations: number[] = HumanTrunkRules.heights.map((pair: Pair): number => height * (pair[0] + shape * pair[1]));
    if (stations.some((value: number, i: number): boolean => !Number.isFinite(value) || (i > 0 && value <= stations[i - 1]!)))
      throw new Error("The common trunk reference gauge has no ordered physical feature stations");
    const start: number = stations[0]!;
    const width: number = stations[4]! - start;
    const knots: number[] = stations.map((station: number): number => (station - start) / width);
    const girth: Spline = spline(knots, KEYS.map((key: Girth): number => physical(parameters.controls[key].value, key)));
    const channels: HumanTrunkShapeSpline.Curve[] = HumanTrunkRules.channels.map((channel: readonly Pair[]): HumanTrunkShapeSpline.Curve => {
      const values: number[] = channel.map((pair: Pair): number => pair[0] + shape * pair[1]);
      return HumanTrunkShapeSpline.build(knots, values.slice(0, 5), values.slice(5));
    });
    const coordinateAt: (station: number) => number = (station: number): number => {
      if (!Number.isFinite(station) || station < start - 1e-8 || station > start + width + 1e-8)
        throw new Error("Trunk source-gauge evaluation lies outside its physical feature domain");
      return Math.max(0, Math.min(1, (station - start) / width));
    };
    const state: (station: number) => State = (station: number): State => {
      const coordinate: number = coordinateAt(station);
      const size: Triple = sample(girth, coordinate);
      if (!(size[0] > 0 && Number.isFinite(size[0])))
        throw new Error("Native girth interpolation left the positive supported domain");
      const values: Triple[] = channels.map((channel: HumanTrunkShapeSpline.Curve): Triple => HumanTrunkShapeSpline.sample(channel, coordinate));
      return {
        originMm: [height * values[0]![0], station, height * values[1]![0]],
        originDerivative: [height * values[0]![1] / width, 1, height * values[1]![1] / width],
        originSecondDerivative: [height * values[0]![2] / (width*width), 0, height * values[1]![2] / (width*width)],
        coefficientsMm: values.slice(2).map((value: Triple): number => size[0] * value[0]),
        derivatives: values.slice(2).map((value: Triple): number => (size[1] * value[0] + size[0] * value[1]) / width),
        secondDerivatives: values.slice(2).map((value: Triple): number => (size[2]*value[0]+2*size[1]*value[1]+size[0]*value[2])/(width*width)),
      };
    };
    const sections: HumanCurve.Section[] = stations.map((station: number, i: number): HumanCurve.Section => {
      const value: State = state(station);
      return { id: "trunk." + KEYS[i]!, stationMm: station, originMm: value.originMm,
        axisU: [1, 0, 0], axisV: [0, 0, 1], coefficientsMm: value.coefficientsMm };
    });
    const sizePowers: number[][] = knots.slice(1).map((_knot: number, i: number): number[] => {
      const h: number = knots[i + 1]! - knots[i]!;
      const a: number = girth.values[i]!;
      const b: number = girth.values[i + 1]!;
      const left: number = h * girth.slopes[i]!;
      const right: number = h * girth.slopes[i + 1]!;
      return [a, left, 3 * (b - a) - 2 * left - right, 2 * (a - b) + left + right];
    });
    const extrema: HumanTrunkShapeSpline.AreaFeature[] = HumanTrunkShapeSpline.areaExtrema(sizePowers, channels.slice(2));
    const volumeFeatures: Gauge["volumeFeatures"] = [];
    for (const feature of extrema) {
      const knot: number = knots[feature.interval]!;
      const h: number = knots[feature.interval + 1]! - knot;
      const station: number = start + width * (knot + h * feature.coordinate);
      const value: State = state(station);
      const id: string = "trunk.area." + feature.kind + "." + feature.interval;
      sections.push({ id,
        stationMm: station, originMm: value.originMm, axisU: [1, 0, 0], axisV: [0, 0, 1],
        coefficientsMm: value.coefficientsMm });
      volumeFeatures.push({ id, stationBoundsMm: [
        start + width * (knot + h * feature.bounds[0]),
        start + width * (knot + h * feature.bounds[1]),
      ] });
    }
    sections.sort((left: HumanCurve.Section, right: HumanCurve.Section): number => left.stationMm - right.stationMm);
    return { sections, volumeFeatures,
      nativeGirthJet: (station: number): readonly [number, number, number] => {
        const size: Triple = sample(girth, coordinateAt(station));
        const result: Triple = [size[0], size[1] / width, size[2] / (width * width)];
        if (!(result[0] > 0) || !result.every(Number.isFinite))
          throw new Error("Native girth interpolation has no finite physical jet");
        return result;
      },
      jet: (station: number, phase: number): HumanCurveFamily.Jet => {
      if (!Number.isFinite(phase)) throw new Error("Trunk circumferential phase must be finite radians");
      const value: State = state(station);
      const radius: Triple = radial(value.coefficientsMm, phase);
      const derivative: Triple = radial(value.derivatives, phase);
      const second: Triple = radial(value.secondDerivatives, phase);
      if (!(radius[0] > 0 && Number.isFinite(radius[0])))
        throw new Error("The fitted trunk radial field left the positive supported domain");
      const cosine: number = Math.cos(phase);
      const sine: number = Math.sin(phase);
      return {
        positionMm: [value.originMm[0] + radius[0] * cosine, station, value.originMm[2] + radius[0] * sine],
        longitudinalDerivative: [value.originDerivative[0] + derivative[0] * cosine, 1, value.originDerivative[2] + derivative[0] * sine],
        phaseDerivativeMmPerRadian: [radius[1] * cosine - radius[0] * sine, 0, radius[1] * sine + radius[0] * cosine],
        longitudinalPhaseDerivativePerRadian: [derivative[1] * cosine - derivative[0] * sine, 0, derivative[1] * sine + derivative[0] * cosine],
        longitudinalSecondDerivative: [value.originSecondDerivative[0]+second[0]*cosine,0,value.originSecondDerivative[2]+second[0]*sine],
        phaseSecondDerivativeMmPerRadianSquared: [(radius[2]-radius[0])*cosine-2*radius[1]*sine,0,(radius[2]-radius[0])*sine+2*radius[1]*cosine],
        longitudinalPhaseSecondDerivativePerRadianSquared: [(derivative[2]-derivative[0])*cosine-2*derivative[1]*sine,0,(derivative[2]-derivative[0])*sine+2*derivative[1]*cosine],
      };
    } };
  }

  type Pair = readonly [number, number];
  type Triple = [number, number, number];
  type Girth = "hip" | "highHip" | "waist" | "underbust" | "chest";
  interface State {
    originMm: HumanCurve.Vector;
    originDerivative: HumanCurve.Vector;
    originSecondDerivative: HumanCurve.Vector;
    coefficientsMm: number[];
    derivatives: number[];
    secondDerivatives: number[];
  }
  interface Spline {
    knots: number[];
    values: number[];
    slopes: number[];
  }
  /** Factor the five-knot C2 cubic system in its dimensionless physical gauge. */
  function spline(knots: number[], values: number[]): Spline {
    const n: number = knots.length;
    const lower: number[] = new Array<number>(n).fill(0);
    const upper: number[] = new Array<number>(n).fill(0);
    const diagonal: number[] = new Array<number>(n).fill(2);
    const rhs: number[] = new Array<number>(n).fill(0);
    const secants: number[] = values.slice(1).map((value: number, i: number): number => (value - values[i]!) / (knots[i + 1]! - knots[i]!));
    upper[0] = 1; rhs[0] = 3 * secants[0]!;
    lower[n - 1] = 1; rhs[n - 1] = 3 * secants[n - 2]!;
    for (let i: number = 1; i < n - 1; i++) {
      const before: number = knots[i]! - knots[i - 1]!;
      const after: number = knots[i + 1]! - knots[i]!;
      lower[i] = after / (before + after);
      upper[i] = before / (before + after);
      rhs[i] = 3 * (lower[i]! * secants[i - 1]! + upper[i]! * secants[i]!);
    }
    for (let i: number = 1; i < n; i++) {
      const factor: number = lower[i]! / diagonal[i - 1]!;
      diagonal[i] = diagonal[i]! - factor * upper[i - 1]!;
      rhs[i] = rhs[i]! - factor * rhs[i - 1]!;
    }
    const slopes: number[] = new Array<number>(n).fill(0);
    slopes[n - 1] = rhs[n - 1]! / diagonal[n - 1]!;
    for (let i: number = n - 2; i >= 0; i--)
      slopes[i] = (rhs[i]! - upper[i]! * slopes[i + 1]!) / diagonal[i]!;
    return { knots, values, slopes };
  }

  /** Evaluate one existing cubic and its first two derivatives in the same gauge. */
  function sample(curve: Spline, coordinate: number): Triple {
    let i: number = 0;
    while (i < curve.knots.length - 2 && coordinate > curve.knots[i + 1]!) i++;
    const width: number = curve.knots[i + 1]! - curve.knots[i]!;
    const t: number = (coordinate - curve.knots[i]!) / width;
    const t2: number = t * t;
    const t3: number = t2 * t;
    return [
      (2 * t3 - 3 * t2 + 1) * curve.values[i]! + (t3 - 2 * t2 + t) * width * curve.slopes[i]! +
      (-2 * t3 + 3 * t2) * curve.values[i + 1]! + (t3 - t2) * width * curve.slopes[i + 1]!,
      (6 * t2 - 6 * t) / width * curve.values[i]! + (3 * t2 - 4 * t + 1) * curve.slopes[i]! +
      (-6 * t2 + 6 * t) / width * curve.values[i + 1]! + (3 * t2 - 2 * t) * curve.slopes[i + 1]!,
      (12*t-6)/(width*width)*curve.values[i]!+(6*t-4)/width*curve.slopes[i]!+(-12*t+6)/(width*width)*curve.values[i+1]!+(6*t-2)/width*curve.slopes[i+1]!,
    ];
  }

  /** Return radius and its exact first two angular derivatives, mm and radians. */
  function radial(coefficients: number[], phase: number): Triple {
    let radius: number = coefficients[0]!;
    let derivative: number = 0;
    let second: number = 0;
    for (let harmonic: number = 1; harmonic <= 10; harmonic++) {
      const cosine: number = Math.cos(harmonic * phase);
      const sine: number = Math.sin(harmonic * phase);
      radius += coefficients[2 * harmonic - 1]! * cosine + coefficients[2 * harmonic]! * sine;
      derivative += harmonic * (-coefficients[2 * harmonic - 1]! * sine + coefficients[2 * harmonic]! * cosine);
      second -= harmonic*harmonic*(coefficients[2*harmonic-1]!*cosine+coefficients[2*harmonic]!*sine);
    }
    return [radius, derivative, second];
  }

  /** Reject missing or nonpositive physical inputs before constructing a field. */
  function physical(value: number | null, key: string): number {
    if (value === null || !Number.isFinite(value) || value <= 0)
      throw new Error("A positive finite trunk physical input is required: " + key);
    return value;
  }

  const KEYS: Girth[] = ["hip", "highHip", "waist", "underbust", "chest"];
}
