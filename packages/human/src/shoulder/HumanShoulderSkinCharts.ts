import { HumanHermitePatch } from "../internal/HumanHermitePatch";
import type { HumanSurface } from "../internal/HumanSurface";
import { HumanShoulderSkinMath as M } from "./HumanShoulderSkinMath";
import { HumanShoulderSkinCorners as Enclosure } from "./HumanShoulderSkinCorners";
import { HumanShoulderSkinArithmetic as A } from "./HumanShoulderSkinArithmetic";

/** Pending source-conforming pants atlas. Both diagonals join A.B to C.B,
 * leaving each whole forward A-to-C guide in one quadrilateral. This is an
 * alternative combinatorial atlas, not a change to HumanBranchPants. Diagonal
 * shape continues the complete common B half, with endpoint osculating jets.
 * Unobserved interior twist remains a declared variational generator choice.
 */
export namespace HumanShoulderSkinCharts {
  /** One of six principal source-qualified branch contact roles. */
  export type Node = "A.B"|"A.C"|"B.A"|"B.C"|"C.A"|"C.B";

  /** Exterior whole-port restrictions; front/back names refer to guide roles. */
  export type External = "aFront"|"aBack"|"bFront"|"bBack"|"cFront"|"cBack";

  /** Eleven base-atlas geometric edge identities, including distinct body continuations. */
  export type EdgeName = External|"AB"|"AC"|"BC"|"frontDiagonal"|"backDiagonal";

  /** Whole generated port restriction with explicit regional or derived transverse authority. */
  export interface Port extends M.Curve {
    /** Actual nonparallel regional surface 2jet in its declared coordinate units; absent in derived mode. */
    frameAt?: (parameter: number) => M.Frame2;

    /** Additional whole-guide contacts constraining the derived field, in increasing local physical phase. */
    fieldAnchors?: readonly FieldAnchor[];

    /** Every declared feature address in local physical phase, without fixed count. */
    featureParameters: readonly number[];
  }
  /** One physical guide contact on a derived transverse field. */
  export interface FieldAnchor {
    /** Contact phase in the whole restriction's original declared unit. */
    parameter:number;

    /** Shared P/first/second generating frame, with actual or explicitly derived ownership. */
    frame:M.Frame2;
  }
  /** Main-owned common functions for the base four-chart pants atlas. */
  export interface Input {
    /** Stable region identity shared with displayed construction. */
    id: string;

    /** Explicit isolated common-q stage or actual regional-G1 requirement. */
    boundaryMode:"regional-G1"|"isolated-source-conditioned";

    /** Six exact whole-cycle restrictions with physical Jacobians. */
    ports: Record<External,Port>;

    /** Three principal full guide functions; forward guides are lifted after atlas construction. */
    guides: Record<"AB"|"AC"|"BC",M.Curve>;

    /** One actual or declared derived osculating frame per principal vertex. */
    frames: Record<Node,M.Frame2>;
  }
  /** Single transverse ribbon authority consumed by both incident charts. */
  export interface Ribbon {
    /** Entire geometric curve with its actual physical phase and generating D2. */
    curve: M.Curve;

    /** Unit co-normal plus derivative per physical edge phase; not a native material crossfield. */
    transverse: (parameter: number) => FieldJet;
  }
  /** Generated transverse field with explicit physical edge Jacobian. */
  export interface FieldJet {
    /** Unit world-space co-normal, defining the generator's transverse length gauge. */
    value:M.V;

    /** Derivative of that unit field per declared physical edge phase. */
    first:M.V;

    /** Shared analytic moving-basis endpoint owner, when this phase is an anchor. */
    movingBasis?:M.MovingBasis;
  }
  /** Four base charts before the two whole forward-guide splits. */
  export interface Result {
    /** Front arm/body and back arm/body charts in this stable order. */
    patches: readonly [HumanHermitePatch.Patch,HumanHermitePatch.Patch,HumanHermitePatch.Patch,HumanHermitePatch.Patch];

    /** One curve and transverse authority for each of the eleven shared edges. */
    ribbons: Record<EdgeName,Ribbon>;

    /** Exact same boundary objects used by the analytic skin. */
    boundaries: Record<EdgeName,HumanSurface.Boundary>;

    /** Pants incidence, separate from global embedding or positive volume. */
    topology:Topology;

