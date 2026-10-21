import type { HumanSurface } from "../internal/HumanSurface";
import { HumanShoulderSkinCharts as Charts } from "./HumanShoulderSkinCharts";
import { HumanShoulderSkinGuideLift as Lift } from "./HumanShoulderSkinGuideLift";
import { HumanShoulderSkinMath as M } from "./HumanShoulderSkinMath";

/** Pending injectable shoulder skin candidate. The common owner supplies the
 * complete actual nonparallel ABC cycles and source-qualified contact roles.
 * No native source geometry, coefficient rows, scalar station guard, horizontal
 * Chest crop, shifted arm or visibility selection is used as a runtime port.
 */
export namespace HumanShoulderSkin {
  /** Qualified principal contact role; feature count is independent of this set. */
  export type Contact = Charts.Node|"A.F"|"A.R"|"C.F"|"C.R";

  /** One complete common q-generated port authority, never a stored specimen. */
  export interface Authority {
    /** Whole generating cycle with declared physical phase, P/T and exact generating D2. */
    curve:M.Curve;

    /** Unique principal role addresses in the whole curve's original parameter unit. */
    contacts:Partial<Record<Contact,number>>;

    /** Qualified canonical source-graph direction relative to the generated curve. */
    canonicalDirection:1|-1;

    /** Actual generated regional surface 2jet; absent only for explicit derived-field research. */
    frameAt?: (physicalParameter:number)=>M.Frame2;

    /** Common owner's generated outward orientation witness; no source normal is read. */
    outwardAt:(physicalParameter:number)=>M.V;

    /** All declared features in original phase; no fixed count or guide order is imposed on them. */
    featureParameters:readonly number[];
  }
  /** Main-owned generated inputs for an isolated or regional-G1 skin candidate. */
  export interface Input {
    /** Stable region identity used for shared generated edge identities. */
    id:string;

    /** Isolated mode means common source-identified q laws, never raw-source runtime curves. */
    boundaryMode:"regional-G1"|"isolated-source-conditioned";

    /** Complete main-owned ABC cycles; A is independent of patch corner interpolation. */
    ports:Record<"A"|"B"|"C",Authority>;

    /** Five complete common q-generated guide functions with their physical units and D2. */
    guides:Record<"AB"|"AC"|"BC"|"AF"|"AR",M.Curve>;

    /** Qualified AF-side B.C-to-B.A direction; no nearest or shortest arc is selected. */
    bodyFrontDirection:1|-1;

    /** Independent native-role C and retained shaft coverage status, owned by main. */
    shaftContinuation:ShaftContinuation;
  }
  /** Explicit continuation status; the retained .34 domain never becomes native-role C. */
  export interface ShaftContinuation {
    /** Same generated C boundary object as the port input; no source geometry is authorized. */
    nativeC:HumanSurface.Boundary;

    /** Different actual generated boundary inside the existing retained shaft domain. */
    retainedShaft:HumanSurface.Boundary;

    /** Unresolved allows an isolated capture but cannot qualify a whole-body join. */
    status:"unresolved"|"identified-joint-BVP";
  }
  /** Exact oriented restriction metadata, preserving its parent whole-function authority. */
  export interface Restriction {
    /** Main's anatomical branch port identity. */
    port:"A"|"B"|"C";

    /** Original complete generated curve; it is delegated, never resampled or fitted here. */
    original:M.Curve;

    /** Original physical phase of the restriction's first endpoint. */
    startPhysicalParameter:number;

    /** Original physical phase of its last endpoint; wrapping is explicitly directed. */
    endPhysicalParameter:number;

    /** First derivative Jacobian sign; the second derivative Jacobian is its square. */
    direction:1|-1;

    /** Exact oriented phase width in the parent's declared unit, not necessarily arclength. */
    width:number;

    /** Shared local phase authority consumed by skin and construction. */
    curve:Charts.Port;

    /** Map the closed local interval to its original cyclic physical address. */
    toOriginal:(localPhysicalParameter:number)=>number;

    /** Map an original half-open cyclic address to directed local phase. */
    toLocal:(originalPhysicalParameter:number)=>number;
  }
  /** Six-chart candidate; every unqualified geometric claim remains explicit. */
  export interface Result {
    /** Actual analytic generating skin charts, ready for main's emitter after adoption. */
    patches:readonly HumanSurface.Patch[];

    /** The same seventeen boundary objects used by these skin charts. */
    construction:readonly HumanSurface.Boundary[];

