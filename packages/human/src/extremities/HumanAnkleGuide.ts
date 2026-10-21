import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";

/** Conditional ankle guides consume the common owner's actual port jets. */
export namespace HumanAnkleGuide {
  /** The caller retains this actual shared endpoint and its physical tau jet. */
  export interface Endpoint {
    /** Shared generated position in world millimetres. */
    readonly pointMm: HumanCurve.Vector;
    /** Shared generated derivative in mm per dimensionless tau. */
    readonly derivativeTauMm: HumanCurve.Vector;
  }

  /** Endpoint objects remain immutable after the guide authority is built. */
  export interface Endpoints {
    /** Exact proximal port and guide-plane intersection, at tau zero. */
    readonly start: Endpoint;
    /** Exact distal port and guide-plane intersection, at tau one. */
    readonly end: Endpoint;
  }

  /** This curve defines no surface cross-jet, corner twist or regular patch. */
  export interface Result {
    /** Both incident patches and construction consume this same object. */
    boundary: HumanSurface.Boundary;
    /** Analytic second derivative in mm per dimensionless tau squared. */
    secondDerivative: (tau: number) => HumanCurve.Vector;
    /** The actual endpoint objects supplied by the common boundary owner. */
    endpoints: Endpoints;
    /** Explicit degree of the generated polynomial approximation. */
    polynomialDegree: 8 | 10;
    /** Endpoint chord, projected incoming axis and reflected transverse axis. */
    frame: readonly HumanCurve.Vector[];
    /** Physical length of the actual endpoint chord, in millimetres. */
    chordLengthMm: number;
    /** Actual distal jet metric, independent of any invented measurement. */
    distalPlaneJet: number;
    /** Observed heel metric support; no clamp or extrapolation fallback applies. */
    outsideObservedHeelJetRange: boolean;
    /** Source approximation, conditional validation and missing surface data. */
    limitations: string[];
  }

