import { AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart, measureAutoMovieCurveLength64 } from "@automovie/engine";

import type { IAutoMovieHumanHeadInputs } from "../IAutoMovieHumanHeadInputs";
import type { IAutoMovieHumanHeadNeck } from "../IAutoMovieHumanHeadNeck";

/**
 * Original lower-head curves for two distinct neck measurements.
 * The retained mean height is an axis-plane centre proxy and the retained
 * posterior skin secant supplies a pose slope, not a measured neck axis.
 * A constant conic-template band closes the axis-normal tape. A separate
 * named-height course lies on the same homothetic native-conic source below it.
 * Neither choice identifies the palpated thyroid point or taut tape contact.
 *
 * @evidence contracts/common.md#principled-implementation Declares original shared-jet radius and physical-station origin curves, then measures their actual composed three-dimensional base derivative through the engine's source-length owner.
 * @evidence contracts/common.md#clear-and-simple-design One radius, one origin and one named-height course supply the actual mass author and both measurement readers; no independent neck skin or floating target tape is constructed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no Human quadrature, fitted cubic, reference measurement, person branch, finite-difference jet or anatomical-site relabelling.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes retained site/pose proxies, the constant-template and affine-origin premises, original declarations, numerical length observation and unverified final loft/anatomical contact.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded scalar solves use at most128 bracket expansions,120 bisections and64 conditional minimum steps. Normal trials prepare one native conic; base trials reuse its fixed polar population and original finite partition with bounded engine quadrature.
 * @evidence contracts/performance.md#reuse-equivalent-work The fixed height/origin declarations and course partition are shared across the one-radius solve; only its small radius source changes per trial.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All preparations and trial callbacks are call-owned; the result retains only original numeric declarations and small measurement metadata.
 */
export namespace AutoMovieHumanHeadNeckCurves {
  /**
   * Inputs in one calibration-mm frame; slope is dimensionless dx/dy.
   *
   * @evidence contracts/common.md#principled-implementation Keeps public base length/heights separate from retained pose/site data and cranial/clinical neighbours.
   * @evidence contracts/common.md#clear-and-simple-design The one owning solve receives explicit scalar context rather than a body, skin or reference model.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no person selector, expected answer or independent source evaluator.
   * @evidence contracts/common.md#meaningful-documentation Each field names its calibration units, ownership and anatomical versus retained meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This input record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This input record coordinates no work or cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fixed-size scalar/point context; no generated body or asynchronous handle is retained.
   */
  export interface IInputs {
    /** Retained mean, C7 posterior point, circle-equivalent lateral scale and posterior skin secant. */
    neck: IAutoMovieHumanHeadNeck;
    /** Public base target and three resolved heights, already scaled once. */
    base: IAutoMovieHumanHeadInputs["neckBase"];
    /** Existing internal overlap mean, distinct from the base course. */
    bottom: number;
    /** Existing clinical neck/submental junction, not a thyroid landmark. */
    cervical: readonly [number, number];
    /** Existing cranial origin, fixed from the tragion to the crown. */
    cranialCentre: number;
    /** Existing named tragion height. */
    tragion: number;
    /** Crown/pole height and original root-parameter owner. */
    crown: number;
    /** Existing source's evaluation spacing; also retains its internal overlap margin. */
    spacing: number;
  }