    /** Whole generated guide authorities after endpoint osculating transport. */
    physicalGuides:Record<"AB"|"AC"|"BC"|"AF"|"AR",M.Curve>;

    /** Physical phase, orientation and parent identity for every exterior half cycle. */
    restrictions:Record<Charts.External,Restriction>;

    /** Front/back whole-guide lifts and explicit nonlinear phase Jacobians. */
    forwardLifts:readonly [Lift.Result,Lift.Result];

    /** Endpoint position/tangent-plane/curvature changes, separate from original source fitting error. */
    endpointTransport:Record<"AB"|"AC"|"BC"|"AF"|"AR",M.Lift["endpointResiduals"]>;

    /** Exact closed sector normal-form, endpoint lane and rank evidence consumed by the charts. */
    cornerEnclosure:Charts.Result["cornerEnclosure"];

    /** Combinatorial pants identity; no immersion or embedding certificate is implied. */
    topology:Topology;

    /** Original main-owned continuation status, unchanged by this candidate. */
    shaftContinuation:ShaftContinuation;

    /** Explicit stage prevents derived fields from masquerading as regional surface jets. */
    boundaryMode:Input["boundaryMode"];

    /** Every declared feature's guide crossing equation and unresolved subdivision status. */
    featureRelations:readonly FeatureRelation[];

    /** Pending state never claims compilation, rendering or whole-body completion. */
    status:"pending-render-candidate";

    /** Observational rank, geometry and integration limits retained for the consumer. */
    limitations:readonly string[];
  }
  /** Six actual quad faces after two source-qualified forward-guide splits. */
  export interface Topology {
    /** Six principal vertices and four forward-guide port contacts. */
    vertices:10;

    /** Seventeen unique shared geometric boundary identities. */
    edges:17;

    /** Six quad skin charts, selected by source guide structure rather than sampling. */
    faces:6;

    /** Complete A, B and C exterior cycles. */
    boundaryCycles:3;

    /** Euler characteristic of a genus-zero three-boundary pants surface. */
    euler:-1;
  }
  /** Feature/guide events remain equations rather than a forced fixed topology. */
  export interface FeatureRelation {
    /** Exact exterior restriction carrying the caller-declared feature. */
    restriction:Charts.External;

    /** Feature address in the original whole-port physical unit. */
    originalPhysicalParameter:number;

    /** Corresponding normalized U in the unsplit generating chart. */
    normalizedBaseU:number;

    /** Actual base chart influenced by that boundary feature. */
    chart:"front.arm"|"back.arm"|"front.body"|"back.body";

    /** Forward guide that can cross the implied lane, or null on body-only charts. */
    guide:"AF"|"AR"|null;

    /** a(v)-u_feature and its analytic derivative; null means no forward-guide comparison. */
    crossingCondition:((normalizedV:number)=>CrossingJet)|null;

    /** Classification and additional C0 chart subdivision remain main-owned and unimplemented. */
    interiorSubdivision:"unresolved-owner-must-classify-feature";
  }
  /** Dimensionless feature/guide crossing equation in normalized chart V. */
  export interface CrossingJet {
    /** Zero identifies a feature lane meeting a forward guide. */
    value:number;

    /** d(value)/dV; a simultaneous zero is a repeated crossing condition. */
    derivative:number;
  }
  const CONTACTS:Record<"A"|"B"|"C",readonly Contact[]> = {A:["A.B","A.F","A.C","A.R"],B:["B.A","B.C"],C:["C.A","C.R","C.B","C.F"]};
  const GUIDE_ENDS:Record<"AB"|"AC"|"BC"|"AF"|"AR",readonly [Contact,Contact]> = {AB:["A.B","B.A"],AC:["A.C","C.A"],BC:["B.C","C.B"],AF:["A.F","C.F"],AR:["A.R","C.R"]};

