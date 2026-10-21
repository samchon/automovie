import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";
import type { HumanSurface } from "./HumanSurface";

/** Exact regional station boundaries and geometric guide-plane contacts. */
export namespace HumanStationPort {
  type PhaseSample={
    value:number;
    derivative:number;
    tolerance?:number;
    positionMm?:HumanCurve.Vector;
  };

  /** Optional convergence of the same isolated simple contact, without a new isolator. */
  export type ConvergenceMode = "scalar-residual" | "representable-phase";

  /** One existing safeguarded Newton iteration, with its actual function value. */
  export interface RootIteration {
    /** Original complete-curve angular address, in radians. */
    phaseRadians: number;
    /** Existing plane equation value, in mm for a unit plane normal. */
    scalarResidual: number;
    /** Existing derivative of that equation per radian. */
    scalarDerivative: number;
    /** Existing scalar admission tolerance at this point. */
    scalarTolerance: number;
    /** Same Newton candidate before the original bracket safeguard. */
    newtonCandidateRadians: number;
    /** Actual function position, when the contact scalar provides it. */
    positionMm: HumanCurve.Vector | null;
  }

  /** Convergence evidence distinguishes scalar admission from geometric replay. */
  export interface RootResolution {
    /** Explicit opt-in; the default existing scalar-residual mode is unchanged. */
    mode: "representable-phase";
    /** Lower original monotone isolation-cell address, in radians. */
    cellStartRadians: number;
    /** Upper original monotone isolation-cell address, in radians. */
    cellEndRadians: number;
    /** Initial same-solver phase, before any Newton iteration. */
    initialPhaseRadians: number;
    /** First phase that would have satisfied the old scalar-only stopping rule. */
    firstScalarFloorPhaseRadians: number | null;
    /** Scalar residual at that former stopping address. */
    firstScalarFloorResidual: number | null;
    /** Returned original-function phase, without a point replacement. */
    finalPhaseRadians: number | null;
    /** Scalar residual at the returned phase. */
    finalScalarResidual: number | null;
    /** Finite existing Newton iteration ledger, at most80 rows. */
    iterations: RootIteration[];
    /** Explicit convergence or an unchanged coarse endpoint admission limitation. */
    termination: "pending" | "exact-scalar-zero" | "newton-fixed-point" |
      "two-cycle-coordinate-closure" | "bracket-coordinate-closure" |
      "scalar-admitted-cell-endpoint" | "failed";
    /** Actual same-function coordinate difference used for cycle/bracket closure. */
    closureDeltaMm: HumanCurve.Vector | null;
    /** Existing128EPS coordinate bounds for that same-function comparison. */
    closureBoundsMm: HumanCurve.Vector | null;
    /** Original failure text for unresolved same-cell convergence. */
    failure?: string;
  }

  /** A contact retains its original angular address and regional second jets. */
  export interface Contact {
    /** Radians in the original complete regional curve, without phase refitting. */
    phaseRadians: number;
    /** The actual regional position and independent physical derivatives. */
    jet: HumanCurveFamily.Jet;
    /** Unit intersection tangent for the declared cross-product orientation. */
    planeTangent: HumanCurve.Vector;
    /** Exact angular derivative of that unit tangent, per radian. */
    planeTangentPhaseDerivative: HumanCurve.Vector;
    /** Optional same-cell convergence ledger; absent for unchanged default queries. */
    rootResolution?: RootResolution;
  }

  /** One owner supplies a complete station curve and every plane intersection. */
  export interface Result {
    /** Actual function shared by construction and subsequent incident patches. */
    boundary: HumanSurface.Boundary;
    /** Borrow the unchanged complete regional jet at its original phase. */
    jet: (phaseRadians: number) => HumanCurveFamily.Jet;
    /** Exact second angular derivative in mm per radian squared. */
    secondDerivative: (phaseRadians: number) => HumanCurve.Vector;
    /** Find every simple crossing; optional phase convergence keeps the same cells and budgets. */
    contacts: (normal: HumanCurve.Vector, offsetMm: number, mode?: ConvergenceMode) => Contact[];
  }

  /** Complete angular norm bounds derived by the actual family owner. */
  export interface Bounds {
    /** Upper bound for world position norm, mm. */
    positionMm: number;
    /** Upper bound for the first angular derivative norm, mm/radian. */
    firstMmPerRadian: number;
    /** Upper bound for the second angular derivative norm, mm/radian². */
    secondMmPerRadianSquared: number;
  }