  /**
   * Build a degree-eight dorsal or degree-ten heel/plantar common guide.
   * The common owner supplies the actual port/guide-plane intersections and
   * endpoint derivatives. With a=nIncoming.p-cIncoming and
   * b=cOutgoing-nOutgoing.p, tau=a/(a+b), those jets are T/(grad(tau).T).
   * The source guide retains its original physical cubic phase and every h;
   * this new tau polynomial is an explicit conditional approximation.
   *
   * H(tau; P0,D0,P1,D1)+L*tau^2*(1-tau)^2*sum(theta*P_k(2*tau-1))
   * preserves the supplied endpoints and first jets exactly in real arithmetic.
   * Fifty-seven pooled scalar coefficients describe both branches. The heel
   * residual also consumes the actual distal jet's chord-plane component;
   * it does not invent a heel, ankle-girth or independent parameter response.
   */
  export function build(
    id: string,
    side: "l" | "r",
    branch: "dorsal" | "heel-plantar",
    incomingAxis: HumanCurve.Vector,
    endpoints: Endpoints,
  ): Result {
    const p0: HumanCurve.Vector = endpoints.start.pointMm;
    const p1: HumanCurve.Vector = endpoints.end.pointMm;
    const d0: HumanCurve.Vector = endpoints.start.derivativeTauMm;
    const d1: HumanCurve.Vector = endpoints.end.derivativeTauMm;
    if (![p0,p1,d0,d1,incomingAxis].every((v: HumanCurve.Vector): boolean => v.every(Number.isFinite)) ||
        Math.abs(Math.hypot(...incomingAxis)-1) > 1e-10)
      throw new Error("Ankle guides require finite shared endpoint jets and a unit incoming axis");
    const chord: HumanCurve.Vector = p1.map((x: number, i: number): number => x-p0[i]!) as HumanCurve.Vector;
    const length: number = Math.hypot(...chord);
    if (!(length > 0)) throw new Error("An ankle guide requires distinct generated port endpoints");
    const e0: HumanCurve.Vector = chord.map((x: number): number => x/length) as HumanCurve.Vector;
    const projection: number = dot(incomingAxis,e0);
    const orthogonal: HumanCurve.Vector = incomingAxis.map((x: number, i: number): number => x-projection*e0[i]!) as HumanCurve.Vector;
    const planeLength: number = Math.hypot(...orthogonal);
    if (!(planeLength > 1e-10))
      throw new Error("The ankle guide chord and incoming plane cannot define the observed geometry frame");
    const e1: HumanCurve.Vector = orthogonal.map((x: number): number => x/planeLength) as HumanCurve.Vector;
    const parity: number = side === "l" ? 1 : -1;
    const e2: HumanCurve.Vector = [parity*(e0[1]*e1[2]-e0[2]*e1[1]),
      parity*(e0[2]*e1[0]-e0[0]*e1[2]),parity*(e0[0]*e1[1]-e0[1]*e1[0])];
    const frame: readonly HumanCurve.Vector[] = [e0,e1,e2];
    const metric: number = dot(d1,e1)/length;
    const normalized: number = (metric+0.930414172400872)/0.09095389157070644;
    const modes: HumanCurve.Vector[] = branch === "dorsal" ? dorsal.map((v: readonly number[]): HumanCurve.Vector => [...v] as HumanCurve.Vector) :
      Array.from({length:7},(_: unknown, k: number): HumanCurve.Vector =>
        heel[2*k]!.map((x: number, i: number): number => x+normalized*heel[2*k+1]![i]!) as HumanCurve.Vector);
    const boundary: HumanSurface.Boundary = {
      id, unit:"normalized", start:0, end:1,
      evaluate:(tau: number): HumanCurve.Vector => jet(tau,0),
      derivative:(tau: number): HumanCurve.Vector => jet(tau,1),
    };
    return {boundary,secondDerivative:(tau: number): HumanCurve.Vector => jet(tau,2),endpoints,
      polynomialDegree:branch === "dorsal" ? 8 : 10,frame,chordLengthMm:length,distalPlaneJet:metric,
      outsideObservedHeelJetRange:branch === "heel-plantar" && (metric < -1.028589542312615 || metric > -0.8156861804428045),
      limitations:[
        "The eight source pairs use actual sampled shank-area-minimum and following foot-waist ports; common normalized principal stations alone do not identify these extrema",
        "Dorsal conditional train positional RMS is 0.290 mm; whole-person held-out RMS is 0.209-0.549 mm and observed quadrature maximum is 0.985 mm",
        "Heel conditional train positional RMS is 1.315 mm; whole-person held-out RMS is 1.245-2.290 mm and observed quadrature maximum is 6.703 mm",
        "Held-out errors retain that person's actual source endpoint positions and jets; exploratory model selection and these four cohorts do not establish independent parameter causality or unseen morphology prediction",
        "Maxima are numerical quadrature observations, not certified whole-curve bounds; original guide fitted-polyline upper estimates are 0.310-0.412 mm and toleranceMet is false",
        "Source lateral cross-jets, corner twists, global sheet orientation, full-surface regularity and embedding are not identified by these one-dimensional guides",
        "The common owner must verify actual generated port separation, tau domain, guide-plane correspondence and compatible shared patch jets before surface emission",
      ]};

    function jet(tau: number, order: 0 | 1 | 2): HumanCurve.Vector {
      if (!Number.isFinite(tau) || tau < 0 || tau > 1)
        throw new Error("An ankle guide is defined only on its dimensionless tau interval [0,1]");
      if (order === 0 && tau === 0) return p0;
      if (order === 0 && tau === 1) return p1;
      if (order === 1 && tau === 0) return d0;
      if (order === 1 && tau === 1) return d1;
      const t2: number = tau*tau;
      const t3: number = t2*tau;
      const h: readonly number[] = order === 0 ? [2*t3-3*t2+1,t3-2*t2+tau,-2*t3+3*t2,t3-t2] :
        order === 1 ? [6*t2-6*tau,3*t2-4*tau+1,-6*t2+6*tau,3*t2-2*tau] :
          [12*tau-6,6*tau-4,-12*tau+6,6*tau-2];
      const w: number = t2*(1-tau)*(1-tau);
      const dw: number = 2*tau-6*t2+4*t3;
      const ddw: number = 2-12*tau+12*t2;
      const basis: readonly (readonly number[])[] = legendre(tau,modes.length-1);
      const local: HumanCurve.Vector = [0,0,0];
      for (let k: number = 0; k < modes.length; k++) {
        const b: readonly number[] = basis[k]!;
        const factor: number = order === 0 ? w*b[0]! : order === 1 ? dw*b[0]!+w*b[1]! : ddw*b[0]!+2*dw*b[1]!+w*b[2]!;
        for (let axis: number = 0; axis < 3; axis++) local[axis]! += factor*modes[k]![axis]!;
      }
      return p0.map((_: number, axis: number): number => h[0]!*p0[axis]!+h[1]!*d0[axis]!+h[2]!*p1[axis]!+h[3]!*d1[axis]!+
        length*(e0[axis]!*local[0]+e1[axis]!*local[1]+e2[axis]!*local[2])) as HumanCurve.Vector;
    }
  }

