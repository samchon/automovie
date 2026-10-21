import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";
import type { HumanSurface } from "./HumanSurface";

/** Implicit plane intersections retain the original surface and its full order. */
export namespace HumanPlaneCut {
  /** Common orthonormal joint chart, with independent source side orientation. */
  export interface Frame {
    /** World support origin, mm. */
    originMm: HumanCurve.Vector;
    /** Increasing physical plane coordinate direction. */
    normal: HumanCurve.Vector;
    /** Unit polar cosine direction. */
    u: HumanCurve.Vector;
    /** Unit polar sine direction. */
    v: HumanCurve.Vector;
  }

  /** Actual boundary functions and their exact chain-rule derivative owner. */
  export interface Cut {
    /** One periodic curve in common polar radians, calling the original family. */
    boundary: HumanSurface.Boundary;
    /** Position and common plane-coordinate derivatives, mm and radians. */
    jet: (phaseRadians: number) => HumanCurveFamily.Jet;
    /** Original physical station and original phase at the same boundary point. */
    sourceParameters: (phaseRadians: number) => { stationMm: number; phaseRadians: number; stationDerivativePerRadian: number; phaseDerivativePerRadian: number };
  }

  /**
   * Solve the original station implicitly, then invert its monotone polar map.
   * Safeguarded Newton iterations retain brackets and terminate at binary64
   * resolution; no station average, plane projection or angular refit is used.
   * Exact second derivatives must come from the regional analytic owner. The
   * Returned first, second and mixed jets differentiate both implicit changes of coordinates.
   * Positive plane speed and polar speed are admission conditions at evaluated
   * points, not a continuous-domain certificate. A bounded per-boundary cache
   * retains at most 512 exact argument results; it contains no source samples.
   */
  export function build(id: string, family: HumanCurveFamily.Family, frame: Frame, planeMm: number): Cut {
    if (!id || !Number.isFinite(planeMm) || ![frame.originMm, frame.normal, frame.u, frame.v].every(finite) ||
      [frame.normal, frame.u, frame.v].some((axis: HumanCurve.Vector): boolean => Math.abs(dot(axis, axis)-1) > 1e-10) ||
      Math.max(Math.abs(dot(frame.normal, frame.u)), Math.abs(dot(frame.normal, frame.v)), Math.abs(dot(frame.u, frame.v))) > 1e-10) throw new Error("Plane cuts require a finite orthonormal physical chart");
    const low: number = family.intervals[0]!.startMm, high: number = family.intervals.at(-1)!.endMm;
    const origin: HumanCurve.Vector = add(frame.originMm, scale(frame.normal, planeMm));
    const cache: Map<number, Sample> = new Map();
    const seam: number = angle(cut(0));
    return { boundary: { id, unit: "radians", start: 0, end: 2*Math.PI,
      evaluate: (phase: number): HumanCurve.Vector => sample(phase).jet.positionMm,
      derivative: (phase: number): HumanCurve.Vector => sample(phase).jet.phaseDerivativeMmPerRadian },
      jet: (phase: number): HumanCurveFamily.Jet => sample(phase).jet,
      sourceParameters: (phase: number): ReturnType<Cut["sourceParameters"]> => { const value: Sample = sample(phase); return { stationMm: value.stationMm, phaseRadians: value.originalPhase, stationDerivativePerRadian: value.stationDerivativePerRadian, phaseDerivativePerRadian: value.phaseDerivativePerRadian }; },
    };

    function cut(phase: number): Raw {
      let a: number = low, b: number = high;
      const first: number = dot(sub(family.evaluate(a, phase), origin), frame.normal), last: number = dot(sub(family.evaluate(b, phase), origin), frame.normal);
      if (!(first <= 0 && last >= 0)) throw new Error("Common plane lies outside the original shaft domain: " + id);
      let station: number = first === 0 ? a : last === 0 ? b : a+(b-a)*(-first)/(last-first);
      for (let iteration: number = 0; iteration < 80; iteration++) {
        const value: HumanCurveFamily.Jet = family.jet(station, phase);
        const c: number = dot(frame.normal, value.longitudinalDerivative);
        if (!(c > 0 && Number.isFinite(c))) throw new Error("Source surface is not monotone across the common plane: " + id);
        const error: number = dot(sub(value.positionMm, origin), frame.normal);
        if (Math.abs(error) <= 64*Number.EPSILON*Math.max(1, Math.hypot(...value.positionMm), Math.hypot(...origin))) return { stationMm: station, phase, value };
        if (error < 0) a = station; else b = station;
        const newton: number = station-error/c;
        const next: number = newton > a && newton < b ? newton : a+(b-a)/2;
        if (next === station || next === a || next === b) throw new Error("Implicit plane intersection exhausted physical resolution: " + id);
        station = next;
      }
      throw new Error("Implicit plane intersection exceeded its finite solve budget: " + id);
    }

    function sample(request: number): Sample {
      if (!Number.isFinite(request)) throw new Error("Plane boundary phase must be finite");
      const phase: number = ((request % (2*Math.PI))+2*Math.PI) % (2*Math.PI);
      const previous: Sample | undefined = cache.get(phase);
      if (previous !== undefined) return previous;
      const period: number = 2*Math.PI;
      const target: number = seam+(((phase-seam)%period)+period)%period;
      let a: number = 0, b: number = 2*Math.PI, psi: number = target-seam;
      let raw: Raw | undefined;
      for (let iteration: number = 0; iteration < 80; iteration++) {
        raw = cut(psi);
        let actual: number = angle(raw);
        if (actual < seam) actual += 2*Math.PI;
        const speed: number = polarSpeed(raw);
        const error: number = actual-target;
        if (Math.abs(error) <= 64*Number.EPSILON*Math.max(1, Math.abs(target))) break;
        if (error < 0) a = psi; else b = psi;
        const newton: number = psi-error/speed;
        const next: number = newton > a && newton < b ? newton : a+(b-a)/2;
        if (next === psi || iteration === 79) throw new Error("Polar inverse exhausted its finite monotone bracket: " + id);
        psi = next;
      }
      if (raw === undefined) throw new Error("Polar inverse produced no original surface point");
      const value: HumanCurveFamily.Jet = transform(raw);
      const k: number = polarSpeed(raw), c: number = dot(frame.normal,raw.value.longitudinalDerivative), d: number = dot(frame.normal,raw.value.phaseDerivativeMmPerRadian);
      const result: Sample = { stationMm: raw.stationMm, originalPhase: raw.phase, jet: value, stationDerivativePerRadian: -d/(c*k), phaseDerivativePerRadian: 1/k };
      if (cache.size === 512) cache.delete(cache.keys().next().value!);
      cache.set(phase, result);
      return result;
    }

    function angle(raw: Raw): number { const q: HumanCurve.Vector = sub(raw.value.positionMm, origin); return Math.atan2(dot(q, frame.v), dot(q, frame.u)); }
    function polarSpeed(raw: Raw): number {
      const q: HumanCurve.Vector = sub(raw.value.positionMm, origin), fs: HumanCurve.Vector = raw.value.longitudinalDerivative, fp: HumanCurve.Vector = raw.value.phaseDerivativeMmPerRadian;
      const c: number = dot(frame.normal, fs), d: number = dot(frame.normal, fp), tangent: HumanCurve.Vector = add(fp, scale(fs, -d/c));
      const radiusSquared: number = dot2(q, q), speed: number = det2(q, tangent)/radiusSquared;
      if (!(radiusSquared > 0 && speed > 0 && Number.isFinite(speed))) throw new Error("Common polar boundary is not admitted as a regular star curve: " + id);
      return speed;
    }
    function transform(raw: Raw): HumanCurveFamily.Jet {
      const j: HumanCurveFamily.Jet = raw.value;
      if (j.longitudinalSecondDerivative === undefined || j.phaseSecondDerivativeMmPerRadianSquared === undefined) throw new Error("Implicit plane jets require exact regional second derivatives: " + id);
      const fs: HumanCurve.Vector = j.longitudinalDerivative, fp: HumanCurve.Vector = j.phaseDerivativeMmPerRadian;
      const c: number = dot(frame.normal, fs), d: number = dot(frame.normal, fp), a: number = -d/c;
      const t: HumanCurve.Vector = add(fp, scale(fs, a));
      const aa: HumanCurve.Vector = add(j.longitudinalPhaseDerivativePerRadian, scale(j.longitudinalSecondDerivative, a));
      const bb: HumanCurve.Vector = add(j.phaseSecondDerivativeMmPerRadianSquared, scale(j.longitudinalPhaseDerivativePerRadian, a));
      const cp: number = dot(frame.normal, aa), dp: number = dot(frame.normal, bb), ap: number = -(dp*c-d*cp)/(c*c);
      const tp: HumanCurve.Vector = add(add(bb, scale(aa, a)), scale(fs, ap));
      const lVector: HumanCurve.Vector = scale(fs, 1/c), lp: HumanCurve.Vector = sub(scale(aa, 1/c), scale(fs, cp/(c*c)));
      const q: HumanCurve.Vector = sub(j.positionMm, origin), radiusSquared: number = dot2(q, q), k: number = polarSpeed(raw);
      const l: number = det2(q, sub(lVector, frame.normal))/radiusSquared;
      const kp: number = (det2(q, tp)-2*k*dot2(q, t))/radiusSquared;
      const llp: number = (det2(t, sub(lVector, frame.normal))+det2(q, lp)-2*l*dot2(q, t))/radiusSquared;
      const hs: number = det2(q,fs)/radiusSquared, hp: number = det2(q,fp)/radiusSquared, determinant: number = c*k;
      const along: [number,number] = [hp/determinant,-hs/determinant], around: [number,number] = [-d/determinant,c/determinant];
      // For C=(normal distance, polar angle), differentiate C(F(x(y)))=y
      // twice: x_ab=-DC^-1 D2C[x_a,x_b]. No source third jet is needed.
      const second: (a: [number,number],b: [number,number]) => HumanCurve.Vector = (a: [number,number],b: [number,number]): HumanCurve.Vector => {
        const sourceHessian: HumanCurve.Vector = add(add(scale(j.longitudinalSecondDerivative!,a[0]*b[0]),scale(j.longitudinalPhaseDerivativePerRadian,a[0]*b[1]+a[1]*b[0])),scale(j.phaseSecondDerivativeMmPerRadianSquared!,a[1]*b[1]));
        const av: HumanCurve.Vector = add(scale(fs,a[0]),scale(fp,a[1])), bv: HumanCurve.Vector = add(scale(fs,b[0]),scale(fp,b[1]));
        const normalHessian: number = dot(frame.normal,sourceHessian);
        const polarHessian: number = det2(q,sourceHessian)/radiusSquared-(det2(q,av)*dot2(q,bv)+det2(q,bv)*dot2(q,av))/(radiusSquared*radiusSquared);
        const stationSecond: number = (-hp*normalHessian+d*polarHessian)/determinant;
        const phaseSecond: number = (hs*normalHessian-c*polarHessian)/determinant;
        return add(add(sourceHessian,scale(fs,stationSecond)),scale(fp,phaseSecond));
      };
      return { positionMm: j.positionMm, longitudinalDerivative: sub(lVector, scale(t, l/k)), phaseDerivativeMmPerRadian: scale(t, 1/k),
        longitudinalPhaseDerivativePerRadian: scale(sub(sub(lp, scale(tp, l/k)), scale(t, (llp*k-l*kp)/(k*k))), 1/k), longitudinalSecondDerivative: second(along,along), phaseSecondDerivativeMmPerRadianSquared: second(around,around) };
    }
    function dot2(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return dot(a, frame.u)*dot(b, frame.u)+dot(a, frame.v)*dot(b, frame.v); }
    function det2(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return dot(a, frame.u)*dot(b, frame.v)-dot(a, frame.v)*dot(b, frame.u); }
  }
  interface Raw { stationMm: number; phase: number; value: HumanCurveFamily.Jet; }
  interface Sample { stationMm: number; originalPhase: number; jet: HumanCurveFamily.Jet; stationDerivativePerRadian:number;phaseDerivativePerRadian:number; }
  function finite(a: HumanCurve.Vector): boolean { return a.length === 3 && a.every(Number.isFinite); }
  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function scale(a: HumanCurve.Vector, s: number): HumanCurve.Vector { return [a[0]*s,a[1]*s,a[2]*s]; }
  function add(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
  function sub(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
}
