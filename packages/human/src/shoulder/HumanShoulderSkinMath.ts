import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanShoulderSkinArithmetic as A } from "./HumanShoulderSkinArithmetic";

/** Pending analytic operations for whole-curve shoulder skin. No observation
 * files, meshes, normals, specimen rows or executable resources are consumed.
 */
export namespace HumanShoulderSkinMath {
  /** World-space vector components; positions use mm and derivatives retain declared units. */
  export type V = HumanCurve.Vector;

  /** Whole common generated function; neither its degree nor rational weights are truncated. */
  export interface Curve {
    /** Main's exact shared P/T boundary object and declared physical phase interval. */
    boundary: HumanSurface.Boundary;

    /** Exact generating second derivative, mm per squared declared parameter unit. */
    secondDerivative: (parameter: number) => V;

    /** Optional exact one-sided generating jets; absence means the caller declares one regular evaluator. */
    oneSidedJets?: (parameter: number) => OneSidedJets;
  }
  /** Incoming and outgoing jets preserve a declared C0 contact without averaging. */
  export interface OneSidedJets {
    /** Incoming physical phase limit. */
    left:CurveJet;

    /** Outgoing physical phase limit. */
    right:CurveJet;
  }
  /** Generated co-normal gauge and its physical edge-phase derivative. */
  export interface FrameFieldJet {
    /** Unit world co-normal, defining a transverse length coordinate. */
    value:V;

    /** d(co-normal)/d(original edge phase), inverse declared phase unit. */
    first:V;

    /** Optional common moving-basis owners at an analytic interpolation anchor. */
    movingBasis?:MovingBasis;
  }
  /** Analytic orthogonal-frame coefficients in the same physical edge phase. */
  export interface MovingBasis {
    /** Common outward unit normal, whose real limit agrees with tangent cross co-normal. */
    normal:V;
    /** Shared e-prime normal component, inverse physical phase unit. */
    normalDerivative:A.D;
    /** Actual n dot DD, inverse physical phase unit. */
    normalCurvature:A.D;
    /** Actual e dot DD, inverse physical phase unit. */
    conormalCurvature:A.D;
    /** Actual d dot DD divided by d dot d, inverse physical phase unit. */
    tangentAcceleration:A.D;
    /** Actual squared generating phase speed, retaining its declared gauge. */
    speedSquared:A.D;
  }
  /** World physical curve 2jet with its boundary's original parameter gauge. */
  export interface CurveJet {
    /** Generating position in world mm. */
    positionMm: V;

    /** First derivative in mm per declared physical phase unit. */
    derivativeMm: V;

    /** Second derivative in mm per squared declared physical phase unit. */
    secondDerivativeMm: V;
  }
  /** Shared actual or declared derived surface osculating frame at a world point. */
  export interface Frame2 {
    /** Common geometric point in world mm. */
    positionMm:V;

    /** dP/du in mm per u-coordinate unit. */
    u:V;

    /** dP/dv in mm per v-coordinate unit. */
    v:V;

    /** d2P/du2 in mm per squared u-coordinate unit. */
    uu:V;

    /** d2P/dudv in mm per u-coordinate unit per v-coordinate unit. */
    uv:V;

    /** d2P/dv2 in mm per squared v-coordinate unit. */
    vv:V;

    /** Explicit independent-coordinate units; normalized lambda is not physical axial mm. */
    coordinateUnits:CoordinateUnits;

    /** Outward orientation relative to the generating u cross v tangent frame. */
    outwardSign:1|-1;

    /** Distinguishes actual regional generation from an explicitly unobserved mixed-jet closure. */
    authority:"actual-regional-generator"|"derived-zero-mixed-gauge";
  }
  /** Units of a surface frame's two independent generating coordinates. */
  export interface CoordinateUnits {
    /** Unit used by u and the first index of uu/uv. */
    u:string;

    /** Unit used by v and the second index of vv/uv. */
    v:string;
  }
  /** Scalar value with exact first and second derivatives in its input coordinate. */
  export interface MapJet {
    /** Mapped value, retaining the target coordinate's declared unit. */
    value:number;

    /** First target-unit/input-unit Jacobian. */
    first:number;

