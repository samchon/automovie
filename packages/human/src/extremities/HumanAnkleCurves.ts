import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { HumanPlaneCut } from "../internal/HumanPlaneCut";
import { HumanAnkleRules } from "./HumanAnkleRules";

/** Conditional ankle shape laws consume generated calf and foot geometry. */
export namespace HumanAnkleCurves {
  /** These observations must come from the caller's actual generated curves.
   * No reference curves, copied specimen controls or measured ankle girth enter.
   */
  export interface Geometry {
    /** Area centroid of the generated calf on the incoming support plane, mm. */
    incomingSupportCentroidMm: HumanCurve.Vector;
    /** Area centroid of the generated foot on the outgoing support plane, mm. */
    outgoingSupportCentroidMm: HumanCurve.Vector;
    /** Area of the generated calf on incoming signed plane -20 mm, mm squared. */
    proximalIncomingAreaMm2: number;
    /** The fixed source-observed geometry protocol; another plane is unsupported. */
    proximalIncomingPlaneMm: -20;
  }

  /** Exact generated descriptors from their existing calf and foot curve owners. */
  export interface Sections {
    /** Calf section on the foot-support plane perpendicular to incoming axis. */
    incomingSupport: HumanCurve.Section;
    /** Same calf authority exactly 20 mm proximal in the incoming plane chart. */
    proximalIncoming: HumanCurve.Section;
    /** Foot section on its existing proximal support plane. */
    outgoingSupport: HumanCurve.Section;
  }

  /** A prior band supplies common shape; the common owner supplies exact joins. */
  export interface Result {
    /** One unchanged analytic evaluator for skin, construction and all jets. */
    family: HumanCurveFamily.Family;
    /** Source support-plane prior, independent of the final shared boundary. */
    middle: HumanCurve.Section;
    /** Intersection of all observed normalized bands, in physical mm. */
    observedDomainMm: [number, number];
    /** Full-band lower radius bound in real arithmetic, before rounding error. */
    radiusLowerBoundMm: number;
    /** Conditional observation and unimplemented input effects remain explicit. */
    limitations: string[];
  }

  /**
   * Consume actual adjoining Fourier authorities without mesh measurement or fit.
   * Orthogonality and the three physical planes are checked before integration.
   * Parseval's identity gives area; the complete first harmonic of r cubed gives
   * its area centroid. Finite complex convolution retains every input harmonic.
   * This changes neither input curves nor their degrees and has no angular-grid
   * or polygon approximation. Unavailable section domains remain the caller's
   * explicit refusal instead of an extrapolated descriptor.
   */
  export function buildFromSections(
    id: string,
    side: "l" | "r",
    frame: HumanPlaneCut.Frame,
    incomingAxis: HumanCurve.Vector,
    outgoingAxis: HumanCurve.Vector,
    footBreadthMm: number,
    sections: Sections,
  ): Result {
    admitPlane(sections.incomingSupport,incomingAxis,0);
    admitPlane(sections.proximalIncoming,incomingAxis,HumanAnkleRules.proximalIncomingPlaneMm);
    admitPlane(sections.outgoingSupport,outgoingAxis,0);
    const incoming: Moments = moments(sections.incomingSupport);
    const outgoing: Moments = moments(sections.outgoingSupport);
    const proximal: Moments = moments(sections.proximalIncoming);
    return build(id,side,frame,incomingAxis,outgoingAxis,footBreadthMm,{
      incomingSupportCentroidMm: incoming.centroidMm, outgoingSupportCentroidMm: outgoing.centroidMm,
      proximalIncomingAreaMm2: proximal.areaMm2, proximalIncomingPlaneMm: -20,
    });

    function admitPlane(section: HumanCurve.Section,normal: HumanCurve.Vector,plane: number): void {
      const tolerance: number = 128*Number.EPSILON*Math.max(1,Math.hypot(...section.originMm),Math.hypot(...frame.originMm),Math.abs(plane));
      if (!finite(section.originMm) || !finite(section.axisU) || !finite(section.axisV) || !finite(normal) ||
          Math.abs(dot(section.axisU,normal)) > 1e-10 || Math.abs(dot(section.axisV,normal)) > 1e-10 ||
          Math.abs(dot(sub(section.originMm,frame.originMm),normal)-plane) > tolerance)
        throw new Error("An adjoining generated ankle section does not occupy its declared physical plane");
    }
  }

