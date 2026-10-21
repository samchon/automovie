import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanCurveFamily } from "../internal/HumanCurveFamily";
import { HumanHermitePatch } from "../internal/HumanHermitePatch";
import { HumanPlanePencilChart } from "../internal/HumanPlanePencilChart";
import type { HumanStationPort } from "../internal/HumanStationPort";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanPelvisSeams } from "./HumanPelvisSeams";

/** Consume one main-selected actual lateral network without another shape owner.
 * The design base fixes complete family port crossjets. Identified residuals
 * may change guide crossfields and the zero-jet interior only.
 *
 * @evidence contracts/common.md#principled-implementation Implicit scalar differentiation retains original curves; inverse full-family jets fix port Su/Suv and clamped guide fields share their corner twists.
 * @evidence contracts/common.md#clear-and-simple-design One injected network owns all planes, endpoint addresses and full jets; a diagnostic base and an explicitly supplied fitted law remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference data, copied source geometry, source normal, new port root, average, projection, coordinate offset or default fitted coefficient is used.
 * @evidence contracts/common.md#meaningful-documentation Canonical and original physical gauges, source side identity and unqualified whole-domain admissions are stated explicitly.
 * @evidence contracts/performance.md#efficient-algorithms Each implicit inverse has a finite 80-step safeguarded Newton budget; residual evaluation is linear in the supplied fitted degree.
 * @evidence contracts/performance.md#reuse-equivalent-work Each of four exact adapters retains its last identical-coordinate jet to share root and pullback work between value, derivative and crossfield queries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No global cache, file, task or renderer is retained; four adapter caches and corner records belong to the returned caller-owned result.
 */
export namespace HumanPelvisLateralFields {
  /** Physical world vector in the common +X forward/+Y up/signed-Z frame. */
  export type Vector = HumanCurve.Vector;

  /** Read-only main station authority, including its actual full second jet. */
  export type ActualPort = HumanStationPort.Result & {
    /** Original angular parameter in radians; no descriptor refit is accepted. */
    jet: (phaseRadians: number) => HumanCurveFamily.Jet;
  };

  /** Main alone selects this own-leg network and both original endpoint pairs. */
  export interface Network {
    /** Current trunk first-station authority. */
    hip: ActualPort;
    /** Current own-thigh first-station authority. */
    thigh: ActualPort;
    /** Main-signed source chart: h<=0,t<=0,a<=0,f>=0. */
    planes: HumanPlanePencilChart.Planes;
    /** Existing hip-to-own-thigh across outer curve and original root addresses. */
    across: HumanPelvisSeams.Result;
    /** Existing posterior hip-to-own-thigh forward meridian. */
    posterior: HumanPelvisSeams.Result;
  }

  /** Exact change of parameter to one borrowed original curve. */
  export interface Address {
    /** Original actual curve, retained without coefficient conversion. */
    curve: HumanSurface.Boundary;
    /** Original radians on ports or physical generated mm on meridians. */
    parameter: number;
    /** Original parameter derivative per canonical normalized coordinate. */
    firstDerivative: number;
    /** Original parameter second derivative per squared canonical coordinate. */
    secondDerivative: number;
  }

  /** Canonical edge jet plus its unchanged physical source address. */
  export interface EdgeJet {
    /** Actual position in mm. */
    positionMm: Vector;
    /** Derivative per canonical normalized along-edge coordinate, mm. */
    derivative: Vector;
    /** Exact second along-edge derivative, mm. */
    secondDerivative: Vector;
    /** Original curve and exact implicit parameter change. */
    address: Address;
  }

  /** Whole function adapter; no sampled replacement curve is created. */
  export interface Edge {
    /** Main-selected original function under an exact canonical parameter map. */
    curve: HumanSurface.Boundary;
    /** Full analytic adapted jet at a canonical coordinate in [0,1]. */
    jet: (coordinate: number) => EdgeJet;
  }

  /** Port adapter adds the main-owned inverse full-family jet authority. */
  export interface Port extends Edge {
    /** Unchanged raw inverse full-family jet, including its original diagnostics. */
    pullback: (v: number) => HumanPlanePencilChart.SurfaceJet;
    /** Closed-corner authority at endpoints; raw full-family field inside. */
    crossjet: (v: number) => Pick<HumanPlanePencilChart.SurfaceJet, "derivativeU" | "mixedDerivativeUV">;
  }

