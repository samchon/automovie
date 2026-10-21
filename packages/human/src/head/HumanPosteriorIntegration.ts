import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanStationPort } from "../internal/HumanStationPort";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanCranialDomain } from "./HumanCranialDomain";
import type { HumanFaceFeatures } from "./HumanFaceFeatures";
import type { HumanForeheadSideNetwork } from "./HumanForeheadSideNetwork";
import type { HumanHeadFrame } from "./HumanHeadFrame";
import type { HumanHeadYAdmission } from "./HumanHeadYAdmission";
import { HumanPosteriorAssembly } from "./HumanPosteriorAssembly";

/** Own the current head's contacts, cap partition and shared sampling addresses. */
export namespace HumanPosteriorIntegration {
  type Vector = HumanCurve.Vector;

  /** Actual objects from the single root assembly and its existing emitter depth. */
  export interface Input {
    /** Same current head support, dimensions and eye/crown datum. */
    frame: HumanHeadFrame.Result;
    /** Existing bilateral eye curves defining both actual canthal planes. */
    eyes: HumanFaceFeatures.Result;
    /** Same complete cranial station, retained charts and upper phase owner. */
    cranial: HumanCranialDomain.Result;
    /** Existing incident vector charts with full U1 jets and Y powers enabled. */
    forehead: HumanForeheadSideNetwork.Result;
    /** Root's unchanged dyadic emitter depth, used to preserve old V addresses. */
    defaultPatchDepth: number;
  }

  /** Whole posterior replacement and the original construction it supersedes. */
  export interface Result {
    /** Same-cap two-hemisphere replacement and readdressed front charts. */
    posterior: HumanPosteriorAssembly.Result;
    /** Active same-object construction, with superseded V courses removed. */
    boundaries: HumanSurface.Boundary[];
    /** Exact original full-cap phases plus the actual newly selected endpoints. */
    upperPhases: number[];
    /** All selected actual contacts, with the sole rear object shared by both sides. */
    contacts: { back: HumanStationPort.Contact; fronts: HumanStationPort.Contact[] };
    /** Serializable actual root and address evidence for Node/browser comparison. */
    diagnostics: Diagnostics;
  }

  /** Complete queries from one unchanged actual cap owner. */
  export interface CapQueries {
    /** Existing side from the main-injected original cap owner. */
    side: "left" | "right";
    /** Original admission and separate diagnostic-only observation failures. */
    queries: HumanPosteriorAssembly.Prepared["cap"]["queries"];
  }

  /** Data-only actual contact, root and address records published by both runtimes. */
  export interface Diagnostics {
    /** Stable identity of the data-only payload. */
    schema: "human-posterior-contact-root-address-v1";
    /** Actual selected contact positions and original full regional jets. */
    contacts: Result["contacts"];
    /** Explicit opt-in of the cap ray owner; other station queries keep their default policy. */
    capConvergenceMode: "representable-phase";
    /** Whole-V derivative bound, formed powers and every requested root isolation. */
    admissions: Array<Pick<HumanHeadYAdmission.Result,"minimumWorldYDerivativeBoundMm"|"derivativeExtrema"|"coefficients"|"bound"|"queries">>;
    /** Shared canonical Y, preserved original V and actual forward residuals. */
    addressLedgers: HumanPosteriorAssembly.Result["addressLedgers"];
    /** All original full-cap replay queries from the same actual two cap owners. */
    capQueries: CapQueries[];
    /** Immutable pooled source-fit commitments, distinct from target admission. */
    evidence: HumanPosteriorAssembly.Result["posterior"]["evidence"];
  }

