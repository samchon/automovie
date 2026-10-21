import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import { HumanStationPort } from "../internal/HumanStationPort";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanFaceFeatures } from "./HumanFaceFeatures";

/** Source-plane restrictions of the existing cranial authority, without reshaping. */
export namespace HumanCranialDomain {
  type Vector = HumanCurve.Vector;
  type Jet = ReturnType<HumanSurface.Patch["jet"]>;
  interface Cut { id: string; normal: Vector; offsetMm: number }
  interface Address { phase: number; derivative: number }

  /** One actual forehead edge and its station-based transverse authority. */
  export interface Forehead {
    /** Existing geometric eye side. */
    side: "left" | "right";
    /** Actual head.forehead restriction in the same canthal parameter. */
    boundary: HumanSurface.Boundary;
    /** Exact dP/ds and d²P/(ds du), with s in meridian-station mm. */
    transverse: (u: number) => { derivativeS: Vector; derivativeSU: Vector };
  }

  /** The caller selects the outer source-canthal ownership plane for retained sectors. */
  export interface Result {
    /** Same cached port(last) used by the existing forehead contacts, not a rebuilt station. */
    foreheadStation: HumanStationPort.Result;
    /** Unchanged forehead-to-crown family. */
    upper: HumanCurveFamily.Family;
    /** Exact lower-sheet restrictions outside the two central canthal sectors. */
    retained: HumanSurface.Patch[];
    /** Actual upper edges supplied to the common forehead-band owner. */
    foreheads: Forehead[];
    /** Upper mesh addresses include every shared lower-edge sample. */
    upperPhases: number[];
    /** Source-domain and unjoined lateral-edge qualifications. */
    limitations: string[];
  }

