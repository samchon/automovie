import { HumanJointCurves } from "../limbs/HumanJointCurves";
import { HumanAnkleCurves } from "../extremities/HumanAnkleCurves";
import type { HumanFootBody } from "../extremities/HumanFootBody";
import type { HumanLimbCurves } from "../limbs/HumanLimbCurves";
import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import type { HumanCurve } from "./HumanCurve";
import { HumanCurveFamily } from "./HumanCurveFamily";
import { HumanPlaneCut } from "./HumanPlaneCut";
import { HumanPositiveJoint } from "./HumanPositiveJoint";
import { HumanRetainedShaft } from "./HumanRetainedShaft";
import type { HumanSkeleton } from "./HumanSkeleton";
import type { HumanSurface } from "./HumanSurface";

/** Sole owner of exact shaft restrictions and shared physical joint boundaries. */
export namespace HumanJointAssembly {
  /** An independently generated foot supplies its actual family and input breadth. */
  export interface Foot {
    /** Original foot curve authority, before an exact mirrored chart pullback. */
    body: HumanFootBody.Result;
    /** Independently supplied physical transverse breadth, mm. */
    breadthMm: number;
  }
  /** Positive joining family emitted by the common skin/construction owner. */
  export interface Region {
    /** Physical joining half-domain identity. */
    id:string;
    /** Exact exponential polar surface, without polynomial reduction. */
    family:HumanCurveFamily.Family;
    /** Outward direction in the common side chart. */
    outwardSign:1|-1;
  }
  /** One curve and one transverse derivative authority per actual join. */
  export interface Boundary {
    /** Actual implicit intersection function in common polar phase. */
    curve:HumanSurface.Boundary;
    /** Exact physical plane-coordinate and mixed derivatives. */
    transverse:HumanCurveFamily.EndpointDerivative;
  }
  /** Source-free assembly retains explicit geometric and inference limits. */
  export interface Result {
    /** Positive elbow, knee and optionally ankle joining half-domains. */
    regions:Region[];
    /** Original shaft and optional foot surfaces restricted by actual plane cuts. */
    patches:HumanSurface.Patch[];
    /** Incoming, middle and outgoing actual shared authority per joint. */
    boundaries:ReadonlyMap<string,Boundary>;
    /** Mathematical premises and unresolved source correspondence. */
    limitations:string[];
  }

