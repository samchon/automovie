import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanCurveFamily } from "../internal/HumanCurveFamily";
import type { HumanStationPort } from "../internal/HumanStationPort";
import type { HumanSurface } from "../internal/HumanSurface";

/** Reparameterize one actual cap arc by the observed outside-chord angle. */
export namespace HumanPosteriorCapPort {
  type Vector = HumanCurve.Vector;
  interface Jet {
    p: Vector; pu: Vector; puu: Vector; js: Vector; jsu: Vector;
  }


  /** One observation failure cannot replace the original geometric admission. */
  export interface DiagnosticFailure {
    /** Additional observation stage that failed. */
    stage: string;
    /** Original exception text, without inferred geometric meaning. */
    message: string;
  }

  /** Complete original contact and diagnostics of the unchanged ray predicate. */
  export interface RayContactObservation {
    /** Contact returned by the same public station authority. */
    contact: HumanStationPort.Contact;
    /** Original angular second derivative in mm/radian², if observation succeeded. */
    secondAngularDerivative: Vector | null;
    /** Signed projection onto the same ray, in mm. */
    positiveRayDistanceMm: number;
    /** Signed residual of the same plane, in mm. */
    planeResidualMm: number;
    /** Additional full-jet observation errors, independent of positivity selection. */
    diagnosticFailures: DiagnosticFailure[];
  }

  /** Same output jet already calculated by the existing evaluator. */
  export interface EvaluatedJet {
    /** Actual world position, in mm. */
    p: Vector;
    /** Along derivative, in mm per normalized intrinsic U. */
    pu: Vector;
    /** Second along derivative, in mm per normalized intrinsic U squared. */
    puu: Vector;
    /** Station derivative, in mm per meridian-station mm. */
    js: Vector;
    /** Mixed derivative, in mm per meridian-station mm per normalized U. */
    jsu: Vector;
  }

  /** Data-only same-owner ray query; unavailable isolation internals are explicit. */
  export interface RayObservation {
    /** Existing normalized intrinsic front-to-back coordinate. */
    intrinsicU: number;
    /** Corresponding intrinsic ray angle, in radians. */
    thetaRadians: number;
    /** Existing unit ray direction. */
    ray: Vector;
    /** Ray derivative per normalized intrinsic U. */
    rayU: Vector;
    /** Ray derivative per physical meridian-station mm. */
    rayS: Vector;
    /** Mixed ray derivative per station mm and normalized U. */
    raySU: Vector;
    /** Same ray-plane normal, without alternate projection. */
    planeNormal: Vector;
    /** Same signed plane offset, in mm. */
    planeOffsetMm: number;
    /** Existing front/back chord midpoint, in world mm. */
    middleMm: Vector;
    /** Midpoint derivative per meridian-station mm. */
    middleDerivativeS: Vector;
    /** Existing forward direction of the atan2 frame. */
    forward: Vector;
    /** Existing outside direction of the atan2 frame. */
    outside: Vector;
    /** Forward-frame derivative per meridian-station mm. */
    forwardDerivativeS: Vector;
    /** Outside-frame derivative per meridian-station mm. */
    outsideDerivativeS: Vector;
    /** Every returned public contact before the unchanged positivity predicate. */
    contacts: RayContactObservation[];
    /** Ordinals satisfying the unchanged strict positive-ray predicate. */
    positiveOrdinals: number[];
    /** Existing endpoint ownership or existing unique positive contact policy. */
    selection: "owned-front-endpoint" | "owned-back-endpoint" | "unique-positive-ray";
    /** Actual selected same-owner contact, without branch replacement. */
    selected: HumanStationPort.Contact | null;
    /** Original phase derivative per normalized intrinsic U. */
    phaseU?: number;
    /** Original phase derivative per meridian-station mm. */
    phaseS?: number;
    /** Second original phase derivative per normalized U squared. */
    phaseUU?: number;
    /** Mixed original phase derivative per station mm and normalized U. */
    phaseSU?: number;
    /** Existing implicit phase Jacobian denominator. */
    denominator?: number;
    /** Existing station numerator before division by the phase Jacobian. */
    numeratorS?: number;
    /** Existing U derivative of the phase Jacobian denominator. */
    denominatorU?: number;
    /** Existing mixed station/U numerator. */
    numeratorSU?: number;
    /** Same complete output fields, without evaluating an alternate surface. */
    result?: EvaluatedJet;
    /** Public station contacts do not expose isolation brackets. */
    isolationIntervals: null;
    /** Preserved evaluator/contact observation error, not itself an admission decision. */
    failure?: string;
  }

