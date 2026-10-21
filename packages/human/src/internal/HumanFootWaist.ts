import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";
import { HumanStationPort } from "./HumanStationPort";

/** Actual breadth turning points belong to the complete current foot function. */
export namespace HumanFootWaist {
  /** Numerical feature correspondence, without moving or refitting the family. */
  export interface Result {
    /** Dominant generated proximal breadth maximum, physical support station mm. */
    firstMaximumMm: number;
    /** Following local breadth minimum, physical support station mm. */
    waistMm: number;
    /** Actual minimum transverse breadth, mm. */
    breadthMm: number;
    /** Finite search and correspondence qualifications. */
    limitations: readonly string[];
  }

  /**
   * Breadth is max_phi U.F minus min_phi U.F over every full angular branch.
   * Competing support points can exchange at a nonsmooth envelope cusp. The
   * continuous scalar objective therefore uses bounded value minimization,
   * never the derivative of one arbitrarily selected supporting point.
   * Original source-feature windows distinguish the proximal bulge and the
   * following waist from small proximal angular-branch switching events.
   */
  export function build(family:HumanCurveFamily.Family):Result {
    if(family.sections.length<5||family.polynomialSpans===undefined) throw new Error("Foot features require their actual complete polynomial authority");
    const direction:HumanCurve.Vector=family.sections[0]!.axisU;
    const first:number=family.intervals[0]!.startMm;
    const proximalEnd:number=family.sections[2]!.stationMm,forefoot:number=family.sections[3]!.stationMm;
    const peak:number=optimize(first,proximalEnd,-1);
    const waist:number=optimize(peak,forefoot,1);
    if(!(peak>first&&peak<proximalEnd&&waist>peak&&waist<forefoot)) throw new Error("The observed proximal peak and following waist are censored in the generated foot");
    return {firstMaximumMm:peak,waistMm:waist,breadthMm:width(waist),limitations:[
      "Breadth support values retain every complete world-Fourier angular branch, including tied support points and nonsmooth envelope switches",
      "The proximal bulge is the maximum before the source waist principal domain; the following waist is the minimum before the distal forefoot maximum domain. Neither is snapped to a principal descriptor",
      "Thirty-two value brackets per original physical span and bounded scalar minimization provide finite numerical feature observations, not a certified count of every narrow extremum",
      "Actual feature ports and guide curves do not certify complete ankle skin, source anatomical equivalence or independent native parameter response",
    ]};

    function width(station:number):number {
      const extrema:HumanStationPort.Extrema=HumanStationPort.projectionExtrema(family,station,direction);
      return extrema.maximumValueMm-extrema.minimumValueMm;
    }
    function optimize(start:number,end:number,sign:1|-1):number {
      const probes:number[]=[start];
      for(const span of family.polynomialSpans!) {
        const a:number=Math.max(start,span.startMm),b:number=Math.min(end,span.endMm);
        if(!(a<b)) continue;
        for(let i:number=1;i<=32;i++) probes.push(i===32?b:a+(b-a)*i/32);
      }
      const values:number[]=probes.map((station:number):number=>sign*width(station));
      const candidates:number[]=[start,end];
      for(let i:number=1;i<probes.length-1;i++)
        if(values[i]!<=values[i-1]!&&values[i]!<=values[i+1]!) candidates.push(minimize(probes[i-1]!,probes[i+1]!));
      candidates.sort((a:number,b:number):number=>sign*(width(a)-width(b)));
      return candidates[0]!;
      function minimize(a:number,b:number):number {
        const ratio:number=(Math.sqrt(5)-1)/2;
        let c:number=b-ratio*(b-a),d:number=a+ratio*(b-a),fc:number=sign*width(c),fd:number=sign*width(d);
        for(let iteration:number=0;iteration<80;iteration++) {
          if(c===a||d===b||c===d) break;
          if(fc<=fd) {b=d;d=c;fd=fc;c=b-ratio*(b-a);fc=sign*width(c);}
          else {a=c;c=d;fc=fd;d=a+ratio*(b-a);fd=sign*width(d);}
        }
        return fc<=fd?c:d;
      }
    }
  }
}