  /** Common achieved-shape affine law; entries are dimensionless world triples. */
  export interface Channels {
    /** Legendre coefficients independent of achieved shape. */
    constant: readonly Vector[];
    /** Matching coefficients multiplying achieved shape. */
    shape: readonly Vector[];
  }

  /** A jointly identified law supplies every free guide and skin coefficient. */
  export interface Law {
    /** Across guide W residual: Hip*u²(1-u)² times these Legendre channels. */
    across: Channels;
    /** Posterior guide W residual in the identical canonical gauge. */
    posterior: Channels;
    /** Zero-jet skin coefficients in ascending monomial powers u^i*v^j. */
    interiorConstant: readonly (readonly Vector[])[];
    /** Matching monomial coefficients multiplying achieved shape. */
    interiorShape: readonly (readonly Vector[])[];
  }

  /** Caller inputs retain native own-side identity, rather than point-Z labels. */
  export interface Inputs {
    /** Positive current physical Hip, mm. */
    hipMm: number;
    /** Current dimensionless achieved-shape input. */
    shape: number;
    /** Main-owned native side identity for the common reflected residual frame. */
    side: "l" | "r";
  }

  /** All shared edge objects and fields remain available to main assembly. */
  export interface Result {
    /** Actual common ports, under canonical v. */
    ports: { hip: Port; thigh: Port };
    /** Actual common meridians, under canonical u. */
    guides: { across: Edge; posterior: Edge };
    /** Shared function-valued sides; main owns their retained-cut integration. */
    sides: { u0: HumanHermitePatch.Side; u1: HumanHermitePatch.Side; v0: HumanHermitePatch.Side; v1: HumanHermitePatch.Side };
    /** Function-valued GH field, using these identical four side objects. */
    patch: HumanHermitePatch.Patch;
    /** A design base is data for LS, never an identified skin model. */
    role: "fixed-constraint-design-base" | "identified-lateral-candidate";
    /** Correspondence and visual verification remain separate from construction. */
    limitations: readonly string[];
  }

  /** Raw actual corner evidence is available before the shared GH admission. */
  export interface CornerDiagnostic {
    /** Canonical endpoint pair; no coordinate is repaired to match another. */
    u: 0 | 1;
    /** Canonical along-port endpoint, preserving the original angular address. */
    v: 0 | 1;
    /** Original radians/mm addresses used by these identical endpoint objects. */
    addresses: { port: Address; meridian: Address };
    /** Raw chart coordinates, affine values and inverse conditioning. */
    pullback: HumanPlanePencilChart.SurfaceJet;
    /** World residual norms, in mm, before any GH compatibility decision. */
    residualsMm: { position:number; derivativeU:number; derivativeV:number; twist:number; portAlongVersusPullbackV:number };
    /** Original independent formulas remain observable; none is repaired. */
    rawResidualsMm: { position:number; derivativeU:number; portAlongVersusPullbackV:number };
    /** Physical original-curve jets and implicit parameter derivatives. */
    rawEdges: { port:EdgeJet; meridian:EdgeJet };
    /** The one closed-corner differential consumed by both incident sides. */
    shared: ClosedCornerJet;
  }

  /** One exact-real intersection differential with an explicit numeric owner.
   * Su follows the original meridian/its scalar inverse, Sv the original
   * port/its scalar inverse, and Suv the original full-family pullback. At an
   * exact incidence these equal the inverse-chart formulas. No normal, plane,
   * phase, physical derivative or corner coordinate is moved or projected.
   */
  export interface ClosedCornerJet {
    /** Original port P, mm; each edge still evaluates its own unchanged P. */
    positionMm:Vector;
    /** Original physical meridian D multiplied by its existing dt/du. */
    derivativeU:Vector;
    /** Original angular port D multiplied by its existing dphi/dv. */
    derivativeV:Vector;
    /** Mixed derivative from this identical actual port's full second jet. */
    mixedDerivativeUV:Vector;
  }

  interface CornerAuthority {
    u:0|1; v:0|1; port:EdgeJet; meridian:EdgeJet;
    pullback:HumanPlanePencilChart.SurfaceJet; shared:ClosedCornerJet;
  }

  /** Construct the fixed part of the joint LS without inventing a fitted law.
   * Actual port crossfields retain the common incidence differential. Guide crossfields are the unique
   * endpoint-value/endpoint-twist clamped cubic part of the later fitted field.
   * This returned field is a design base only and supplies no missing shape.
   */
  export function designBase(id: string, network: Network, outwardSign: 1 | -1): Result {
    return assemble(id,network,outwardSign);
  }