  /**
   * Generate a source-identified bisector neighborhood from actual adjoining form.
   * Signed s is the bisector-plane distance in mm; phi is common polar radians.
   * The caller owns the projected-forward frame, calf and foot axes and their
   * exact shared boundaries. Two generated area centres are projected along
   * their own plane normals, then bounded pooled least squares supplies the
   * centre law. Foot breadth and sqrt(actual proximal calf area/pi) supply two
   * independent physical radial bases. No ankle-girth field is invented.
   *
   * Ankle height influences the independently generated foot axis and geometry
   * upstream. A direct radial ankle-height coefficient was rejected by held-out
   * comparisons. The complete common quadratic/Fourier law is retained without
   * cubic refitting, and supplies analytic second and mixed derivatives.
   */
  export function build(
    id: string,
    side: "l" | "r",
    frame: HumanPlaneCut.Frame,
    incomingAxis: HumanCurve.Vector,
    outgoingAxis: HumanCurve.Vector,
    footBreadthMm: number,
    geometry: Geometry,
  ): Result {
    if (!id || !(Number.isFinite(footBreadthMm) && footBreadthMm > 0) ||
        !(Number.isFinite(geometry.proximalIncomingAreaMm2) && geometry.proximalIncomingAreaMm2 > 0) ||
        geometry.proximalIncomingPlaneMm !== HumanAnkleRules.proximalIncomingPlaneMm ||
        ![frame.originMm,frame.normal,frame.u,frame.v,incomingAxis,outgoingAxis,geometry.incomingSupportCentroidMm,geometry.outgoingSupportCentroidMm].every(finite))
      throw new Error("Ankle generation requires finite generated geometry and its observed -20 mm area protocol");
    for (const axis of [frame.normal,frame.u,frame.v,incomingAxis,outgoingAxis])
      if (Math.abs(dot(axis,axis)-1) > 1e-10) throw new Error("Ankle shape axes must be unit vectors owned by the common assembler");
    if (Math.max(Math.abs(dot(frame.u,frame.v)),Math.abs(dot(frame.u,frame.normal)),Math.abs(dot(frame.v,frame.normal))) > 1e-10)
      throw new Error("The common ankle chart is not orthogonal");
    const bisector: HumanCurve.Vector = unit(add(incomingAxis,outgoingAxis));
    const forward: HumanCurve.Vector = unit(sub([1,0,0],scale(bisector,bisector[0])));
    const across: HumanCurve.Vector = scale(cross(forward,bisector),side === "l" ? 1 : -1);
    if (Math.hypot(...sub(bisector,frame.normal)) > 1e-10 || Math.hypot(...sub(forward,frame.v)) > 1e-10 || Math.hypot(...sub(across,frame.u)) > 1e-10)
      throw new Error("Ankle identification requires the directed bisector and projected-forward phase gauge");
    const incoming: [number,number] = project(geometry.incomingSupportCentroidMm,incomingAxis);
    const outgoing: [number,number] = project(geometry.outgoingSupportCentroidMm,outgoingAxis);
    const calfRadius: number = Math.sqrt(geometry.proximalIncomingAreaMm2/Math.PI);
    const bases: number[] = [footBreadthMm,calfRadius];
    const width: number = footBreadthMm*HumanAnkleRules.etaScale;
    const half: number = footBreadthMm*HumanAnkleRules.halfDomainRatio;
    const radial: number[][] = HumanAnkleRules.radial[0]!.map((row: readonly number[], channel: number): number[] =>
      row.map((coefficient: number, power: number): number => coefficient*bases[0]!+HumanAnkleRules.radial[1]![channel]![power]!*bases[1]!),
    );
    const lowerBound: number = positiveBound(radial,half/width);
    if (!(lowerBound > 0 && Number.isFinite(lowerBound)))
      throw new Error("The requested generated ankle geometry has no admitted positive radial bound");
    const limitations: string[] = [
      "This source-conditioned band requires actual generated calf/foot support-plane centroids and actual incoming -20 mm calf area; unavailable generated domains must refuse instead of extrapolating or substituting source geometry",
      "The 88 source sections retain 4761 original cubic Hermite spans with their physical phase widths; 84 source fit-tolerance failures remain separate from this common model's error",
      "All 64 observed slabs and 128 components are regular annuli with no branch events or issues; this does not identify a malleolar apex or a universal ankle-volume minimum",
      "The common quadratic/order-eight prior has conditional source positional RMS 1.443 mm and sampled maximum 5.175 mm; leave-one-reference-out RMS is 2.350–2.939 mm with maxima 6.676–11.148 mm under observed adjoining geometry",
      "Original source angular approximation RMS is 0.394 mm and sampled maximum 2.617 mm; source flattening used 0.025 mm chord tolerance and 128 uniquely intersecting rays per selected curve",
      "Independent clinical dimensions and unseen generated-shaft errors are unverified; ankle height acts through the caller's generated foot axis and geometry, not an invented radial height or ankle-girth coefficient",
      "The sole common owner must restrict the actual shaft and foot functions, establish one shared boundary and compatible physical jets; this prior alone is not an assembled ankle surface",
    ];
    if (footBreadthMm < HumanAnkleRules.sourceRange.breadthMm[0] || footBreadthMm > HumanAnkleRules.sourceRange.breadthMm[1] ||
        calfRadius/footBreadthMm < HumanAnkleRules.sourceRange.radiusPerBreadth[0] || calfRadius/footBreadthMm > HumanAnkleRules.sourceRange.radiusPerBreadth[1])
      limitations.push("The requested geometric ratio lies outside the observed breadth/calf-area range and is an unverified morphology prediction");
    const sections: HumanCurve.Section[] = [-half,0,half].map((stationMm: number, index: number): HumanCurve.Section => {
      const c: Channels = channels(stationMm);
      return { id: id+(index === 1 ? ".support-prior" : index === 0 ? ".observed-incoming-limit" : ".observed-outgoing-limit"),
        stationMm, originMm: add(add(add(frame.originMm,scale(frame.normal,stationMm)),scale(frame.u,c.center[0])),scale(frame.v,c.center[1])),
        axisU: [...frame.u], axisV: [...frame.v], coefficientsMm: c.radial };
    });
    const family: HumanCurveFamily.Family = HumanCurveFamily.fromFunction(sections,jet,limitations);
    return { family, middle: sections[1]!, observedDomainMm: [-half,half], radiusLowerBoundMm: lowerBound, limitations };

    /** Project a real adjoining centroid along its own normal, with the exact Jacobian. */
    function project(point: HumanCurve.Vector, normal: HumanCurve.Vector): [number,number] {
      const projection: number = dot(frame.normal,normal);
      const delta: HumanCurve.Vector = sub(point,frame.originMm);
      const tolerance: number = 128*Number.EPSILON*Math.max(1,Math.hypot(...point),Math.hypot(...frame.originMm));
      if (!(projection > 0) || Math.abs(dot(delta,normal)) > tolerance)
        throw new Error("An adjoining centroid is not on its declared generated support plane");
      const mapped: HumanCurve.Vector = sub(delta,scale(normal,dot(frame.normal,delta)/projection));
      return [dot(mapped,frame.u),dot(mapped,frame.v)];
    }

    /** Physical channel jets differentiate xi=s/(breadth*etaScale). */
    function channels(station: number): Channels {
      const xi: number = station/width;
      const center: [number,number] = [0,0], centerS: [number,number] = [0,0], centerSS: [number,number] = [0,0];
      for (let axis: number = 0; axis < 2; axis++) {
        const row: readonly number[] = HumanAnkleRules.centre[axis]!, weight: number = HumanAnkleRules.centreIncomingWeight[axis]!;
        center[axis] = outgoing[axis]!+weight*(incoming[axis]!-outgoing[axis]!)+footBreadthMm*(row[0]!+row[1]!*xi+row[2]!*xi*xi);
        centerS[axis] = footBreadthMm*(row[1]!+2*row[2]!*xi)/width;
        centerSS[axis] = 2*footBreadthMm*row[2]!/(width*width);
      }
      return { center,centerS,centerSS,
        radial: radial.map((row: number[]): number => row[0]!+row[1]!*xi+row[2]!*xi*xi),
        radialS: radial.map((row: number[]): number => (row[1]!+2*row[2]!*xi)/width),
        radialSS: radial.map((row: number[]): number => 2*row[2]!/(width*width)) };
    }

    /** One analytic authority retains every Fourier mode and all required jets. */
    function jet(station: number,phase: number): HumanCurveFamily.Jet {
      if (!(Number.isFinite(station) && station >= -half && station <= half && Number.isFinite(phase)))
        throw new Error("Ankle evaluation lies outside its observed physical domain");
      const c: Channels = channels(station), cosine: number = Math.cos(phase), sine: number = Math.sin(phase);
      const e: HumanCurve.Vector = add(scale(frame.u,cosine),scale(frame.v,sine));
      const ep: HumanCurve.Vector = add(scale(frame.u,-sine),scale(frame.v,cosine));
      let r: number = c.radial[0]!, rs: number = c.radialS[0]!, rss: number = c.radialSS[0]!;
      let rp: number = 0, rpp: number = 0, rsp: number = 0, rspp: number = 0;
      for (let k: number = 1; 2*k < c.radial.length; k++) {
        const cs: number = Math.cos(k*phase), sn: number = Math.sin(k*phase), a: number = c.radial[2*k-1]!, b: number = c.radial[2*k]!;
        const da: number = c.radialS[2*k-1]!, db: number = c.radialS[2*k]!;
        r += a*cs+b*sn; rs += da*cs+db*sn; rss += c.radialSS[2*k-1]!*cs+c.radialSS[2*k]!*sn;
        rp += k*(-a*sn+b*cs); rpp -= k*k*(a*cs+b*sn);
        rsp += k*(-da*sn+db*cs); rspp -= k*k*(da*cs+db*sn);
      }
      if (!(r > 0 && Number.isFinite(r))) throw new Error("The admitted ankle radial law became nonfinite or nonpositive");
      const origin: HumanCurve.Vector = add(add(add(frame.originMm,scale(frame.normal,station)),scale(frame.u,c.center[0])),scale(frame.v,c.center[1]));
      const originS: HumanCurve.Vector = add(add(frame.normal,scale(frame.u,c.centerS[0])),scale(frame.v,c.centerS[1]));
      const originSS: HumanCurve.Vector = add(scale(frame.u,c.centerSS[0]),scale(frame.v,c.centerSS[1]));
      return { positionMm: add(origin,scale(e,r)), longitudinalDerivative: add(originS,scale(e,rs)),
        phaseDerivativeMmPerRadian: add(scale(ep,r),scale(e,rp)),
        longitudinalPhaseDerivativePerRadian: add(scale(ep,rs),scale(e,rsp)),
        longitudinalSecondDerivative: add(originSS,scale(e,rss)),
        phaseSecondDerivativeMmPerRadianSquared: add(scale(e,rpp-r),scale(ep,2*rp)),
        longitudinalPhaseSecondDerivativePerRadianSquared: add(scale(e,rspp-rs),scale(ep,2*rsp)) };
    }
  }

