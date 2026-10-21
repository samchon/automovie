import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanAnkleGuide } from "./HumanAnkleGuide";

/** Scalar guide laws retain both original physical plane equations identically. */
export namespace HumanAnklePencilGuide {
  /** Actual generated port planes and the single shared acquisition guide plane. */
  export interface Planes {
    /** Directed incoming unit normal, with the source registration unchanged. */
    incomingNormal: HumanCurve.Vector;
    /** Incoming feature plane's absolute dot-coordinate in millimetres. */
    incomingCoordinateMm: number;
    /** Directed outgoing unit normal, with the source registration unchanged. */
    outgoingNormal: HumanCurve.Vector;
    /** Outgoing feature plane's absolute dot-coordinate in millimetres. */
    outgoingCoordinateMm: number;
    /** Unit normal of the actual common forward-guide plane. */
    guidePlaneNormal: HumanCurve.Vector;
    /** Guide plane's absolute dot-coordinate in millimetres. */
    guidePlaneCoordinateMm: number;
  }

  /** Full ascending powers in the existing dimensionless tau, with no degree
   * reduction. G(tau)=numeratorMm(tau)/denominator(tau) in real arithmetic.
   * Arrays and each world coefficient triple are frozen. Binary64 expansion
   * can differ from the original evaluator by roundoff, including its exact
   * endpoint return branches; the original boundary and jets remain authority.
   */
  export interface RationalPowerCoefficients {
    /** World numerator powers in mm, through degree 11 or 15, including zeros. */
    readonly numeratorMm: readonly Readonly<HumanCurve.Vector>[];

    /** Dimensionless [qc,qb,qa] powers of the original quadratic E dot E. */
    readonly denominator: readonly number[];
  }

  /** Both incident skin charts and construction consume this exact boundary. */
  export interface Result {
    /** One world curve with dimensionless physical pencil coordinate tau. */
    boundary: HumanSurface.Boundary;
    /** Analytic world second derivative, in mm per tau squared. */
    secondDerivative: (tau: number) => HumanCurve.Vector;
    /** The same actual generated endpoint objects supplied by the caller. */
    endpoints: HumanAnkleGuide.Endpoints;
    /** Degree of the scalar z approximation; the world curve is rational. */
    scalarPolynomialDegree: 8 | 12;
    /** Upper degree of the rational world numerator. */
    worldNumeratorDegreeUpper: 11 | 15;
    /** The unnormalised line frame has a quadratic rational denominator. */
    worldDenominatorDegree: 2;
    /** Frozen full rational expansion of this same scalar and line-frame law.
     * This is an inspection representation, not a second curve evaluator.
     */
    readonly rationalPowerCoefficients: RationalPowerCoefficients;
    /** Exact real-arithmetic quadratic minimum; no interval rounding certificate. */
    planeDenominatorLowerBound: number;
    /** Actual distal scalar jet divided by the endpoint chord length. */
    distalScalarJetMetric: number;
    /** Declared extrapolation flag; no clamp or fallback changes the law. */
    outsideObservedHeelMetricRange: boolean;
    /** Conditional source errors and unimplemented skin qualifications. */
    limitations: string[];
  }