  /** Collect all four corner causes even when GH admission would reject one.
   * This performs only actual-function math. It creates no patch, changes no
   * authority and cannot turn incompatible fields into an accepted dataset.
   */
  export function inspectCorners(id:string,network:Network):CornerDiagnostic[] {
    const base=constraints(id,network);const result:CornerDiagnostic[]=[];
    for(const corner of base.corners){
      const {u,v,port:pj,meridian:gj,pullback,shared}=corner;
      const port:Port=u===0?base.ports.hip:base.ports.thigh,guide:Edge=v===0?base.guides.across:base.guides.posterior;
      const side:HumanHermitePatch.Side=v===0?base.sides.v0:base.sides.v1;
      result.push({u,v,addresses:{port:pj.address,meridian:gj.address},pullback,
        residualsMm:{position:distance(port.jet(v).positionMm,guide.jet(u).positionMm),derivativeU:distance(port.crossjet(v).derivativeU,guide.jet(u).derivative),derivativeV:distance(port.jet(v).derivative,side.cross(u)),twist:distance(port.crossjet(v).mixedDerivativeUV,side.crossDerivative(u)),portAlongVersusPullbackV:distance(pj.derivative,pullback.derivativeV)},
        rawResidualsMm:{position:distance(pj.positionMm,gj.positionMm),derivativeU:distance(pullback.derivativeU,gj.derivative),portAlongVersusPullbackV:distance(pj.derivative,pullback.derivativeV)},
        rawEdges:{port:pj,meridian:gj},shared});
    }
    return result;
  }

  /** Apply an explicitly identified joint guide-W/zero-jet law.
   * No optional/default coefficients exist. All current port values and first
   * jets are fixed; guide residuals vanish in value and first u derivative at
   * both port corners. Exact monomial interior terms vanish in every first jet.
   */
  export function build(id: string, network: Network, outwardSign: 1 | -1, inputs: Inputs, law: Law): Result {
    if (!(Number.isFinite(inputs.hipMm) && inputs.hipMm>0 && Number.isFinite(inputs.shape)) || (inputs.side!=="l" && inputs.side!=="r")) throw new Error("Lateral fields require current finite physical inputs and native side identity");
    for (const channels of [law.across,law.posterior]) if (!channels.constant.length || channels.constant.length!==channels.shape.length || channels.constant.length>64 || [...channels.constant,...channels.shape].some((v:Vector):boolean=>!finite(v))) throw new Error("Every guide residual requires complete finite common fitted channels");
    if (!law.interiorConstant.length || law.interiorConstant.length!==law.interiorShape.length || law.interiorConstant.some((row:readonly Vector[],i:number):boolean=>!row.length || row.length!==law.interiorShape[i]!.length || [...row,...law.interiorShape[i]!].some((v:Vector):boolean=>!finite(v)))) throw new Error("Every zero-jet coefficient requires matching finite common shape channels");
    return assemble(id,network,outwardSign,inputs,law);
  }

  /** Restrict the same actual endpoint pair; never select another port or root. */
  function assemble(id:string,network:Network,outwardSign:1|-1,inputs?:Inputs,law?:Law):Result {
    const fields=constraints(id,network,inputs,law);
    const interior:Vector[][]=law===undefined?[]:law.interiorConstant.map((row:readonly Vector[],i:number):Vector[]=>row.map((value:Vector,j:number):Vector=>physical(add(value,scale(law.interiorShape[i]![j]!,inputs!.shape)),inputs!)));
    const patch:HumanHermitePatch.Patch=HumanHermitePatch.build(id,fields.sides,outwardSign,interior);
    return {...fields,patch,role:law===undefined?"fixed-constraint-design-base":"identified-lateral-candidate",limitations:[
      "Main-selected port/plane/root and original parameter authorities are retained; normalized edges only reparameterize their whole supplied functions",
      "Inside each port its crossfield is the unchanged actual full-family pullback. Closed corners share physical meridian/scalar-inverse Su, port/scalar-inverse Sv and that same full-family Suv from their first construction",
      "Raw inverse pullbacks, original physical jets, scalar addresses, signed plane residuals and numeric differences remain inspectable; a shared closed-corner evaluation is not a claim of whole-port C1 or actual neighbor compatibility",
      "A design base supplies no identified skin or missing volume; only an explicit jointly fitted guide-W and zero-jet law creates a candidate",
      "The finite local implicit solves and local Jacobian admissions do not certify complete arc monotonicity, source lateral-disk topology, global embedding or unseen parameter validity",
      "Source/native phase station differences, source correspondence, generated neighboring surfaces and hardware captures remain main-owned verification work",
    ]};
  }