  /** Keep an opaque clamped function intact under its owner's analytic bounds.
   * Bounds admit root isolation only; every contact consumes the actual family
   * jet. They are never used as a sampled, truncated or fitted shape surrogate.
   */
  export function fromBounds(id: string, family: HumanCurveFamily.Family, stationMm: number, bounds: Bounds): Result {
    if (!id || !Number.isFinite(stationMm) || stationMm < family.intervals[0]!.startMm || stationMm > family.intervals.at(-1)!.endMm || !Object.values(bounds).every((value: number): boolean => Number.isFinite(value) && value > 0))
      throw new Error("A bounded station requires finite positive angular bounds from its actual owner");
    return create(id,family,stationMm,bounds.firstMmPerRadian,bounds.secondMmPerRadianSquared,bounds.positionMm);
  }

  /**
   * The descriptor must come from the same regional channel authority at this
   * physical station. It supplies only conservative trigonometric derivative
   * bounds; all positions and derivatives call the actual complete family.
   * Recursive sign/monotonicity brackets isolate simple plane intersections.
   * Binary64 bounds are numerical admissions, not interval certificates.
   * A tangent contact is unresolved rather than silently discarded or moved.
   */
  export function build(id: string, family: HumanCurveFamily.Family, section: HumanCurve.Section): Result {
    if (!id || !Number.isFinite(section.stationMm) || section.coefficientsMm.length % 2 !== 1)
      throw new Error("A station port requires its actual regional descriptor");
    let r: number = Math.abs(section.coefficientsMm[0]!), dr: number = 0, ddr: number = 0;
    for (let k: number = 1; 2*k < section.coefficientsMm.length; k++) {
      const size: number = Math.abs(section.coefficientsMm[2*k-1]!)+Math.abs(section.coefficientsMm[2*k]!);
      r += size; dr += k*size; ddr += k*k*size;
    }
    if (![r,dr,ddr].every(Number.isFinite)) throw new Error("Station bounds are nonfinite");
    return create(id,family,section.stationMm,r+dr,r+2*dr+ddr,Math.hypot(...section.originMm)+r);
  }

  /** Preserve an ordinary cubic family's complete world-Fourier authority. */
  export function fromPolynomial(id:string,family:HumanCurveFamily.Family,stationMm:number):Result {
    const modes:HumanCurve.Vector[]=polynomialAt(family,stationMm);
    let first:number=0,second:number=0,size:number=Math.hypot(...modes[0]!);
    for(let k:number=1;2*k<modes.length;k++) {
      const magnitude:number=Math.hypot(...modes[2*k-1]!)+Math.hypot(...modes[2*k]!);
      size+=magnitude;first+=k*magnitude;second+=k*k*magnitude;
    }
    return create(id,family,stationMm,first,second,size);
  }

  /** Evaluate retained power coefficients algebraically, never by Fourier refit. */
  export function polynomialAt(family:HumanCurveFamily.Family,stationMm:number):HumanCurve.Vector[] {
    const span:HumanCurveFamily.PolynomialSpan|undefined=family.polynomialSpans?.find((item:HumanCurveFamily.PolynomialSpan):boolean=>stationMm>=item.startMm&&stationMm<=item.endMm);
    if(span===undefined) throw new Error("This physical station has no exact retained world polynomial authority");
    const u:number=(stationMm-span.startMm)/(span.endMm-span.startMm);
    return span.powers[0]!.map((_:HumanCurve.Vector,channel:number):HumanCurve.Vector=>[0,1,2].map((axis:number):number=>{
      let value:number=0;for(let power:number=span.powers.length-1;power>=0;power--) value=value*u+span.powers[power]![channel]![axis]!;
      return value;
    }) as HumanCurve.Vector);
  }

  /** Scalar support values preserve every angular stationary branch. */
  export interface Extrema {
    /** Actual lower support value; tied contacts are not collapsed. */
    minimumValueMm:number;
    /** Actual upper support value of the same complete curve. */
    maximumValueMm:number;
    /** All isolated angular contacts, including equally supporting branches. */
    stationary:readonly HumanCurveFamily.Jet[];
  }

  /** Full angular extrema of one actual world-Fourier section projection. */
  export function projectionExtrema(family:HumanCurveFamily.Family,stationMm:number,direction:HumanCurve.Vector):Extrema {
    const modes:HumanCurve.Vector[]=polynomialAt(family,stationMm);
    let first:number=0,secondMagnitude:number=0;
    for(let k:number=1;2*k<modes.length;k++) {
      const size:number=Math.abs(dot(direction,modes[2*k-1]!))+Math.abs(dot(direction,modes[2*k]!));
      first+=k*k*size;secondMagnitude+=k*k*k*size;
    }
    return extrema(family,stationMm,direction,first,secondMagnitude);
  }

