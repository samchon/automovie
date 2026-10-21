import { HumanShoulderSkinMath as M } from "./HumanShoulderSkinMath";
import { HumanShoulderSkinArithmetic as A } from "./HumanShoulderSkinArithmetic";

/** Finite one-sided corner enclosure for a C1, piecewise C2 shoulder atlas.
 * Whole edge functions and their inside D2 remain constraints. Every shared
 * edge has one normal derivative, even when the incident sector Hessians differ.
 */
export namespace HumanShoulderSkinCorners {
  /** An oriented complete edge of one face; phase orientation is not a lane. */
  export interface Edge {
    /** Common geometric edge identity. */
    name:string;
    /** Signed chart traversal relative to increasing physical phase. */
    orientation:1|-1;
  }
  /** Four oriented common edges of a normalized quadrilateral. */
  export type Face = Record<"u0"|"u1"|"v0"|"v1",Edge>;
  /** Endpoint-selected inside jet, with the original one-sided inventory retained. */
  export interface Endpoint {
    /** Exact position and physical first/second generating derivatives. */
    jet:M.CurveJet;
    /** Which side approaches from inside this complete edge. */
    inside:"left"|"right";
    /** Both original sides; these are never averaged or overwritten. */
    inventory:M.OneSidedJets;
  }
  /** Closed solution for one face corner in normalized U,V. */
  export interface Corner {
    /** Common physical point, mm. */
    p:M.V;
    /** Exact boundary dP/dU, mm. */
    u:M.V;
    /** Exact boundary dP/dV, mm. */
    v:M.V;
    /** Derived normal mixed jet; tangent acceleration has minimum-norm zero gauge. */
    uv:M.V;
    /** Generated outward unit normal. */
    normal:M.V;
  }
  /** Direct fan-rank and scalar closure audit, separate from geometry acceptance. */
  export interface Audit {
    /** Common graph vertex identity. */
    node:string;
    /** Scalar symmetric-form coefficients in all incident sectors. */
    unknowns:number;
    /** Number of actual curvature and shared-normal-derivative equations. */
    equations:number;
    /** Implied physical symmetric-form rank after exact fan elimination. */
    rank:number;
    /** Unobserved freedoms fixed by the common minimum-Euclidean-norm gauge. */
    nullity:number;
    /** Empty for the direct fan method; no QR pivots are claimed. */
    rowQrPivots:readonly number[];
    /** SVD spectrum is explicitly unavailable; QR pivots are not singular values. */
    singularValues:null;
    /** Maximum direct consumed mixed-normal residual in normalized UV mm. */
    maximumResidual:number;
    /** Selected sector coefficient vector, preserving the finite closed solution for inspection. */
    normalForms:readonly number[];
    /** Every incident scalar normal-UV constraint residual in mm. */
    equationResiduals:readonly number[];
    /** Explicit method; no original source/material Hessian is asserted. */
    gauge:"sector-normal-form/minimum-norm-direct-fan";
    /** Explicit unit of maximumResidual and equationResiduals. */
    residualUnit:"normalized-UV-mm";
    /** Reduced mixed-normal scalar unknown count. */
    reducedUnknowns:number;
    /** Independent shared-ribbon equations, plus any actual regional root constraint. */
    reducedRank:number;
    /** Affine fan root retained before rounding, with physical mixed-jet units. */
    rootExpansion:A.D;
  }
  /** All corners and endpoint ribbons from the same closed solution. */
  export interface Result {
    /** Face-major 2 by 2 corner arrays in normalized U,V. */
    corners:Record<string,Corner[][]>;
    /** One endpoint field jet per increasing-physical-phase edge endpoint. */
    fields:Record<string,readonly [M.FrameFieldJet,M.FrameFieldJet]>;
    /** All actual one-sided endpoint observations used by this solve. */
    endpoints:Record<string,readonly [Endpoint,Endpoint]>;
    /** Per-vertex rank, nullspace gauge and residual evidence. */
    audits:readonly Audit[];
    /** Single scalar endpoint owners consumed by the whole side Hermite laws. */
    scalars:Record<string,Record<string,readonly [ScalarJet,ScalarJet]>>;
  }
  /** Scalar endpoint jet from the same direct corner and shared ribbon solution. */
  export interface ScalarJet {
    /** Exact selected co-normal scale in the side's normalized cross-coordinate. */
    alpha:A.D;
    /** Exact selected tangent shear in that same coordinate. */
    beta:A.D;
    /** Physical phase derivative of alpha, defined before whole Hermite construction. */
    alphaPrime:A.D;
    /** Physical phase derivative of beta from the same moving-basis identity. */
    betaPrime:A.D;
  }
  /** Shared full edge functions and qualified principal node incidence. */
  export interface Input {
    /** Every complete generated edge, without source geometry copies. */
    curves:Record<string,M.Curve>;
    /** Source-qualified start/end role incidence. */
    ends:Record<string,readonly [string,string]>;
    /** All four base faces, closed simultaneously. */
    faces:Record<string,Face>;
    /** Original single-owner first plane and outward witness at each node. */
    frames:Record<string,M.Frame2>;
    /** Optional full actual regional endpoint frames; their normal forms remain exact constraints. */
    actualFrames?:Record<string,readonly [M.Frame2,M.Frame2]>;
  }
  interface Sector {face:string;i:number;j:number;node:string;h:Sample;v:Sample;}
  interface Sample {name:string;end:0|1;along:M.V;node:string;width:number;}
  interface Incident {sector:number;sample:Sample;side:string;chartEnd:0|1;alpha:A.D;beta:A.D;}
  interface Affine {a:A.D;b:A.D;}
  interface Form {zero:readonly A.D[];mixed:readonly A.D[];}