  /**
   * Intersect N(tau).P=c(tau) with Ng.P=cg using an unnormalised line frame.
   * E=Ng cross N, D=E.E, A=N-Ng(Ng.N), f=c-N.P0, O=P0+A*f/D.
   * G=O+E*z therefore consumes both planes without a point projection or weld.
   * z is endpoint-jet Hermite plus a pooled zero-value/zero-first-jet residual.
   * Original source cubic degrees, physical h and native phases stay intact;
   * only the explicitly declared generated scalar law is approximated here.
   */
  export function build(
    id: string,
    branch: "dorsal" | "heel-plantar",
    planes: Planes,
    endpoints: HumanAnkleGuide.Endpoints,
  ): Result {
    const n0: HumanCurve.Vector = planes.incomingNormal;
    const n1: HumanCurve.Vector = planes.outgoingNormal;
    const ng: HumanCurve.Vector = planes.guidePlaneNormal;
    const p0: HumanCurve.Vector = endpoints.start.pointMm;
    const p1: HumanCurve.Vector = endpoints.end.pointMm;
    const d0: HumanCurve.Vector = endpoints.start.derivativeTauMm;
    const d1: HumanCurve.Vector = endpoints.end.derivativeTauMm;
    if (![n0,n1,ng,p0,p1,d0,d1].every((v: HumanCurve.Vector): boolean => v.every(Number.isFinite)) ||
        ![planes.incomingCoordinateMm,planes.outgoingCoordinateMm,planes.guidePlaneCoordinateMm].every(Number.isFinite) ||
        [n0,n1,ng].some((v: HumanCurve.Vector): boolean => Math.abs(Math.hypot(...v)-1) > 1e-10))
      throw new Error("Pencil guides require finite actual endpoint jets and unit physical plane normals");
    const dn: HumanCurve.Vector = subtract(n1,n0);
    const dc: number = planes.outgoingCoordinateMm-planes.incomingCoordinateMm;
    const ep: HumanCurve.Vector = cross(ng,dn);
    const e0: HumanCurve.Vector = cross(ng,n0);
    const qa: number = dot(ep,ep);
    const qb: number = 2*dot(e0,ep);
    const qc: number = dot(e0,e0);
    const vertex: number = qa > 0 ? -qb/(2*qa) : -1;
    const minimum: number = Math.min(qc,qa+qb+qc,vertex > 0 && vertex < 1 ? qa*vertex*vertex+qb*vertex+qc : Infinity);
    if (!(minimum > 0)) throw new Error("The actual guide and pencil planes have a singular line frame");
    const length: number = Math.hypot(...subtract(p1,p0));
    if (!(length > 0 && Number.isFinite(length))) throw new Error("Pencil guide port endpoints must be distinct");
    const endpointScalars: number[][] = [];
    for (const end of [0,1] as const) {
      const p: HumanCurve.Vector = end === 0 ? p0 : p1;
      const d: HumanCurve.Vector = end === 0 ? d0 : d1;
      const n: HumanCurve.Vector = end === 0 ? n0 : n1;
      const c: number = end === 0 ? planes.incomingCoordinateMm : planes.outgoingCoordinateMm;
      const tolerance: number = 512*Number.EPSILON*Math.max(1,Math.hypot(...p),Math.abs(c),Math.abs(planes.guidePlaneCoordinateMm),Math.hypot(...d));
      if (Math.abs(dot(n,p)-c) > tolerance || Math.abs(dot(ng,p)-planes.guidePlaneCoordinateMm) > tolerance ||
          Math.abs(dot(ng,d)) > tolerance || Math.abs(dot(n,d)+dot(dn,p)-dc) > tolerance)
        throw new Error("A pencil guide endpoint or tau jet disagrees with the actual two-plane authority");
      const f: Frame = frame(end);
      const z: number = dot(subtract(p,f.o),f.e)/f.denominator;
      const zd: number = dot(subtract(subtract(d,f.od),scale(ep,z)),f.e)/f.denominator;
      endpointScalars.push([z,zd]);
    }
    const metric: number = endpointScalars[1]![1]!/length;
    const normalized: number = (metric+0.10217096378497571)/0.11987760068311205;
    const coefficients: readonly number[] = branch === "dorsal" ? dorsal : heel.map((v: readonly number[]): number => v[0]!+normalized*v[1]!);
    const boundary: HumanSurface.Boundary = {id,unit:"normalized",start:0,end:1,
      evaluate:(tau: number): HumanCurve.Vector => jet(tau,0),derivative:(tau: number): HumanCurve.Vector => jet(tau,1)};
    return {boundary,secondDerivative:(tau: number): HumanCurve.Vector => jet(tau,2),endpoints,
      scalarPolynomialDegree:branch === "dorsal" ? 8 : 12,worldNumeratorDegreeUpper:branch === "dorsal" ? 11 : 15,
      worldDenominatorDegree:2,rationalPowerCoefficients:rationalPowers(),planeDenominatorLowerBound:minimum,distalScalarJetMetric:metric,
      outsideObservedHeelMetricRange:branch === "heel-plantar" && (metric < -0.22950723942509074 || metric > 0.053646051960087995),
      limitations:[
        "Tau is the actual plane-pencil coordinate a/(a+b), with a=nIncoming.P-cIncoming and b=cOutgoing-nOutgoing.P; the guide plane and both port orientations are unchanged",
        "The pooled scalar law preserves supplied endpoint P/Dtau in real arithmetic and its rational frame preserves both plane equations; its positive quadratic denominator does not certify skin regularity or embedding",
        "Dorsal conditional train positional RMS is 0.263 mm; whole-person held-out RMS is 0.185-0.554 mm and observed maximum is 1.150 mm",
        "Heel conditional train positional RMS is 1.298 mm; held-out RMS is 1.727-2.715 mm and observed maximum is 10.168 mm; scalar-jet world RMS is 19.77 mm per tau on the fitted sources",
        "Heel residual degree eight was selected over degree six for lower held-out mean and scalar-jet RMS; its worst held-out observed maximum increases by 0.10 mm",
        "Holdout retains actual source endpoint jets and planes; four-person associations do not identify independent parameter causality, unseen morphology or certified whole-curve bounds",
        "Source phase h remains physical millimetres; generated tau is dimensionless. Source lateral mixed jets, compatible surface twists and skin domains remain separate common-owner qualifications",
      ]};

    function frame(tau: number): Frame {
      const n: HumanCurve.Vector = add(n0,scale(dn,tau));
      const a: HumanCurve.Vector = subtract(n,scale(ng,dot(ng,n)));
      const ap: HumanCurve.Vector = subtract(dn,scale(ng,dot(ng,dn)));
      const e: HumanCurve.Vector = cross(ng,n);
      const denominator: number = dot(e,e);
      const dp: number = 2*dot(e,ep);
      const ddp: number = 2*dot(ep,ep);
      const f: number = planes.incomingCoordinateMm+tau*dc-dot(n,p0);
      const fp: number = dc-dot(dn,p0);
      const q: number = f/denominator;
      const qp: number = fp/denominator-f*dp/(denominator*denominator);
      const qpp: number = -2*fp*dp/(denominator*denominator)-f*ddp/(denominator*denominator)+2*f*dp*dp/(denominator*denominator*denominator);
      return {o:add(p0,scale(a,q)),od:add(scale(ap,q),scale(a,qp)),odd:add(scale(ap,2*qp),scale(a,qpp)),e,denominator};
    }

    /** Expand the original endpoint Hermite and every shifted Legendre mode.
     * z=Hermite+length*tau^2*(1-tau)^2*sum(c_k*P_k(2*tau-1)).
     * With A=A0+tau*A1, f=f0+tau*f1 and E=e0+tau*ep, publish
     * numerator=p0*D+A*f+E*z*D and D=qc+qb*tau+qa*tau^2.
     * Fixed degree at most 15 costs O(K^2) work and O(K) retained powers for
     * K<=9 modes. No sampling, derivative fitting or source curve is involved.
     */
    function rationalPowers(): RationalPowerCoefficients {
      const modes: number[][] = [[1],[-1,2]];
      for (let k: number = 1; k < coefficients.length-1; k++) {
        const previous: readonly number[] = modes[k-1]!;
        const current: readonly number[] = modes[k]!;
        const next: number[] = new Array<number>(k+2).fill(0);
        for (let j: number = 0; j < current.length; j++) {
          next[j]! -= (2*k+1)*current[j]!/(k+1);
          next[j+1]! += 2*(2*k+1)*current[j]!/(k+1);
        }
        for (let j: number = 0; j < previous.length; j++) next[j]! -= k*previous[j]!/(k+1);
        modes.push(next);
      }
      const start: readonly number[] = endpointScalars[0]!;
      const end: readonly number[] = endpointScalars[1]!;
      const z: number[] = new Array<number>(coefficients.length+4).fill(0);
      z[0] = start[0]!; z[1] = start[1]!;
      z[2] = 3*(end[0]!-start[0]!)-2*start[1]!-end[1]!;
      z[3] = 2*(start[0]!-end[0]!)+start[1]!+end[1]!;
      for (let k: number = 0; k < coefficients.length; k++) {
        const mode: readonly number[] = modes[k]!;
        const factor: number = length*coefficients[k]!;
        for (let j: number = 0; j < mode.length; j++) {
          const value: number = factor*mode[j]!;
          z[j+2]! += value; z[j+3]! -= 2*value; z[j+4]! += value;
        }
      }
      const denominator: readonly number[] = Object.freeze([qc,qb,qa]);
      const a0: HumanCurve.Vector = subtract(n0,scale(ng,dot(ng,n0)));
      const a1: HumanCurve.Vector = subtract(dn,scale(ng,dot(ng,dn)));
      const f0: number = planes.incomingCoordinateMm-dot(n0,p0);
      const f1: number = dc-dot(dn,p0);
      const numerator: HumanCurve.Vector[] = Array.from({length:z.length+3},(): HumanCurve.Vector => [0,0,0]);
      for (let j: number = 0; j < denominator.length; j++) numerator[j] = scale(p0,denominator[j]!);
      numerator[0] = add(numerator[0]!,scale(a0,f0));
      numerator[1] = add(numerator[1]!,add(scale(a0,f1),scale(a1,f0)));
      numerator[2] = add(numerator[2]!,scale(a1,f1));
      const line: readonly HumanCurve.Vector[] = [e0,ep];
      for (let j: number = 0; j < z.length; j++)
        for (let k: number = 0; k < denominator.length; k++)
          for (let e: number = 0; e < line.length; e++) {
            const power: number = j+k+e;
            numerator[power] = add(numerator[power]!,scale(line[e]!,z[j]!*denominator[k]!));
          }
      if (!denominator.every(Number.isFinite) || numerator.some((value: HumanCurve.Vector): boolean => !value.every(Number.isFinite)))
        throw new Error("The full rational power expansion is not representable in binary64 arithmetic");
      const numeratorMm: readonly Readonly<HumanCurve.Vector>[] = Object.freeze(numerator.map(
        (value: HumanCurve.Vector): Readonly<HumanCurve.Vector> => Object.freeze(value),
      ));
      return Object.freeze({numeratorMm,denominator});
    }

    function jet(tau: number, order: 0 | 1 | 2): HumanCurve.Vector {
      if (!Number.isFinite(tau) || tau < 0 || tau > 1) throw new Error("Pencil guide tau lies outside [0,1]");
      if (order === 0 && tau === 0) return p0;
      if (order === 0 && tau === 1) return p1;
      if (order === 1 && tau === 0) return d0;
      if (order === 1 && tau === 1) return d1;
      const t2: number = tau*tau;
      const h: readonly number[][] = [[2*t2*tau-3*t2+1,t2*tau-2*t2+tau,-2*t2*tau+3*t2,t2*tau-t2],
        [6*t2-6*tau,3*t2-4*tau+1,-6*t2+6*tau,3*t2-2*tau],[12*tau-6,6*tau-4,-12*tau+6,6*tau-2]];
      const end: readonly number[] = [...endpointScalars[0]!,...endpointScalars[1]!];
      const z: number[] = h.map((row: readonly number[]): number => row.reduce((sum: number,v: number,i: number): number => sum+v*end[i]!,0));
      const w: number = t2*(1-tau)*(1-tau);
      const wd: number = 2*tau-6*t2+4*t2*tau;
      const wdd: number = 2-12*tau+12*t2;
      const modes: readonly (readonly number[])[] = legendre(tau,coefficients.length-1);
      for (let k: number = 0; k < coefficients.length; k++) {
        const p: readonly number[] = modes[k]!;
        const c: number = length*coefficients[k]!;
        z[0]! += c*w*p[0]!; z[1]! += c*(wd*p[0]!+w*p[1]!); z[2]! += c*(wdd*p[0]!+2*wd*p[1]!+w*p[2]!);
      }
      const f: Frame = frame(tau);
      return order === 0 ? add(f.o,scale(f.e,z[0]!)) : order === 1 ? add(f.od,add(scale(ep,z[0]!),scale(f.e,z[1]!))) :
        add(f.odd,add(scale(ep,2*z[1]!),scale(f.e,z[2]!)));
    }
  }

