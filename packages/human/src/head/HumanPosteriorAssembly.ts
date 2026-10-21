import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanStationPort } from "../internal/HumanStationPort";
import type { HumanSurface } from "../internal/HumanSurface";
import type { HumanForeheadSideNetwork } from "./HumanForeheadSideNetwork";
import type { HumanHeadFrame } from "./HumanHeadFrame";
import type { HumanHeadPosteriorMedian } from "./HumanHeadPosteriorMedian";
import { HumanHeadYAdmission } from "./HumanHeadYAdmission";
import { HumanHeadYPort } from "./HumanHeadYPort";
import { HumanForeheadYNetwork } from "./HumanForeheadYNetwork";
import { HumanPosteriorCapPort } from "./HumanPosteriorCapPort";
import { HumanPosteriorSurface } from "./HumanPosteriorSurface";

/** Main-selected common contacts join unchanged front fields to the pooled posterior rule. */
export namespace HumanPosteriorAssembly {
  type Vector = HumanCurve.Vector;
  type SideName = "left" | "right";

  /** Actual single-owner front region and selected cap contact, with no branch guessing. */
  export interface Side {
    /** Existing geometric side. */
    side: SideName;
    /** Same actual canthal plane normal and offset used by main's Xmax selection. */
    frontPlane: { normal: Vector; offsetMm: number };
    /** Main-selected actual anterior contact at canthal U1 on station. */
    frontContact: HumanStationPort.Contact;
    /** Same original vector charts from one network build. */
    central: HumanSurface.Patch;
    /** Same field's lateral chart. */
    lateral: HumanSurface.Patch;
    /** Same original quarter, three-quarter and outer ports. */
    inner: HumanForeheadSideNetwork.SidePort;
    /** Actual shared three-quarter port. */
    shared: HumanForeheadSideNetwork.SidePort;
    /** Original U1 with same-owner full quintic metadata enabled. */
    outer: HumanForeheadSideNetwork.SidePort;
    /** Original full upper-cap phases already qualified by main for this half, including both endpoints. */
    capPhaseAddresses: readonly number[];
    /** Original owned front V samples; all must survive the common address union. */
    originalVAddresses: readonly number[];
  }

  /** Prepared current actual ports are offered to the sole main sampling owner. */
  export interface Prepared {
    /** Current side and immutable input provenance. */
    source: Side;
    /** Actual original-to-Y function and inverse map. */
    front: HumanHeadYPort.Result;
    /** Actual complete cap function and physical two-jets. */
    cap: HumanPosteriorCapPort.Result;
    /** Exact map of every supplied original full-cap phase; aliases are retained. */
    capAddresses: readonly { phaseRadians: number; intrinsicU: number }[];
    /** Original V address and its exact Y value, before the union. */
    frontAddresses: readonly { originalV: number; yMm: number }[];
  }

  /** Main owns required front/median edge-chord address union, rather than either region. */
  export interface Sampling {
    /** Two complete original-V lists, retaining old addresses and adding inverse union addresses. */
    originalVAddresses: readonly [readonly number[],readonly number[]];
    /** Same canonical-Y arrays borrowed by front and posterior skin; overlap must be identical. */
    samplingY: readonly [readonly number[],readonly number[]];
  }

  /** All geometric branch and common-domain choices remain injected by main. */
  export interface Input {
    /** Existing shared HeadFrame, not regenerated here. */
    frame: HumanHeadFrame.Result;
    /** Exact existing cranialDomain port(last) object, also used by the upper cap owner. */
    station: HumanStationPort.Result;
    /** Main-selected Xmin contact of that station with Z=frame.supportMm[2]. */
    backContact: HumanStationPort.Contact;
    /** Two current actual sides, preserving their object authority. */
    sides: readonly [Side,Side];
    /** Full prior retained list; exactly its posterior two are replaced. */
    oldRetained: readonly HumanSurface.Patch[];
    /** Main-owned lower domain of the one shared median. */
    medianLowerYmm: number;
    /** Single main callback computes exact sample address unions and preserves provenance. */
    samplingOwner: (prepared: readonly [Prepared,Prepared]) => Sampling;
  }