  /** Use the complete radial descriptor only for conservative derivative bounds. */
  export function projectionFromSection(family:HumanCurveFamily.Family,section:HumanCurve.Section,direction:HumanCurve.Vector):Extrema {
    let r:number=Math.abs(section.coefficientsMm[0]!),dr:number=0,ddr:number=0,dddr:number=0;
    for(let k:number=1;2*k<section.coefficientsMm.length;k++) {
      const size:number=Math.abs(section.coefficientsMm[2*k-1]!)+Math.abs(section.coefficientsMm[2*k]!);
      r+=size;dr+=k*size;ddr+=k*k*size;dddr+=k*k*k*size;
    }
    const norm:number=Math.hypot(...direction);
    return extrema(family,section.stationMm,direction,norm*(r+2*dr+ddr),norm*(r+3*dr+3*ddr+dddr));
  }

  /** Evaluate every simple projection extremum against one actual family. */
  function extrema(family:HumanCurveFamily.Family,stationMm:number,direction:HumanCurve.Vector,first:number,secondMagnitude:number):Extrema {
    const scalar:(phase:number)=>{value:number;derivative:number}=(phase:number):{value:number;derivative:number}=>{
      const value:HumanCurveFamily.Jet=family.jet(stationMm,phase);
      return {value:dot(direction,value.phaseDerivativeMmPerRadian),derivative:dot(direction,second(value))};
    };
    const phases:number[]=phaseRoots(scalar,first,secondMagnitude,64*Number.EPSILON*Math.max(1,first));
    const values:HumanCurveFamily.Jet[]=phases.map((phase:number):HumanCurveFamily.Jet=>family.jet(stationMm,phase));
    values.sort((a:HumanCurveFamily.Jet,b:HumanCurveFamily.Jet):number=>dot(direction,a.positionMm)-dot(direction,b.positionMm));
    if(values.length<2) throw new Error("The actual section has no two simple transverse projection extrema");
    return {minimumValueMm:dot(direction,values[0]!.positionMm),maximumValueMm:dot(direction,values.at(-1)!.positionMm),stationary:values};
  }

  /** Share one original evaluator and conservative angular derivative bounds. */
  function create(id:string,family:HumanCurveFamily.Family,stationMm:number,firstMagnitude:number,secondMagnitude:number,sizeMagnitude:number):Result {
    const at:(phase:number)=>HumanCurveFamily.Jet=(phase:number):HumanCurveFamily.Jet=>family.jet(stationMm,phase);
    const boundary:HumanSurface.Boundary={id,unit:"radians",start:0,end:2*Math.PI,evaluate:(phase:number):HumanCurve.Vector=>at(phase).positionMm,derivative:(phase:number):HumanCurve.Vector=>at(phase).phaseDerivativeMmPerRadian};
    return {boundary,jet:at,secondDerivative:(phase:number):HumanCurve.Vector=>second(at(phase)),contacts};

    function contacts(normal: HumanCurve.Vector, offsetMm: number, mode: ConvergenceMode = "scalar-residual"): Contact[] {
      const normalLength: number = Math.hypot(...normal);
      if (mode !== "scalar-residual" && mode !== "representable-phase")
        throw new Error("A station contact requires a declared existing convergence mode");
      if (!normal.every(Number.isFinite) || !Number.isFinite(offsetMm) || !(normalLength > 0))
        throw new Error("A guide plane requires a finite nonzero normal");
      const firstBound: number = normalLength*firstMagnitude, secondBound: number = normalLength*secondMagnitude;
      const floor: number = 64*Number.EPSILON*Math.max(1,Math.abs(offsetMm),normalLength*sizeMagnitude);
      const resolutions: Map<number,RootResolution> = new Map();
      const roots:number[]=phaseRoots(scalar,firstBound,secondBound,floor,mode,resolutions);
      roots.sort((a: number,b: number): number => a-b);
      const unique: number[] = roots.filter((phase: number,index: number): boolean => index === 0 || phase-roots[index-1]! > 256*Number.EPSILON*Math.max(1,phase));
      if (unique.length > 1 && unique[0]!+2*Math.PI-unique.at(-1)! <= 256*Number.EPSILON*2*Math.PI) unique.pop();
      return unique.map((phase: number): Contact => {
        const value: HumanCurveFamily.Jet = at(phase), fp: HumanCurve.Vector = value.phaseDerivativeMmPerRadian;
        const fsp: HumanCurve.Vector = value.longitudinalPhaseDerivativePerRadian, fpp: HumanCurve.Vector = second(value);
        const surfaceNormal: HumanCurve.Vector = cross(value.longitudinalDerivative,fp);
        const normalDerivative: HumanCurve.Vector = add(cross(fsp,fp),cross(value.longitudinalDerivative,fpp));
        const tangent: HumanCurve.Vector = cross(surfaceNormal,normal), derivative: HumanCurve.Vector = cross(normalDerivative,normal);
        const length: number = Math.hypot(...tangent);
        if (!(length > 0 && Number.isFinite(length))) throw new Error("A guide plane is tangent to the actual regional surface");
        const unit: HumanCurve.Vector = scale(tangent,1/length);
        return {phaseRadians:phase,jet:value,planeTangent:unit,planeTangentPhaseDerivative:scale(add(derivative,scale(unit,-dot(unit,derivative))),1/length),
          ...(mode === "representable-phase" ? {rootResolution:resolutions.get(phase)} : {})};
      });

      function scalar(phase: number): PhaseSample {
        const value: HumanCurveFamily.Jet = at(phase);
        return {value:dot(normal,value.positionMm)-offsetMm,derivative:dot(normal,value.phaseDerivativeMmPerRadian),tolerance:64*Number.EPSILON*Math.max(1,Math.abs(offsetMm),normalLength*Math.hypot(...value.positionMm)),
          positionMm:value.positionMm};
      }

    }
  }