  interface Frame { o: HumanCurve.Vector; od: HumanCurve.Vector; odd: HumanCurve.Vector; e: HumanCurve.Vector; denominator: number }
  function dot(a: HumanCurve.Vector,b: HumanCurve.Vector): number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function add(a: HumanCurve.Vector,b: HumanCurve.Vector): HumanCurve.Vector { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
  function subtract(a: HumanCurve.Vector,b: HumanCurve.Vector): HumanCurve.Vector { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
  function scale(a: HumanCurve.Vector,s: number): HumanCurve.Vector { return [a[0]*s,a[1]*s,a[2]*s]; }
  function cross(a: HumanCurve.Vector,b: HumanCurve.Vector): HumanCurve.Vector { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
  function legendre(tau: number,degree: number): readonly (readonly number[])[] {
    const x: number = 2*tau-1;
    const result: number[][] = [[1,0,0]];
    if (degree > 0) result.push([x,2,0]);
    for (let k: number = 1; k < degree; k++) {
      const p: readonly number[] = result[k]!; const q: readonly number[] = result[k-1]!; const a: number = 2*k+1;
      result.push([(a*x*p[0]!-k*q[0]!)/(k+1),(a*(2*p[0]!+x*p[1]!)-k*q[1]!)/(k+1),(a*(4*p[1]!+x*p[2]!)-k*q[2]!)/(k+1)]);
    }
    return result;
  }
  const dorsal: readonly number[] = [-0.8700123587189156,0.7290453473466214,0.228304439788842,0.05977519517819108,-0.12568465059445866];
  const heel: readonly (readonly number[])[] = [
    [1.288011677573223,0.4931968662301694],[3.580039837216826,-1.4022108354610767],[-1.8864690117544005,-1.6938452710656542],
    [-2.6871800450814884,-1.077378262663546],[-1.7777097620921052,0.4624786067398429],[1.024761168989827,-1.1438581145022015],
    [-0.6678001571275646,-1.1611450117990316],[-0.5992636079341573,-1.5410985431725157],[-1.2184149181175663,-0.22875354646597287],
  ];
}