  /**
   * The source declarations and their explicitly limited measurement metadata.
   *
   * @evidence contracts/common.md#principled-implementation Publishes the actual radius/origin/height sources separately from their numeric solve and quadrature observations.
   * @evidence contracts/common.md#clear-and-simple-design The mass and independent observer share explicit declarations rather than a hidden registry or second neck skin.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Measurements are not certificates or anatomical-site identities; no failed source is replaced by a successful fallback.
   * @evidence contracts/common.md#meaningful-documentation Fields distinguish world heights, physical source parameter, lateral scale, extents, pose slope and numerical observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This output record performs no computation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This output record coordinates no requests.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One composition owns bounded numeric source arrays and metadata; no prepared callback, global cache or retained body escapes.
   */
  export interface IOutput {
    /** Original radius in the mass's crown-root parameter; only its lower domain is authored here. */
    radius: IAutoMovieViewPart.IOutline;
    /** Full-domain physical-station origin X, affine throughout the lower cylinder. */
    centre: IAutoMovieViewPart.IOutline;
    /** Base height in the finite course clock [0,baseClock], with four C2 quarters. */
    height: IAutoMovieViewPart.IOutline;
    /** Whole mass's lower source boundary. */
    bottom: number;
    /** Inclusive constant-template band, in world height. */
    band: readonly [number, number];
    /** Adopted mean-axis plane origin, not a geometric centroid or palpated skin landmark. */
    planeOrigin: readonly [number, number, number];
    /** Unit axis normal to that plane, from the retained pose slope. */
    planeNormal: readonly [number, number, number];
    /** Retained circle-equivalent lateral scale; the actual normal section is not assumed circular. */
    lateral: number;
    /** Constant horizontal supports, front/left/back/right, calibration mm. */
    extents: readonly [number, number, number, number];
    /** Actual conic cut's normal-plane metric measurement, not an error certificate. */
    normalMeasured: ReturnType<typeof measureAutoMovieCurveLength64>;
    /** Retained posterior-skin secant adopted as the lower origin's slope. */
    slope: number;
    /** Course parameter's finite domain length; a clock, not an extra anatomical distance. */
    baseClock: number;
    /** Chosen positive lower-radius root in the stated family. */
    baseRadius: number;
    /** Actual numerical measurement and K/K2 observation, not an error certificate. */
    measured: ReturnType<typeof measureAutoMovieCurveLength64>;
  }