  interface Channels { center:[number,number];centerS:[number,number];centerSS:[number,number];radial:number[];radialS:number[];radialSS:number[]; }
  interface Moments { areaMm2:number;centroidMm:HumanCurve.Vector; }

  /** Parseval and complete finite Fourier convolution retain every generated mode. */
  function moments(section: HumanCurve.Section): Moments {
    const coefficients: number[] = section.coefficientsMm;
    if (section.topology === "pole" || coefficients.length === 0 || coefficients.length%2 !== 1 || !coefficients.every(Number.isFinite) ||
        Math.abs(dot(section.axisU,section.axisU)-1) > 1e-10 || Math.abs(dot(section.axisV,section.axisV)-1) > 1e-10 || Math.abs(dot(section.axisU,section.axisV)) > 1e-10 ||
        !(positiveBound(coefficients.map((value: number): number[] => [value,0,0]),0) > 0))
      throw new Error("Ankle moments require an admitted regular generated radial Fourier section");
    const order: number = (coefficients.length-1)/2;
    const real: number[] = Array.from({length:2*order+1},():number=>0);
    const imaginary: number[] = Array.from({length:2*order+1},():number=>0);
    real[order] = coefficients[0]!;
    let area: number = coefficients[0]!*coefficients[0]!;
    for (let k:number=1;k<=order;k++) {
      const a:number=coefficients[2*k-1]!,b:number=coefficients[2*k]!;
      real[order+k]=a/2;real[order-k]=a/2;imaginary[order+k]=-b/2;imaginary[order-k]=b/2;
      area+=(a*a+b*b)/2;
    }
    area*=Math.PI;
    let firstReal:number=0,firstImaginary:number=0;
    for(let i:number=-order;i<=order;i++)for(let j:number=-order;j<=order;j++) {
      const k:number=1-i-j;
      if(k < -order || k > order)continue;
      const ar:number=real[i+order]!,ai:number=imaginary[i+order]!,br:number=real[j+order]!,bi:number=imaginary[j+order]!;
      const productReal:number=ar*br-ai*bi,productImaginary:number=ar*bi+ai*br;
      firstReal+=productReal*real[k+order]!-productImaginary*imaginary[k+order]!;
      firstImaginary+=productReal*imaginary[k+order]!+productImaginary*real[k+order]!;
    }
    const x:number=2*Math.PI*firstReal/(3*area),y:number=-2*Math.PI*firstImaginary/(3*area);
    const centroid:HumanCurve.Vector=add(add(section.originMm,scale(section.axisU,x)),scale(section.axisV,y));
    if(!(area>0&&Number.isFinite(area)&&finite(centroid)))throw new Error("Generated ankle section moments exceed their finite physical range");
    return {areaMm2:area,centroidMm:centroid};
  }

