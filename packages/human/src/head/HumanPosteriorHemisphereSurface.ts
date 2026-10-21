import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanPosteriorCapPort } from "./HumanPosteriorCapPort";

/** A qualified outside chart retains whole cap and side functions in an intrinsic ray gauge. */
export namespace HumanPosteriorHemisphereSurface {
  type Vector = HumanCurve.Vector;
  interface Frame { m: Vector; mv: Vector; a: Vector; av: Vector; n: Vector; nv: Vector; radius: number; radiusV: number }
  interface ScalarJet { p: number; u: number; v: number; uv: number }
  interface Jet { positionMm: Vector; derivativeU: Vector; derivativeV: Vector; mixedDerivativeUV: Vector }
  interface TopJet { p: number; u: number; v: number; uv: number; pv: Vector; puv: Vector }

  /** Four dimensionless common coefficients are fitted once across all source subjects. */
  export interface Law {
    /** The fixed source correspondence and finite four-coefficient interior basis. */
    kind: "source37-posterior-median-log-radius-v1";
    /** Multipliers of U²(1-U)²(1-V)² [1,2U-1,V,(2U-1)V]. */
    interior: readonly [number,number,number,number];
    /** SHA256 of the complete source fit, person omissions and transport limitations. */
    evidenceSha256: string;
  }

  /** Main's exact physical-Y restriction of the actual front U1 function. */
  export interface Front {
    /** Same existing geometric side. */
    side: "left" | "right";
    /** Whole actual physical-Y boundary; no sampled source data is accepted. */
    boundary: HumanSurface.Boundary;
    /** Exact d²P/dY². */
    alongSecond: (worldYmm: number) => Vector;
    /** Fixed-Y canthal tangent and its exact derivative with respect to Y. */
    transverse: (worldYmm: number) => { derivativeU: Vector; mixedDerivativeUY: Vector };
  }

  /** Main's single physical-Y median authority is shared by both hemisphere charts. */
  export interface Posterior {
    /** Whole generated median curve, retained as the same object in both charts. */
    boundary: HumanSurface.Boundary;
    /** Exact d²P/dY². */
    alongSecond: (worldYmm: number) => Vector;
    /** One fixed-Y dP/dZ direction and its exact Y derivative, shared by both halves. */
    transverse: (worldYmm: number) => { derivativeZ: Vector; mixedDerivativeZY: Vector };
  }

  /** Main injects one front, median and full cap authority; this region rebuilds none. */
  export interface Input {
    /** Existing geometric side and reflection orientation. */
    side: "left" | "right";
    /** Existing actual unit inner-to-outer canthal direction. */
    normal: Vector;
    /** Same actual U1 field and its two-jet. */
    front: Front;
    /** Same generated common posterior principal consumed by the next posterior chart. */
    back: Posterior;
    /** Same whole cap object and exact physical station two-jet. */
    cap: HumanPosteriorCapPort.Result;
    /** Actual named-front-course lower Y and common forehead principal Y, millimetres. */
    lowerYmm: number;
    /** The exact same top layer used by the cap owner. */
    upperYmm: number;
    /** Source-identified common law; no specimen coefficients or zero default exist. */
    law: Law;
    /** Main-owned intrinsic addresses of the existing full nonuniform cap. */
    samplingU: readonly number[];
    /** Main-owned shared physical Y addresses, restricted to this chart's domain. */
    samplingY: readonly number[];
  }

  /** One ordinary outside chart, with all displayed curves derived from its own function. */
  export interface Result {
    /** Whole front-to-posterior-median hemisphere; the opposite chart shares the same median object. */
    patch: HumanSurface.Patch;
    /** Same endpoint authorities and generated lower prediction, for construction. */
    boundaries: HumanSurface.Boundary[];
    /** Exact main-owned full cap and angular second jet, retained without reduction. */
    cap: HumanPosteriorCapPort.Result;
    /** Exact U intrinsic-fraction / world-Y-mm two-jet, shared with the skin evaluator. */
    evaluate: (u: number,v: number) => Jet;
    /** Median outgoing field; main jointly owns tangent-plane compatibility of both halves. */
    backTransverse: (v: number) => { derivativeU: Vector; mixedDerivativeUV: Vector };
    /** Conditional source fit and topology/clinical/adjoining-surface limitations. */
    limitations: string[];
  }