    /** Second target-unit/input-unit-squared Jacobian. */
    second:number;
  }
  /** Whole-curve endpoint transport and separate constraint-change diagnostics. */
  export interface Lift {
    /** Full generating function after the endpoint Hermite correction. */
    curve:Curve;

    /** Start/end changes in declared units; these are not original source-fit tolerances. */
    endpointResiduals:readonly EndpointResidual[];
  }
  /** One endpoint's required geometric transport, separate from native source accuracy. */
  export interface EndpointResidual {
    /** Euclidean endpoint displacement in world mm. */
    positionMm:number;

    /** Removed tangent-normal component, mm per original curve parameter unit. */
    tangentNormalMmPerUnit:number;

    /** Required normal-curvature change, mm per original parameter unit squared. */
    secondNormalMmPerUnit2:number;
  }
  /** Add world vectors while retaining their common declared units. */
  export function add(a: V, b: V): V { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
  /** Subtract world vectors in their common declared units. */
  export function sub(a: V, b: V): V { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  /** Scale a world vector by an explicit scalar Jacobian. */
  export function mul(a: V, k: number): V { return [a[0]*k, a[1]*k, a[2]*k]; }
  /** Euclidean scalar product in the common world frame. */
  export function dot(a: V, b: V): number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  /** Oriented Euclidean cross product in the common world frame. */
  export function cross(a: V, b: V): V { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  /** Euclidean magnitude retaining the vector components' declared physical unit. */
  export function norm(a: V): number { return Math.hypot(...a); }
  /** Normalize a finite nonzero generating direction; singular input is unsupported. */
  export function unit(a: V): V {
    const length: number = norm(a);
    if (!(Number.isFinite(length) && length > 0)) throw new Error("Shoulder tangent or normal is singular");
    return mul(a, 1/length);
  }
  /** Check all three world components without altering geometric values. */
  export function finite(a: V): boolean { return a.length === 3 && a.every(Number.isFinite); }
  /** Require binary64-scale shared constraints, without relaxing original source tolerance. */
  export function close(a: V, b: V, label: string, diagnostic?: unknown): void {
    if (!finite(a) || !finite(b) || a.some((x: number, i: number): boolean => Math.abs(x-b[i]!) > 256*Number.EPSILON*Math.max(1, Math.abs(x), Math.abs(b[i]!))))
      throw new Error("Incompatible actual shoulder " + label + " " + JSON.stringify({actual:a,expected:b,residual:sub(a,b),diagnostic}));
  }
  /** Reorthogonalized two-column QR in the declared physical frame. Exact owner-vector identities bypass arithmetic, without changing plane acceptance. */
  export function coordinates(f: Frame2, value: V): [number, number] {
    const length:number=norm(f.u), c:number=dot(f.v,f.v);
    if (!(Number.isFinite(length) && length > 0 && Number.isFinite(c))) throw new Error("Shoulder osculating frame is rank deficient");
    const first:V=mul(f.u,1/length);
    let coupling:number=dot(first,f.v), remainder:V=sub(f.v,mul(first,coupling));
    const correction:number=dot(first,remainder);
    coupling+=correction;remainder=sub(remainder,mul(first,correction));
    const secondLength:number=norm(remainder);
    if (!(Number.isFinite(secondLength) && secondLength*secondLength > 1024*Number.EPSILON*c)) throw new Error("Shoulder osculating frame is rank deficient");
    if (value.every((v:number,i:number):boolean=>v === f.u[i])) return [1,0];
    if (value.every((v:number,i:number):boolean=>v === f.v[i])) return [0,1];
    const second:V=mul(remainder,1/secondLength), qv:number=dot(second,value)/secondLength;
    return [(dot(first,value)-coupling*qv)/length,qv];
  }
  /** Reconstruct a world tangent from coefficients in the frame's declared coordinates. */
  export function tangent(f: Frame2, q: readonly [number, number]): V { return add(mul(f.u,q[0]),mul(f.v,q[1])); }
  /** Bilinear physical second-jet pullback; no native material mixed derivative is inferred. */
  export function hessian(f: Frame2, a: readonly [number,number], b: readonly [number,number]): V {
    return add(add(mul(f.uu,a[0]*b[0]),mul(f.uv,a[0]*b[1]+a[1]*b[0])),mul(f.vv,a[1]*b[1]));
  }
  /** Derive outward unit normal from the generating frame, never stored source normals. */
  export function normal(f: Frame2): V { return mul(unit(cross(f.u,f.v)),f.outwardSign); }
  /** Unit co-normal and its derivative in the curve's declared physical phase.
   * Physical axial, normalized lambda and edge phase are never interchanged.
   */
  export function conormal(f: Frame2, d: V, dd: V): FrameFieldJet {
    const q: [number,number] = coordinates(f,d);
    close(tangent(f,q),d,"curve tangent plane");
    const raw: V = cross(f.u,f.v), n: V = normal(f), t: V = unit(d);
    const du: V = add(mul(f.uu,q[0]),mul(f.uv,q[1]));
    const dv: V = add(mul(f.uv,q[0]),mul(f.vv,q[1]));
    const rawFirst: V = mul(add(cross(du,f.v),cross(f.u,dv)),f.outwardSign);
    const nFirst: V = mul(sub(rawFirst,mul(n,dot(n,rawFirst))),1/norm(raw));
    const tFirst: V = mul(sub(dd,mul(t,dot(t,dd))),1/norm(d));
    return { value: cross(n,t), first: add(cross(nFirst,t),cross(n,tFirst)) };
  }
  /** A's absent transverse observation is a declared variational completion.
   * The complete port and guide determine its two axes and pure second jets;
   * zero mixed coordinate acceleration is a generator gauge, not native data.
   */
  export function derivedFrame(port: CurveJet, guide: CurveJet, outward: V, coordinateUnits:Frame2["coordinateUnits"]): Frame2 {
    const sign: 1|-1 = dot(cross(port.derivativeMm,guide.derivativeMm),outward) > 0 ? 1 : -1;
    const frame: Frame2 = { positionMm: port.positionMm, u: port.derivativeMm, v: guide.derivativeMm,
      uu: port.secondDerivativeMm, uv: [0,0,0], vv: guide.secondDerivativeMm,
      coordinateUnits,outwardSign: sign, authority: "derived-zero-mixed-gauge" };
    coordinates(frame,[0,0,0]);
    if (!(dot(normal(frame),unit(outward)) > 0)) throw new Error("Shoulder frame has no outward orientation");
    return frame;
  }
  /** Read the requested exact generating one-sided physical curve jet. */
  export function sample(c: Curve, p: number, side: "left"|"right" = "right"): CurveJet {
    if (c.oneSidedJets) return c.oneSidedJets(p)[side];
    return { positionMm: c.boundary.evaluate(p), derivativeMm: c.boundary.derivative(p), secondDerivativeMm: c.secondDerivative(p) };
  }
  /** Exact Hermite polynomial in normalized t; derivative conversion belongs
   * to the returned curve's explicit physical parameter width.
   */
  export function quintic(p: V, q: V, d: V, e: V, dd: V, ee: V): V[] {
    const a: V = sub(sub(sub(q,p),d),mul(dd,.5));
    const b: V = sub(sub(e,d),dd), c: V = sub(ee,dd);
    return [p,d,mul(dd,.5),add(add(mul(a,10),mul(b,-4)),mul(c,.5)),
      add(add(mul(a,-15),mul(b,7)),mul(c,-1)),add(add(mul(a,6),mul(b,-3)),mul(c,.5))];
  }
  /** Horner evaluation of every retained power and its first or second analytic derivative. */
  export function power(coefficients: readonly V[], t: number, order: 0|1|2): V {
    let result: V = [0,0,0];
    for (let i: number = coefficients.length-1; i >= order; i--) {
      const factor: number = order === 0 ? 1 : order === 1 ? i : i*(i-1);
      result = add(mul(result,t),mul(coefficients[i]!,factor));
    }
    return result;
  }
  /** Exact reversal retains the complete evaluator and all physical Jacobians. */
  export function reverse(c:Curve,id:string):Curve {
    const width:number = c.boundary.end-c.boundary.start;
    const original:(p:number)=>number = (p:number):number => {
      if (!(Number.isFinite(p) && p >= 0 && p <= width)) throw new Error("Reversed shoulder continuation left its physical interval");
      return p === 0 ? c.boundary.end : p === width ? c.boundary.start : c.boundary.end-p;
    };
    const result:Curve = {boundary:{id,unit:c.boundary.unit,start:0,end:width,evaluate:(p:number):V => c.boundary.evaluate(original(p)),derivative:(p:number):V => mul(c.boundary.derivative(original(p)),-1)},secondDerivative:(p:number):V => c.secondDerivative(original(p))};
    if (c.oneSidedJets) result.oneSidedJets = (p:number):{left:CurveJet;right:CurveJet} => {
      const jets:{left:CurveJet;right:CurveJet} = c.oneSidedJets!(original(p));
      const flip:(jet:CurveJet)=>CurveJet = (jet:CurveJet):CurveJet => ({...jet,derivativeMm:mul(jet.derivativeMm,-1)});
      return {left:flip(jets.right),right:flip(jets.left)};
    };
    return result;
  }
  /** Whole-curve endpoint transport. The original function is retained and a
   * quintic correction imposes actual P, tangent plane and normal curvature.
   * Its residuals remain separate from source fitting error and support motion.
   */
  export function transport(c: Curve, start: Frame2, end: Frame2, id: string): Lift {
    const width: number = c.boundary.end-c.boundary.start;
    if (!(Number.isFinite(width) && width > 0 && c.boundary.unit)) throw new Error("Whole guide transport needs a positive declared physical phase width");
    const corrections: CurveJet[] = [], targets: CurveJet[] = [], residuals: Lift["endpointResiduals"][number][] = [];
    for (const [index,frame] of [start,end].entries()) {
      const p: number = index === 0 ? c.boundary.start : c.boundary.end;
      const jet: CurveJet = sample(c,p,index === 0 ? "right" : "left");
      const q: [number,number] = coordinates(frame,jet.derivativeMm), d: V = tangent(frame,q);
      const h: V = hessian(frame,q,q), dd: V = add(h,tangent(frame,coordinates(frame,sub(jet.secondDerivativeMm,h))));
      targets.push({positionMm:frame.positionMm,derivativeMm:d,secondDerivativeMm:dd});
      corrections.push({ positionMm: sub(frame.positionMm,jet.positionMm), derivativeMm: sub(d,jet.derivativeMm), secondDerivativeMm: sub(dd,jet.secondDerivativeMm) });
      residuals.push({ positionMm: norm(corrections[index]!.positionMm), tangentNormalMmPerUnit: norm(corrections[index]!.derivativeMm), secondNormalMmPerUnit2: norm(corrections[index]!.secondDerivativeMm) });
    }
    return { curve:jetLift(c,targets[0]!,targets[1]!,id),endpointResiduals:residuals };
  }
  /** Exact whole-function Hermite transport to already identified endpoint jets.
   * Original nonpolynomial/higher-order interiors are not replaced by a bridge.
   */
  export function jetLift(c:Curve, start:CurveJet, end:CurveJet, id:string):Curve {
    const width:number = c.boundary.end-c.boundary.start;
    if (!(Number.isFinite(width) && width > 0)) throw new Error("Shoulder whole-curve transport needs a finite physical interval");
    const targets:readonly [CurveJet,CurveJet] = [start,end];
    const corrections:CurveJet[] = targets.map((target:CurveJet,i:number):CurveJet => {
      const original:CurveJet = sample(c,i === 0 ? c.boundary.start : c.boundary.end,i === 0 ? "right" : "left");
      return {positionMm:sub(target.positionMm,original.positionMm),derivativeMm:sub(target.derivativeMm,original.derivativeMm),secondDerivativeMm:sub(target.secondDerivativeMm,original.secondDerivativeMm)};
    });
    const a:CurveJet = corrections[0]!, b:CurveJet = corrections[1]!;
    const correction:V[] = quintic(a.positionMm,b.positionMm,mul(a.derivativeMm,width),mul(b.derivativeMm,width),mul(a.secondDerivativeMm,width*width),mul(b.secondDerivativeMm,width*width));
    const curve: Curve = { boundary: { ...c.boundary,id,
      evaluate: (s: number): V => s === c.boundary.start ? targets[0]!.positionMm : s === c.boundary.end ? targets[1]!.positionMm : add(c.boundary.evaluate(s),extra(s,0)),
      derivative: (s: number): V => s === c.boundary.start ? targets[0]!.derivativeMm : s === c.boundary.end ? targets[1]!.derivativeMm : add(c.boundary.derivative(s),extra(s,1)) },
      secondDerivative: (s: number): V => s === c.boundary.start ? targets[0]!.secondDerivativeMm : s === c.boundary.end ? targets[1]!.secondDerivativeMm : add(c.secondDerivative(s),extra(s,2)) };
    if (c.oneSidedJets) curve.oneSidedJets = (s: number): { left: CurveJet; right: CurveJet } => {
      const jets: { left: CurveJet; right: CurveJet } = c.oneSidedJets!(s);
      return { left:s === c.boundary.end ? targets[1]! : lifted(jets.left,s),right:s === c.boundary.start ? targets[0]! : lifted(jets.right,s) };
    };
    return curve;
    function extra(s: number, order: 0|1|2): V { return mul(power(correction,(s-c.boundary.start)/width,order),width**(-order)); }
    function lifted(j: CurveJet, s: number): CurveJet { return { positionMm:add(j.positionMm,extra(s,0)),derivativeMm:add(j.derivativeMm,extra(s,1)),secondDerivativeMm:add(j.secondDerivativeMm,extra(s,2)) }; }
  }
  /** Whole body-side continuation, using the matching full B half as an actual
   * generating function. Endpoint tangent speeds keep its physical phase gauge;
   * source-related endpoint angle sectors and osculating normal curvatures set
   * the transported jets. This is a common-function continuation hypothesis,
   * not an exact native diagonal or a minimum-bending endpoint-only bridge.
   */
  export function diagonal(id:string, template:Curve, a:Frame2, b:Frame2, firstRay:V, lastRay:V):Curve {
    const first:CurveJet = sample(template,template.boundary.start,"right"), last:CurveJet = sample(template,template.boundary.end,"left");
    const d:V = mul(unit(firstRay),norm(first.derivativeMm)), e:V = mul(unit(lastRay),norm(last.derivativeMm));
    close(tangent(a,coordinates(a,d)),d,"diagonal start ray");
    close(tangent(b,coordinates(b,e)),e,"diagonal end ray");
    function lift(f: Frame2, first: V, second: V): V {
      const q: [number,number] = coordinates(f,first), h: V = hessian(f,q,q);
      return add(h,tangent(f,coordinates(f,sub(second,h))));
    }
    return jetLift(template,{positionMm:a.positionMm,derivativeMm:d,secondDerivativeMm:lift(a,d,first.secondDerivativeMm)},
      {positionMm:b.positionMm,derivativeMm:e,secondDerivativeMm:lift(b,e,last.secondDerivativeMm)},id);
  }
  /** Equal oriented tangent-plane angles specify a local conformal gauge,
   * rather than averaging a missing curve or copying specimen coordinates.
   */
  export function sectorRay(a:V, b:V, frame:Frame2): V {
    const first: V = unit(a), last: V = unit(b), n: V = normal(frame);
    close(tangent(frame,coordinates(frame,first)),first,"sector first tangent");
    close(tangent(frame,coordinates(frame,last)),last,"sector last tangent");
    const angle: number = Math.atan2(dot(cross(first,last),n),dot(first,last));
    if (!(Math.abs(angle) > 1e-8 && Math.abs(angle) < Math.PI-1e-8)) throw new Error("Shoulder source sector is degenerate or ambiguous");
    return add(mul(first,Math.cos(angle/2)),mul(cross(n,first),Math.sin(angle/2)));
  }
  /** Scalar cubic Hermite value and two derivatives in normalized t. */
  export function hermite(a: number, b: number, da: number, db: number, t: number): MapJet {
    const c: number = 3*(b-a)-2*da-db, d: number = 2*(a-b)+da+db;
    return { value:a+t*(da+t*(c+t*d)),first:da+t*(2*c+3*t*d),second:2*c+6*t*d };
  }
}