  /**
   * Keep every old cap phase and front sample. The actual canthal U1 planes
   * select their distinct anterior contacts; the common support sagittal plane
   * selects one distinct posterior contact for both sides. Each full cap phase
   * is admitted to a hemisphere by its original chord-side domain, then the
   * cap adapter verifies the same original contact and complete parameter jet.
   * The union adds only addresses needed by the two incident edge samplers.
   */
  export function build(input: Input): Result {
    if (!Number.isSafeInteger(input.defaultPatchDepth) || input.defaultPatchDepth < 1 || input.defaultPatchDepth > 8)
      throw new Error("Posterior integration requires the actual bounded patch emitter depth");
    const station: HumanStationPort.Result = input.cranial.foreheadStation;
    const back: HumanStationPort.Contact = selected(station.contacts([0,0,1],input.frame.supportMm[2]),false);
    const sides: [HumanPosteriorAssembly.Side,HumanPosteriorAssembly.Side] = (["left","right"] as const).map(
      (side: "left"|"right"): HumanPosteriorAssembly.Side => {
        const openings: typeof input.eyes.openings = input.eyes.openings.filter(
          (opening: typeof input.eyes.openings[number]): boolean => opening.upper.side === side);
        if (openings.length !== 1) throw new Error("A posterior side requires its actual unique eye owner");
        const opening: typeof openings[number] = openings[0]!;
        const start: Vector = opening.upper.evaluate(0), end: Vector = opening.upper.evaluate(1);
        const chord: Vector = subtract(end,start), length: number = Math.hypot(...chord);
        if (!(length > 0 && Number.isFinite(length))) throw new Error("The actual canthal chord is singular");
        const normal: Vector = scale(chord,1/length), offsetMm: number = dot(normal,start)+length;
        const frontContact: HumanStationPort.Contact = selected(station.contacts(normal,offsetMm),true);
        const central: HumanSurface.Patch = unique(input.forehead.central,side);
        const lateral: HumanSurface.Patch = unique(input.forehead.lateral,side);
        const inner: HumanForeheadSideNetwork.SidePort = port(input.forehead.innerPorts,side);
        const shared: HumanForeheadSideNetwork.SidePort = port(input.forehead.sidePorts,side);
        const outer: HumanForeheadSideNetwork.SidePort = port(input.forehead.outerPorts,side);
        const fp: Vector = frontContact.jet.positionMm, bp: Vector = back.jet.positionMm;
        const across: Vector = subtract(bp,fp), width: number = Math.hypot(across[0],across[2]);
        if (!(width > 0 && Number.isFinite(width))) throw new Error("The actual posterior cap has no transverse chord");
        const e: Vector = [across[0]/width,0,across[2]/width];
        const rotated: Vector = [-e[2],0,e[0]];
        const outside: Vector = scale(rotated,dot(normal,rotated) > 0 ? 1 : -1);
        const capPhaseAddresses: number[] = [...new Set([
          frontContact.phaseRadians,back.phaseRadians,
          ...input.cranial.upperPhases.filter((phase: number): boolean => {
            const p: Vector = station.boundary.evaluate(phase);
            // Twice the chord-midpoint displacement gives the same exact side
            // definition without creating or shifting any geometric point.
            return dot(outside,subtract(scale(p,2),add(fp,bp))) > 0;
          }),
        ])].sort((a: number,b: number): number => a-b);
        const originalVAddresses: number[] = [...new Set([...samples(central),...samples(lateral)])]
          .sort((a: number,b: number): number => a-b);
        return {side,frontPlane:{normal,offsetMm},frontContact,central,lateral,inner,shared,outer,
          capPhaseAddresses,originalVAddresses};
      }) as [HumanPosteriorAssembly.Side,HumanPosteriorAssembly.Side];
    const posterior: HumanPosteriorAssembly.Result = HumanPosteriorAssembly.build({
      frame:input.frame,station,backContact:back,sides,oldRetained:input.cranial.retained,
      medianLowerYmm:Math.min(...sides.map((side: HumanPosteriorAssembly.Side): number => side.outer.boundary.evaluate(0)[1])),
      samplingOwner,
    });
    const superseded: Set<HumanSurface.Boundary> = new Set([
      ...input.forehead.innerPorts,...input.forehead.sidePorts,...input.forehead.outerPorts,
    ].map((owner: HumanForeheadSideNetwork.SidePort): HumanSurface.Boundary => owner.boundary));
    const boundaries: HumanSurface.Boundary[] = input.forehead.boundaries.filter(
      (boundary: HumanSurface.Boundary): boolean => !superseded.has(boundary));
    for (const boundary of posterior.boundaries) {
      const previous: HumanSurface.Boundary | undefined = boundaries.find(
        (value: HumanSurface.Boundary): boolean => value.id === boundary.id);
      if (previous === undefined) boundaries.push(boundary);
      else if (previous !== boundary) throw new Error("Posterior construction has multiple owners for "+boundary.id);
    }
    const upperPhases: number[] = [...new Set([...input.cranial.upperPhases,...posterior.requiredUpperPhases])]
      .sort((a: number,b: number): number => a-b);
    if (upperPhases[0] !== 0 || upperPhases.length > 1024 || upperPhases.some(
      (phase: number): boolean => !Number.isFinite(phase) || phase < 0 || phase >= 2*Math.PI))
      throw new Error("The unchanged full upper cap needs one admitted periodic phase union");
    const contacts: Result["contacts"] = {back,fronts:sides.map(
      (side: HumanPosteriorAssembly.Side): HumanStationPort.Contact => side.frontContact)};
    const diagnostics: Diagnostics = {schema:"human-posterior-contact-root-address-v1",contacts,
      capConvergenceMode:"representable-phase",
      admissions:posterior.admissions.map((admission: HumanHeadYAdmission.Result): Diagnostics["admissions"][number] => ({
        minimumWorldYDerivativeBoundMm:admission.minimumWorldYDerivativeBoundMm,
        derivativeExtrema:admission.derivativeExtrema,coefficients:admission.coefficients,
        bound:admission.bound,queries:admission.queries,
      })),addressLedgers:posterior.addressLedgers,
      capQueries:posterior.prepared.map((part: HumanPosteriorAssembly.Prepared): Diagnostics["capQueries"][number] =>
        ({side:part.source.side,queries:part.cap.queries})),
      evidence:posterior.posterior.evidence};
    return {posterior,boundaries,upperPhases,contacts,diagnostics};

    /** Reproduce only the current emitter's actual original V addresses. */
    function samples(patch: HumanSurface.Patch): readonly number[] {
      const count: number = 2**input.defaultPatchDepth;
      return patch.sampling?.v ?? Array.from({length:count+1},(_:unknown,i:number):number =>
        i === count ? patch.v.end : patch.v.start+(patch.v.end-patch.v.start)*i/count);
    }
  }