  /** Solve the one-dimensional physical-B minimum-norm gauge directly on the
   * source-qualified sector fan. Actual normal pure jets are definitions; one
   * shared k_e joins the same alpha/beta/width equations consumed by the skin.
   */
  export function build(input:Input):Result {
    if (Object.keys(input.curves).length !== 11 || Object.keys(input.faces).length !== 4) throw new Error("Shoulder direct enclosure requires its qualified finite atlas");
    const endpoints:Result["endpoints"]={},corners:Result["corners"]={},fields:Result["fields"]={},scalars:Result["scalars"]={};
    const sectors:Sector[]=[];
    for (const [name,curve] of Object.entries(input.curves)) {endpoints[name]=[endpoint(curve,0),endpoint(curve,1)];fields[name]=[{value:[0,0,0],first:[0,0,0]},{value:[0,0,0],first:[0,0,0]}];}
    for (const [face,sides] of Object.entries(input.faces)) {
      corners[face]=[[],[]];scalars[face]={};
      for (const side of ["u0","u1","v0","v1"]) scalars[face]![side]=[] as unknown as readonly [ScalarJet,ScalarJet];
      for (let i:number=0;i<2;i++) for (let j:number=0;j<2;j++) {
        const h:Sample=sample(j === 0 ? sides.v0 : sides.v1,i as 0|1),v:Sample=sample(i === 0 ? sides.u0 : sides.u1,j as 0|1);
        if (h.node !== v.node) throw new Error("Shoulder direct enclosure incidence disagrees");
        M.close(endpoints[h.name]![h.end].jet.positionMm,endpoints[v.name]![v.end].jet.positionMm,"direct enclosure corner point");
        sectors.push({face,i,j,node:h.node,h,v});
      }
    }
    const audits:Audit[]=[];
    for (const node of [...new Set(sectors.map((s:Sector):string=>s.node))]) {
      const local:Sector[]=sectors.filter((s:Sector):boolean=>s.node === node),count:number=local.length;
      if (count !== 2 && count !== 4) throw new Error("Unsupported shoulder direct sector count");
      const frame:M.Frame2=input.frames[node]!,n:M.V=M.normal(frame),x:M.V=M.unit(frame.u),y:M.V=M.cross(n,x);
      const incidence:Map<string,Incident[]>=new Map(),forms:Form[]=[],edgeValues:Map<string,{e:M.V;c:A.D;rho:A.D;speed:A.D;tau:A.D}>=new Map();
      for (const [k,s] of local.entries()) {
        for (const [sample,side,chartEnd,target] of [[s.h,"v"+s.j,s.i,s.v.along],[s.v,"u"+s.i,s.j,s.h.along]] as const) {
          const jet:M.CurveJet=endpoints[sample.name]![sample.end].jet,d:M.V=jet.derivativeMm;
          M.close(M.tangent(frame,M.coordinates(frame,d)),d,"direct enclosure inside tangent plane");
          let data:{e:M.V;c:A.D;rho:A.D;speed:A.D;tau:A.D}|undefined=edgeValues.get(sample.name);
          if (!data) {
            const e:M.V=M.cross(n,M.unit(d)),speed:A.D=A.dot(d,d);
            data={e,c:A.dot(n,jet.secondDerivativeMm),rho:A.dot(e,jet.secondDerivativeMm),speed,tau:A.div(A.dot(d,jet.secondDerivativeMm),speed)};edgeValues.set(sample.name,data);
          }
          const span:M.Frame2={positionMm:jet.positionMm,u:data.e,v:d,uu:[0,0,0],uv:[0,0,0],vv:[0,0,0],coordinateUnits:{u:"normalized cross scale",v:"normalized cross shear"},outwardSign:1,authority:"derived-zero-mixed-gauge"};
          const q:[number,number]=M.coordinates(span,target);M.close(M.tangent(span,q),target,"direct enclosure cross span");
          if (!(q[0] !== 0 && Number.isFinite(q[0]))) throw new Error("Singular direct shoulder transverse coefficient");
          const list:Incident[]=incidence.get(sample.name) ?? [];list.push({sector:k,sample,side,chartEnd:chartEnd as 0|1,alpha:A.of(q[0]),beta:A.of(q[1])});incidence.set(sample.name,list);
        }
        forms.push(form(s,n,x,y,endpoints));
      }
      const adjacency:Map<number,{other:number;edge:string;from:Incident;to:Incident}[]>=new Map();
      for (let k:number=0;k<count;k++) adjacency.set(k,[]);
      let internal:number=0;
      for (const [edge,list] of incidence) {
        if (list.length === 2) {
          internal++;const a:Incident=list[0]!,b:Incident=list[1]!;
          adjacency.get(a.sector)!.push({other:b.sector,edge,from:a,to:b});adjacency.get(b.sector)!.push({other:a.sector,edge,from:b,to:a});
        } else if (list.length !== 1) throw new Error("Nonmanifold direct shoulder edge");
      }
      const starts:number[]=[...adjacency.keys()].filter((k:number):boolean=>adjacency.get(k)!.length === 1).sort((a:number,b:number):number=>local[a]!.face < local[b]!.face ? -1 : local[a]!.face > local[b]!.face ? 1 : 0);
      if (internal !== count-1 || starts.length !== 2 || [...adjacency.values()].some((a:unknown[]):boolean=>a.length>2)) throw new Error("Shoulder direct enclosure is not one qualified boundary fan");
      const affine:Map<number,Affine>=new Map([[starts[0]!,{a:A.of(1),b:A.of(0)}]]),queue:number[]=[starts[0]!];
      for (let cursor:number=0;cursor<queue.length;cursor++) {
        const k:number=queue[cursor]!,parent:Affine=affine.get(k)!;
        for (const step of adjacency.get(k)!) if (!affine.has(step.other)) {
          const c:A.D=edgeValues.get(step.edge)!.c;
          const ratio:A.D=A.div(A.scale(step.to.alpha,step.to.sample.width),A.scale(step.from.alpha,step.from.sample.width));
          const shift:A.D=A.scale(A.mul(c,A.sub(step.to.beta,A.div(A.mul(step.to.alpha,step.from.beta),step.from.alpha))),step.to.sample.width);
          affine.set(step.other,{a:A.mul(ratio,parent.a),b:A.add(A.mul(ratio,parent.b),shift)});queue.push(step.other);
        }
      }
      if (affine.size !== count) throw new Error("Disconnected direct shoulder fan");
      let numerator:A.D=A.of(0),denominator:A.D=A.of(0),fixed:A.D|undefined;
      for (let k:number=0;k<count;k++) {
        const law:Affine=affine.get(k)!,f:Form=forms[k]!;
        for (let axis:number=0;axis<3;axis++) {
          const u:A.D=A.add(f.zero[axis]!,A.mul(f.mixed[axis]!,law.b)),v:A.D=A.mul(f.mixed[axis]!,law.a);
          numerator=A.add(numerator,A.mul(u,v));denominator=A.add(denominator,A.mul(v,v));
        }
        for (const sample of [local[k]!.h,local[k]!.v]) {
          const actual:M.Frame2|undefined=input.actualFrames?.[sample.name]?.[sample.end];if (!actual) continue;
          M.close(M.normal(actual),n,"direct actual regional normal");
          for (const side of [local[k]!.h,local[k]!.v]) {
            const d:M.V=endpoints[side.name]![side.end].jet.derivativeMm,q:[number,number]=M.coordinates(actual,d);
            M.close([A.value(A.dot(n,M.hessian(actual,q,q))),0,0],[A.value(edgeValues.get(side.name)!.c),0,0],"direct actual regional pure curvature");
          }
          const qh:[number,number]=M.coordinates(actual,local[k]!.h.along),qv:[number,number]=M.coordinates(actual,local[k]!.v.along);
          const target:A.D=A.dot(n,M.hessian(actual,qh,qv)),root:A.D=A.div(A.sub(target,law.b),law.a);
          if (fixed) M.close([A.value(root),0,0],[A.value(fixed),0,0],"direct actual regional mixed constraints");
          fixed=root;
        }
      }
      if (!(A.value(denominator)>0)) throw new Error("Rank-deficient direct shoulder gauge");
      const root:A.D=fixed ?? A.neg(A.div(numerator,denominator));
      const kappas:A.D[]=local.map((_s:Sector,k:number):A.D=>{const a:Affine=affine.get(k)!;return A.add(A.mul(a.a,root),a.b);});
      const residuals:number[]=[],normalForms:number[]=[];
      for (const [k,s] of local.entries()) {
        corners[s.face]![s.i]![s.j]={p:endpoints[s.h.name]![s.h.end].jet.positionMm,u:s.h.along,v:s.v.along,uv:A.combine([{factor:kappas[k]!,vector:n}]),normal:n};
        for (let axis:number=0;axis<3;axis++) normalForms.push(A.value(A.add(forms[k]!.zero[axis]!,A.mul(forms[k]!.mixed[axis]!,kappas[k]!))));
      }
      for (const [name,list] of incidence) {
        const first:Incident=list[0]!,data:{e:M.V;c:A.D;rho:A.D;speed:A.D;tau:A.D}=edgeValues.get(name)!;
        const ke:A.D=A.div(A.sub(A.div(kappas[first.sector]!,A.of(first.sample.width)),A.mul(first.beta,data.c)),first.alpha);
        const jet:M.CurveJet=endpoints[name]![first.sample.end].jet;
        const field:M.FrameFieldJet={value:data.e,first:A.combine([{factor:ke,vector:n},{factor:A.neg(A.div(data.rho,data.speed)),vector:jet.derivativeMm}]),movingBasis:{normal:n,normalDerivative:ke,normalCurvature:data.c,conormalCurvature:data.rho,tangentAcceleration:data.tau,speedSquared:data.speed}};
        (fields[name] as [M.FrameFieldJet,M.FrameFieldJet])[first.sample.end]=field;
        for (const entry of list) {
          const alphaPrime:A.D=A.neg(A.mul(entry.beta,data.rho)),betaPrime:A.D=A.sub(A.div(A.mul(entry.alpha,data.rho),data.speed),A.mul(entry.beta,data.tau));
          const values:[ScalarJet,ScalarJet]=scalars[local[entry.sector]!.face]![entry.side] as [ScalarJet,ScalarJet];values[entry.chartEnd]={alpha:entry.alpha,beta:entry.beta,alphaPrime,betaPrime};
          const consumed:A.D=A.scale(A.add(A.mul(entry.alpha,ke),A.mul(entry.beta,data.c)),entry.sample.width);
          residuals.push(A.value(A.sub(consumed,kappas[entry.sector]!)));
          M.close(A.combine([{factor:consumed,vector:n}]),corners[local[entry.sector]!.face]![local[entry.sector]!.i]![local[entry.sector]!.j]!.uv,"direct shared scalar mixed identity");
        }
      }
      audits.push({node,unknowns:3*count,equations:4*count-2,rank:fixed ? 3*count : 3*count-1,nullity:fixed ? 0 : 1,rowQrPivots:[],singularValues:null,maximumResidual:Math.max(...residuals.map(Math.abs)),normalForms,equationResiduals:residuals,gauge:"sector-normal-form/minimum-norm-direct-fan",residualUnit:"normalized-UV-mm",reducedUnknowns:count,reducedRank:fixed ? count : count-1,rootExpansion:root});
    }
    return {corners,fields,endpoints,audits,scalars};
    function sample(edge:Edge,t:0|1):Sample {
      const end:0|1=(edge.orientation === 1 ? t : 1-t) as 0|1,curve:M.Curve=input.curves[edge.name]!,width:number=edge.orientation*(curve.boundary.end-curve.boundary.start);
      return {name:edge.name,end,width,along:M.mul(endpoints[edge.name]![end].jet.derivativeMm,width),node:input.ends[edge.name]![end]};
    }
  }
  /** Choose the edge-interior limit and retain both original one-sided jets. */
  export function endpoint(curve:M.Curve,end:0|1):Endpoint {
    const p:number=end === 0 ? curve.boundary.start : curve.boundary.end,inside:"right"|"left"=end === 0 ? "right" : "left",jet:M.CurveJet=M.sample(curve,p,inside);
    return {jet,inside,inventory:curve.oneSidedJets?.(p) ?? {left:jet,right:jet}};
  }
  /** Affine physical B coefficients from actual pure jets and one normalized mixed unknown. */
  function form(s:Sector,n:M.V,x:M.V,y:M.V,endpoints:Result["endpoints"]):Form {
    const hx:A.D=A.dot(x,s.h.along),hy:A.D=A.dot(y,s.h.along),vx:A.D=A.dot(x,s.v.along),vy:A.D=A.dot(y,s.v.along);
    const det:A.D=A.sub(A.mul(hx,vy),A.mul(hy,vx));
    if (!(Math.abs(A.value(det))>1024*Number.EPSILON*M.norm(s.h.along)*M.norm(s.v.along))) throw new Error("Singular direct shoulder chart basis");
    const a:A.D=A.div(vy,det),b:A.D=A.neg(A.div(vx,det)),c:A.D=A.neg(A.div(hy,det)),d:A.D=A.div(hx,det);
    const uu:A.D=A.scale(A.scale(A.dot(n,endpoints[s.h.name]![s.h.end].jet.secondDerivativeMm),s.h.width),s.h.width),vv:A.D=A.scale(A.scale(A.dot(n,endpoints[s.v.name]![s.v.end].jet.secondDerivativeMm),s.v.width),s.v.width);
    return {zero:[A.add(A.mul(uu,A.mul(a,a)),A.mul(vv,A.mul(c,c))),A.add(A.mul(uu,A.mul(a,b)),A.mul(vv,A.mul(c,d))),A.add(A.mul(uu,A.mul(b,b)),A.mul(vv,A.mul(d,d)))],mixed:[A.scale(A.mul(a,c),2),A.add(A.mul(a,d),A.mul(b,c)),A.scale(A.mul(b,d),2)]};
  }
}