  /**
   * The source exterior crosscourses meet the named brow and then the observed
   * forehead principal plane. Their quarter and selected three-quarter/outer canthal planes define
   * the two replacement sectors. This operation restricts that actual network;
   * it introduces no angular crop, boundary shift, bridge or fitted radial edge.
   * Every plane crossing is isolated using complete angular derivative bounds.
   * Two simple crossings and a distinct anterior branch are required.
   *
   * Implicit derivatives retain the physical meridian and canthal gauges.
   * The cranial family's supplied crown derivative has norm bounds one for its
   * value and first two angular derivatives. The tridiagonal slope system has
   * row diagonal margin at least one, which bounds all solved angular slopes by
   * the largest right-hand-side norm. Cubic Hermite basis bounds then admit each
   * actual station without sampling or refitting the family. These binary64
   * bounds are numerical admissions, not outward interval certificates.
   */
  export function build(family: HumanCurveFamily.Family, eyes: HumanFaceFeatures.Result, canthalEnd: .75 | 1 = .75): Result {
    const forehead: HumanCurve.Section | undefined = family.sections.find((section: HumanCurve.Section): boolean => section.id === "head.forehead");
    if (forehead === undefined || family.boundaryConditions.start !== "natural" || family.boundaryConditions.end !== "clamped")
      throw new Error("Cranial restrictions require the existing head forehead and crown authorities");
    const first: number = family.sections[0]!.stationMm, last: number = forehead.stationMm;
    const descriptors: Array<[number, number, number]> = family.sections.map((section: HumanCurve.Section): [number, number, number] => {
      let r: number = Math.abs(section.coefficientsMm[0]!), dr: number = 0, ddr: number = 0;
      for (let k: number = 1; 2*k < section.coefficientsMm.length; k++) {
        const magnitude: number = Math.abs(section.coefficientsMm[2*k-1]!)+Math.abs(section.coefficientsMm[2*k]!);
        r += magnitude; dr += k*magnitude; ddr += k*k*magnitude;
      }
      return [Math.hypot(...section.originMm)+r, r+dr, r+2*dr+ddr];
    });
    const slopeBounds: number[] = [1,1,1];
    for (let i: number = 0; i < descriptors.length-1; i++) {
      const width: number = family.sections[i+1]!.stationMm-family.sections[i]!.stationMm;
      for (let order: number = 0; order < 3; order++)
        slopeBounds[order] = Math.max(slopeBounds[order]!,3*(descriptors[i]![order]!+descriptors[i+1]![order]!)/width);
    }
    const ports: Map<number, HumanStationPort.Result> = new Map();
    const addresses: Map<string, Address> = new Map();
    const port: (s: number) => HumanStationPort.Result = (s: number): HumanStationPort.Result => {
      const previous: HumanStationPort.Result | undefined = ports.get(s);
      if (previous !== undefined) return previous;
      const index: number = family.intervals.findIndex((interval: HumanCurveFamily.Interval): boolean => s >= interval.startMm && s <= interval.endMm);
      if (index < 0) throw new Error("Cranial station is outside its unchanged family");
      const width: number = family.intervals[index]!.endMm-family.intervals[index]!.startMm;
      const bounds: number[] = [0,1,2].map((order: number): number => Math.max(descriptors[index]![order]!,descriptors[index+1]![order]!)+width*slopeBounds[order]!/4);
      const result: HumanStationPort.Result = HumanStationPort.fromBounds("head.cranial.station."+s,family,s,{positionMm:bounds[0]!,firstMmPerRadian:bounds[1]!,secondMmPerRadianSquared:bounds[2]!});
      ports.set(s,result); return result;
    };
    const address: (cut: Cut, s: number) => Address = (cut: Cut, s: number): Address => {
      const key: string = cut.id+"/"+s;
      const previous: Address | undefined = addresses.get(key);
      if (previous !== undefined) return previous;
      const contacts: HumanStationPort.Contact[] = port(s).contacts(cut.normal,cut.offsetMm);
      if (contacts.length !== 2) throw new Error("The cranial plane lacks two qualified simple crossings");
      contacts.sort((a: HumanStationPort.Contact,b: HumanStationPort.Contact): number => b.jet.positionMm[0]-a.jet.positionMm[0]);
      const contact: HumanStationPort.Contact = contacts[0]!;
      if (!(contact.jet.positionMm[0]-contacts[1]!.jet.positionMm[0] > 128*Number.EPSILON*Math.max(1,Math.hypot(...contact.jet.positionMm))))
        throw new Error("The anterior cranial branch is unresolved");
      const result: Address = {phase:contact.phaseRadians > Math.PI ? contact.phaseRadians-2*Math.PI : contact.phaseRadians,
        derivative:-dot(cut.normal,contact.jet.longitudinalDerivative)/dot(cut.normal,contact.jet.phaseDerivativeMmPerRadian)};
      if (!Number.isFinite(result.derivative)) throw new Error("Cranial plane projection has no regular station derivative");
      addresses.set(key,result); return result;
    };
    const cuts: Map<string, Cut> = new Map();
    const foreheads: Forehead[] = [];
    const upperPhases: Set<number> = new Set([0]);
    for (const opening of eyes.openings) {
      const side: "left" | "right" = opening.upper.side;
      const start: Vector = opening.upper.evaluate(0), end: Vector = opening.upper.evaluate(1);
      const chord: Vector = end.map((value: number,axis: number): number => value-start[axis]!) as Vector;
      const length: number = Math.hypot(...chord), normal: Vector = chord.map((value: number): number => value/length) as Vector;
      const cut: (u: number) => Cut = (u: number): Cut => ({id:side+"/"+u,normal,offsetMm:dot(normal,start)+length*u});
      cuts.set(side+"-inner",cut(.25)); cuts.set(side+"-outer",cut(canthalEnd));
      const at: (u: number) => {value: HumanCurveFamily.Jet; rate: number} = (u: number): {value: HumanCurveFamily.Jet; rate: number} => {
        if (!(Number.isFinite(u) && u >= .25 && u <= canthalEnd)) throw new Error("Forehead edge lies outside its source canthal domain");
        const location: Address = address(cut(u),last);
        const value: HumanCurveFamily.Jet = family.jet(last,periodic(location.phase));
        return {value,rate:length/dot(normal,value.phaseDerivativeMmPerRadian)};
      };
      const boundary: HumanSurface.Boundary = {id:"head.forehead."+side+".central-canthal",start:.25,end:canthalEnd,unit:"canthal-chord-fraction",
        evaluate:(u: number): Vector => at(u).value.positionMm,
        derivative:(u: number): Vector => {const sample: ReturnType<typeof at> = at(u);return scale(sample.value.phaseDerivativeMmPerRadian,sample.rate);}};
      foreheads.push({side,boundary,transverse:(u: number): {derivativeS: Vector;derivativeSU: Vector} => {
        const sample: ReturnType<typeof at> = at(u), value: HumanCurveFamily.Jet = sample.value;
        const second: Vector | undefined = value.phaseSecondDerivativeMmPerRadianSquared;
        if (second === undefined) throw new Error("Cranial transverse authority requires its exact angular second jet");
        const a: number = dot(normal,value.longitudinalDerivative), b: number = dot(normal,value.phaseDerivativeMmPerRadian);
        const q: number = -a/b, qp: number = -(dot(normal,value.longitudinalPhaseDerivativePerRadian)*b-a*dot(normal,second))/(b*b);
        return {derivativeS:add(value.longitudinalDerivative,scale(value.phaseDerivativeMmPerRadian,q)),
          derivativeSU:scale(add(add(value.longitudinalPhaseDerivativePerRadian,scale(second,q)),scale(value.phaseDerivativeMmPerRadian,qp)),sample.rate)};
      }});
      for (let i: number = 0; i <= 16; i++) upperPhases.add(periodic(address(cut(.25+.5*i/16),last).phase));
      if (canthalEnd === 1)
        for (let i: number = 0; i <= 16; i++) upperPhases.add(periodic(address(cut(.75+.25*i/16),last).phase));
    }
    if (foreheads.length !== 2 || cuts.size !== 4) throw new Error("Cranial replacement requires exactly two existing eye sides");
    const fixed: (phase: number) => ((s: number) => Address) = (phase: number): ((s: number) => Address) => (_s: number): Address => ({phase,derivative:0});
    const owned: (name: string) => ((s: number) => Address) = (name: string): ((s: number) => Address) => (s: number): Address => address(cuts.get(name)!,s);
    const spans: Array<{id: string;lowId:string;highId:string;low:(s: number)=>Address;high:(s: number)=>Address}> = [
      {id:"left-posterior",lowId:"posterior-seam",highId:"left-outer",low:fixed(-Math.PI),high:owned("left-outer")},
      {id:"left-medial",lowId:"left-inner",highId:"anterior-seam",low:owned("left-inner"),high:fixed(0)},
      {id:"right-medial",lowId:"anterior-seam",highId:"right-inner",low:fixed(0),high:owned("right-inner")},
      {id:"right-posterior",lowId:"right-outer",highId:"posterior-seam",low:owned("right-outer"),high:fixed(Math.PI)},
    ];
    const edgeOwners: Map<string,HumanSurface.Boundary> = new Map();
    const stations: number[] = [first,...family.refine(3,8192).filter((interval: HumanCurveFamily.Interval): boolean => interval.endMm > first && interval.endMm <= last).map((interval: HumanCurveFamily.Interval): number=>interval.endMm)];
    const retained: HumanSurface.Patch[] = spans.map((span: typeof spans[number]): HumanSurface.Patch => {
      const id: string = "head.cranial.retained."+span.id;
      const jet: (s: number,v: number) => Jet = (s: number,v: number): Jet => {
        if (!(Number.isFinite(s) && s >= first && s <= last && Number.isFinite(v) && v >= 0 && v <= 1))
          throw new Error("Retained cranial evaluation lies outside its owned source-plane domain");
        const low: Address = span.low(s), high: Address = span.high(s);
        if (!(high.phase > low.phase)) throw new Error("Source-plane cranial sector order is unresolved");
        const phase: number = v === 0 ? low.phase : v === 1 ? high.phase : low.phase+(high.phase-low.phase)*v;
        const value: HumanCurveFamily.Jet = family.jet(s,periodic(phase));
        return {positionMm:value.positionMm,derivativeU:add(value.longitudinalDerivative,scale(value.phaseDerivativeMmPerRadian,(1-v)*low.derivative+v*high.derivative)),
          derivativeV:scale(value.phaseDerivativeMmPerRadian,high.phase-low.phase)};
      };
      const section: (s: number,label: string) => HumanSurface.Boundary = (s: number,label: string): HumanSurface.Boundary => ({id:id+label,start:0,end:1,unit:"normalized-retained-phase",evaluate:(v: number): Vector=>jet(s,v).positionMm,derivative:(v: number): Vector=>jet(s,v).derivativeV});
      const meridian: (v: number,key: string) => HumanSurface.Boundary = (v: number,key: string): HumanSurface.Boundary => {
        const previous: HumanSurface.Boundary | undefined = edgeOwners.get(key);
        if(previous !== undefined) return previous;
        const edge: HumanSurface.Boundary = {id:"head.cranial.retained.edge."+key,start:first,end:last,unit:"meridian-station-mm",evaluate:(s: number): Vector=>jet(s,v).positionMm,derivative:(s: number): Vector=>jet(s,v).derivativeU};
        edgeOwners.set(key,edge);return edge;
      };
      const phases: number[] = Array.from({length:65},(_:unknown,index:number):number=>index/64);
      for (const v of phases) upperPhases.add(periodic(v===0?span.low(last).phase:v===1?span.high(last).phase:span.low(last).phase+(span.high(last).phase-span.low(last).phase)*v));
      return {id,u:{start:first,end:last,unit:"meridian-station-mm"},v:{start:0,end:1,unit:"normalized-retained-phase"},jet,outwardSign:1,sampling:{u:stations,v:phases},
        boundaries:{u0:{curve:section(first,".lower"),orientation:1},u1:{curve:section(last,".forehead"),orientation:1},v0:{curve:meridian(0,span.lowId),orientation:1},v1:{curve:meridian(1,span.highId),orientation:1}}};
    });
    return {foreheadStation:port(last),upper:HumanCurveFamily.restrict(family,last,family.sections.at(-1)!.stationMm),retained,foreheads,upperPhases:[...upperPhases].sort((a: number,b: number): number=>a-b),limitations:[
      "The two source-canthal sectors below head.forehead extend to the caller-selected outer plane. Retained posterior sectors change domain when that plane changes; their independent boundary authority and all neighbors require fresh inspection",
      "Restrictions preserve the complete existing cranial function and exact implicit jets; they establish neither a new source fit nor unseen morphology prediction",
      "Brow/forehead transverse jets, side-course neighbors and generated intersections require a complete common-boundary inspection before this candidate is adopted",
    ]};
  }
  function dot(a: Vector,b: Vector): number {return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function scale(a: Vector,s: number): Vector {return a.map((value: number): number=>value*s) as Vector;}
  function add(a: Vector,b: Vector): Vector {return a.map((value: number,axis: number): number=>value+b[axis]!) as Vector;}
  function periodic(phase: number): number {return phase < 0 ? phase+2*Math.PI : phase;}
}