  /**
   * Author a generalized-cylinder band and its named-height base course.
   * Constant radius and affine origin hold as functions, through explicit
   * shared jets in their respective root and physical-station parameters.
   * The base family keeps its height, phase, partition and origin fixed;
   * its radius function is affine in the lower radius. The actual derivative
   * is therefore affine in that one dimension. Length need not be monotone:
   * only a finite continuous opposite-sign bracket selects this branch.
   * C7 must lie inside the constant band so its existing posterior X and
   * public height remain the same point. The final positive radius and
   * computed target residual are admitted separately from K/K2 accuracy.
   *
   * @evidence contracts/common.md#principled-implementation Retains the mean origin X and posterior C7 point, then solves the independent anterior support on the actual conic's normal-plane metric. A circle-equivalent lateral scale is an explicit shape convention, not a circularity claim. The same conic polar source and original lower scale/origin give the base course's full world derivative.
   * @evidence contracts/common.md#clear-and-simple-design Returns the original declarations that the mass must consume, not a sampled replacement or an unrelated measurement curve.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses an incompatible finite band or missing selected root bracket; it never shifts a public height, changes the retained slope or calls a failed branch globally impossible.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, anatomical versus generating assumptions, fixed-family prerequisites and numerical measurement limits.
   * @evidence contracts/performance.md#efficient-algorithms Two fixed-size scalar solves and an optional64-step convex minimum use four GL8 panels per original refinement piece plus its doubled observation; no head, loft or figure is rebuilt inside them.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the fixed prepared height/origin and their common refinement while preparing only a four-knot radius per trial.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned declarations and scalar metadata; no prepared source or callback is retained globally.
   */
  export function of(input: IInputs): IOutput {
    const r: number = input.neck.radius;
    const m: number = input.neck.backSlope;
    const h: number = Math.hypot(1, m);
    const yc: number = input.neck.level;
    const back: number = input.neck.x + m * (input.base.cervicaleHeight - yc) - input.neck.back;
    const normal: (front: number) => ReturnType<typeof measureAutoMovieCurveLength64> = (front: number): ReturnType<typeof measureAutoMovieCurveLength64> => normalLength(section([front, r, back, r]), m);
    if (!(Number.isFinite(back) && back > 0 && r > 0 && Number.isFinite(r) && Number.isFinite(m))) throw new Error("Neck mean origin has no positive finite posterior/lateral source support");
    let frontLo: number = back;
    let frontHi: number = 2 * r;
    const normalTarget: number = 2 * Math.PI * r;
    for (let i: number = 0; normal(frontHi).lengthMm < normalTarget && i < 64; i++) frontHi *= 2;
    if (!(Number.isFinite(frontHi) && normal(frontLo).lengthMm <= normalTarget && normal(frontHi).lengthMm >= normalTarget)) throw new Error("Neck normal conic has no selected positive anterior-reach bracket");
    for (let i: number = 0; i < 60; i++) { const middle: number = (frontLo + frontHi) / 2; if (normal(middle).lengthMm < normalTarget) frontLo = middle; else frontHi = middle; }
    const front: number = (frontLo + frontHi) / 2;
    const extents: [number, number, number, number] = [front, r, back, r];
    const template: AutoMovieViewSection.ISection = section(extents);
    const normalMeasured: ReturnType<typeof measureAutoMovieCurveLength64> = normalLength(template, m);
    const projected: [number, number] = [yc - m * front / (h * h), yc + m * back / (h * h)];
    const lower: number = Math.min(...projected);
    const upper: number = Math.max(...projected);
    const first: number = Math.min(input.bottom - r, input.cervical[1] - input.spacing, input.base.suprasternaleHeight, input.base.sideNeckPointHeight, input.base.cervicaleHeight);
    const x0: number = input.neck.x;
    if (![r, m, h, yc, lower, upper, first, x0, input.base.girth, input.crown].every(Number.isFinite) || !(r > 0 && input.base.girth > 0 && first < lower && lower <= upper && upper < input.cervical[1] && upper < input.tragion && input.tragion < input.crown && input.base.suprasternaleHeight < lower && input.base.cervicaleHeight >= lower && Math.max(input.base.cervicaleHeight, input.base.sideNeckPointHeight) <= upper))
      throw new Error("Neck source has no compatible finite conic band below clinical C with its unchanged named base heights");
    if (Math.abs(normalMeasured.lengthMm - normalTarget) > 128 * Number.EPSILON * Math.max(normalMeasured.lengthMm, normalTarget)) throw new Error("Neck normal conic computed residual failed admission");

    const axisSpan: number = input.crown - first;
    const axis: IAutoMovieViewPart.IOutline = { knots: [
      { site: "neck.origin.bottom", station: first, value: x0 + m * (first - yc), jet: { first: m * axisSpan, second: 0 } },
      { site: "neck.cylinder.upper", station: upper, value: x0 + m * (upper - yc), jet: { first: m * axisSpan, second: 0 } },
      { site: "tragion", station: input.tragion, value: input.cranialCentre, jet: { first: 0, second: 0 } },
      { site: "vertex", station: input.crown, value: input.cranialCentre, jet: { first: 0, second: 0 } },
    ] };
    const clock: number = input.base.girth;
    const height: IAutoMovieViewPart.IOutline = { knots: [input.base.suprasternaleHeight, input.base.sideNeckPointHeight, input.base.cervicaleHeight, input.base.sideNeckPointHeight, input.base.suprasternaleHeight].map((value: number, i: number): IAutoMovieViewPart.IKnot => ({ site: ["base.front", "base.left", "base.cervicale", "base.right", "base.front.close"][i]!, station: clock * i / 4, value, jet: { first: 0, second: 0 } })) };
    const preparedHeight: AutoMovieViewOutline.IOutline = prepare(height);
    const preparedAxis: AutoMovieViewOutline.IOutline = prepare(axis);
    const radius: (base: number) => IAutoMovieViewPart.IOutline = (base: number): IAutoMovieViewPart.IOutline => {
      const rows: [string, number, number][] = [["neck.radius.bottom", first, base], ["base.front", input.base.suprasternaleHeight, base], ["neck.cylinder.lower", lower, r], ["neck.cylinder.upper", upper, r]];
      return {
        parameter: { type: "root", end: "top", pole: input.crown },
        knots: rows.filter((entry: [string, number, number], i: number): boolean => i === 0 || entry[1] !== rows[i - 1]![1]).map(([site, station, value]: [string, number, number]): IAutoMovieViewPart.IKnot => ({ site, station, value, jet: { first: 0, second: 0 } })),
      };
    };

    // Height is monotone on each declared quarter. Split at the actual
    // radius-knot numerical preimages as well, without fitting a new world
    // curve or claiming an interval-certified partition/integral.
    const stations: number[] = height.knots.map((k: IAutoMovieViewPart.IKnot): number => k.station);
    stations.push(...template.knots.map((k: AutoMovieViewSection.ISection["knots"][number]): number => clockAt(k.angle, clock)));
    for (let i: number = 0; i + 1 < height.knots.length; i++) {
      const a: IAutoMovieViewPart.IKnot = height.knots[i]!;
      const b: IAutoMovieViewPart.IKnot = height.knots[i + 1]!;
      for (const y of [first, input.base.suprasternaleHeight, lower, upper]) {
        if (!(y > Math.min(a.value, b.value) && y < Math.max(a.value, b.value))) continue;
        let lo: number = a.station;
        let hi: number = b.station;
        for (let k: number = 0; k < 60; k++) {
          const middle: number = (lo + hi) / 2;
          if (middle === lo || middle === hi) break;
          if ((read(preparedHeight, middle).value < y) === (a.value < b.value)) lo = middle; else hi = middle;
        }
        stations.push((lo + hi) / 2);
      }
    }
    const partition: number[] = [...new Set(stations)].sort((a: number, b: number): number => a - b);
    const polar: Map<number, [number, number, number]> = new Map();
    const measure: (base: number) => ReturnType<typeof measureAutoMovieCurveLength64> = (base: number): ReturnType<typeof measureAutoMovieCurveLength64> => {
      const preparedRadius: AutoMovieViewOutline.IOutline = prepare(radius(base));
      try {
        return measureAutoMovieCurveLength64(partition.slice(1).map((end: number, i: number): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({
        domain: [partition[i]!, end],
        derivative: (s: number): [number, number, number] => {
          const y: AutoMovieViewOutline.IReading = read(preparedHeight, s);
          const radial: AutoMovieViewOutline.IReading = read(preparedRadius, y.value);
          const centre: AutoMovieViewOutline.IReading = read(preparedAxis, y.value);
          const dy: number = y.stationJet![0];
          const dr: number = radial.stationJet![0] * dy;
          const theta: number = angleAt(s, clock);
          const turn: number = 2 * Math.PI / clock;
          let jet: [number, number, number] | undefined = polar.get(theta);
          if (jet === undefined) { jet = AutoMovieViewSection.radius(template, theta); polar.set(theta, jet); }
          const q: number = radial.value / r;
          const dq: number = dr / r;
          const u: number = jet[0] * Math.cos(theta);
          const v: number = jet[0] * Math.sin(theta);
          const du: number = jet[1] * Math.cos(theta) - jet[0] * Math.sin(theta);
          const dv: number = jet[1] * Math.sin(theta) + jet[0] * Math.cos(theta);
          return [centre.stationJet![0] * dy + dq * u + q * du * turn, dy, dq * v + q * dv * turn];
        },
        })), 4);
      } catch (error) {
        throw new Error(`Neck base original-source integral failed: ${error instanceof Error ? error.stack : String(error)}; clock=${clock}; partition=${JSON.stringify(partition)}`);
      }
    };
    let lo: number = 0;
    let hi: number = 2 * r;
    const lowLength: number = measure(lo).lengthMm;
    let highLength: number = measure(hi).lengthMm;
    for (let i: number = 0; highLength < Math.max(clock, lowLength) && i < 64; i++) {
      hi *= 2;
      if (!Number.isFinite(hi)) break;
      highLength = measure(hi).lengthMm;
    }
    let lowerLength: number = lowLength;
    if (lowerLength >= clock && Number.isFinite(hi) && highLength >= lowLength) {
      const ratio: number = (Math.sqrt(5) - 1) / 2;
      let a: number = 0;
      let b: number = hi;
      let c: number = b - ratio * (b - a);
      let d: number = a + ratio * (b - a);
      let fc: number = measure(c).lengthMm;
      let fd: number = measure(d).lengthMm;

      // Fixed source/phase/partition make P' affine in the lower radius.
      // Positive quadrature weights preserve convexity in real arithmetic.
      // A numerical minimum selects a sublevel branch; it is not a certificate.
      for (let i: number = 0; i < 64; i++) {
        if (fc < fd) { b = d; d = c; fd = fc; c = b - ratio * (b - a); fc = measure(c).lengthMm; }
        else { a = c; c = d; fc = fd; d = a + ratio * (b - a); fd = measure(d).lengthMm; }
      }
      lo = (a + b) / 2;
      lowerLength = measure(lo).lengthMm;
    }
    if (!(Number.isFinite(hi) && lowerLength < clock && highLength >= clock)) throw new Error(`Neck base has no selected finite positive-radius sign bracket: radius=${lo}, lower=${lowerLength}, upper=${highLength}, target=${clock}; extents=${extents}`);
    for (let i: number = 0; i < 60; i++) {
      const middle: number = (lo + hi) / 2;
      if (measure(middle).lengthMm < clock) lo = middle; else hi = middle;
    }
    const baseRadius: number = (lo + hi) / 2;
    const measured: ReturnType<typeof measureAutoMovieCurveLength64> = measure(baseRadius);

    // This is the computed root residual's binary64 budget, not the
    // quadrature's error bound or anatomical measurement accuracy.
    const allowance: number = 128 * Number.EPSILON * Math.max(clock, measured.lengthMm);
    if (!(Number.isFinite(baseRadius) && baseRadius > 0 && Math.abs(measured.lengthMm - clock) <= allowance)) throw new Error(`Neck base radius/root residual failed admission: radius=${baseRadius}, residual=${measured.lengthMm - clock}, allowance=${allowance}`);
    return { radius: radius(baseRadius), centre: axis, height, bottom: first, band: [lower, upper], planeOrigin: [x0, yc, 0], planeNormal: [m / h, 1 / h, 0], lateral: r, extents, normalMeasured, slope: m, baseClock: clock, baseRadius, measured };
  }