  /** Original whole-cap address and its complete diagnostic replay. */
  export interface AddressQuery {
    /** Same original station boundary identity. */
    stationBoundaryId: string;
    /** Requested complete-cap angular address, in radians. */
    originalPhaseRadians: number;
    /** Existing exact endpoint shortcut, if this is its owned address. */
    endpointAlias: "front" | "back" | null;
    /** Original full-function world position, in mm. */
    originalPositionMm: Vector | null;
    /** Original full family jet, if the additional observation succeeded. */
    originalJet: HumanCurveFamily.Jet | null;
    /** Original angular second derivative, in mm/radian², if observable. */
    originalSecondAngularDerivative: Vector | null;
    /** Raw atan2 coordinate, separate from an owned endpoint shortcut. */
    atan2IntrinsicU: number | null;
    /** Original admitted endpoint alias or original interior intrinsic coordinate. */
    intrinsicU: number | null;
    /** Signed outside projection used by atan2, in mm. */
    atan2NumeratorMm: number | null;
    /** Signed forward projection used by atan2, in mm. */
    atan2DenominatorMm: number | null;
    /** Same evaluator replay position, in mm, if observable. */
    replayedPositionMm: Vector | null;
    /** Replay minus original position per world axis, in mm. */
    deltaMm: Vector | null;
    /** Existing 128 EPS coordinate arithmetic bounds, in mm. */
    coordinateBoundsMm: Vector | null;
    /** Per-axis comparisons with the unchanged arithmetic bounds. */
    coordinateWithinBounds: boolean[] | null;
    /** Full same-ray contact and output observations, if available. */
    evaluation: RayObservation | null;
    /** Signed residual of the original position against the same plane, in mm. */
    originalPlaneResidualMm: number | null;
    /** Original position's signed distance along the same ray, in mm. */
    originalRayDistanceMm: number | null;
    /** Original geometric admission only; diagnostic-only errors cannot change it. */
    status: "pending" | "passed" | "failed";
    /** Original admission failure text for an interior query only. */
    failure?: string;
    /** Additional observation errors, separate from original admission. */
    diagnosticFailures: DiagnosticFailure[];
  }

  /** Main-owned exact source-corresponding front and posterior-median contacts. */
  export interface Input {
    /** Existing geometric side. */
    side: "left" | "right";
    /** Same complete actual station authority; no coefficients are copied. */
    station: HumanStationPort.Result;
    /** Main-selected anterior Xmax contact of the actual outer-canthal plane. */
    front: HumanStationPort.Contact;
    /** Main-selected posterior Xmin contact of the same common HeadFrame sagittal datum. */
    back: HumanStationPort.Contact;
    /** Exact defining plane of the front contact, normally the actual U1 canthal plane. */
    frontPlaneNormal: Vector;
    /** Exact defining plane of the sole shared median contact. */
    backPlaneNormal: Vector;
    /** Fixed actual unit canthal-plane normal, used only to select the observed outside. */
    normal: Vector;
  }

  /** One complete cap arc can be injected into both subsequent vector charts. */
  export interface Result {
    /** Sole exact cap-arc object, front0 through back1. */
    boundary: HumanSurface.Boundary;
    /** Exact second along derivative, mm per normalized intrinsic angle squared. */
    alongSecond: (u: number) => Vector;
    /** Actual meridian-station gauge; it includes moving endpoint phase drift. */
    transverseUnit: "meridian-station-mm";
    /** Exact dP/ds and d²P/(ds dU), s in physical meridian-station mm. */
    transverse: (u: number) => { derivative: Vector; derivativeU: Vector };
    /** Same actual posterior endpoint derivative for the back-course owner. */
    backDerivativeS: Vector;
    /** Exact intrinsic address of an original whole-cap phase; main qualifies the domain. */
    intrinsicAddress: (phaseRadians: number) => number;
    /** The actual whole station function, retained as provenance without refitting. */
    stationBoundary: HumanSurface.Boundary;
    /** Complete original-phase replay queries, borrowed by root diagnostics. */
    queries: readonly AddressQuery[];
    /** Source-coordinate admission and missing outside surface qualifications. */
    limitations: string[];
  }

