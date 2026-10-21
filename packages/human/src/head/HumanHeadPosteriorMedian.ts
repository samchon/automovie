import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";

/** A single physical-Y posterior curve and cross direction are shared by both halves. */
export namespace HumanHeadPosteriorMedian {
  type Vector = HumanCurve.Vector;

  /** The main-owned actual posterior contact on the common support sagittal datum. */
  export interface Top {
    /** Exact existing full-cap point, not a source sample or averaged half endpoint. */
    positionMm: Vector;
    /** Exact derivative along the existing meridian-station mm. */
    derivativeS: Vector;
    /** Exact complete cap along derivative in its existing canonical parameter. */
    tangent: Vector;
    /** Mixed derivative of that same tangent along meridian station mm. */
    tangentDerivativeS: Vector;
    /** Independent physical meridian gauge. */
    stationUnit: "meridian-station-mm";
  }

  /** Two common source-identified curvatures, with actual endpoint jets held hard. */
  export interface Law {
    /** Exact dataset and correspondence selecting both common source curvatures. */
    kind: "source19-posterior-median-quadratic-v1";
    /** Dimensionless X curvature in head-length units per normalized eye-to-crown Y². */
    forwardCurvature: number;
    /** Dimensionless dX/dZ curvature per normalized eye-to-crown Y². */
    crossCurvature: number;
    /** Complete source fit/person-omission/target-transport evidence SHA256. */
    evidenceSha256: string;
  }

  /** Actual shared frame and main-selected whole median domain, never specimen coordinates. */
  export interface Input {
    /** Same common HeadFrame support Z; its anatomical meaning remains unqualified. */
    sagittalZmm: number;
    /** Existing physical forward head length. */
    headLengthMm: number;
    /** Existing common crownY minus eyeY, positive millimetres. */
    eyeToCrownMm: number;
    /** Main-selected lower edge of the shared physical-Y authority. */
    lowerYmm: number;
    /** Main-owned actual complete-cap median contact and full mixed jet. */
    top: Top;
    /** One pooled source law, with no implicit zero default. */
    law: Law;
  }

  /** Both hemisphere charts retain these same actual objects and exact derivatives. */
  export interface Result {
    /** One full posterior generating curve with physical world Y as its parameter. */
    boundary: HumanSurface.Boundary;
    /** Exact d²P/dY². */
    alongSecond: (worldYmm: number) => Vector;
    /** Fixed-Y dP/dZ direction and its exact Y derivative. */
    transverse: (worldYmm: number) => { derivativeZ: Vector; mixedDerivativeZY: Vector };
    /** Source correspondence, transport and missing-neighbor limitations. */
    limitations: string[];
  }

  /**
   * The original full transverse functions intersect the same registered native
   * head-support sagittal datum. All roots precede unique rear-Xmin qualification;
   * no canthal-back ordering is assumed. Nineteen source layers identify the
   * common forward/cross curvature after source upper endpoint conditions.
   *
   * Product upper P, dX/dY, dX/dZ and d²X/(dZ dY) are injected exact fields. The
   * full Jacobians retain the existing physical station and cap tangent units.
   * These replace the conditional source slope estimates; this transport is
   * separately measured and is not claimed as unseen-person prediction.
   */
  export function build(input: Input): Result {
    const t: Top = input.top, law: Law = input.law;
    if (t.stationUnit !== "meridian-station-mm" ||
      law.kind !== "source19-posterior-median-quadratic-v1" ||
      !/^[a-f0-9]{64}$/.test(law.evidenceSha256) ||
      ![input.sagittalZmm,input.headLengthMm,input.eyeToCrownMm,input.lowerYmm,
        law.forwardCurvature,law.crossCurvature].every(Number.isFinite) ||
      ![t.positionMm,t.derivativeS,t.tangent,t.tangentDerivativeS].every(
        (v: Vector): boolean => v.length === 3 && v.every(Number.isFinite)) ||
      !(input.headLengthMm > 0 && input.eyeToCrownMm > 0 &&
        t.positionMm[1] > input.lowerYmm && t.derivativeS[1] > 0) || t.tangent[2] === 0)
      throw new Error("Posterior median requires one actual full-cap physical jet and a bound common law");
    compatible(t.positionMm[2],input.sagittalZmm,"upper sagittal point");
    compatible(t.derivativeS[2],0,"upper fixed-sagittal longitudinal derivative");
    if (t.tangent[1] !== 0)
      throw new Error("The top median mixed port requires an exactly horizontal cap tangent");
    const height: number = input.eyeToCrownMm, length: number = input.headLengthMm;
    const upperY: number = t.positionMm[1], slope: number = t.derivativeS[0]/t.derivativeS[1];
    // At this horizontal top PuY=0. Its station derivative need not vanish.
    // The full fixed-Y readdressing contributes -Js*(JsuY/JsY).
    const crossS: Vector = t.tangentDerivativeS.map((value: number,i: number): number =>
      value-t.derivativeS[i]!*t.tangentDerivativeS[1]/t.derivativeS[1]) as Vector;
    const k: number = t.tangent[0]/t.tangent[2];
    const ky: number = (crossS[0]*t.tangent[2]-t.tangent[0]*crossS[2])/
      (t.tangent[2]*t.tangent[2]*t.derivativeS[1]);
    const evaluate: (y: number) => {p: Vector;py: Vector;k: number;ky: number} =
      (y: number): {p: Vector;py: Vector;k: number;ky: number} => {
        if (!(Number.isFinite(y) && y >= input.lowerYmm && y <= upperY))
          throw new Error("Posterior median address exceeds its main-owned physical-Y domain");
        const d: number = y-upperY, v: number = d/height;
        return {p:y === upperY ? t.positionMm :
          [t.positionMm[0]+slope*d+length*law.forwardCurvature*v*v,y,input.sagittalZmm],
          py:[slope+2*length*law.forwardCurvature*d/(height*height),1,0],
          k:k+ky*d+law.crossCurvature*v*v,
          ky:ky+2*law.crossCurvature*d/(height*height)};
      };
    return {
      boundary:{id:"head.posterior.shared-median",start:input.lowerYmm,end:upperY,unit:"world-Y-mm",
        evaluate:(y: number): Vector => evaluate(y).p,
        derivative:(y: number): Vector => evaluate(y).py},
      alongSecond:(y: number): Vector => {
        evaluate(y);return [2*length*law.forwardCurvature/(height*height),0,0];
      },
      transverse:(y: number): {derivativeZ: Vector;mixedDerivativeZY: Vector} => {
        const j: ReturnType<typeof evaluate> = evaluate(y);
        return {derivativeZ:[j.k,0,1],mixedDerivativeZY:[j.ky,0,0]};
      },
      limitations:[
        "The support sagittal datum is geometric; it is not a certified anatomical midsagittal plane or pose correction",
        "Source19 upper points and source conditional slopes identify two pooled curvatures; actual top two-jet transport remains a separate validation",
        "The entire original source37 intervals,19 root sets, physical h and one-sided C0 jets remain in external evidence; no specimen data is consumed at runtime",
        "One median object and one physical dP/dZ authority serve both halves; their different source V gauges are never aliased or averaged",
        "The lower endpoint is a common-law prediction and does not invent an occipital, ear, jaw or neck join",
        "No whole-head likeness, arbitrary q support, immersion, normal/contact or matched-render success is asserted by this pending curve",
      ],
    };
  }

  function compatible(a: number,b: number,name: string): void {
    if (Math.abs(a-b) > 128*Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b)))
      throw new Error("Posterior median incompatible "+name+"; reidentify the common boundary before assembly");
  }
}