  /** Assemble closed-corner incidence differentials before either side exists.
   * Two independent formulas for a real-identical derivative must not become
   * independent numeric authorities. The raw functions/inverses are retained;
   * their common endpoint records are borrowed, not corrected after a failed
   * GH check. Interior evaluations still use the original whole functions.
   */
  function constraints(id:string,network:Network,inputs?:Inputs,law?:Law):Pick<Result,"ports"|"guides"|"sides">&{corners:CornerAuthority[]} {
    const a0:HumanPelvisSeams.Endpoint=network.across.endpoints[0],a1:HumanPelvisSeams.Endpoint=network.across.endpoints[1];
    const b0:HumanPelvisSeams.Endpoint=network.posterior.endpoints[0],b1:HumanPelvisSeams.Endpoint=network.posterior.endpoints[1];
    requireEndpoint(network.hip,a0);requireEndpoint(network.hip,b0);requireEndpoint(network.thigh,a1);requireEndpoint(network.thigh,b1);
    const rawHip:Port=port(id+".hip",network.hip,a0.parameter,b0.parameter,network.planes);
    const rawThigh:Port=port(id+".thigh",network.thigh,a1.parameter,b1.parameter,network.planes);
    const rawAcross:Edge=meridian(id+".across",network.across,network.planes),rawPosterior:Edge=meridian(id+".posterior",network.posterior,network.planes);
    const corners:CornerAuthority[]=[];
    for(const u of [0,1] as const)for(const v of [0,1] as const){
      const p:Port=u===0?rawHip:rawThigh,g:Edge=v===0?rawAcross:rawPosterior;
      const pj:EdgeJet=p.jet(v),gj:EdgeJet=g.jet(u),pullback:HumanPlanePencilChart.SurfaceJet=p.pullback(v);
      corners.push({u,v,port:pj,meridian:gj,pullback,shared:{positionMm:pj.positionMm,derivativeU:gj.derivative,derivativeV:pj.derivative,mixedDerivativeUV:pullback.mixedDerivativeUV}});
    }
    const [c00,c01,c10,c11]=corners as [CornerAuthority,CornerAuthority,CornerAuthority,CornerAuthority];
    const hip:Port=closedPort(rawHip,c00,c01),thigh:Port=closedPort(rawThigh,c10,c11);
    const across:Edge=closedEdge(rawAcross,c00,c10,"meridian"),posterior:Edge=closedEdge(rawPosterior,c01,c11,"meridian");
    const w0=clamped(c00.shared.derivativeV,c10.shared.derivativeV,c00.shared.mixedDerivativeUV,c10.shared.mixedDerivativeUV,inputs,law?.across);
    const w1=clamped(c01.shared.derivativeV,c11.shared.derivativeV,c01.shared.mixedDerivativeUV,c11.shared.mixedDerivativeUV,inputs,law?.posterior);
    const sides:Result["sides"]={
      u0:{edge:{curve:hip.curve,orientation:1},cross:(v:number):Vector=>hip.crossjet(v).derivativeU,crossDerivative:(v:number):Vector=>hip.crossjet(v).mixedDerivativeUV},
      u1:{edge:{curve:thigh.curve,orientation:1},cross:(v:number):Vector=>thigh.crossjet(v).derivativeU,crossDerivative:(v:number):Vector=>thigh.crossjet(v).mixedDerivativeUV},
      v0:{edge:{curve:across.curve,orientation:1},cross:(u:number):Vector=>w0(u)[0],crossDerivative:(u:number):Vector=>w0(u)[1]},
      v1:{edge:{curve:posterior.curve,orientation:1},cross:(u:number):Vector=>w1(u)[0],crossDerivative:(u:number):Vector=>w1(u)[1]},
    };
    return {ports:{hip,thigh},guides:{across,posterior},sides,corners};
  }