  function dot(a: HumanCurve.Vector, b: HumanCurve.Vector): number {
    return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  }

  /** Shifted Legendre values and their exact first two tau derivatives. */
  function legendre(tau: number, degree: number): readonly (readonly number[])[] {
    const x: number = 2*tau-1;
    const result: number[][] = [[1,0,0]];
    if (degree > 0) result.push([x,2,0]);
    for (let k: number = 1; k < degree; k++) {
      const p: readonly number[] = result[k]!;
      const q: readonly number[] = result[k-1]!;
      const a: number = 2*k+1;
      result.push([(a*x*p[0]!-k*q[0]!)/(k+1),
        (a*(2*p[0]!+x*p[1]!)-k*q[1]!)/(k+1),
        (a*(4*p[1]!+x*p[2]!)-k*q[2]!)/(k+1)]);
    }
    return result;
  }

  // Common local-vector coefficients, in shifted Legendre order; no specimen rows.
  const dorsal: readonly (readonly number[])[] = [
    [-0.013834743521038065,0.1189889365596668,-1.0848911734841726e-14],
    [0.13545082650641413,0.3332874246536935,-7.946696991728339e-15],
    [0.14420938157924082,0.0006708461849146868,-2.2179617975101236e-14],
    [0.03491244865927762,0.09377251526268068,-1.0811478463110257e-14],
    [0.012835340419257884,-0.07957642633956934,-1.3561450310603564e-14],
  ];
  // Each mode has constant and standardized distal-plane-jet coefficient vectors.
  const heel: readonly (readonly number[])[] = [
    [-0.12160250211414259,2.4776226104428867,8.64623445974851e-16],
    [0.06537084829368511,0.5546073220703593,1.6294685182540087e-15],
    [1.086492303505178,3.326103738818304,4.070174568442434e-15],
    [0.07549359788802354,0.5306765577054333,2.8653073325026466e-16],
    [1.0072213428825014,0.3434229850783872,7.52692179043325e-15],
    [0.06347244733742309,-0.9483100642301432,-1.0453928343158399e-14],
    [-1.0758429081989016,-0.9655853672777326,2.275418457536607e-15],
    [0.5156226780549864,2.005615620752507,-3.1663517019592007e-15],
    [-0.05982733846946786,1.4609827049296271,5.636450115221816e-15],
    [0.535065249715689,0.9001917415975828,-1.219351014910161e-14],
    [-0.26250149365678954,1.9915175182433487,-1.5028469126139822e-15],
    [0.4904999697496883,1.737382329773964,-2.9887637066581767e-15],
    [0.7011315964339938,1.7314541883260435,2.168350853432047e-15],
    [0.07130256617646441,-0.49533192495850775,-4.11285904358455e-15],
  ];
}
