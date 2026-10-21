import type { HumanHermitePatch } from "../internal/HumanHermitePatch";
import type { HumanSurface } from "../internal/HumanSurface";
import { HumanShoulderSkinMath as M } from "./HumanShoulderSkinMath";

/** Pending full forward-guide Gordon lift and source-motivated chart split.
 * No samples of the guide replace its original high-order/rational evaluator.
 */
export namespace HumanShoulderSkinGuideLift {
  /** Whole common-q forward-guide constraint inside one source-qualified arm chart. */
  export interface Input {
    /** Stable trace identity retained by both skin pieces and construction. */
    id:string;

    /** Actual full-function base patch, with exact first and mixed generating jets. */
    patch:HumanHermitePatch.Patch;

    /** Whole q-generated AF or AR curve; no source specimen is loaded at runtime. */
    guide:M.Curve;

    /** Strictly interior normalized U of the A-side contact. */
    startU:number;

    /** Strictly interior normalized U of the corresponding C-side contact. */
    endU:number;
  }
  /** Exact guide lift and two skin charts sharing one reparameterized trace. */
  export interface Result {
    /** Left/right analytic skin pieces; their common boundary object is identical. */
    patches:readonly [HumanSurface.Patch,HumanSurface.Patch];

    /** Same whole guide image in normalized V, retaining the nonlinear physical phase Jacobian. */
    trace:M.Curve;

    /** Original common generating guide, before chart reparameterization; never raw source input. */
    originalPhysicalGuide:M.Curve;

    /** Actual guide phase, dphase/dV and d2phase/dV2, with original physical units. */
    physicalPhase:(normalizedV:number)=>M.MapJet;

    /** Interior chart U, dU/dV and d2U/dV2 from the positive bounded trace map. */
    chartU:(normalizedV:number)=>M.MapJet;

    /** Exact exterior restriction objects that the main regional owner must share with neighbors. */
    externalPartitions:readonly ExternalPartition[];

    /** Degree of the derived phase map, at most 33; the original guide degree is unchanged. */
    parameterDegree:number;
  }
  /** One regional edge partition introduced by an actual forward-guide contact. */
  export interface ExternalPartition {
    /** Existing whole exterior edge and its original direction. */
    original:HumanSurface.Edge;

    /** Two exact physical restrictions in increasing chart direction. */
    pieces:readonly [HumanSurface.Edge,HumanSurface.Edge];
  }
  /** Private exact first jet in the normalized lifted skin chart. */
  interface FirstJet {
    /** Actual generating position, world mm. */
    positionMm:M.V;

    /** dP/dU, mm per normalized U. */
    derivativeU:M.V;