  /**
   * The earlier37 canthal-back arcs admit an increasing intrinsic angle; the new front-to-median arcs require their own all37 admission
   * around their actual front/median chord midpoint. This coordinate uses their
   * complete physical-phase Jacobian; it does not identify equal Fourier phases
   * or fit a radius. The generated cap remains its existing complete function.
   *
   * The actual station owner isolates every plane crossing for each requested
   * intrinsic ray. Exactly one positive ray contact is required. Endpoint motion
   * changes the chord frame and midpoint; their full station derivatives enter
   * the implicit phase Jacobian and its mixed derivative. No endpoint is shifted,
   * projected, clamped, interpolated from source points or given a fallback.
   */
  export function build(input: Input): Result {
    const n: Vector = input.normal, f: HumanStationPort.Contact = input.front;
    const b: HumanStationPort.Contact = input.back;
    const fp: Vector = f.jet.positionMm, bp: Vector = b.jet.positionMm;
    if (![input.frontPlaneNormal,input.backPlaneNormal].every(
      (v: Vector): boolean => v.length === 3 && v.every(Number.isFinite) && Math.abs(dot(v,v)-1) <= 1e-10) ||
      n.length !== 3 || !n.every(Number.isFinite) ||
      Math.abs(dot(n,n)-1) > 1e-10 || !(fp[0] > bp[0]) ||
      ![fp,bp].every((x: Vector): boolean => x.every(Number.isFinite)))
      throw new Error("Outside cap requires actual distinct front/back contacts and their canthal plane");
    const extent: number = Math.max(1,Math.hypot(...fp),Math.hypot(...bp));
    if (Math.abs(bp[1]-fp[1]) > 128*Number.EPSILON*extent)
      throw new Error("Outside cap contacts do not share the actual transverse layer");
    const endpoint: (contact: HumanStationPort.Contact,planeNormal: Vector) => Vector =
      (contact: HumanStationPort.Contact,planeNormal: Vector): Vector => {
        const j: HumanCurveFamily.Jet = contact.jet;
        const rate: number = -dot(planeNormal,j.longitudinalDerivative)/dot(planeNormal,j.phaseDerivativeMmPerRadian);
        if (!Number.isFinite(rate)) throw new Error("Outside cap endpoint has no regular implicit station jet");
        return add(j.longitudinalDerivative,scale(j.phaseDerivativeMmPerRadian,rate));
      };
    const fs: Vector = endpoint(f,input.frontPlaneNormal), bs: Vector = endpoint(b,input.backPlaneNormal);
    const chord: Vector = [bp[0]-fp[0],0,bp[2]-fp[2]];
    const chordS: Vector = [bs[0]-fs[0],0,bs[2]-fs[2]];
    const length: number = Math.hypot(...chord);
    if (!(length > 0 && Number.isFinite(length))) throw new Error("Outside cap has no transverse chord");
    const e: Vector = scale(chord,1/length);
    const es: Vector = scale(subtract(chordS,scale(e,dot(e,chordS))),1/length);
    const forward: Vector = scale(e,-1), forwardS: Vector = scale(es,-1);
    const rotate: (x: Vector) => Vector = (x: Vector): Vector => [-x[2],0,x[0]];
    const sign: number = dot(n,rotate(e)) > 0 ? 1 : -1;
    const outside: Vector = scale(rotate(e),sign), outsideS: Vector = scale(rotate(es),sign);
    const middle: Vector = scale(add(fp,bp),.5), middleS: Vector = scale(add(fs,bs),.5);
    const cache: Map<number,Jet> = new Map();
    const observations: Map<number,RayObservation> = new Map();
    const queries: AddressQuery[] = [];
    const evaluate: (u: number) => Jet = (u: number): Jet => {
      const previous: Jet | undefined = cache.get(u);
      if (previous !== undefined) return previous;
      if (!(Number.isFinite(u) && u >= 0 && u <= 1))
        throw new Error("Outside cap evaluation exceeds its intrinsic front/back interval");
      const theta: number = Math.PI*u;
      const c: number = u === 0 ? 1 : u === 1 ? -1 : Math.cos(theta);
      const s: number = u === 0 || u === 1 ? 0 : Math.sin(theta);
      const ray: Vector = add(scale(forward,c),scale(outside,s));
      const rayU: Vector = scale(add(scale(forward,-s),scale(outside,c)),Math.PI);
      const rayS: Vector = add(scale(forwardS,c),scale(outsideS,s));
      const raySU: Vector = scale(add(scale(forwardS,-s),scale(outsideS,c)),Math.PI);
      const k: Vector = rotate(ray), ku: Vector = rotate(rayU);
      const ks: Vector = rotate(rayS), ksu: Vector = rotate(raySU);
      const observation: RayObservation = {intrinsicU:u,thetaRadians:theta,ray,rayU,rayS,raySU,
        planeNormal:k,planeOffsetMm:dot(k,middle),middleMm:middle,middleDerivativeS:middleS,
        forward,outside,forwardDerivativeS:forwardS,outsideDerivativeS:outsideS,
        contacts:[],positiveOrdinals:[],selection:u === 0 ? "owned-front-endpoint" :
          u === 1 ? "owned-back-endpoint" : "unique-positive-ray",selected:null,isolationIntervals:null};
      observations.set(u,observation);
      const contact: HumanStationPort.Contact = u === 0 ? f : u === 1 ? b : uniqueRay();
      observation.selected=contact;
      const j: HumanCurveFamily.Jet = contact.jet;
      const p: Vector = j.positionMm, q: Vector = subtract(p,middle);
      const a: Vector = j.phaseDerivativeMmPerRadian;
      const aa: Vector = input.station.secondDerivative(contact.phaseRadians);
      const ja: Vector = j.longitudinalPhaseDerivativePerRadian;
      const denominator: number = dot(k,a);
      const phaseU: number = -dot(ku,q)/denominator;
      const numeratorS: number = dot(ks,q)+dot(k,subtract(j.longitudinalDerivative,middleS));
      const phaseS: number = -numeratorS/denominator;
      const pu: Vector = scale(a,phaseU);
      const denominatorU: number = dot(ku,a)+dot(k,aa)*phaseU;
      const numeratorSU: number = dot(ksu,q)+dot(ks,pu)+
        dot(ku,subtract(j.longitudinalDerivative,middleS))+dot(k,ja)*phaseU;
      const phaseSU: number = -(numeratorSU*denominator-numeratorS*denominatorU)/(denominator*denominator);
      const phaseUU: number = -(dot(k,aa)*phaseU*phaseU+
        2*dot(ku,a)*phaseU-Math.PI*Math.PI*dot(k,q))/denominator;
      const result: Jet = {p,pu,puu:add(scale(aa,phaseU*phaseU),scale(a,phaseUU)),
        js:u === 0 ? fs : u === 1 ? bs : add(j.longitudinalDerivative,scale(a,phaseS)),
        jsu:add(add(scale(ja,phaseU),scale(aa,phaseU*phaseS)),scale(a,phaseSU))};
      observation.phaseU=phaseU; observation.phaseS=phaseS;
      observation.phaseUU=phaseUU; observation.phaseSU=phaseSU; observation.result=result;
      observation.denominator=denominator; observation.numeratorS=numeratorS;
      observation.denominatorU=denominatorU; observation.numeratorSU=numeratorSU;
      if (![result.p,result.pu,result.puu,result.js,result.jsu].every(
        (x: Vector): boolean => x.every(Number.isFinite)) ||
        !(dot(ray,q) > 0 && result.js[1] > 0))
        throw new Error("Actual outside cap lacks a finite regular positive intrinsic/station gauge");
      cache.set(u,result); return result;

      /** Every exact same-curve contact participates before the branch is selected. */
      function uniqueRay(): HumanStationPort.Contact {
        const contacts: HumanStationPort.Contact[] = observeContacts(observation);
        const qualified: HumanStationPort.Contact[] = contacts.filter(
          (value: HumanStationPort.Contact): boolean => dot(ray,subtract(value.jet.positionMm,middle)) > 0);
        if (qualified.length !== 1)
          throw new Error("The actual cap does not admit one qualified outside intrinsic ray");
        return qualified[0]!;
      }
    };
    /** Observe the same public all-contact owner without changing endpoint or positive selection. */
    function observeContacts(observation: RayObservation): HumanStationPort.Contact[] {
      const contacts: HumanStationPort.Contact[] = input.station.contacts(observation.planeNormal,observation.planeOffsetMm,"representable-phase");
      observation.contacts=contacts.map((contact: HumanStationPort.Contact): RayContactObservation => {
        const entry: RayContactObservation = {contact,secondAngularDerivative:null,
          positiveRayDistanceMm:dot(observation.ray,subtract(contact.jet.positionMm,middle)),
          planeResidualMm:dot(observation.planeNormal,contact.jet.positionMm)-observation.planeOffsetMm,
          diagnosticFailures:[]};
        try { entry.secondAngularDerivative=input.station.secondDerivative(contact.phaseRadians); }
        catch (error: unknown) { entry.diagnosticFailures.push({stage:"contact-second-angular-jet",
          message:error instanceof Error ? error.message : String(error)}); }
        return entry;
      });
      observation.positiveOrdinals=observation.contacts.flatMap(
        (entry: RayObservation["contacts"][number],ordinal: number): number[] => entry.positiveRayDistanceMm > 0 ? [ordinal] : []);
      return contacts;
    }
    const boundary: HumanSurface.Boundary = {
      id:"head.posterior-hemisphere."+input.side+".forehead-principal",start:0,end:1,
      unit:"normalized-outside-intrinsic-angle",
      evaluate:(u: number): Vector => evaluate(u).p,
      derivative:(u: number): Vector => evaluate(u).pu,
    };
    return {boundary,stationBoundary:input.station.boundary,
      queries,
      intrinsicAddress:(phase: number): number => {
        const alias: "front"|"back"|null = phase === f.phaseRadians ? "front" : phase === b.phaseRadians ? "back" : null;
        const query: AddressQuery = {stationBoundaryId:input.station.boundary.id,originalPhaseRadians:phase,
          endpointAlias:alias,originalPositionMm:null,originalJet:null,originalSecondAngularDerivative:null,
          atan2IntrinsicU:null,intrinsicU:null,atan2NumeratorMm:null,atan2DenominatorMm:null,replayedPositionMm:null,deltaMm:null,coordinateBoundsMm:null,
          coordinateWithinBounds:null,evaluation:null,originalPlaneResidualMm:null,originalRayDistanceMm:null,status:"pending",diagnosticFailures:[]};
        queries.push(query);
        try {
          const p: Vector = input.station.boundary.evaluate(phase), q: Vector = subtract(p,middle);
          query.originalPositionMm=p;
          try { query.originalJet=input.station.jet(phase); }
          catch (error: unknown) { query.diagnosticFailures.push({stage:"original-full-family-jet",
            message:error instanceof Error ? error.message : String(error)}); }
          try { query.originalSecondAngularDerivative=input.station.secondDerivative(phase); }
          catch (error: unknown) { query.diagnosticFailures.push({stage:"original-second-angular-jet",
            message:error instanceof Error ? error.message : String(error)}); }
          const atan2U: number = Math.atan2(dot(outside,q),dot(forward,q))/Math.PI;
          query.atan2IntrinsicU=atan2U;
          query.atan2NumeratorMm=dot(outside,q); query.atan2DenominatorMm=dot(forward,q);
          const u: number = alias === "front" ? 0 : alias === "back" ? 1 : atan2U;
          query.intrinsicU=u;
          if (!(u >= 0 && u <= 1 && Number.isFinite(u)))
            throw new Error("The actual whole-cap phase is outside this source-defined front/median half");
          const point: Vector = evaluate(u).p;
          const observation: RayObservation = observations.get(u)!;
          query.evaluation=observation;
          // Endpoints keep their existing owned contact; this query observes all alternatives only.
          if (alias !== null) observeContacts(observation);
          query.replayedPositionMm=point;
          query.deltaMm=subtract(point,p);
          query.coordinateBoundsMm=point.map((x: number,i: number): number =>
            128*Number.EPSILON*Math.max(1,Math.abs(x),Math.abs(p[i]!))) as Vector;
          query.coordinateWithinBounds=point.map((x: number,i: number): boolean =>
            Math.abs(x-p[i]!) <= query.coordinateBoundsMm![i]!);
          query.originalPlaneResidualMm=dot(observation.planeNormal,p)-observation.planeOffsetMm;
          query.originalRayDistanceMm=dot(observation.ray,subtract(p,middle));
          // Preserve the original exact endpoint shortcut; comparison remains interior-only.
          if (alias === null && point.some((x: number,i: number): boolean => Math.abs(x-p[i]!) >
            128*Number.EPSILON*Math.max(1,Math.abs(x),Math.abs(p[i]!))))
            throw new Error("The original cap phase and qualified intrinsic branch are different contacts");
          query.status="passed"; return u;
        } catch (error: unknown) {
          const message: string = error instanceof Error ? error.message : String(error);
          if (alias === null) { query.status="failed"; query.failure=message; }
          else {
            query.status="passed";
            query.intrinsicU=alias === "front" ? 0 : 1;
            query.diagnosticFailures.push({stage:"owned-endpoint-additional-observation",message});
          }
          if (query.intrinsicU !== null) query.evaluation=observations.get(query.intrinsicU) ?? null;
          if (query.evaluation !== null) {
            const observation: RayObservation = query.evaluation;
            observation.failure=message;
            if (query.originalPositionMm !== null) {
              const p: Vector = query.originalPositionMm;
              query.originalPlaneResidualMm=dot(observation.planeNormal,p)-observation.planeOffsetMm;
              query.originalRayDistanceMm=dot(observation.ray,subtract(p,middle));
              if (observation.result !== undefined && query.replayedPositionMm === null) {
                const point: Vector = observation.result.p;
                query.replayedPositionMm=point; query.deltaMm=subtract(point,p);
                query.coordinateBoundsMm=point.map((x: number,i: number): number =>
                  128*Number.EPSILON*Math.max(1,Math.abs(x),Math.abs(p[i]!))) as Vector;
                query.coordinateWithinBounds=point.map((x: number,i: number): boolean =>
                  Math.abs(x-p[i]!) <= query.coordinateBoundsMm![i]!);
              }
            }
          }
          // Preserve the original immediate exact endpoint admission despite observer failure.
          if (alias !== null) return alias === "front" ? 0 : 1;
          throw error;
        }
      },
      transverseUnit:"meridian-station-mm",backDerivativeS:bs,
      alongSecond:(u: number): Vector => evaluate(u).puu,
      transverse:(u: number): {derivative: Vector;derivativeU: Vector} =>
        ({derivative:evaluate(u).js,derivativeU:evaluate(u).jsu}),
      limitations:[
        "This adapter retains the actual original cap function and main-selected contacts; it changes only their declared address and full parameter Jacobian",
        "The new median-restricted source37 intrinsic-ray admissions are binary64 whole-span algebraic studies, not an outward certificate or proof for arbitrary generated parameters",
        "All actual contacts are considered and nonunique or singular requested rays are rejected; no angular crop, outermost fallback or source copy is used",
        "Ray contacts opt into the same station owner's representable-phase convergence inside the original monotone cell; the scalar root floor is not treated as coordinate equality",
        "Original phase inputs and the existing coordinatewise128EPS replay admission are unchanged. Same-root refinement changes no curve, final point or branch, and may still reject unresolved numerical or geometric cases",
        "Station derivatives include midpoint and chord-frame motion, so raw family_s is not mislabeled as a fixed intrinsic-ray transverse derivative",
        "Actual generated admission, same median ownership, full corner/tangent compatibility, newly median-restricted source fit and matched rendering remain unverified",
        "The cache belongs to this one returned cap owner and stores only requested exact function evaluations; no source samples are retained",
      ]};
  }

  function dot(a: Vector,b: Vector): number {return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function scale(a: Vector,t: number): Vector {return a.map((x: number): number => x*t) as Vector;}
  function add(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x+b[i]!) as Vector;}
  function subtract(a: Vector,b: Vector): Vector {return a.map((x: number,i: number): number => x-b[i]!) as Vector;}
}
