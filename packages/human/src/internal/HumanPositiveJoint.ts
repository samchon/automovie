import type { HumanCurve } from "./HumanCurve";
import { HumanCurveFamily } from "./HumanCurveFamily";
import type { HumanPlaneCut } from "./HumanPlaneCut";

/** Positive polar spans use exact implicit boundary functions without refitting. */
export namespace HumanPositiveJoint {
  /**
   * Interpolate log radius under actual position and physical transverse jets.
   * Every interior section lies in its own parallel physical plane and has a
   * positive radius. Thus n·P_s=1 and n·P_phase=0, and the angular tangent cannot
   * vanish. This removes the prior unconstrained world-cubic rank loss by its
   * representation, without handle shrinking, increased sampling or a normal
   * replacement. It does not prove source likeness or a clinical joint shape.
   * A cubic log field is the constrained minimum-bending solution for that field;
   * the world surface is exponential and is retained without cubic reduction.
   */
  export function build(start: HumanPlaneCut.Cut, end: HumanPlaneCut.Cut, frame: HumanPlaneCut.Frame, startMm: number, endMm: number): HumanCurveFamily.Family {
    const width: number = endMm-startMm;
    if (!(width > 0 && Number.isFinite(width))) throw new Error("Positive joint spans require a finite physical interval");
    const jet: HumanCurveFamily.Family["jet"] = (station: number, phase: number): HumanCurveFamily.Jet => {
      if (!(Number.isFinite(station) && station >= startMm && station <= endMm && Number.isFinite(phase))) throw new Error("Positive joint evaluation is outside its physical domain");
      if (station === startMm) return start.jet(phase);
      if (station === endMm) return end.jet(phase);
      const a: LogJet = logarithm(start.jet(phase), startMm), b: LogJet = logarithm(end.jet(phase), endMm);
      const t: number = (station-startMm)/width, t2: number = t*t, t3: number = t2*t;
      const h: number[] = [2*t3-3*t2+1, (t3-2*t2+t)*width, -2*t3+3*t2, (t3-t2)*width];
      const d: number[] = [(6*t2-6*t)/width, 3*t2-4*t+1, (-6*t2+6*t)/width, 3*t2-2*t];
      const f: number = combine([a.value,a.station,b.value,b.station],h), fs: number = combine([a.value,a.station,b.value,b.station],d);
      const fp: number = combine([a.phase,a.mixed,b.phase,b.mixed],h), fsp: number = combine([a.phase,a.mixed,b.phase,b.mixed],d);
      const radius: number = Math.exp(f);
      if (!(radius > 0 && Number.isFinite(radius))) throw new Error("Identified positive joint field exceeded its finite physical range");
      const e: HumanCurve.Vector = add(scale(frame.u,Math.cos(phase)),scale(frame.v,Math.sin(phase)));
      const ep: HumanCurve.Vector = add(scale(frame.u,-Math.sin(phase)),scale(frame.v,Math.cos(phase)));
      return { positionMm: add(add(frame.originMm,scale(frame.normal,station)),scale(e,radius)),
        longitudinalDerivative: add(frame.normal,scale(e,radius*fs)),
        phaseDerivativeMmPerRadian: add(scale(ep,radius),scale(e,radius*fp)),
        longitudinalPhaseDerivativePerRadian: add(scale(ep,radius*fs),scale(e,radius*(fp*fs+fsp))) };
    };
    const intervals: HumanCurveFamily.Interval[] = [HumanCurveFamily.interval(startMm,endMm,(phase: number): HumanCurveFamily.Jet => start.jet(phase),(phase: number): HumanCurveFamily.Jet => end.jet(phase),jet)];
    return { sections: [], intervals, boundaryConditions: { start:"analytic",end:"analytic" }, jet,
      evaluate: (station: number,phase: number): HumanCurve.Vector => jet(station,phase).positionMm,
      derivative: (station: number,phase: number): HumanCurve.Vector => jet(station,phase).longitudinalDerivative,
      phaseDerivative: (station: number,phase: number): HumanCurve.Vector => jet(station,phase).phaseDerivativeMmPerRadian,
      refine: (depth: number,budget: number): HumanCurveFamily.Interval[] => HumanCurveFamily.refineIntervals(intervals,depth,budget),
      limitations: ["Positive polar joining spans preserve the original implicit boundary curves and physical first jets; source likeness and curvature across adjacent spans require the complete affected render round", "Log-radius interpolation is a constrained representation choice; it does not identify missing anatomical principal features or source transverse derivatives"],
    };

    function logarithm(value: HumanCurveFamily.Jet, station: number): LogJet {
      const q: HumanCurve.Vector = subtract(value.positionMm,add(frame.originMm,scale(frame.normal,station)));
      const rp: HumanCurve.Vector = value.phaseDerivativeMmPerRadian, rs: HumanCurve.Vector = subtract(value.longitudinalDerivative,frame.normal);
      const radiusSquared: number = dot(q,frame.u)**2+dot(q,frame.v)**2;
      if (!(radiusSquared > 0 && Number.isFinite(radiusSquared))) throw new Error("Joint boundary has no positive polar radius");
      const qrStation: number = dot(q,rs), qrPhase: number = dot(q,rp);
      return { value: .5*Math.log(radiusSquared), station: qrStation/radiusSquared, phase: qrPhase/radiusSquared,
        mixed: (dot(rp,rs)+dot(q,value.longitudinalPhaseDerivativePerRadian))/radiusSquared-2*qrStation*qrPhase/(radiusSquared*radiusSquared) };
    }
  }
  interface LogJet { value:number;station:number;phase:number;mixed:number; }
  function combine(values:number[],weights:number[]):number { return values.reduce((sum:number,value:number,index:number):number => sum+value*weights[index]!,0); }
  function dot(a:HumanCurve.Vector,b:HumanCurve.Vector):number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function add(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
  function subtract(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
  function scale(a:HumanCurve.Vector,s:number):HumanCurve.Vector { return [a[0]*s,a[1]*s,a[2]*s]; }
}