  /** Exact quadratic extrema in xi plus an angular derivative bound cover the whole band. */
  function positiveBound(coefficients: number[][],halfXi: number): number {
    let angularBound: number = 0, minimum: number = Infinity;
    for (let k: number = 1; 2*k < coefficients.length; k++)
      angularBound += k*(maximumAbsolute(coefficients[2*k-1]!)+maximumAbsolute(coefficients[2*k]!));
    for (let index: number = 0; index < 512; index++) {
      const phase: number = 2*Math.PI*index/512, row: number[] = [...coefficients[0]!];
      for (let k: number = 1; 2*k < coefficients.length; k++) for (let power: number = 0; power < 3; power++)
        row[power] = row[power]!+coefficients[2*k-1]![power]!*Math.cos(k*phase)+coefficients[2*k]![power]!*Math.sin(k*phase);
      minimum = Math.min(minimum,...extrema(row));
    }
    return minimum-angularBound*Math.PI/512;
    function extrema(row: number[]): number[] {
      const result: number[] = [-halfXi,halfXi];
      if (row[2] !== 0) { const vertex: number = -row[1]!/(2*row[2]!); if (vertex > -halfXi && vertex < halfXi) result.push(vertex); }
      return result.map((xi: number): number => row[0]!+row[1]!*xi+row[2]!*xi*xi);
    }
    function maximumAbsolute(row: number[]): number { return Math.max(...extrema(row).map((value: number): number => Math.abs(value))); }
  }
  function finite(point: HumanCurve.Vector): boolean { return point.length === 3 && point.every(Number.isFinite); }
  function dot(a:HumanCurve.Vector,b:HumanCurve.Vector):number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function add(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
  function sub(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
  function scale(a:HumanCurve.Vector,s:number):HumanCurve.Vector { return [a[0]*s,a[1]*s,a[2]*s]; }
  function cross(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
  function unit(a:HumanCurve.Vector):HumanCurve.Vector { const norm:number=Math.hypot(...a);if(!(norm>1e-6&&Number.isFinite(norm)))throw new Error("Ankle frame direction is degenerate");return scale(a,1/norm); }
}