    /** Closed sector curvature, endpoint lane and QR rank evidence used by every ribbon. */
    cornerEnclosure:Enclosure.Result;

    /** Caller-side complete actual side-evaluation ledger; observation only. */
    diagnosticLedger:unknown;

    /** Declared selection of the remaining unobserved continuation and twist freedoms. */
    closure: "whole-body-continuation/equal-angle-endpoint-sectors/sector-normal-form-minimum-norm-gauge";

    /** Source rank, C0 regularity and geometric limitations for the owner. */
    limitations: readonly string[];
  }
  /** Base genus-zero pants complex before the forward-guide splits. */
  export interface Topology {
    /** Six actual principal port/guide intersection vertices. */
    vertices:6;

    /** Six exterior restrictions plus five shared internal edges. */
    edges:11;

    /** Four analytic quadrilateral charts. */
    faces:4;

    /** Complete A, B and C cycles. */
    boundaryCycles:3;

    /** Genus-zero three-boundary Euler characteristic. */
    euler:-1;
  }
  /** Private chart traversal of one shared edge. */
  interface Oriented {
    /** Shared geometric edge role. */
    name:EdgeName;

    /** Increasing chart direction relative to the curve's own parameter. */
    orientation:1|-1;
  }
  /** Private normalized corner sample with its original physical Jacobian. */
  interface Sample {
    /** Actual endpoint position, world mm. */
    position:M.V;

    /** dP/d(normalized edge coordinate), world mm. */
    along:M.V;

    /** Original physical edge-phase address. */
    parameter:number;

    /** Signed original phase width per normalized edge coordinate. */
    width:number;

    /** Shared principal graph vertex at this endpoint. */
    node:Node;
  }
  /** Private common corner 2jet in one face's normalized chart. */
  interface Corner {
    /** Actual shared world position, mm. */
    p:M.V;

    /** dP/dU, world mm. */
    u:M.V;

    /** dP/dV, world mm. */
    v:M.V;

    /** d2P/dUdV from the closed incident-sector normal-form system and declared coordinate gauge, mm. */
    uv:M.V;

    /** Generated outward unit orientation witness. */
    normal:M.V;
  }
  type Sides = Record<"u0"|"u1"|"v0"|"v1",Oriented>;
  const ENDS: Record<EdgeName,readonly [Node,Node]> = {
    aFront:["A.B","A.C"],aBack:["A.C","A.B"],bFront:["B.C","B.A"],bBack:["B.A","B.C"],
    cFront:["C.A","C.B"],cBack:["C.B","C.A"],AB:["A.B","B.A"],AC:["A.C","C.A"],BC:["B.C","C.B"],
    frontDiagonal:["A.B","C.B"],backDiagonal:["A.B","C.B"],
  };