  /** Borrow pre-existing physical edge jets at the two closed endpoints.
   * This retains the original position, first/second chain rule and address;
   * it only avoids independently reconstructing that same closed-end value.
   */
  function closedEdge(raw:Edge,a:CornerAuthority,b:CornerAuthority,role:"port"|"meridian"):Edge {
    const at=(q:number):EdgeJet=>{requireCoordinate(q);return q===0?a[role]:q===1?b[role]:raw.jet(q);};
    return {curve:{...raw.curve,evaluate:(q:number):Vector=>at(q).positionMm,derivative:(q:number):Vector=>at(q).derivative},jet:at};
  }

  /** The common corner crossjet is part of the whole function's definition.
   * Its exact-real limit is the same full-family incidence differential.
   * Binary64 raw inverse differences are retained by inspectCorners, never
   * turned into a tolerance, coordinate projection or changed physical edge.
   */
  function closedPort(raw:Port,a:CornerAuthority,b:CornerAuthority):Port {
    return {...closedEdge(raw,a,b,"port"),pullback:(v:number):HumanPlanePencilChart.SurfaceJet=>{requireCoordinate(v);return v===0?a.pullback:v===1?b.pullback:raw.pullback(v);},
      crossjet:(v:number):Pick<HumanPlanePencilChart.SurfaceJet,"derivativeU"|"mixedDerivativeUV">=>{requireCoordinate(v);return v===0?a.shared:v===1?b.shared:raw.pullback(v);}};
  }

  /** Adapt original radians to canonical v; borrow the same full family jet. */
  function port(id:string,authority:ActualPort,start:number,end:number,planes:HumanPlanePencilChart.Planes):Port {
    const original:HumanSurface.Boundary=authority.boundary,period:number=original.end-original.start;
    if (!(Number.isFinite(period) && period>0)) throw new Error("An actual port requires its original finite periodic parameter range");
    const positive:number=mod(end-start,period);
    if (!(positive>0 && positive<period)) throw new Error("Distinct actual lateral port roots are required");
    const choices:number[]=[positive,positive-period].filter((delta:number):boolean=>{
      const p:Vector=original.evaluate(wrap(start+delta/2,original));
      return signed(planes.across,p)<0 && signed(planes.forward,p)>0;
    });
    if (choices.length!==1) throw new Error("The selected original endpoint pair has no unique lateral-sector arc");
    const delta:number=choices[0]!;
    let cached:{coordinate:number;edge:EdgeJet;pullback:HumanPlanePencilChart.SurfaceJet}|undefined;
    function at(v:number):{edge:EdgeJet;pullback:HumanPlanePencilChart.SurfaceJet} {
      requireCoordinate(v);
      if (cached?.coordinate===v) return cached;
      const parameter:number=v===0?start:v===1?end:solve(v,planes.across,planes.forward,1,(x:number):ScalarJet=>{
        const phase:number=wrap(start+delta*x,original),jet:HumanCurveFamily.Jet=authority.jet(phase);
        return {position:jet.positionMm,derivative:scale(jet.phaseDerivativeMmPerRadian,delta)};
      }).coordinate*delta+start;
      const phase:number=v===0?start:v===1?end:wrap(parameter,original),jet:HumanCurveFamily.Jet=authority.jet(phase);
      const second:Vector|undefined=jet.phaseSecondDerivativeMmPerRadianSquared;
      if(second===undefined) throw new Error("Lateral ports require their actual complete angular second derivative");
      const chart:HumanPlanePencilChart.ChartJet=HumanPlanePencilChart.evaluate(planes,jet.positionMm);
      const edge:EdgeJet=implicitJet(original,phase,jet.positionMm,jet.phaseDerivativeMmPerRadian,second,chart.v);
      if (!(delta/edge.address.firstDerivative>0)) throw new Error("The selected actual port phase reverses its canonical-v direction");
      const pulled:HumanPlanePencilChart.SurfaceJet=HumanPlanePencilChart.pullback(planes,jet);
      cached={coordinate:v,edge,pullback:pulled};return cached;
    }
    const curve:HumanSurface.Boundary={id,unit:"normalized",start:0,end:1,evaluate:(v:number):Vector=>at(v).edge.positionMm,derivative:(v:number):Vector=>at(v).edge.derivative};
    return {curve,jet:(v:number):EdgeJet=>at(v).edge,pullback:(v:number):HumanPlanePencilChart.SurfaceJet=>at(v).pullback,crossjet:(v:number):HumanPlanePencilChart.SurfaceJet=>at(v).pullback};
  }