  /** Cut original shafts by common planes without fitting or projecting them.
   * The middle observed function retains its full angular order. Positive log
   * spans consume the same boundaries and exact physical chain-rule jets.
   * All incident skin/construction consumes the owner's angular addresses.
   */
  export function build(parameters:IAutoMovieHumanBodyParameters,skeleton:HumanSkeleton.Result,limbs:HumanLimbCurves.Result,phases:readonly number[],feet:ReadonlyMap<"l"|"r",Foot>=new Map()):Result {
    const shafts:Map<string,HumanLimbCurves.Region>=new Map(limbs.regions.map((region:HumanLimbCurves.Region):[string,HumanLimbCurves.Region]=>[region.id,region]));
    const restrictions:Map<string,{start?:HumanPlaneCut.Cut;end?:HumanPlaneCut.Cut}>=new Map();
    const regions:Region[]=[],boundaries:Map<string,Boundary>=new Map(),limitations:string[]=[];
    const retainedFeet:Array<{id:string;family:HumanCurveFamily.Family;cut:HumanPlaneCut.Cut;outwardSign:1|-1}>=[];
    for(const joint of HumanJointCurves.build(parameters,skeleton)){
      const parsed:RegExpExecArray|null=/^joint-(elbow|knee)-([lr])$/.exec(joint.id);
      if(parsed===null) throw new Error("Joint has no physical assembly identity: "+joint.id);
      const side:string=parsed[2]!,isElbow:boolean=parsed[1]==="elbow";
      const incomingId:string=(isElbow?"upper-arm-":"thigh-")+side,outgoingId:string=(isElbow?"forearm-":"shank-")+side;
      const incoming:HumanLimbCurves.Region|undefined=shafts.get(incomingId),outgoing:HumanLimbCurves.Region|undefined=shafts.get(outgoingId);
      const originMm:HumanCurve.Vector|undefined=skeleton.supports.get((isElbow?"lowerarm_":"calf_")+side);
      if(incoming===undefined||outgoing===undefined||originMm===undefined||incoming.outwardSign!==joint.outwardSign||outgoing.outwardSign!==joint.outwardSign) throw new Error("Joint has no consistently oriented shaft pair: "+joint.id);
      const u:HumanCurve.Vector=joint.middle.axisU,v:HumanCurve.Vector=joint.middle.axisV;
      const normal:HumanCurve.Vector=scale(cross(u,v),-joint.outwardSign);
      const frame:HumanPlaneCut.Frame={originMm,normal,u,v};
      const halfWidth:number=Math.min(-joint.observedDomainMm[0],joint.observedDomainMm[1]);
      const before:HumanPlaneCut.Cut=HumanPlaneCut.build(joint.id+".incoming",incoming.family,frame,-halfWidth);
      const middle:HumanPlaneCut.Cut=HumanPlaneCut.build(joint.id+".middle",joint.family,frame,0);
      const after:HumanPlaneCut.Cut=HumanPlaneCut.build(joint.id+".outgoing",outgoing.family,frame,halfWidth);
      own(before);own(middle);own(after);
      const a:{start?:HumanPlaneCut.Cut;end?:HumanPlaneCut.Cut}=restrictions.get(incomingId)??{};
      const b:{start?:HumanPlaneCut.Cut;end?:HumanPlaneCut.Cut}=restrictions.get(outgoingId)??{};
      if(a.end!==undefined||b.start!==undefined) throw new Error("Two joints claim one shaft end");
      a.end=before;b.start=after;restrictions.set(incomingId,a);restrictions.set(outgoingId,b);
      regions.push({id:joint.id+".incoming-half",family:HumanPositiveJoint.build(before,middle,frame,-halfWidth,0),outwardSign:joint.outwardSign});
      regions.push({id:joint.id+".outgoing-half",family:HumanPositiveJoint.build(middle,after,frame,0,halfWidth),outwardSign:joint.outwardSign});
      limitations.push(...joint.limitations);
    }
    for(const [side,foot] of feet){
      const id:string="joint-ankle-"+side,shaft:HumanLimbCurves.Region|undefined=shafts.get("shank-"+side);
      const originMm:HumanCurve.Vector|undefined=skeleton.supports.get("foot_"+side),proximal:HumanCurve.Vector|undefined=skeleton.supports.get("calf_"+side);
      if(shaft===undefined||originMm===undefined||proximal===undefined) throw new Error("An ankle has no generated calf and support: "+id);
      const incoming:HumanCurve.Vector=unit(subtract(originMm,proximal));
      const firstFoot:HumanCurve.Section|undefined=foot.body.family.sections[0];
      if(firstFoot===undefined) throw new Error("An ankle has no actual proximal foot section: "+id);
      const outgoing:HumanCurve.Vector=unit(cross(firstFoot.axisU,firstFoot.axisV));
      const normal:HumanCurve.Vector=unit(add(incoming,outgoing));
      const v:HumanCurve.Vector=unit(subtract([1,0,0],scale(normal,normal[0]))),u:HumanCurve.Vector=scale(cross(v,normal),side==="l"?1:-1);
      const frame:HumanPlaneCut.Frame={originMm,normal,u,v};
      const length:number=Math.hypot(...subtract(originMm,proximal));
      const prior:HumanAnkleCurves.Result=HumanAnkleCurves.buildFromSections(id,side,frame,incoming,outgoing,foot.breadthMm,{
        incomingSupport:shaft.sectionAt(length),proximalIncoming:shaft.sectionAt(length-20),outgoingSupport:firstFoot,
      });
      // A right foot's original U/V frame is right-handed. Its exact phase
      // reversal makes it agree with the mirrored common ankle chart; every
      // world point and complete Fourier order remains unchanged.
      const family:HumanCurveFamily.Family=side==="l"?foot.body.family:reversePhase(foot.body.family);
      const half:number=Math.min(-prior.observedDomainMm[0],prior.observedDomainMm[1]);
      const before:HumanPlaneCut.Cut=HumanPlaneCut.build(id+".incoming",shaft.family,frame,-half);
      const middle:HumanPlaneCut.Cut=HumanPlaneCut.build(id+".middle",prior.family,frame,0);
      const after:HumanPlaneCut.Cut=HumanPlaneCut.build(id+".outgoing",family,frame,half);
      own(before);own(middle);own(after);
      const cuts:{start?:HumanPlaneCut.Cut;end?:HumanPlaneCut.Cut}=restrictions.get(shaft.id)??{};
      if(cuts.end!==undefined) throw new Error("Two owners claim the same calf terminal boundary");
      cuts.end=before;restrictions.set(shaft.id,cuts);
      const outwardSign:1|-1=side==="l"?-1:1;
      regions.push({id:id+".incoming-half",family:HumanPositiveJoint.build(before,middle,frame,-half,0),outwardSign},
        {id:id+".outgoing-half",family:HumanPositiveJoint.build(middle,after,frame,0,half),outwardSign});
      retainedFeet.push({id:"foot-"+side,family,cut:after,outwardSign});
      limitations.push(...prior.limitations,
        "The ankle consumes actual generated calf and foot moments and exact surface restrictions; its assembled source fidelity, curvature and parameter interactions require the complete neighbor inspection",
      );
    }
    const patches:HumanSurface.Patch[]=limbs.regions.map((shaft:HumanLimbCurves.Region):HumanSurface.Patch=>{
      const cuts:{start?:HumanPlaneCut.Cut;end?:HumanPlaneCut.Cut}|undefined=restrictions.get(shaft.id);
      if(cuts===undefined) throw new Error("A retained shaft has no assembly boundary: "+shaft.id);
      return HumanRetainedShaft.build(shaft.id,shaft.family,cuts.start,cuts.end,shaft.outwardSign,phases);
    });
    for(const foot of retainedFeet) patches.push(HumanRetainedShaft.build(foot.id,foot.family,foot.cut,undefined,foot.outwardSign,phases));
    return {regions,patches,boundaries,limitations:[...limitations,
      "Implicit original-surface plane cuts and monotone polar inverses retain full shaft and middle-curve order; finite solve error and evaluated-point admission are not continuous-domain certificates",
      "Positive parallel-plane spans structurally remove rank loss in their admitted star charts; source silhouette, anatomical features, curvature and independent parameter response still require complete visual inspection",
      "Projected-forward phase is a geometric chart convention, not recovered native material transport",
      "Open shoulder, pelvis and wrist domains remain separate shared-boundary work; an omitted foot also leaves its ankle unresolved, and no source mesh or normal fills any omitted domain",
    ]};
    function own(cut:HumanPlaneCut.Cut):void{
      if(boundaries.has(cut.boundary.id)) throw new Error("Duplicate shared joint boundary owner");
      boundaries.set(cut.boundary.id,{curve:cut.boundary,transverse:{evaluate:(phase:number):HumanCurve.Vector=>cut.jet(phase).longitudinalDerivative,phaseDerivative:(phase:number):HumanCurve.Vector=>cut.jet(phase).longitudinalPhaseDerivativePerRadian}});
    }
  }
  /** Exact phi -> -phi pullback, including every available analytic derivative. */
  function reversePhase(family:HumanCurveFamily.Family):HumanCurveFamily.Family {
    const sections:HumanCurve.Section[]=family.sections.map((section:HumanCurve.Section):HumanCurve.Section=>({...section,axisU:[...section.axisU],axisV:scale(section.axisV,-1),originMm:[...section.originMm],coefficientsMm:section.coefficientsMm.map((value:number,index:number):number=>index>0&&index%2===0?-value:value)}));
    return HumanCurveFamily.fromFunction(sections,(station:number,phase:number):HumanCurveFamily.Jet=>{
      const value:HumanCurveFamily.Jet=family.jet(station,-phase);
      return {...value,phaseDerivativeMmPerRadian:scale(value.phaseDerivativeMmPerRadian,-1),longitudinalPhaseDerivativePerRadian:scale(value.longitudinalPhaseDerivativePerRadian,-1)};
    },[...family.limitations,"A mirrored common chart reverses only circumferential parameter direction; it preserves all original world points, longitudinal derivatives and even phase derivatives"]);
  }
  function add(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
  function subtract(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
  function unit(a:HumanCurve.Vector):HumanCurve.Vector{const length:number=Math.hypot(...a);if(!(length>0&&Number.isFinite(length)))throw new Error("A common joint requires a finite nonzero generated axis");return scale(a,1/length);}
  function cross(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function scale(a:HumanCurve.Vector,s:number):HumanCurve.Vector{return [a[0]*s,a[1]*s,a[2]*s];}
}