    /** dP/dV, mm per normalized V. */
    derivativeV:M.V;
  }
  /** Endpoint tangent decomposition identifies both phase velocity and chart
   * shear. A positive Bernstein velocity supplies an invertible physical phase
   * law with those endpoint velocities and exact total width. A logistic cubic
   * keeps the complete guide trace inside the chart without coordinate clamps.
   * A C1 two-sided Hermite cardinal lift imposes every guide point and tangent,
   * retaining all four original boundary values and first jets. Its transverse
   * second derivative may jump at the guide; source twist is not asserted.
   */
  export function build(input:Input): Result {
    for (const u of [input.startU,input.endU]) if (!(Number.isFinite(u) && u > 0 && u < 1)) throw new Error("Forward guide contact is not inside its qualified A/C half port");
    const source: HumanSurface.Boundary = input.guide.boundary;
    const contacts: number[] = [input.startU,input.endU];
    const phaseVelocities: number[] = [], uVelocities: number[] = [];
    for (let end:number = 0; end < 2; end++) {
      const jet: HumanHermitePatch.Jet = input.patch.jet(contacts[end]!,end);
      const p:number = end === 0 ? source.start : source.end;
      M.close(source.evaluate(p),jet.positionMm,"forward guide boundary contact");
      const frame: M.Frame2 = {positionMm:jet.positionMm,u:source.derivative(p),v:M.mul(jet.derivativeU,-1),uu:[0,0,0],uv:[0,0,0],vv:[0,0,0],coordinateUnits:{u:source.unit,v:"normalized chart U"},outwardSign:1,authority:"derived-zero-mixed-gauge"};
      const q: [number,number] = M.coordinates(frame,jet.derivativeV);
      M.close(M.tangent(frame,q),jet.derivativeV,"forward guide endpoint phase/shear");
      if (!(q[0] > 0 && Number.isFinite(q[0]) && Number.isFinite(q[1]))) throw new Error("Forward guide has a reversed or zero physical phase Jacobian");
      phaseVelocities.push(q[0]); uVelocities.push(q[1]);
    }
    const phase: {map:(v:number)=>M.MapJet;degree:number} = positivePhase(source.start,source.end,phaseVelocities[0]!,phaseVelocities[1]!);
    const a0:number = Math.log(input.startU/(1-input.startU)), a1:number = Math.log(input.endU/(1-input.endU));
    const da0:number = uVelocities[0]!/(input.startU*(1-input.startU)), da1:number = uVelocities[1]!/(input.endU*(1-input.endU));
    const chartU: Result["chartU"] = (v:number):M.MapJet => {
      domain(v);
      const h:M.MapJet = M.hermite(a0,a1,da0,da1,v);
      const raw:number = h.value >= 0 ? 1/(1+Math.exp(-h.value)) : Math.exp(h.value)/(1+Math.exp(h.value));
      const value:number = v === 0 ? input.startU : v === 1 ? input.endU : raw;
      if (!(value > 0 && value < 1)) throw new Error("Forward guide trace approaches a collapsed chart boundary");
      const first:number = v === 0 ? uVelocities[0]! : v === 1 ? uVelocities[1]! : value*(1-value)*h.first;
      return {value,first,second:value*(1-value)*(h.second+(1-2*value)*h.first*h.first)};
    };
    const trace:M.Curve = {boundary:{id:input.id+".trace",unit:"normalized chart V; physical phase map retained",start:0,end:1,
      evaluate:(v:number):M.V => source.evaluate(phase.map(v).value),
      derivative:(v:number):M.V => { const s:M.MapJet = phase.map(v); return M.mul(source.derivative(s.value),s.first); }},
      secondDerivative:(v:number):M.V => { const s:M.MapJet = phase.map(v); return M.add(M.mul(input.guide.secondDerivative(s.value),s.first*s.first),M.mul(source.derivative(s.value),s.second)); }};
    if (input.guide.oneSidedJets) trace.oneSidedJets = (v:number):{left:M.CurveJet;right:M.CurveJet} => {
      const s:M.MapJet = phase.map(v), jets:{left:M.CurveJet;right:M.CurveJet} = input.guide.oneSidedJets!(s.value);
      const transform:(j:M.CurveJet)=>M.CurveJet = (j:M.CurveJet):M.CurveJet => ({positionMm:j.positionMm,derivativeMm:M.mul(j.derivativeMm,s.first),secondDerivativeMm:M.add(M.mul(j.secondDerivativeMm,s.first*s.first),M.mul(j.derivativeMm,s.second))});
      return {left:transform(jets.left),right:transform(jets.right)};
    };
    const bottom:readonly [HumanSurface.Edge,HumanSurface.Edge] = partition(input.patch.boundaries.v0,input.startU,input.id+".A");
    const top:readonly [HumanSurface.Edge,HumanSurface.Edge] = partition(input.patch.boundaries.v1,input.endU,input.id+".C");
    const traceEdge:HumanSurface.Edge = {curve:trace.boundary,orientation:1};
    const patches:Result["patches"] = [piece(false),piece(true)];
    return {patches,trace,originalPhysicalGuide:input.guide,physicalPhase:phase.map,chartU,
      externalPartitions:[{original:input.patch.boundaries.v0,pieces:bottom},{original:input.patch.boundaries.v1,pieces:top}],parameterDegree:phase.degree};

    function lifted(u:number,v:number):FirstJet {
      const base:HumanHermitePatch.Jet = input.patch.jet(u,v);
      if (v === 0 || v === 1) return base;
      const a:M.MapJet = chartU(v), s:M.MapJet = phase.map(v);
      const center:HumanHermitePatch.Jet = input.patch.jet(a.value,v);
      const guide:M.V = source.evaluate(s.value), guideFirst:M.V = M.mul(source.derivative(s.value),s.first);
      const d:M.V = M.sub(guide,center.positionMm);
      const dp:M.V = M.sub(guideFirst,M.add(M.mul(center.derivativeU,a.first),center.derivativeV));
      if (u === a.value) return {positionMm:guide,derivativeU:base.derivativeU,derivativeV:M.sub(guideFirst,M.mul(base.derivativeU,a.first))};
      const left:boolean = u < a.value;
      const r:number = left ? u/a.value : (1-u)/(1-a.value);
      const ru:number = left ? 1/a.value : -1/(1-a.value);
      const rv:number = left ? -u*a.first/(a.value*a.value) : (1-u)*a.first/((1-a.value)*(1-a.value));
      const cardinal:number = r*r*(3-2*r), slope:number = 6*r*(1-r);
      return {positionMm:M.add(base.positionMm,M.mul(d,cardinal)),derivativeU:M.add(base.derivativeU,M.mul(d,slope*ru)),
        derivativeV:M.add(base.derivativeV,M.add(M.mul(d,slope*rv),M.mul(dp,cardinal)))};
    }
    function piece(right:boolean):HumanSurface.Patch {
      return {id:input.id+(right ? ".right" : ".left"),u:{start:0,end:1,unit:"normalized"},v:{start:0,end:1,unit:"normalized"},outwardSign:input.patch.outwardSign,
        boundaries:{u0:right ? traceEdge : input.patch.boundaries.u0,u1:right ? input.patch.boundaries.u1 : traceEdge,v0:bottom[right ? 1 : 0],v1:top[right ? 1 : 0]},
        jet:(u:number,v:number):FirstJet => {
          domain(u); domain(v);
          const a:M.MapJet = chartU(v), width:number = right ? 1-a.value : a.value;
          const originalU:number = right ? a.value+width*u : width*u;
          const mapV:number = right ? a.first*(1-u) : a.first*u;
          const jet:FirstJet = lifted(originalU,v);
          return {positionMm:jet.positionMm,derivativeU:M.mul(jet.derivativeU,width),derivativeV:M.add(jet.derivativeV,M.mul(jet.derivativeU,mapV))};
        }};
    }
  }
  /** Explicit restrictions preserve the same original evaluator and physical
   * unit. Main must pass these very partition objects to the regional neighbor.
   */
  function partition(edge:HumanSurface.Edge, split:number, id:string):readonly [HumanSurface.Edge,HumanSurface.Edge] {
    return [restriction(0,split,id+".0"),restriction(split,1,id+".1")];
    function restriction(a:number,b:number,key:string):HumanSurface.Edge {
      const curve:HumanSurface.Boundary = edge.curve, width:number = curve.end-curve.start;
      const p:number = curve.start+width*(edge.orientation === 1 ? a : 1-a);
      const q:number = curve.start+width*(edge.orientation === 1 ? b : 1-b);
      return {orientation:edge.orientation,curve:{...curve,id:key,start:Math.min(p,q),end:Math.max(p,q)}};
    }
  }
  function positivePhase(start:number,end:number,first:number,last:number):{map:(v:number)=>M.MapJet;degree:number} {
    const width:number = end-start;
    let degree:number = 2;
    while (degree <= 32 && !((degree+1)*width > first+last)) degree++;
    if (degree > 32 || !(width > 0 && first > 0 && last > 0)) throw new Error("Forward guide phase needs an unsupported positive-velocity degree");
    const interior:number = ((degree+1)*width-first-last)/(degree-1);
    const velocity:number[] = Array.from({length:degree+1},(_value:unknown,i:number):number => i === 0 ? first : i === degree ? last : interior);
    const position:number[] = [start];
    for (const value of velocity) position.push(position[position.length-1]!+value/(degree+1));
    position[position.length-1] = end;
    const acceleration:number[] = velocity.slice(1).map((value:number,i:number):number => degree*(value-velocity[i]!));
    return {degree:degree+1,map:(v:number):M.MapJet => {
      domain(v);
      return {value:v === 0 ? start : v === 1 ? end : bezier(position,v),first:v === 0 ? first : v === 1 ? last : bezier(velocity,v),second:bezier(acceleration,v)};
    }};
  }
  function bezier(coefficients:readonly number[], t:number):number {
    const values:number[] = [...coefficients];
    for (let n:number = values.length-1; n > 0; n--) for (let i:number = 0; i < n; i++) values[i] = (1-t)*values[i]!+t*values[i+1]!;
    const result:number = values[0]!;
    if (!Number.isFinite(result)) throw new Error("Forward guide chart map is nonfinite");
    return result;
  }
  function domain(value:number):void { if (!(Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error("Shoulder guide chart left [0,1]"); }
}