  /** Recursively isolate simple angular crossings with full analytic bounds. */
  function phaseRoots(scalar:(phase:number)=>PhaseSample,firstBound:number,secondBound:number,floor:number,
    mode:ConvergenceMode="scalar-residual",resolutions?:Map<number,RootResolution>):number[] {
    const roots:number[]=[];let cells:number=0;
    visit(0,2*Math.PI,0);roots.sort((a:number,b:number):number=>a-b);
    const unique:number[]=roots.filter((phase:number,index:number):boolean=>index===0||phase-roots[index-1]!>256*Number.EPSILON*Math.max(1,phase));
    if(unique.length>1&&unique[0]!+2*Math.PI-unique.at(-1)!<=256*Number.EPSILON*2*Math.PI) unique.pop();
    return unique;
      function visit(a: number,b: number,depth: number): void {
        if (++cells > 16384 || depth > 52) throw new Error("Station-plane crossings exceed the finite isolation budget");
        const middle: number = a+(b-a)/2, half: number = (b-a)/2, center: ReturnType<typeof scalar> = scalar(middle);
        if (Math.abs(center.value) > firstBound*half+floor) return;
        const left: ReturnType<typeof scalar> = scalar(a), right: ReturnType<typeof scalar> = scalar(b);
        if (Math.abs(center.derivative) > secondBound*half+floor) {
          if (Math.abs(left.value) <= Math.min(floor,left.tolerance??floor)) {
            roots.push(mode === "representable-phase" ? solve(a,b,left.value,a) : a); return;
          }
          if (Math.abs(right.value) <= Math.min(floor,right.tolerance??floor)) {
            roots.push(mode === "representable-phase" ? solve(a,b,left.value,b) : b); return;
          }
          if ((left.value < 0) === (right.value < 0)) return;
          roots.push(solve(a,b,left.value)); return;
        }
        if (middle === a || middle === b) throw new Error("A station-plane tangency is unresolved at physical resolution");
        visit(a,middle,depth+1); visit(middle,b,depth+1);
      }
      function solve(a: number,b: number,leftValue: number,seed?: number): number {
        let phase: number = seed ?? a+(b-a)/2;
        const cellStart: number = a, cellEnd: number = b;
        const refined: boolean = mode === "representable-phase";
        const resolution: RootResolution = {mode:"representable-phase",cellStartRadians:a,cellEndRadians:b,
          initialPhaseRadians:phase,firstScalarFloorPhaseRadians:null,firstScalarFloorResidual:null,
          finalPhaseRadians:null,finalScalarResidual:null,iterations:[],termination:"pending",
          closureDeltaMm:null,closureBoundsMm:null};
        let previousPhase: number | null = null, previousSample: PhaseSample | null = null;
        const rightValue: number = refined ? scalar(b).value : 0;
        const strictBracket: boolean = refined && (leftValue < 0) !== (rightValue < 0);
        for (let iteration: number = 0; iteration < 80; iteration++) {
          const value: ReturnType<typeof scalar> = scalar(phase);
          const tolerance: number = Math.min(floor,value.tolerance??floor);
          const admitted: boolean = Math.abs(value.value) <= tolerance;
          if (!refined && admitted) return phase;
          const candidate: number = phase-value.value/value.derivative;
          if (refined) {
            resolution.iterations.push({phaseRadians:phase,scalarResidual:value.value,
              scalarDerivative:value.derivative,scalarTolerance:tolerance,
              newtonCandidateRadians:candidate,positionMm:value.positionMm ?? null});
            if (admitted && resolution.firstScalarFloorPhaseRadians === null) {
              resolution.firstScalarFloorPhaseRadians=phase;
              resolution.firstScalarFloorResidual=value.value;
            }
            if (admitted && value.value === 0) return finish("exact-scalar-zero");
            if (admitted && candidate === phase) return finish("newton-fixed-point");
            if (admitted && candidate === previousPhase && previousSample !== null &&
              Math.abs(previousSample.value) <= Math.min(floor,previousSample.tolerance??floor) &&
              coordinateClosure(value,previousSample))
              return finish("two-cycle-coordinate-closure");
            // Preserve the original floor-qualified endpoint alias if this cell
            // has no strict interior bracket. It is not a phase-precision claim;
            // the caller's unchanged geometric replay still decides equality.
            if (seed !== undefined && iteration === 0 && admitted && !strictBracket)
              return finish("scalar-admitted-cell-endpoint");
          }
          if ((value.value < 0) === (leftValue < 0)) a = phase; else b = phase;
          const next: number = candidate > a && candidate < b ? candidate : a+(b-a)/2;
          if (next === phase || next === a || next === b) {
            if (refined && admitted && next >= cellStart && next <= cellEnd &&
              coordinateClosure(value,scalar(next))) return finish("bracket-coordinate-closure");
            if (refined) return fail("A station-plane crossing exhausted its numerical bracket");
            throw new Error("A station-plane crossing exhausted its numerical bracket");
          }
          previousPhase=phase; previousSample=value; phase=next;
        }
        if (refined) return fail("A station-plane crossing exceeded its finite solve budget");
        throw new Error("A station-plane crossing exceeded its finite solve budget");

        /** Compare actual same-function coordinates using the existing replay bounds. */
        function coordinateClosure(left: PhaseSample,right: PhaseSample): boolean {
          if (left.positionMm === undefined || right.positionMm === undefined) return false;
          const x: HumanCurve.Vector = left.positionMm, y: HumanCurve.Vector = right.positionMm;
          const bounds: HumanCurve.Vector = x.map((v:number,i:number):number =>
            128*Number.EPSILON*Math.max(1,Math.abs(v),Math.abs(y[i]!))) as HumanCurve.Vector;
          const delta: HumanCurve.Vector = x.map((v:number,i:number):number => v-y[i]!) as HumanCurve.Vector;
          resolution.closureBoundsMm=bounds; resolution.closureDeltaMm=delta;
          return delta.every((v:number,i:number):boolean => Number.isFinite(v) && Math.abs(v) <= bounds[i]!);
        }
        /** Return the current original-function phase, never another phase or point. */
        function finish(termination: RootResolution["termination"]): number {
          resolution.termination=termination; resolution.finalPhaseRadians=phase;
          resolution.finalScalarResidual=scalar(phase).value;
          resolutions?.set(phase,resolution); return phase;
        }
        /** Preserve unresolved iteration evidence rather than fabricating a contact. */
        function fail(message: string): never {
          resolution.termination="failed"; resolution.finalPhaseRadians=phase;
          resolution.finalScalarResidual=scalar(phase).value; resolution.failure=message;
          throw Object.assign(new Error(message+"; same-cell convergence: "+JSON.stringify(resolution)),
            {rootResolution:resolution});
        }
      }
  }

  function second(value: HumanCurveFamily.Jet): HumanCurve.Vector {
    if (value.phaseSecondDerivativeMmPerRadianSquared === undefined) throw new Error("A shared port requires its exact regional second angular jet");
    return value.phaseSecondDerivativeMmPerRadianSquared;
  }
  function dot(a: HumanCurve.Vector,b: HumanCurve.Vector): number { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function scale(a: HumanCurve.Vector,s: number): HumanCurve.Vector { return [a[0]*s,a[1]*s,a[2]*s]; }
  function add(a: HumanCurve.Vector,b: HumanCurve.Vector): HumanCurve.Vector { return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]; }
  function cross(a: HumanCurve.Vector,b: HumanCurve.Vector): HumanCurve.Vector { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
}