  /** Adapt a main-selected physical meridian to canonical u, retaining P/D/P''. */
  function meridian(id:string,authority:HumanPelvisSeams.Result,planes:HumanPlanePencilChart.Planes):Edge {
    const original:HumanSurface.Boundary=authority.curve,width:number=original.end-original.start;
    if (!(Number.isFinite(width) && width>0)) throw new Error("A meridian requires its original finite physical phase");
    let cached:{coordinate:number;edge:EdgeJet}|undefined;
    function at(u:number):EdgeJet {
      requireCoordinate(u);if(cached?.coordinate===u)return cached.edge;
      const parameter:number=u===0?original.start:u===1?original.end:original.start+width*solve(u,planes.hip,planes.thigh,-1,(x:number):ScalarJet=>{
        const phase:number=original.start+width*x;return{position:original.evaluate(phase),derivative:scale(original.derivative(phase),width)};
      }).coordinate;
      const p:Vector=original.evaluate(parameter),d:Vector=original.derivative(parameter),dd:Vector=authority.secondDerivative(parameter);
      const chart:HumanPlanePencilChart.ChartJet=HumanPlanePencilChart.evaluate(planes,p);
      const edge:EdgeJet=implicitJet(original,parameter,p,d,dd,chart.u);
      if (!(edge.address.firstDerivative>0)) throw new Error("The actual meridian reverses its canonical-u direction");
      cached={coordinate:u,edge};return edge;
    }
    return {curve:{id,unit:"normalized",start:0,end:1,evaluate:(u:number):Vector=>at(u).positionMm,derivative:(u:number):Vector=>at(u).derivative},jet:at};
  }

  /** Exact scalar inverse and full second chain rule; source phase is retained. */
  function implicitJet(curve:HumanSurface.Boundary,parameter:number,p:Vector,d:Vector,dd:Vector,q:HumanPlanePencilChart.CoordinateJet):EdgeJet {
    const speed:number=dot(q.gradient,d),acceleration:number=bilinear(q.hessian,d,d)+dot(q.gradient,dd);
    if (!(Number.isFinite(speed) && speed!==0 && Number.isFinite(acceleration))) throw new Error("An actual lateral edge has a singular implicit parameter map");
    const first:number=1/speed,second:number=-acceleration/(speed*speed*speed);
    const along:Vector=scale(d,first),curvature:Vector=add(scale(dd,first*first),scale(d,second));
    if(!finite(along)||!finite(curvature)||!Number.isFinite(second))throw new Error("Implicit lateral edge derivatives are not representable");
    return {positionMm:p,derivative:along,secondDerivative:curvature,address:{curve,parameter,firstDerivative:first,secondDerivative:second}};
  }

  interface ScalarJet {position:Vector;derivative:Vector;}

  /** Safeguarded Newton solves the same selected arc, never another root.
   * q=0/1 is dispatched to original endpoint addresses by the adapters. Interior
   * residual admission uses only binary64 actual-point/plane arithmetic scale.
   */
  function solve(q:number,first:HumanPlanePencilChart.Plane,last:HumanPlanePencilChart.Plane,lastSign:1|-1,at:(coordinate:number)=>ScalarJet):{coordinate:number} {
    const normal:Vector=add(scale(first.normal,1-q),scale(last.normal,lastSign*q)),c:number=(1-q)*first.coordinateMm+lastSign*q*last.coordinateMm;
    const sample=(x:number):{value:number;derivative:number;floor:number}=>{const p:ScalarJet=at(x);const value:number=dot(normal,p.position)-c,derivative:number=dot(normal,p.derivative),floor:number=64*Number.EPSILON*Math.max(1,Math.abs(c),Math.hypot(...normal)*Math.hypot(...p.position));if(!Number.isFinite(value)||!Number.isFinite(derivative)||!Number.isFinite(floor))throw new Error("Implicit lateral plane evaluation is not finite");return{value,derivative,floor};};
    let lo:number=0,hi:number=1;const a=sample(lo),b=sample(hi);
    if(Math.abs(a.value)<=a.floor)return{coordinate:lo};if(Math.abs(b.value)<=b.floor)return{coordinate:hi};
    if (!(a.value*b.value<0)) throw new Error("The supplied lateral arc does not bracket its requested chart plane");
    let x:number=q;
    for(let iteration:number=0;iteration<80;iteration++){
      const f=sample(x);if(Math.abs(f.value)<=f.floor)return{coordinate:x};
      if(f.value*a.value>0)lo=x;else hi=x;
      const next:number=x-f.value/f.derivative;x=Number.isFinite(next)&&next>lo&&next<hi?next:(lo+hi)/2;
      if(!(x>lo&&x<hi))throw new Error("Implicit lateral inversion is unresolved at binary64 precision");
    }
    throw new Error("Implicit lateral inversion exceeded its finite root budget");
  }