  /** Construct whole-curve function-valued patches, without source sampling or
   * fitting. Every internal edge uses one transverse field, and each incident
   * side derives its scale/shear and corner twist from one closed sector solve.
   * Positive exponential Hermite scale prevents hidden transverse sign changes.
   * No spatial embedding or source-native material crossfield is certified.
   */
  export function build(input:Input): Result {
    for (const name of ["bFront","bBack","cFront","cBack"] as const)
      if (input.boundaryMode === "regional-G1" && !input.ports[name].frameAt) throw new Error("Complete actual B/C physical surface jets are required; no crop or shaft extrapolation supplies them");
    const ab: M.V = input.guides.AB.boundary.derivative(input.guides.AB.boundary.start);
    const bc: M.V = input.guides.BC.boundary.derivative(input.guides.BC.boundary.end);
    const af: M.V = input.ports.aFront.boundary.derivative(input.ports.aFront.boundary.start);
    const ar: M.V = M.mul(input.ports.aBack.boundary.derivative(input.ports.aBack.boundary.end),-1);
    const cf: M.V = input.ports.cFront.boundary.derivative(input.ports.cFront.boundary.end);
    const cr: M.V = input.ports.cBack.boundary.derivative(input.ports.cBack.boundary.start);
    const curves: Record<EdgeName,M.Curve> = { ...input.ports,AB:input.guides.AB,AC:input.guides.AC,BC:input.guides.BC,
      frontDiagonal:M.diagonal(input.id+".frontDiagonal",M.reverse(input.ports.bFront,input.id+".B.front.continuation"),input.frames["A.B"],input.frames["C.B"],M.sectorRay(af,ab,input.frames["A.B"]),M.sectorRay(cf,bc,input.frames["C.B"])),
      backDiagonal:M.diagonal(input.id+".backDiagonal",input.ports.bBack,input.frames["A.B"],input.frames["C.B"],M.sectorRay(ar,ab,input.frames["A.B"]),M.mul(M.sectorRay(cr,M.mul(bc,-1),input.frames["C.B"]),-1)) };
    const front0: Sides = { v0:{name:"aFront",orientation:1},u1:{name:"AC",orientation:1},v1:{name:"cFront",orientation:-1},u0:{name:"frontDiagonal",orientation:1} };
    const front1: Sides = { v0:{name:"frontDiagonal",orientation:1},u1:{name:"BC",orientation:-1},v1:{name:"bFront",orientation:-1},u0:{name:"AB",orientation:1} };
    const back0: Sides = { v0:{name:"aBack",orientation:-1},u1:{name:"AC",orientation:1},v1:{name:"cBack",orientation:1},u0:{name:"backDiagonal",orientation:1} };
    const back1: Sides = { v0:{name:"backDiagonal",orientation:1},u1:{name:"BC",orientation:-1},v1:{name:"bBack",orientation:1},u0:{name:"AB",orientation:1} };
    const actualFrames:Record<string,readonly [M.Frame2,M.Frame2]>={};
    for (const name of Object.keys(input.ports) as External[]) {
      const port:Port=input.ports[name];
      if (port.frameAt) actualFrames[name]=[port.frameAt(port.boundary.start),port.frameAt(port.boundary.end)];
    }
    const enclosure:Enclosure.Result=Enclosure.build({curves,ends:ENDS,actualFrames,faces:{"front.arm":front0,"front.body":front1,"back.arm":back0,"back.body":back1},frames:input.frames});
    const ribbons: Record<EdgeName,Ribbon> = {} as Record<EdgeName,Ribbon>;
    for (const name of Object.keys(curves) as EdgeName[]) {
      const curve: M.Curve = curves[name];
      const [a,b]:readonly [Node,Node] = ENDS[name];
      M.close(curve.boundary.evaluate(curve.boundary.start),input.frames[a].positionMm,name+" start");
      M.close(curve.boundary.evaluate(curve.boundary.end),input.frames[b].positionMm,name+" end");
      const frameAt: Port["frameAt"] = name in input.ports ? input.ports[name as External].frameAt : undefined;
      ribbons[name] = { curve,transverse: frameAt
        ? (p:number): {value:M.V;first:M.V} => {
          const frame: M.Frame2 = frameAt(p), jet: M.CurveJet = M.sample(curve,p,p === curve.boundary.end ? "left" : "right");
          if (input.boundaryMode === "regional-G1" && name[0] !== "a" && frame.authority !== "actual-regional-generator") throw new Error("B/C boundary field must come from the actual regional generator");
          M.close(frame.positionMm,jet.positionMm,name+" actual frame position");
          const field:M.FrameFieldJet=M.conormal(frame,jet.derivativeMm,jet.secondDerivativeMm);
          if (p === curve.boundary.start || p === curve.boundary.end) {
            const solved:M.FrameFieldJet=enclosure.fields[name]![p === curve.boundary.start ? 0 : 1];
            M.close(field.value,solved.value,name+" regional endpoint field");
            M.close(field.first,solved.first,name+" regional endpoint mixed field");
          }
          return field;
        }
        : interpolatedField(curve,enclosure.fields[name]!,name in input.ports ? input.ports[name as External].fieldAnchors ?? [] : []) };
    }
    const diagnostics:{schema:string;id:string;cornerEnclosure:Enclosure.Result;faces:Record<string,Record<string,unknown>>}={schema:"caller-side-shoulder-corner-ledger-v1",id:input.id,cornerEnclosure:enclosure,faces:{}};
    const candidates:HumanHermitePatch.Patch[]=[],failures:{face:string;message:string}[]=[];
    const plans:readonly (readonly [string,Sides])[]=[["front.arm",front0],["front.body",front1],["back.arm",back0],["back.body",back1]];
    for (const [key,sides] of plans) {
      diagnostics.faces[key]={stage:"starting",sideEndpoints:{},corners:[]};
      try { candidates.push(face(input.id+"."+key,sides,key));diagnostics.faces[key]!["stage"]="accepted-by-unchanged-patch-builder"; }
      catch (error) {
        const message:string=error instanceof Error ? error.message : String(error);
        diagnostics.faces[key]!["stage"]="rejected";diagnostics.faces[key]!["failure"]=message;
        failures.push({face:key,message});
      }
    }
    if (failures.length) {
      const failure:Error & {shoulderCornerLedger?:unknown}=new Error("Shoulder independent-face diagnostics rejected "+JSON.stringify({id:input.id,failures,completedIndependentFaces:plans.length,ledger:diagnostics}));
      failure.shoulderCornerLedger=diagnostics;throw failure;
    }
    const patches:Result["patches"]=[candidates[0]!,candidates[1]!,candidates[2]!,candidates[3]!];
    validateIncidence(patches);
    return { patches,ribbons,boundaries:Object.fromEntries(Object.entries(curves).map(([key,c]:[string,M.Curve]):[string,HumanSurface.Boundary] => [key,c.boundary])) as Record<EdgeName,HumanSurface.Boundary>,
      cornerEnclosure:enclosure,diagnosticLedger:diagnostics,topology:{vertices:6,edges:11,faces:4,boundaryCycles:3,euler:-1},closure:"whole-body-continuation/equal-angle-endpoint-sectors/sector-normal-form-minimum-norm-gauge",
      limitations:["Diagonal whole-B continuation and unobserved interior twist are generator hypotheses, not exact native intermediate curves/jets.","C0 port features keep their whole one-sided curve jets; regularity across their propagated interior lines is not certified.","Boundary G1 algebra does not prove nonintersection, positive volume or anatomical accuracy."] };

    function sample(edge:Oriented, t:0|1): Sample {
      const c: HumanSurface.Boundary = curves[edge.name].boundary;
      const index: number = edge.orientation === 1 ? t : 1-t;
      const parameter: number = index === 0 ? c.start : c.end;
      const width: number = edge.orientation*(c.end-c.start);
      const endpoint:Enclosure.Endpoint=enclosure.endpoints[edge.name]![index as 0|1];
      return { position:endpoint.jet.positionMm,along:M.mul(endpoint.jet.derivativeMm,width),parameter,width,node:ENDS[edge.name][index]! };
    }
    function face(id:string, sides:Sides, key:string): HumanHermitePatch.Patch {
      const corners:Corner[][]=enclosure.corners[key]!;
      let outwardSign:1|-1|undefined;
      for (let i:number=0;i<2;i++) for (let j:number=0;j<2;j++) {
        const corner:Corner=corners[i]![j]!;
        const orientation:number=M.dot(M.cross(corner.u,corner.v),corner.normal);
        if (!(Number.isFinite(orientation) && Math.abs(orientation)>1024*Number.EPSILON*M.norm(corner.u)*M.norm(corner.v))) throw new Error("Shoulder chart has a degenerate corner");
        const sign:1|-1=orientation>0 ? 1 : -1;
        if (outwardSign !== undefined && outwardSign !== sign) throw new Error("Shoulder chart reverses orientation between corners; boundary/axis/phase must be reconsidered");
        outwardSign=sign;
      }
      const built:Partial<Record<keyof Sides,HumanHermitePatch.Side>>={},sideFailures:Record<string,string>={};
      for (const name of ["u0","u1","v0","v1"] as const) {
        try { built[name]=side(name); }
        catch (error) { sideFailures[name]=error instanceof Error ? error.message : String(error); }
      }
      const actualCorners:Record<string,unknown>[]=[];
      diagnostics.faces[key]!["sideFailures"]=sideFailures;diagnostics.faces[key]!["corners"]=actualCorners;
      for (let i:number=0;i<2;i++) for (let j:number=0;j<2;j++) {
        const vertical:HumanHermitePatch.Side|undefined=built[i === 0 ? "u0" : "u1"],horizontal:HumanHermitePatch.Side|undefined=built[j === 0 ? "v0" : "v1"];
        const entry:Record<string,unknown>={i,j,commonClosedCorner:corners[i]![j]};actualCorners.push(entry);
        if (!vertical || !horizontal) {entry["unavailable"]="Incident side failed; see sideFailures";continue;}
        try {
          const v:ActualSample=actualSample(vertical,j as 0|1),h:ActualSample=actualSample(horizontal,i as 0|1);
          entry["vertical"]=v;entry["horizontal"]=h;
          entry["position"]=comparison(v.position,h.position);
          entry["U"]=comparison(v.cross,h.along);entry["V"]=comparison(v.along,h.cross);
          entry["UV"]=comparison(v.crossAlong,h.crossAlong);
          entry["verticalVsClosedUV"]=comparison(v.crossAlong,corners[i]![j]!.uv);
          entry["horizontalVsClosedUV"]=comparison(h.crossAlong,corners[i]![j]!.uv);
        } catch (error) {entry["evaluationFailure"]=error instanceof Error ? error.message : String(error);}
      }
      if (Object.keys(sideFailures).length) throw new Error("Shoulder side construction diagnostics rejected "+JSON.stringify(sideFailures));
      diagnostics.faces[key]!["stage"]="calling-unchanged-HumanHermitePatch.build";
      return HumanHermitePatch.build(id,built as Record<keyof Sides,HumanHermitePatch.Side>,outwardSign!);
      function side(key:keyof Sides): HumanHermitePatch.Side {
        const edge: Oriented = sides[key], ribbon: Ribbon = ribbons[edge.name], curve: M.Curve = ribbon.curve;
        const width: number = edge.orientation*(curve.boundary.end-curve.boundary.start);
        const vertical: boolean = key[0] === "u", fixed: number = key[1] === "0" ? 0 : 1;
        const cs: Corner[] = vertical ? corners[fixed]! : [corners[0]![fixed]!,corners[1]![fixed]!];
        const endpointRecords:Record<string,unknown>[]=[];
        (diagnostics.faces[id.slice(input.id.length+1)]!["sideEndpoints"] as Record<string,unknown>)[edge.name+"/"+key]=endpointRecords;
        const ends:Enclosure.ScalarJet[]=[];
        for (let i:number = 0; i < 2; i++) {
          const point: Sample = sample(edge,i as 0|1), field: {value:M.V;first:M.V} = ribbon.transverse(point.parameter);
          const target: M.V = vertical ? cs[i]!.u : cs[i]!.v;
          const selected:M.CurveJet=enclosure.endpoints[edge.name]![edge.orientation === 1 ? i as 0|1 : (1-i) as 0|1].jet;
          const tangent: M.V = selected.derivativeMm;
          const context:Record<string,unknown>={edge:edge.name,side:key,endpoint:i,node:point.node,physicalPhase:point.parameter,width,field,selectedJet:selected,inventory:enclosure.endpoints[edge.name]![edge.orientation === 1 ? i as 0|1 : (1-i) as 0|1].inventory,corner:cs[i]};
          context["actualDefaultD"]=curve.boundary.derivative(point.parameter);context["actualDefaultD2"]=curve.secondDerivative(point.parameter);
          endpointRecords.push(context);
          const owner:Enclosure.ScalarJet=enclosure.scalars[id.slice(input.id.length+1)]![key]![i as 0|1];
          const ab:readonly [number,number]=[A.value(owner.alpha),A.value(owner.beta)];context["alphaBeta"]=ab;
          M.close(A.combine([{factor:owner.alpha,vector:field.value},{factor:owner.beta,vector:tangent}]),target,"direct scalar cross owner");
          context["derivativeAlphaBeta"]=[A.value(owner.alphaPrime),A.value(owner.betaPrime)];context["scalarOwnerExpansion"]=owner;
          context["targetTwistPerPhysicalPhase"]=M.mul(cs[i]!.uv,1/width);ends.push(owner);
        }
        if (!(A.value(ends[0]!.alpha)*A.value(ends[1]!.alpha)>0)) throw new Error("Shoulder scale/shear would cross a singular transverse chart");
        return { edge:{curve:curve.boundary,orientation:edge.orientation},
          cross:(p:number):M.V => evaluate(p,false),crossDerivative:(p:number):M.V => evaluate(p,true) };
        function evaluate(p:number, derivative:boolean): M.V {
          const first: number = width > 0 ? curve.boundary.start : curve.boundary.end;
          const t: number = (p-first)/width;
          if (!(Number.isFinite(t) && t >= 0 && t <= 1)) throw new Error("Shoulder ribbon left its physical edge interval");
          const endpoint:Enclosure.ScalarJet|undefined=t === 0 || t === 1 ? ends[t] : undefined;
          const log:{value:A.D;first:A.D;second:A.D}=A.hermite(A.of(Math.log(Math.abs(A.value(ends[0]!.alpha)))),A.of(Math.log(Math.abs(A.value(ends[1]!.alpha)))),A.scale(A.div(ends[0]!.alphaPrime,ends[0]!.alpha),width),A.scale(A.div(ends[1]!.alphaPrime,ends[1]!.alpha),width),t);
          const alpha:A.D=endpoint ? endpoint.alpha : A.of(Math.sign(A.value(ends[0]!.alpha))*Math.exp(A.value(log.value)));
          const alphaPrime:A.D=endpoint ? endpoint.alphaPrime : A.div(A.mul(alpha,log.first),A.of(width));
          const beta:{value:A.D;first:A.D;second:A.D}=A.hermite(ends[0]!.beta,ends[1]!.beta,A.scale(ends[0]!.betaPrime,width),A.scale(ends[1]!.betaPrime,width),t);
          const betaValue:A.D=endpoint ? endpoint.beta : beta.value,betaPrime:A.D=endpoint ? endpoint.betaPrime : A.div(beta.first,A.of(width));
          const field:FieldJet=ribbon.transverse(p),tangent:M.V=curve.boundary.derivative(p),second:M.V=curve.secondDerivative(p);
          const basis:M.MovingBasis=field.movingBasis ?? movingBasis(field,tangent,second);
          const co:A.D=A.add(alphaPrime,A.mul(betaValue,basis.conormalCurvature));
          const along:A.D=A.add(A.sub(betaPrime,A.div(A.mul(alpha,basis.conormalCurvature),basis.speedSquared)),A.mul(betaValue,basis.tangentAcceleration));
          const normal:A.D=A.add(A.mul(alpha,basis.normalDerivative),A.mul(betaValue,basis.normalCurvature));
          const value:M.V=derivative ? A.combine([{factor:co,vector:field.value},{factor:along,vector:tangent},{factor:normal,vector:basis.normal}]) : A.combine([{factor:alpha,vector:field.value},{factor:betaValue,vector:tangent}]);
          if (t === 0 || t === 1) endpointRecords[t]![derivative ? "actualScalarDerivativeEvaluation" : "actualScalarValueEvaluation"]={physicalPhase:p,chartT:t,width,alpha:A.value(alpha),alphaPrime:A.value(alphaPrime),betaValue:A.value(betaValue),betaPrime:A.value(betaPrime),field,defaultTangent:tangent,defaultSecond:second,movingBasis:basis,movingCoefficients:{co,along,normal},value};
          if (!M.finite(value)) throw new Error("Shoulder scale/shear exceeds its finite chart domain");
          return value;
        }
      }
    }
  }
  /** Interpolate endpoint co-normal jets, then remove the current whole-curve
   * tangent component analytically. This is derived generator cross geometry.
   */
  function interpolatedField(curve:M.Curve, endpoints:readonly [M.FrameFieldJet,M.FrameFieldJet], internal:readonly {parameter:number;frame:M.Frame2}[]): Ribbon["transverse"] {
    const start: number = curve.boundary.start, end: number = curve.boundary.end;
    const anchors:{parameter:number;value:M.V;first:M.V}[]=[{parameter:start,...endpoints[0]},...internal.map((entry:{parameter:number;frame:M.Frame2}):{parameter:number;value:M.V;first:M.V}=>{
      const jet:M.CurveJet=M.sample(curve,entry.parameter,"right");
      M.close(jet.positionMm,entry.frame.positionMm,"port field anchor");
      return {parameter:entry.parameter,...M.conormal(entry.frame,jet.derivativeMm,jet.secondDerivativeMm)};
    }),{parameter:end,...endpoints[1]}];
    if (anchors.some((entry:{parameter:number},i:number):boolean => !(Number.isFinite(entry.parameter) && entry.parameter >= start && entry.parameter <= end) || i > 0 && entry.parameter <= anchors[i-1]!.parameter)) throw new Error("Shoulder field anchors do not preserve source physical order");
    return (p:number): {value:M.V;first:M.V} => {
      if (!(Number.isFinite(p) && p >= start && p <= end)) throw new Error("Shoulder field left its physical curve domain");
      for (const entry of anchors) if (p === entry.parameter) return entry;
      const index:number = anchors.findIndex((entry:{parameter:number}):boolean => entry.parameter > p);
      const wa:{parameter:number;value:M.V;first:M.V} = anchors[index-1]!, wb:{parameter:number;value:M.V;first:M.V} = anchors[index]!;
      const interval:number = wb.parameter-wa.parameter, t:number = (p-wa.parameter)/interval;
      const raw: M.V = [0,0,0], rawPrime: M.V = [0,0,0];
      for (let axis:number = 0; axis < 3; axis++) {
        const h: M.MapJet = M.hermite(wa.value[axis]!,wb.value[axis]!,wa.first[axis]!*interval,wb.first[axis]!*interval,t);
        raw[axis] = h.value; rawPrime[axis] = h.first/interval;
      }
      const d: M.V = curve.boundary.derivative(p), dd: M.V = curve.secondDerivative(p), tangent: M.V = M.unit(d);
      const tangentPrime: M.V = M.mul(M.sub(dd,M.mul(tangent,M.dot(tangent,dd))),1/M.norm(d));
      const projection: number = M.dot(raw,tangent), projectionPrime: number = M.dot(rawPrime,tangent)+M.dot(raw,tangentPrime);
      const projected: M.V = M.sub(raw,M.mul(tangent,projection));
      const projectedPrime: M.V = M.sub(M.sub(rawPrime,M.mul(tangentPrime,projection)),M.mul(tangent,projectionPrime));
      const value: M.V = M.unit(projected);
      return {value,first:M.mul(M.sub(projectedPrime,M.mul(value,M.dot(value,projectedPrime))),1/M.norm(projected))};
    };
  }
  /** Same complete derivative in its tangent/co-normal/normal moving basis. */
  function movingBasis(field:FieldJet,d:M.V,dd:M.V):M.MovingBasis {
    const normal:M.V=M.unit(M.cross(d,field.value)),speedSquared:A.D=A.dot(d,d);
    return {normal,normalDerivative:A.dot(normal,field.first),normalCurvature:A.dot(normal,dd),conormalCurvature:A.dot(field.value,dd),tangentAcceleration:A.div(A.dot(d,dd),speedSquared),speedSquared};
  }
  interface ActualSample {position:M.V;along:M.V;cross:M.V;crossAlong:M.V;parameter:number;width:number;}
  /** Observe the same physical path as HumanHermitePatch.sample, without replacing its result. */
  function actualSample(side:HumanHermitePatch.Side,t:0|1):ActualSample {
    const c:HumanSurface.Boundary=side.edge.curve,width:number=(c.end-c.start)*side.edge.orientation;
    const parameter:number=t === 0 ? width > 0 ? c.start : c.end : width > 0 ? c.end : c.start;
    return {position:c.evaluate(parameter),along:M.mul(c.derivative(parameter),width),cross:side.cross(parameter),crossAlong:M.mul(side.crossDerivative(parameter),width),parameter,width};
  }
  /** Record the unchanged 64-epsilon generic comparison; this report grants no acceptance. */
  function comparison(actual:M.V,expected:M.V):{actual:M.V;expected:M.V;residual:M.V;componentTolerance:M.V;wouldPassUnchanged:boolean} {
    const componentTolerance:M.V=actual.map((value:number,i:number):number=>64*Number.EPSILON*Math.max(1,Math.abs(value),Math.abs(expected[i]!))) as M.V;
    return {actual,expected,residual:M.sub(actual,expected),componentTolerance,wouldPassUnchanged:actual.every((value:number,i:number):boolean=>Math.abs(value-expected[i]!)<=componentTolerance[i]!)};
  }
  function validateIncidence(patches:Result["patches"]): void {
    const incidence: Map<HumanSurface.Boundary,number[]> = new Map();
    for (const patch of patches) for (const [side,edge] of Object.entries(patch.boundaries) as ["u0"|"u1"|"v0"|"v1",HumanSurface.Edge][]) {
      const direction: number = (side === "u1" || side === "v0" ? 1 : -1)*edge.orientation*patch.outwardSign;
      const found: number[] = incidence.get(edge.curve) ?? [];
      found.push(direction); incidence.set(edge.curve,found);
    }
    if (incidence.size !== 11 || [...incidence.values()].filter((x:number[]):boolean => x.length === 1).length !== 6 || [...incidence.values()].some((x:number[]):boolean => x.length > 2 || x.length === 2 && x[0] === x[1]))
      throw new Error("Shoulder atlas is not an oriented shared-boundary pants complex");
  }
}
