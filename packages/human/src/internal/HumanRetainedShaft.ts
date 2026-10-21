import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";
import type { HumanPlaneCut } from "./HumanPlaneCut";
import type { HumanSurface } from "./HumanSurface";

/** Restrict the actual shaft by its phase-dependent plane intersections. */
export namespace HumanRetainedShaft {
  /**
   * Reparameterize the original surface without fitting or projecting it.
   * Original station and phase are interpolated between their actual boundary
   * parameter functions; their full chain rule determines the analytic normals.
   * A positive coordinate Jacobian is required at every evaluation. Unjoined
   * ends keep the original physical station and use the other end's phase map.
   * A common angular sample array belongs to the sole assembly boundary owner.
   */
  export function build(id:string,family:HumanCurveFamily.Family,start:HumanPlaneCut.Cut|undefined,end:HumanPlaneCut.Cut|undefined,outwardSign:1|-1,phases:readonly number[]):HumanSurface.Patch {
    const requestedReference:HumanPlaneCut.Cut|undefined=start??end;
    if (requestedReference === undefined) throw new Error("Variable shaft restriction requires an actual implicit boundary");
    const first:number=family.intervals[0]!.startMm,last:number=family.intervals.at(-1)!.endMm;
    const reference:HumanPlaneCut.Cut=requestedReference;
    const seams:Map<HumanPlaneCut.Cut,number>=new Map();
    for(const cut of [start,end,reference]) if(cut!==undefined&&!seams.has(cut)) seams.set(cut,cut.sourceParameters(0).phaseRadians);
    const startBoundary:HumanSurface.Boundary=start?.boundary??openBoundary(id+".open-start",false);
    const endBoundary:HumanSurface.Boundary=end?.boundary??openBoundary(id+".open-end",true);
    const meridian:HumanSurface.Boundary={id:id+".periodic-meridian",unit:"normalized",start:0,end:1,evaluate:(u:number):HumanCurve.Vector=>jet(u,0).positionMm,derivative:(u:number):HumanCurve.Vector=>jet(u,0).derivativeU};
    return {id,u:{start:0,end:1,unit:"normalized"},v:{start:0,end:2*Math.PI,unit:"radians"},outwardSign,
      boundaries:{u0:{curve:startBoundary,orientation:1},u1:{curve:endBoundary,orientation:1},v0:{curve:meridian,orientation:1},v1:{curve:meridian,orientation:1}},sampling:{v:phases},jet};

    function parameters(cut:HumanPlaneCut.Cut|undefined,phase:number,isEnd:boolean):ReturnType<HumanPlaneCut.Cut["sourceParameters"]>{
      const owner:HumanPlaneCut.Cut=cut??reference;
      const value:ReturnType<HumanPlaneCut.Cut["sourceParameters"]>=owner.sourceParameters(phase);
      const lift:number=value.phaseRadians<seams.get(owner)!?2*Math.PI:0;
      return {...value,phaseRadians:value.phaseRadians+lift,stationMm:cut===undefined?(isEnd?last:first):value.stationMm,stationDerivativePerRadian:cut===undefined?0:value.stationDerivativePerRadian};
    }
    function jet(u:number,inputPhase:number):ReturnType<HumanSurface.Patch["jet"]>{
      if(!(Number.isFinite(u)&&u>=0&&u<=1&&Number.isFinite(inputPhase)&&inputPhase>=0&&inputPhase<=2*Math.PI)) throw new Error("Restricted shaft evaluation is outside its actual chart");
      const phase:number=inputPhase===2*Math.PI?0:inputPhase;
      const a:ReturnType<HumanPlaneCut.Cut["sourceParameters"]>=parameters(start,phase,false),b:ReturnType<HumanPlaneCut.Cut["sourceParameters"]>=parameters(end,phase,true);
      // Integer phase lifts choose a chart convention, never move the surface.
      const alignment:number=Math.round((seams.get(start??reference)!-seams.get(end??reference)!)/(2*Math.PI))*2*Math.PI;
      const ds:number=b.stationMm-a.stationMm,dp:number=b.phaseRadians+alignment-a.phaseRadians;
      const sv:number=(1-u)*a.stationDerivativePerRadian+u*b.stationDerivativePerRadian,pv:number=(1-u)*a.phaseDerivativePerRadian+u*b.phaseDerivativePerRadian;
      if(!(ds>0&&ds*pv-sv*dp>0)) throw new Error("Actual shaft cut domains have a nonpositive coordinate Jacobian: "+id);
      const station:number=u===0?a.stationMm:u===1?b.stationMm:a.stationMm+u*ds;
      const originalPhase:number=a.phaseRadians+u*dp;
      const value:HumanCurveFamily.Jet=family.jet(station,originalPhase);
      const result:ReturnType<HumanSurface.Patch["jet"]>={positionMm:value.positionMm,derivativeU:add(scale(value.longitudinalDerivative,ds),scale(value.phaseDerivativeMmPerRadian,dp)),derivativeV:add(scale(value.longitudinalDerivative,sv),scale(value.phaseDerivativeMmPerRadian,pv))};
      if(u===0||u===1){const boundary:HumanSurface.Boundary=u===0?startBoundary:endBoundary;result.positionMm=boundary.evaluate(phase);result.derivativeV=boundary.derivative(phase);}
      return result;
    }
    function openBoundary(name:string,isEnd:boolean):HumanSurface.Boundary{
      return {id:name,unit:"radians",start:0,end:2*Math.PI,
        evaluate:(phase:number):HumanCurve.Vector=>{const p:ReturnType<HumanPlaneCut.Cut["sourceParameters"]>=parameters(undefined,phase,isEnd);return family.evaluate(p.stationMm,p.phaseRadians);},
        derivative:(phase:number):HumanCurve.Vector=>{const p:ReturnType<HumanPlaneCut.Cut["sourceParameters"]>=parameters(undefined,phase,isEnd);return scale(family.phaseDerivative(p.stationMm,p.phaseRadians),p.phaseDerivativePerRadian);},};
    }
  }
  function scale(a:HumanCurve.Vector,s:number):HumanCurve.Vector{return [a[0]*s,a[1]*s,a[2]*s];}
  function add(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
}