  /** Named quarter boundaries use the height clock's exact authoring path, not a second unit round trip. */
  function clockAt(angle: number, clock: number): number {
    const quarter: number = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI].indexOf(angle);
    return quarter < 0 ? clock * (angle / (2 * Math.PI)) : clock * quarter / 4;
  }

  /** Inverse named identity; all other points evaluate the unchanged linear phase law. */
  function angleAt(station: number, clock: number): number {
    const quarter: number = [0, clock / 4, clock / 2, 3 * clock / 4, clock].indexOf(station);
    return quarter < 0 ? 2 * Math.PI * (station / clock) : quarter * Math.PI / 2;
  }

  /** Prepare the actual native conic, including its shared-curvature ends. */
  function section(extents: [number, number, number, number]): AutoMovieViewSection.ISection {
    const rho: number = AutoMovieViewSection.ELLIPSE;
    const value: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents }, [rho, rho, rho, rho]);
    const fault: string | null = AutoMovieViewSection.fault(value);
    if (fault !== null) throw new Error(`Neck original conic: ${fault}`);
    return value;
  }

  /** Actual normal cut: u=Xlocal, z=Zlocal and y-yc=-m*u/(1+m²). */
  function normalLength(source: AutoMovieViewSection.ISection, slope: number): ReturnType<typeof measureAutoMovieCurveLength64> {
    const h2: number = 1 + slope * slope;
    const cuts: number[] = [...new Set([0, ...source.knots.map((k: AutoMovieViewSection.ISection["knots"][number]): number => k.angle), 2 * Math.PI])].sort((a: number, b: number): number => a - b);
    return measureAutoMovieCurveLength64(cuts.slice(1).map((end: number, i: number): Parameters<typeof measureAutoMovieCurveLength64>[0][number] => ({ domain: [cuts[i]!, end], derivative: (theta: number): [number, number, number] => {
      const [r, first]: [number, number, number] = AutoMovieViewSection.radius(source, theta);
      const du: number = first * Math.cos(theta) - r * Math.sin(theta);
      const dv: number = first * Math.sin(theta) + r * Math.cos(theta);
      return [du / h2, -slope * du / h2, dv];
    } })), 4);
  }

  /** Public scalar admission; no substitute curve is constructed on failure. */
  function prepare(outline: IAutoMovieViewPart.IOutline): AutoMovieViewOutline.IOutline {
    const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
    if ("detail" in prepared) throw new Error(`Neck original source: ${prepared.detail}`);
    return prepared;
  }

  /** A regular original station jet, including finite zero speed. */
  function read(outline: AutoMovieViewOutline.IOutline, station: number): AutoMovieViewOutline.IReading {
    const reading: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(outline, station);
    if (typeof reading === "string") throw new Error(`Neck original source: ${reading}`);
    if (reading.stationJet === null) throw new Error(`Neck course has no regular source derivative at ${station}: ${reading.stationJetStatus}`);
    return reading;
  }
}