  /** Whole-region replacement plan; main alone chooses promotion and root wiring. */
  export interface Result {
    /** Four readdressed front charts, unchanged geometric functions and original IDs. */
    fronts: HumanSurface.Patch[];
    /** Prior medial two plus new posterior two; no old posterior overlay remains. */
    retained: HumanSurface.Patch[];
    /** Exact actual pooled posterior functions and common median authority. */
    posterior: HumanPosteriorSurface.Result;
    /** Original regional function and root-admission witnesses for every side. */
    prepared: readonly [Prepared,Prepared];
    /** Full formed-root/extrema and whole-positive-derivative witnesses. */
    admissions: readonly [HumanHeadYAdmission.Result,HumanHeadYAdmission.Result];
    /** Exact phase union main must bind to its unchanged full upper cap sampler. */
    requiredUpperPhases: readonly number[];
    /** Same actual objects used by skin and generating construction. */
    boundaries: HumanSurface.Boundary[];
    /** Final paired owner/inverse addresses, actual forward values and arithmetic residuals. */
    addressLedgers: readonly { side: SideName; samples: readonly HumanHeadYPort.Address[] }[];
    /** Missing attachments and source-conditional limits remain explicit. */
    limitations: string[];
  }

  /** No regional skeleton, curve selection, clamp, refit or source-copy operation occurs. */
  export function build(input: Input): Result {
    if (input.sides[0].side === input.sides[1].side || input.sides.some((side: Side): boolean =>
      [side.inner,side.shared,side.outer].some((port: HumanForeheadSideNetwork.SidePort): boolean => port.side !== side.side)))
      throw new Error("Posterior assembly requires both current single-owner front sides");
    const back: HumanStationPort.Contact = input.backContact;
    compatible(back.jet.positionMm[2],input.frame.supportMm[2],"main-selected sagittal back contact");
    for (const contact of [back,...input.sides.map((side: Side): HumanStationPort.Contact => side.frontContact)]) {
      const actual: HumanStationPort.Contact["jet"] = input.station.jet(contact.phaseRadians);
      for (const key of ["positionMm","phaseDerivativeMmPerRadian","longitudinalDerivative","longitudinalPhaseDerivativePerRadian"] as const)
        for (let axis: number = 0;axis < 3;axis++) compatible(actual[key][axis]!,contact.jet[key][axis]!,"same actual station contact "+key);
    }
    interface CapAttempt {
      side: SideName;
      cap: HumanPosteriorCapPort.Result | null;
      addresses: Array<{phaseRadians:number;intrinsicU:number}>;
      failures: Array<{stage:string;phaseRadians:number|null;message:string}>;
    }
    const capAttempts: CapAttempt[] = input.sides.map((source: Side): CapAttempt => {
      const attempt: CapAttempt = {side:source.side,cap:null,addresses:[],failures:[]};
      try {
        compatible(dot(source.frontPlane.normal,source.frontContact.jet.positionMm),source.frontPlane.offsetMm,"main-selected front plane");
        attempt.cap=HumanPosteriorCapPort.build({
          side:source.side,station:input.station,front:source.frontContact,back,
          frontPlaneNormal:source.frontPlane.normal,backPlaneNormal:[0,0,1],normal:source.frontPlane.normal,
        });
      } catch (error: unknown) {
        const message: string = error instanceof Error ? error.message : String(error);
        for (const phaseRadians of source.capPhaseAddresses)
          attempt.failures.push({stage:"cap-owner-build",phaseRadians,message});
      }
      if (attempt.cap !== null) for (const phaseRadians of source.capPhaseAddresses) {
        try {
          attempt.addresses.push({phaseRadians,intrinsicU:attempt.cap.intrinsicAddress(phaseRadians)});
        } catch (error: unknown) {
          attempt.failures.push({stage:"original-phase-replay",phaseRadians,
            message:error instanceof Error ? error.message : String(error)});
        }
      }
      if (!source.capPhaseAddresses.includes(source.frontContact.phaseRadians) ||
        !source.capPhaseAddresses.includes(back.phaseRadians))
        attempt.failures.push({stage:"owned-endpoint-address-preservation",phaseRadians:null,
          message:"Main's original cap phase list must contain both actual selected endpoint addresses"});
      return attempt;
    });
    if (capAttempts.some((attempt: CapAttempt): boolean => attempt.failures.length !== 0)) {
      const diagnostics: object = {schema:"human-posterior-all-cap-replay-failure-v2",
        geometryReturned:false,stationBoundaryId:input.station.boundary.id,
        rootIntervalScope:"Public StationPort.contacts exposes original phases and full jets, not isolation brackets; no interval is invented",
        sides:capAttempts.map((attempt: CapAttempt,index: number): object => ({
          side:attempt.side,inputPhaseAddresses:input.sides[index]!.capPhaseAddresses,
          frontPlane:input.sides[index]!.frontPlane,front:input.sides[index]!.frontContact,
          backPlane:{normal:[0,0,1],offsetMm:input.frame.supportMm[2]},back,
          successfulAddresses:attempt.addresses,failures:attempt.failures,queries:attempt.cap?.queries ?? [],
        }))};
      throw Object.assign(new Error("Every injected cap address was attempted; geometry is unavailable: "+
        JSON.stringify(diagnostics,(_: string,value: unknown): unknown =>
          typeof value === "number" && !Number.isFinite(value) ? {nonFinite:String(value)} : value)),{diagnostics});
    }
    const admissions: [HumanHeadYAdmission.Result,HumanHeadYAdmission.Result] =
      input.sides.map((side: Side): HumanHeadYAdmission.Result => HumanHeadYAdmission.build({source:side.outer})) as
      [HumanHeadYAdmission.Result,HumanHeadYAdmission.Result];
    const prepared: [Prepared,Prepared] = input.sides.map((source: Side,index: number): Prepared => {
      compatible(dot(source.frontPlane.normal,source.frontContact.jet.positionMm),source.frontPlane.offsetMm,"main-selected front plane");
      const front: HumanHeadYPort.Result = HumanHeadYPort.build({source:source.outer,
        phasesAtY:admissions[index]!.phasesAtY,
        minimumWorldYDerivativeBoundMm:admissions[index]!.minimumWorldYDerivativeBoundMm});
      // Exact known sampler addresses survive numerical inverse rounding unchanged.
      front.admitAddresses(source.originalVAddresses.map((originalV: number): {originalV:number;canonicalY:number} =>
        ({originalV,canonicalY:front.physicalAddress(originalV).yMm})));
      const attempt: CapAttempt = capAttempts[index]!;
      const cap: HumanPosteriorCapPort.Result | null = attempt.cap;
      if (cap === null) throw new Error("A complete cap replay cannot lack its actual owner");
      const capAddresses: Array<{phaseRadians:number;intrinsicU:number}> = attempt.addresses;
      return {source,front,cap,capAddresses,
        frontAddresses:source.originalVAddresses.map((originalV: number): {originalV:number;yMm:number} =>
          ({originalV,yMm:front.physicalAddress(originalV).yMm}))};
    }) as [Prepared,Prepared];
    const sampling: Sampling = input.samplingOwner(prepared);
    const networks: HumanForeheadYNetwork.Result[] = prepared.map((part: Prepared,index: number): HumanForeheadYNetwork.Result => {
      const phases: readonly number[] = sampling.originalVAddresses[index]!;
      if (part.source.originalVAddresses.some((v: number): boolean => !phases.includes(v)))
        throw new Error("The common address union omitted an original front sample");
      for (const original of part.frontAddresses) {
        const ordinal: number = phases.indexOf(original.originalV);
        if (ordinal < 0 || sampling.samplingY[index]![ordinal] !== original.yMm)
          throw new Error("The common address union changed the exact canonical Y of an existing original-V owner sample");
      }
      const network: HumanForeheadYNetwork.Result = HumanForeheadYNetwork.build({
        central:part.source.central,lateral:part.source.lateral,inner:part.source.inner,
        shared:part.source.shared,outer:part.front,originalVAddresses:phases,
        canonicalYAddresses:sampling.samplingY[index]!,
      });
      return network;
    });
    const first: HumanPosteriorCapPort.Result = prepared[0].cap;
    const topField: ReturnType<HumanPosteriorCapPort.Result["transverse"]> = first.transverse(1);
    const medianTop: HumanHeadPosteriorMedian.Top = {
      positionMm:back.jet.positionMm,derivativeS:first.backDerivativeS,
      tangent:first.boundary.derivative(1),tangentDerivativeS:topField.derivativeU,stationUnit:"meridian-station-mm",
    };
    const posteriorSides: [HumanPosteriorSurface.Side,HumanPosteriorSurface.Side] =
      prepared.map((part: Prepared,index: number): HumanPosteriorSurface.Side => ({
        side:part.source.side,normal:part.source.frontPlane.normal,front:part.front,cap:part.cap,
        samplingU:[...new Set(part.capAddresses.map((entry: Prepared["capAddresses"][number]): number => entry.intrinsicU))].sort((a: number,b: number): number => a-b),
        samplingY:sampling.samplingY[index]!,
      })) as [HumanPosteriorSurface.Side,HumanPosteriorSurface.Side];
    const posterior: HumanPosteriorSurface.Result = HumanPosteriorSurface.build({
      frame:input.frame,medianTop,medianLowerYmm:input.medianLowerYmm,sides:posteriorSides,
    });
    const kept: HumanSurface.Patch[] = input.oldRetained.filter((patch: HumanSurface.Patch): boolean =>
      patch.id === "head.cranial.retained.left-medial" || patch.id === "head.cranial.retained.right-medial");
    const removed: HumanSurface.Patch[] = input.oldRetained.filter((patch: HumanSurface.Patch): boolean =>
      patch.id === "head.cranial.retained.left-posterior" || patch.id === "head.cranial.retained.right-posterior");
    if (kept.length !== 2 || removed.length !== 2 || input.oldRetained.length !== 4)
      throw new Error("Whole posterior replacement requires exactly both old posterior and both preserved medial domains");
    const fronts: HumanSurface.Patch[] = networks.flatMap((network: HumanForeheadYNetwork.Result): HumanSurface.Patch[] =>
      [network.central,network.lateral]);
    const registry: Map<string,HumanSurface.Boundary> = new Map();
    for (const patch of [...fronts,...posterior.patches]) for (const edge of Object.values(patch.boundaries)) {
      const previous: HumanSurface.Boundary | undefined = registry.get(edge.curve.id);
      if (previous !== undefined && previous !== edge.curve)
        throw new Error("One boundary identity has multiple objects in the posterior replacement plan");
      registry.set(edge.curve.id,edge.curve);
    }
    return {fronts,retained:[...kept,...posterior.patches],posterior,prepared,admissions,
      requiredUpperPhases:[...new Set(input.sides.flatMap((side: Side): number[] => [...side.capPhaseAddresses]))].sort((a: number,b: number): number => a-b),
      boundaries:[...registry.values()],
      addressLedgers:prepared.map((part: Prepared,index: number): {side:SideName;samples:HumanHeadYPort.Address[]} =>
        ({side:part.source.side,samples:networks[index]!.addressLedger})),
      limitations:[
        "Main selects and injects the existing station object and actual front Xmax/back sagittal Xmin contacts; this module neither reselects a branch nor builds another cranial station",
        "The median top consumes actual back P, its implicit fixed-sagittal station derivative and the cap's complete tangent/mixed derivative. No conditional source cap coefficient replaces a target jet",
        "Both front regions keep their original geometry, U coordinate, brow and forehead boundary objects. Original V is explicitly readdressed through the same outer course, with a single shared three-quarter object",
        "Only the old posterior retained pair is replaced. The medial retained pair and its known seven round41 crossings remain uncorrected; new domains require a fresh complete neighbor inspection",
        "The same cap full function and every injected nonuniform phase address survive. Main must apply requiredUpperPhases to the same upper-cap sampler; this return alone does not update that consumer",
        "Main's canonical Y arrays are borrowed unchanged by front and posterior samplers. Exact original owner samples retain both their V and original exact Y; added inverse pairs record actual forward Y/residual/existing arithmetic bound without coordinate projection",
        "The pooled six-scalar source-conditional law has finite source/LOPO error, unidentified external frame placement and unqualified unseen morphology; actual generated regularity, contacts, appearance and q returns remain unverified",
      ]};
  }
  function dot(a: Vector,b: Vector): number {return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function compatible(a: number,b: number,label: string): void {
    if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a-b) > 128*Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b)))
      throw new Error("Actual contact authority mismatch: "+label);
  }
}