  /** Derive an executable six-chart candidate from whole common curves. The
   * complete source-informed A remains independent of patch interiors. Principal
   * guide endpoints transport by actual osculating constraints; remaining guide
   * interiors retain their original full functions. Source-related angular
   * sectors determine diagonal endpoint directions; the complete common B half
   * supplies each continuation shape and physical tangent speed. Two additional
   * whole guides determine
   * interior trace corrections. The bounded direct solves are not source-native
   * material reconstruction. This function performs no I/O, fitting or rendering.
   */
  export function build(input:Input):Result {
    if ((input.boundaryMode !== "regional-G1" && input.boundaryMode !== "isolated-source-conditioned") || (input.bodyFrontDirection !== 1 && input.bodyFrontDirection !== -1)) throw new Error("Shoulder candidate needs an explicit boundary mode and qualified B arc direction");
    if (!input.id || input.shaftContinuation.nativeC !== input.ports.C.curve.boundary || input.shaftContinuation.nativeC === input.shaftContinuation.retainedShaft)
      throw new Error("Shoulder requires the actual native C authority separately from the retained shaft boundary");
    for (const role of ["A","B","C"] as const) validateAuthority(input.ports[role],CONTACTS[role]);
    if (input.boundaryMode === "regional-G1" && (!input.ports.B.frameAt || !input.ports.C.frameAt)) throw new Error("Complete B and native C need actual regional physical 2jets, not a Chest contour or .34 section");
    const frames:Record<Contact,M.Frame2> = {} as Record<Contact,M.Frame2>;
    for (const key of Object.keys(GUIDE_ENDS) as (keyof typeof GUIDE_ENDS)[]) {
      const ends:readonly [Contact,Contact] = GUIDE_ENDS[key], guide:M.Curve = input.guides[key];
      for (let i:number = 0; i < 2; i++) {
        const node:Contact = ends[i]!, authority:Authority = input.ports[node[0] as "A"|"B"|"C"];
        const p:number = contact(authority,node);
        const physical:M.CurveJet = M.sample(authority.curve,p);
        const actual:M.Frame2|undefined = authority.frameAt?.(p);
        const g:M.CurveJet = M.sample(guide,i === 0 ? guide.boundary.start : guide.boundary.end,i === 0 ? "right" : "left");
        if (input.boundaryMode === "regional-G1" && node[0] !== "A" && actual?.authority !== "actual-regional-generator") throw new Error("B/C contact osculation requires the actual regional generator");
        frames[node] = actual ?? M.derivedFrame(physical,g,authority.outwardAt(p),{u:authority.curve.boundary.unit,v:guide.boundary.unit});
        M.close(frames[node].positionMm,physical.positionMm,node+" actual frame");
        if (!(M.dot(M.normal(frames[node]),M.unit(authority.outwardAt(p))) > 0)) throw new Error("Common shoulder frame has reversed outward orientation");
      }
    }
    const physicalGuides:Result["physicalGuides"] = {} as Result["physicalGuides"];
    const endpointTransport:Result["endpointTransport"] = {} as Result["endpointTransport"];
    for (const name of Object.keys(GUIDE_ENDS) as (keyof typeof GUIDE_ENDS)[]) {
      const ends:readonly [Contact,Contact] = GUIDE_ENDS[name];
      const lifted:M.Lift = M.transport(input.guides[name],frames[ends[0]],frames[ends[1]],input.id+"."+name+".actual");
      physicalGuides[name] = lifted.curve; endpointTransport[name] = lifted.endpointResiduals;
    }
    const restrictions:Result["restrictions"] = {
      aFront:cut("A","A.B","A.C",input.ports.A.canonicalDirection),aBack:cut("A","A.C","A.B",input.ports.A.canonicalDirection),
      bFront:cut("B","B.C","B.A",input.bodyFrontDirection),bBack:cut("B","B.A","B.C",input.bodyFrontDirection),
      cFront:cut("C","C.A","C.B",-input.ports.C.canonicalDirection as 1|-1),cBack:cut("C","C.B","C.A",-input.ports.C.canonicalDirection as 1|-1),
    };
    const ports:Record<Charts.External,Charts.Port> = Object.fromEntries(Object.entries(restrictions).map(([name,r]:[string,Restriction]):[string,Charts.Port] => [name,r.curve])) as Record<Charts.External,Charts.Port>;
    const forwardU:readonly [readonly [number,number],readonly [number,number]] = [
      [traceAddress(restrictions.aFront,"A.F",false),traceAddress(restrictions.cFront,"C.F",true)],
      [traceAddress(restrictions.aBack,"A.R",true),traceAddress(restrictions.cBack,"C.R",false)],
    ];
    for (const [name,node] of [["aFront","A.F"],["aBack","A.R"],["cFront","C.F"],["cBack","C.R"]] as const) if (!ports[name].frameAt)
      ports[name].fieldAnchors = [{parameter:restrictions[name].toLocal(contact(input.ports[node[0] as "A"|"C"],node)),frame:frames[node]}];
    const atlas:Charts.Result = Charts.build({id:input.id,boundaryMode:input.boundaryMode,ports,guides:{AB:physicalGuides.AB,AC:physicalGuides.AC,BC:physicalGuides.BC},frames:frames as Record<Charts.Node,M.Frame2>});
    const front:Lift.Result = Lift.build({id:input.id+".AF",patch:atlas.patches[0],guide:physicalGuides.AF,startU:forwardU[0][0],endU:forwardU[0][1]});
    const back:Lift.Result = Lift.build({id:input.id+".AR",patch:atlas.patches[2],guide:physicalGuides.AR,startU:forwardU[1][0],endU:forwardU[1][1]});
    const patches:readonly HumanSurface.Patch[] = [...front.patches,atlas.patches[1],...back.patches,atlas.patches[3]];
    const construction:HumanSurface.Boundary[] = [...new Set(patches.flatMap((patch:HumanSurface.Patch):HumanSurface.Boundary[] => Object.values(patch.boundaries).map((edge:HumanSurface.Edge):HumanSurface.Boundary => edge.curve)))];
    if (construction.length !== 17) throw new Error("Shoulder six-chart topology has lost shared boundary identity");
    const featureRelations:FeatureRelation[] = [];
    for (const name of Object.keys(restrictions) as Charts.External[]) {
      const r:Restriction = restrictions[name];
      const reverse:boolean = name === "aBack" || name === "bFront" || name === "cFront";
      const lift:Lift.Result|null = name[0] === "b" ? null : name.endsWith("Front") ? front : back;
      for (const p of r.curve.featureParameters) {
        const normalizedBaseU:number = reverse ? 1-p/r.width : p/r.width;
        featureRelations.push({restriction:name,originalPhysicalParameter:r.toOriginal(p),normalizedBaseU,
          chart: name[0] === "b" ? name.endsWith("Front") ? "front.body" : "back.body" : name.endsWith("Front") ? "front.arm" : "back.arm",
          guide:lift === null ? null : name.endsWith("Front") ? "AF" : "AR",
          crossingCondition:lift === null ? null : (v:number):{value:number;derivative:number} => {
            const jet:M.MapJet = lift.chartU(v); return {value:jet.value-normalizedBaseU,derivative:jet.first};
          },interiorSubdivision:"unresolved-owner-must-classify-feature"});
      }
    }
    return {patches,construction,physicalGuides,restrictions,forwardLifts:[front,back],endpointTransport,cornerEnclosure:atlas.cornerEnclosure,topology:{vertices:10,edges:17,faces:6,boundaryCycles:3,euler:-1},
      shaftContinuation:input.shaftContinuation,boundaryMode:input.boundaryMode,featureRelations,status:"pending-render-candidate",limitations:[...atlas.limitations,
        input.boundaryMode === "isolated-source-conditioned" ? "Isolated source-conditioned candidate: all missing B/C fields are explicitly derived generator completions; regional neighbor G1 is unqualified." : "Regional-G1 mode consumes actual regional B/C 2jets; C-to-shaft continuation status remains independently required.",
        "The original source curve h, degree and rational weights remain outside this independent generator and are not replaced by its approximations.",
        "Generated A remains a source-conditioned q law; nonparallel station response and independent anatomical causality are unqualified.",
        "Guide transport residuals measure actual authority displacement, tangent plane and curvature changes separately from original fitting uncertainty.",
        "The positive chart phase is a derived generator Jacobian, not recovered material identity or exact source chord/arclength equality.",
        "Complete B consumes actual regional geometry; native C-to-retained-shaft continuation is a separate jointly identified boundary-value problem.",
        "Unmodeled small source features, C0 propagated crease regularity, immersion, self-intersection, branch volume and actual render improvement remain unqualified."]};

    function cut(role:"A"|"B"|"C", start:Contact, end:Contact, direction:1|-1):Restriction {
      const authority:Authority = input.ports[role], original:M.Curve = authority.curve;
      const first:number = contact(authority,start), last:number = contact(authority,end), period:number = original.boundary.end-original.boundary.start;
      const width:number = modulo(direction*(last-first),period);
      if (!(width > 0 && width < period)) throw new Error("Shoulder half-port has collapsed or lost its qualified counterpart");
      const toOriginal:(p:number)=>number = (p:number):number => {
        if (!(Number.isFinite(p) && p >= 0 && p <= width)) throw new Error("Shoulder restriction left its original physical curve domain");
        if (p === 0) return first;
        if (p === width) return last;
        return original.boundary.start+modulo(first-original.boundary.start+direction*p,period);
      };
      const toLocal:(p:number)=>number = (p:number):number => {
        if (!(Number.isFinite(p) && p >= original.boundary.start && p < original.boundary.end)) throw new Error("Shoulder contact left its original physical phase interval");
        return modulo(direction*(p-first),period);
      };
      const curve:Charts.Port = {boundary:{id:input.id+"."+role+"."+start+"-"+end,unit:original.boundary.unit,start:0,end:width,
        evaluate:(p:number):M.V => original.boundary.evaluate(toOriginal(p)),derivative:(p:number):M.V => localJet(p).derivativeMm},
        secondDerivative:(p:number):M.V => localJet(p).secondDerivativeMm,
        featureParameters:authority.featureParameters.map(toLocal).filter((p:number):boolean => p > 0 && p < width).sort((a:number,b:number):number => a-b)};
      if (authority.frameAt) curve.frameAt = (p:number):M.Frame2 => authority.frameAt!(toOriginal(p));
      if (original.oneSidedJets) curve.oneSidedJets = (p:number):{left:M.CurveJet;right:M.CurveJet} => {
        const jets:{left:M.CurveJet;right:M.CurveJet} = original.oneSidedJets!(toOriginal(p));
        const convert:(j:M.CurveJet)=>M.CurveJet = (j:M.CurveJet):M.CurveJet => ({...j,derivativeMm:M.mul(j.derivativeMm,direction)});
        return direction === 1 ? {left:convert(jets.left),right:convert(jets.right)} : {left:convert(jets.right),right:convert(jets.left)};
      };
      return {port:role,original,startPhysicalParameter:first,endPhysicalParameter:last,direction,width,curve,toOriginal,toLocal};
      function localJet(p:number):M.CurveJet {
        const side:"left"|"right" = p === width ? direction === 1 ? "left" : "right" : direction === 1 ? "right" : "left";
        const jet:M.CurveJet = M.sample(original,toOriginal(p),side);
        return {...jet,derivativeMm:M.mul(jet.derivativeMm,direction)};
      }
    }
    function traceAddress(r:Restriction,node:Contact,reverse:boolean):number {
      const local:number = r.toLocal(contact(input.ports[r.port],node));
      const value:number = local/r.width;
      if (!(value > 0 && value < 1)) throw new Error("Forward guide is outside its source-qualified half-port, not an equal-phase correspondence");
      return reverse ? 1-value : value;
    }
  }
  function validateAuthority(authority:Authority, nodes:readonly Contact[]):void {
    const c:HumanSurface.Boundary = authority.curve.boundary, period:number = c.end-c.start;
    if (!(Number.isFinite(period) && period > 0) || (authority.canonicalDirection !== 1 && authority.canonicalDirection !== -1)) throw new Error("Actual shoulder authority has no physical closed-cycle gauge");
    M.close(c.evaluate(c.start),c.evaluate(c.end),"whole port closure");
    if (authority.featureParameters.some((p:number):boolean => !(Number.isFinite(p) && p >= c.start && p < c.end))) throw new Error("Whole port feature addresses left their actual physical gauge");
    let previous:number = -1;
    const first:number = contact(authority,nodes[0]!);
    for (const node of nodes) {
      const value:number = modulo(authority.canonicalDirection*(contact(authority,node)-first),period);
      if (!(value > previous)) throw new Error("Shoulder principal guide graph changed order or collapsed; its topology requires re-identification");
      previous = value;
    }
  }
  function contact(authority:Authority,node:Contact):number {
    const p:number|undefined = authority.contacts[node], curve:HumanSurface.Boundary = authority.curve.boundary;
    if (!(p !== undefined && Number.isFinite(p) && p >= curve.start && p < curve.end)) throw new Error("Common shoulder authority has no unique physical contact " + node);
    return p;
  }
  /** Preserve a nonnegative remainder without adding a large period first.
   * For example, a positive remainder 2^-54 at period 1 is lost by (r+1)%1.
   * A negative wrap that rounds to the period has no representable half-open
   * address; reject it explicitly instead of turning a real width into zero.
   */
  function modulo(value:number,period:number):number {
    const remainder:number = value%period;
    if (!(remainder < 0)) return remainder;
    const wrapped:number = remainder+period;
    if (!(wrapped > 0 && wrapped < period)) throw new Error("Shoulder cyclic phase wrap has no representable half-open physical address");
    return wrapped;
  }
}