  /**
   * The previous37 canthal-back arcs admit an increasing intrinsic angle. The
   * new median correspondence must separately qualify all37 arcs. Original h,
   * one-sided jets, rays and branch records remain preserved externally.
   * A positive log-radius is identified in that qualified coordinate; it is not
   * an old radial/Fourier shell copied into a missing region. Actual complete
   * cap functions remain exact and are never approximated by these polynomials.
   *
   * Front constant-height transverse direction comes from the actual Pu/Pv
   * plane and its full Puv/Pvv derivative. Both halves consume the same median
   * fixed-Y tangent direction and exact Y derivative, identified from the whole
   * source network and transported from the actual cap, never a person table.
   * Four pooled residual coefficients preserve both side first jets and
   * the cap first jet. A source-conditioned two-coefficient cap-station study
   * is kept in the fit evidence, rather than replacing the injected actual Js.
   *
   * The lower edge V0 is explicitly a common-law prediction. This regular chart
   * does not invent ear attachment or neck topology. Main must
   * jointly identify both half fields at the same actual median object; individual chart emission does not certify their common tangent plane.
   */
  export function build(input: Input): Result {
    if (input.front.side !== input.side ||
      input.front.boundary.unit !== "world-Y-mm" || input.back.boundary.unit !== "world-Y-mm" ||
      !(input.upperYmm > input.lowerYmm) || ![input.upperYmm,input.lowerYmm].every(Number.isFinite) ||
      input.front.boundary.start > input.lowerYmm || input.front.boundary.end < input.upperYmm ||
      input.back.boundary.start > input.lowerYmm || input.back.boundary.end < input.upperYmm ||
      input.cap.boundary.start !== 0 || input.cap.boundary.end !== 1 ||
      input.law.kind !== "source37-posterior-median-log-radius-v1" ||
      !/^[a-f0-9]{64}$/.test(input.law.evidenceSha256) ||
      input.law.interior.length !== 4 || !input.law.interior.every(Number.isFinite) ||
      input.samplingU.length < 2 || input.samplingU[0] !== 0 || input.samplingU.at(-1) !== 1 ||
      input.samplingU.some((u: number,i: number): boolean => !Number.isFinite(u) || (i > 0 && !(u > input.samplingU[i-1]!))) ||
      input.samplingY.length < 2 || input.samplingY[0] !== input.lowerYmm || input.samplingY.at(-1) !== input.upperYmm ||
      input.samplingY.some((y: number,i: number): boolean => !Number.isFinite(y) || (i > 0 && !(y > input.samplingY[i-1]!))) ||
      !input.normal.every(Number.isFinite) || Math.abs(dot(input.normal,input.normal)-1) > 1e-10)
      throw new Error("Outside skin requires the sole actual regular boundary owners and a bound pooled law");
    const coefficients: readonly number[] = [...input.law.interior];
    const height: number = input.upperYmm-input.lowerYmm;
    const worldY: (v: number) => number = (v: number): number =>
      v === 0 ? input.lowerYmm : v === 1 ? input.upperYmm : input.lowerYmm+height*v;
    const frame: (v: number) => Frame = (v: number): Frame => {
      const f: Vector = input.front.boundary.evaluate(worldY(v)), b: Vector = input.back.boundary.evaluate(worldY(v));
      const fv: Vector = scale(input.front.boundary.derivative(worldY(v)),height), bv: Vector = scale(input.back.boundary.derivative(worldY(v)),height);
      compatible(f[1],b[1],"front/back height");
      compatible(fv[1],bv[1],"front/back height derivative");
      compatible(f[1],worldY(v),"front physical-Y address");
      compatible(fv[1],height,"front physical-Y derivative");
      const d: Vector = subtract(b,f), dv: Vector = subtract(bv,fv), length: number = Math.hypot(d[0],d[2]);
      if (!(length > 0 && fv[1] > 0)) throw new Error("Outside chart has no positive transverse chord/course gauge");
      const e: Vector = [d[0]/length,0,d[2]/length];
      const ev: Vector = scale(subtract([dv[0],0,dv[2]],scale(e,dot(e,dv))),1/length);
      const rotated: Vector = rotate(e), orientation: number = dot(rotated,input.normal) > 0 ? 1 : -1;
      return {m:scale(add(f,b),.5),mv:scale(add(fv,bv),.5),a:scale(e,-1),av:scale(ev,-1),
        n:scale(rotated,orientation),nv:scale(rotate(ev),orientation),radius:length/2,radiusV:dot(e,dv)/2};
    };
    const upper: Frame = frame(1);
    same(input.front.boundary.evaluate(input.upperYmm),input.cap.boundary.evaluate(0),"front cap corner");
    same(input.back.boundary.evaluate(input.upperYmm),input.cap.boundary.evaluate(1),"back cap corner");
    const yv: number = height*input.front.boundary.derivative(input.upperYmm)[1];
    const trig: (u: number,f: Frame) => { r: Vector; ru: Vector; rv: Vector; ruv: Vector } =
      (u: number,f: Frame): {r: Vector;ru: Vector;rv: Vector;ruv: Vector} => {
        const t: number = Math.PI*u, c: number = u === 0 ? 1 : u === 1 ? -1 : Math.cos(t);
        const s: number = u === 0 || u === 1 ? 0 : Math.sin(t);
        return {r:add(scale(f.a,c),scale(f.n,s)),ru:scale(add(scale(f.a,-s),scale(f.n,c)),Math.PI),
          rv:add(scale(f.av,c),scale(f.nv,s)),ruv:scale(add(scale(f.av,-s),scale(f.nv,c)),Math.PI)};
      };
    const top: (u: number) => TopJet = (u: number): TopJet => {
      const t: ReturnType<typeof trig> = trig(u,upper), p: Vector = input.cap.boundary.evaluate(u);
      const pu: Vector = input.cap.boundary.derivative(u), js: ReturnType<HumanPosteriorCapPort.Result["transverse"]> = input.cap.transverse(u);
      if (!(js.derivative[1] > 0)) throw new Error("Outside cap has no positive physical station Y Jacobian");
      const lambda: number = yv/js.derivative[1], lambdaU: number = -yv*js.derivativeU[1]/(js.derivative[1]*js.derivative[1]);
      const pv: Vector = scale(js.derivative,lambda);
      const puv: Vector = add(scale(js.derivative,lambdaU),scale(js.derivativeU,lambda));
      const q: Vector = subtract(p,upper.m), r: number = dot(t.r,q), ru: number = dot(t.r,pu);
      if (!(r > 0)) throw new Error("Actual cap is outside the admitted positive intrinsic ray");
      same(p,add(upper.m,scale(t.r,r)),"whole cap ray");
      same(pv,add(upper.mv,add(scale(t.rv,r),scale(t.r,dot(t.r,subtract(pv,upper.mv))))),"whole cap station/ray gauge");
      const rv: number = dot(t.r,subtract(pv,upper.mv));
      const ruv: number = dot(t.ru,subtract(pv,upper.mv))+dot(t.r,puv);
      return {p:Math.log(r),u:ru/r,v:rv/r,uv:ruv/r-rv*ru/(r*r),pv,puv};
    };
    const slopes: (v: number,f: Frame) => [number,number,number,number] =
      (v: number,f: Frame): [number,number,number,number] => {
        const pv: Vector = scale(input.front.boundary.derivative(worldY(v)),height), pvv: Vector = scale(input.front.alongSecond(worldY(v)),height*height);
        const originalCross: ReturnType<Front["transverse"]> = input.front.transverse(worldY(v));
        const cross: {derivativeU: Vector;mixedDerivativeUV: Vector} = {
          derivativeU:originalCross.derivativeU,mixedDerivativeUV:scale(originalCross.mixedDerivativeUY,height)};
        const rate: number = cross.derivativeU[1]/pv[1];
        const rateV: number = cross.mixedDerivativeUV[1]/pv[1]-cross.derivativeU[1]*pvv[1]/(pv[1]*pv[1]);
        const k: Vector = subtract(cross.derivativeU,scale(pv,rate));
        const kv: Vector = subtract(cross.mixedDerivativeUV,add(scale(pvv,rate),scale(pv,rateV)));
        const a: number = dot(f.a,k), n: number = dot(f.n,k);
        const av: number = dot(f.av,k)+dot(f.a,kv), nv: number = dot(f.nv,k)+dot(f.n,kv);
        if (!(n > 0)) throw new Error("Actual front tangent plane does not continue into the qualified outside ray");
        const median: ReturnType<Posterior["transverse"]> = input.back.transverse(worldY(v));
        const direction: Vector = median.derivativeZ, directionV: Vector = scale(median.mixedDerivativeZY,height);
        compatible(direction[1],0,"fixed-Y median transverse direction");
        const ba: number = -dot(f.a,direction), bn: number = dot(f.n,direction);
        const bav: number = -dot(f.av,direction)-dot(f.a,directionV);
        const bnv: number = dot(f.nv,direction)+dot(f.n,directionV);
        if (bn === 0 || ![ba,bn,bav,bnv].every(Number.isFinite))
          throw new Error("The shared posterior tangent has no regular outside ray gauge");
        return [Math.PI*a/n,-Math.PI*ba/bn,
          Math.PI*(av*n-a*nv)/(n*n),-Math.PI*(bav*bn-ba*bnv)/(bn*bn)];
      };
    const base: (u: number,v: number) => ScalarJet = (u: number,v: number): ScalarJet => {
      const f: Frame = frame(v), s: [number,number,number,number] = slopes(v,f);
      const h: number[] = [u*u*u-2*u*u+u,u*u*u-u*u], d: number[] = [3*u*u-4*u+1,3*u*u-2*u];
      return {p:Math.log(f.radius)+h[0]!*s[0]+h[1]!*s[1],u:d[0]!*s[0]+d[1]!*s[1],
        v:f.radiusV/f.radius+h[0]!*s[2]+h[1]!*s[3],uv:d[0]!*s[2]+d[1]!*s[3]};
    };
    for (const u of [0,1]) {
      const a: ScalarJet = base(u,1), b: TopJet = top(u);
      for (const key of ["p","u","v","uv"] as const) compatible(a[key],b[key],"actual cap/front/back corner "+key);
    }
    const evaluate: (u: number,v: number) => Jet = (u: number,v: number): Jet => {
      if (!(Number.isFinite(u) && u >= 0 && u <= 1 && Number.isFinite(v) && v >= 0 && v <= 1))
        throw new Error("Outside chart address exceeds its declared source-corresponding interval");
      const f: Frame = frame(v), t: ReturnType<typeof trig> = trig(u,f);
      const b: ScalarJet = base(u,v), b1: ScalarJet = base(u,1), end: TopJet = top(u);
      const a: number = end.p-b1.p, au: number = end.u-b1.u, c: number = end.v-b1.v, cu: number = end.uv-b1.uv;
      const h: number = -2*v*v*v+3*v*v, hv: number = -6*v*v+6*v;
      const k: number = v*v*v-v*v, kv: number = 3*v*v-2*v;
      const z: number = 2*u-1, bubble: number = u*u*(1-u)*(1-u), bubbleU: number = 2*u*(1-u)*(1-2*u);
      const q: number = coefficients[0]!+coefficients[1]!*z+v*(coefficients[2]!+coefficients[3]!*z);
      const qu: number = 2*(coefficients[1]!+v*coefficients[3]!), qv: number = coefficients[2]!+coefficients[3]!*z, quv: number = 2*coefficients[3]!;
      const w: number = (1-v)*(1-v), wv: number = -2*(1-v);
      const l: number = b.p+h*a+k*c+bubble*w*q, lu: number = b.u+h*au+k*cu+w*(bubbleU*q+bubble*qu);
      const lv: number = b.v+hv*a+kv*c+bubble*(wv*q+w*qv);
      const luv: number = b.uv+hv*au+kv*cu+bubbleU*(wv*q+w*qv)+bubble*(wv*qu+w*quv);
      const r: number = Math.exp(l), ru: number = r*lu, rv: number = r*lv, ruv: number = r*(luv+lu*lv);
      if (!(r > 0 && Number.isFinite(r))) throw new Error("The identified positive radius is outside binary64 finite support");
      const result: Jet = {positionMm:add(f.m,scale(t.r,r)),
        derivativeU:add(scale(t.r,ru),scale(t.ru,r)),
        derivativeV:add(f.mv,add(scale(t.r,rv),scale(t.rv,r))),
        mixedDerivativeUV:add(add(scale(t.r,ruv),scale(t.ru,rv)),add(scale(t.rv,ru),scale(t.ruv,r)))};
      if (u === 0 || u === 1) {
        const boundary: HumanSurface.Boundary = u === 0 ? input.front.boundary : input.back.boundary;
        result.positionMm = boundary.evaluate(worldY(v)); result.derivativeV = scale(boundary.derivative(worldY(v)),height);
      } else if (v === 1) {
        result.positionMm = input.cap.boundary.evaluate(u); result.derivativeU = input.cap.boundary.derivative(u);
        result.derivativeV = end.pv; result.mixedDerivativeUV = end.puv;
      }
      if (!Object.values(result).every((x: Vector): boolean => x.every(Number.isFinite)))
        throw new Error("Outside positive-radius law produced a nonfinite analytic jet");
      return result;
    };
    const normalizedEvaluate: (u: number,v: number) => Jet = evaluate;
    const physicalEvaluate: (u: number,y: number) => Jet = (u: number,y: number): Jet => {
      const value: Jet = normalizedEvaluate(u,(y-input.lowerYmm)/height);
      return {...value,derivativeV:scale(value.derivativeV,1/height),
        mixedDerivativeUV:scale(value.mixedDerivativeUV,1/height)};
    };
    const lower: HumanSurface.Boundary = {id:"head.posterior-hemisphere."+input.side+".lower-prediction",start:0,end:1,
      unit:"normalized-outside-intrinsic-angle",evaluate:(u: number): Vector => evaluate(u,0).positionMm,
      derivative:(u: number): Vector => evaluate(u,0).derivativeU};
    const patch: HumanSurface.Patch = {id:"head.posterior-hemisphere."+input.side,u:{start:0,end:1,unit:input.cap.boundary.unit},
      v:{start:input.lowerYmm,end:input.upperYmm,unit:"world-Y-mm"},jet:physicalEvaluate,
      outwardSign:upper.n[0]*upper.a[2]-upper.n[2]*upper.a[0] > 0 ? 1 : -1,
      sampling:{u:input.samplingU,v:input.samplingY},
      boundaries:{u0:{curve:input.front.boundary,orientation:1},u1:{curve:input.back.boundary,orientation:1},
        v0:{curve:lower,orientation:1},v1:{curve:input.cap.boundary,orientation:1}}};
    return {patch,cap:input.cap,evaluate:physicalEvaluate,boundaries:[input.front.boundary,input.back.boundary,lower,input.cap.boundary],
      backTransverse:(v: number): {derivativeU: Vector;mixedDerivativeUV: Vector} => {
        const j: Jet = physicalEvaluate(1,v);return {derivativeU:j.derivativeU,mixedDerivativeUV:j.mixedDerivativeUV};
      },limitations:[
        "This candidate requires a new bound source37 admission and common-law fit extending each whole arc to the same posterior median; old canthal-back37 coefficients are not interchangeable",
        "The four pooled log-radius coefficients require the bound source fit and person omissions before any promotion; there is no arbitrary zero-coefficient fallback",
        "The complete actual cap and front/back objects are hard constraints; incompatible physical corner jets or nonpositive gauges reject rather than weld",
        "Source cap transverse fields are conditionally identified in the fit, while product cap Js is actual; their transport residual must be reported separately",
        "The V0 transverse boundary is a common-law prediction, not an observed section; ear or lower-domain topology is not filled by this chart",
        "Positive radius alone does not certify immersion, contact, nonintersection, anatomical normals, unseen q transport or visual likeness",
      ]};
  }

  function compatible(a: number,b: number,name: string): void {
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a-b) > 128*Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b)))
      throw new Error("Outside incompatible "+name+"; solve common boundary/gauge constraints before assembly");
  }
  function same(a: Vector,b: Vector,name: string): void {for(let k: number=0;k<3;k++) compatible(a[k]!,b[k]!,name);}
  function dot(a: Vector,b: Vector): number {return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function scale(a: Vector,t: number): Vector {return a.map((x: number): number => x*t) as Vector;}
  function add(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x+b[i]!) as Vector;}
  function subtract(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x-b[i]!) as Vector;}
  function rotate(a: Vector): Vector {return [-a[2],0,a[0]];}
}