  /** Fixed endpoint values/twists plus a fitted first-jet-vanishing residual. */
  function clamped(a:Vector,b:Vector,da:Vector,db:Vector,inputs?:Inputs,channels?:Channels):(u:number)=>[Vector,Vector] {
    return (u:number):[Vector,Vector]=>{
      requireCoordinate(u);const u2:number=u*u,u3:number=u2*u;
      let value:Vector=combine([a,b,da,db],[2*u3-3*u2+1,-2*u3+3*u2,u3-2*u2+u,u3-u2]);
      let derivative:Vector=combine([a,b,da,db],[6*u2-6*u,-6*u2+6*u,3*u2-4*u+1,3*u2-2*u]);
      if(channels!==undefined){
        const basis:[number,number][]=legendre(u,channels.constant.length),bubble:number=u2*(1-u)*(1-u),dbubble:number=2*u-6*u2+4*u3;
        for(let i:number=0;i<basis.length;i++){const coefficient:Vector=physical(add(channels.constant[i]!,scale(channels.shape[i]!,inputs!.shape)),inputs!);value=add(value,scale(coefficient,bubble*basis[i]![0]));derivative=add(derivative,scale(coefficient,dbubble*basis[i]![0]+bubble*basis[i]![1]));}
      }
      if(u===0)return[a,da];if(u===1)return[b,db];return[value,derivative];
    };
  }

  /** Complete supplied Legendre degree and analytic canonical first derivative. */
  function legendre(u:number,count:number):[number,number][] {const result:[number,number][]=[[1,0]];if(count>1)result.push([2*u-1,2]);for(let n:number=2;n<count;n++){const a:[number,number]=result[n-1]!,b:[number,number]=result[n-2]!;result.push([((2*n-1)*(2*u-1)*a[0]-(n-1)*b[0])/n,((2*n-1)*(2*a[0]+(2*u-1)*a[1])-(n-1)*b[1])/n]);}return result;}

  /** Retain main endpoint identity and original address, without matching a copy. */
  function requireEndpoint(port:ActualPort,endpoint:HumanPelvisSeams.Endpoint):void {if(endpoint.curve!==port.boundary||!Number.isFinite(endpoint.parameter)||endpoint.parameter<port.boundary.start||endpoint.parameter>port.boundary.end)throw new Error("A lateral network endpoint must retain its actual main-owned port address");}
  function requireCoordinate(q:number):void {if(!(Number.isFinite(q)&&q>=0&&q<=1))throw new Error("Lateral canonical evaluation escaped [0,1]");}
  function physical(v:Vector,inputs:Inputs):Vector {return[inputs.hipMm*v[0],inputs.hipMm*v[1],inputs.hipMm*v[2]*(inputs.side==="l"?-1:1)];}
  function signed(p:HumanPlanePencilChart.Plane,v:Vector):number{return dot(p.normal,v)-p.coordinateMm;}
  function mod(x:number,width:number):number{return((x%width)+width)%width;}
  function wrap(x:number,curve:HumanSurface.Boundary):number{return curve.start+mod(x-curve.start,curve.end-curve.start);}
  function finite(v:Vector):boolean{return v.length===3&&v.every(Number.isFinite);}
  function dot(a:Vector,b:Vector):number{return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function add(a:Vector,b:Vector):Vector{return[a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
  function scale(a:Vector,s:number):Vector{return[a[0]*s,a[1]*s,a[2]*s];}
  function distance(a:Vector,b:Vector):number{return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
  function combine(v:readonly Vector[],w:readonly number[]):Vector {const result:Vector=[0,0,0];for(let i:number=0;i<v.length;i++)for(let k:number=0;k<3;k++)result[k]!+=v[i]![k]!*w[i]!;return result;}
  function bilinear(h:HumanPlanePencilChart.Matrix3,a:Vector,b:Vector):number{return a[0]*dot(h[0],b)+a[1]*dot(h[1],b)+a[2]*dot(h[2],b);}
}