  /** Borrow the same exact Y union on the overlapping shared median interval. */
  function samplingOwner(prepared: readonly [HumanPosteriorAssembly.Prepared,HumanPosteriorAssembly.Prepared]): HumanPosteriorAssembly.Sampling {
    const union: number[] = [...new Set(prepared.flatMap(
      (side: HumanPosteriorAssembly.Prepared): number[] => side.frontAddresses.map(
        (address: HumanPosteriorAssembly.Prepared["frontAddresses"][number]): number => address.yMm)))]
      .sort((a: number,b: number): number => a-b);
    const samplingY: [number[],number[]] = prepared.map((side: HumanPosteriorAssembly.Prepared): number[] =>
      union.filter((y: number): boolean => y >= side.front.boundary.start && y <= side.front.boundary.end)) as [number[],number[]];
    const originalVAddresses: [number[],number[]] = prepared.map(
      (side: HumanPosteriorAssembly.Prepared,index: number): number[] => {
        const owned: Map<number,number> = new Map(side.frontAddresses.map(
          (address: HumanPosteriorAssembly.Prepared["frontAddresses"][number]): [number,number] => [address.yMm,address.originalV]));
        return samplingY[index]!.map((y: number): number => owned.get(y) ?? side.front.originalPhase(y));
      }) as [number[],number[]];
    return {samplingY,originalVAddresses};
  }

  /** All actual plane contacts precede the distinct anterior or posterior branch. */
  function selected(contacts: HumanStationPort.Contact[],anterior: boolean): HumanStationPort.Contact {
    if (contacts.length !== 2 || contacts[0]!.jet.positionMm[0] === contacts[1]!.jet.positionMm[0])
      throw Object.assign(new Error("The actual head plane lacks two contacts and a distinct X branch"),{contacts,anterior});
    return (contacts[0]!.jet.positionMm[0] > contacts[1]!.jet.positionMm[0]) === anterior ? contacts[0]! : contacts[1]!;
  }
  function unique(patches: readonly HumanSurface.Patch[],side: "left"|"right"): HumanSurface.Patch {
    const matches: HumanSurface.Patch[] = patches.filter((patch: HumanSurface.Patch): boolean => patch.id.includes("."+side+"."));
    if (matches.length !== 1) throw new Error("A posterior side requires its unique actual incident patch");
    return matches[0]!;
  }
  function port(ports: readonly HumanForeheadSideNetwork.SidePort[],side: "left"|"right"): HumanForeheadSideNetwork.SidePort {
    const matches: HumanForeheadSideNetwork.SidePort[] = ports.filter((value: HumanForeheadSideNetwork.SidePort): boolean => value.side === side);
    if (matches.length !== 1) throw new Error("A posterior side requires one actual course owner");
    return matches[0]!;
  }
  function dot(a: Vector,b: Vector): number {return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function scale(a: Vector,t: number): Vector {return a.map((x: number): number => x*t) as Vector;}
  function add(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x+b[i]!) as Vector;}
  function subtract(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x-b[i]!) as Vector;}
}
