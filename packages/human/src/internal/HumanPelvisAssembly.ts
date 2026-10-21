import { HumanPelvisSeams } from "../pelvis/HumanPelvisSeams";
import { HumanPelvisMeridians } from "../pelvis/HumanPelvisMeridians";
import type { HumanLimbCurves } from "../limbs/HumanLimbCurves";
import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";
import type { HumanSkeleton } from "./HumanSkeleton";
import { HumanStationPort } from "./HumanStationPort";
import type { HumanSurface } from "./HumanSurface";
import type { HumanPlanePencilChart } from "./HumanPlanePencilChart";

/** Main-owned pelvic ports and guide networks precede their branched skin. */
export namespace HumanPelvisAssembly {
  /** Original contacts selected once by the common pelvic assembly. */
  export interface PortContacts {
    /** Existing projected-forward plane crossing, in original port radians. */
    across: HumanStationPort.Contact;
    /** Existing posterior forward-plane crossing and its full owner jet. */
    posterior: HumanStationPort.Contact;
    /** Existing anterior forward-plane crossing and its full owner jet. */
    anterior: HumanStationPort.Contact;
  }
  /** A region borrows these actual main-selected ports, curves and signed chart. */
  export interface Network {
    /** The same first-trunk station authority used by both sides. */
    hip: HumanStationPort.Result;
    /** The current first station of this own thigh. */
    thigh: HumanStationPort.Result;
    /** Source-defined signed half-spaces, transported by the common skeleton. */
    planes: HumanPlanePencilChart.Planes;
    /** Existing own-plane outer meridian and its actual endpoint addresses. */
    across: HumanPelvisSeams.Result;
    /** Existing own-plane posterior meridian and the same actual ports. */
    posterior: HumanPelvisSeams.Result;
    /** Exact already-selected Hip contacts; query identity survives endpoint adaptation. */
    hipContacts: PortContacts;
    /** Already selected anterior meridian, unchanged whole function. */
    anterior: HumanPelvisSeams.Result;
    /** Exact own-thigh contacts selected by the original assembly loops. */
    thighContacts: PortContacts;
  }
  /** Current generated port functions, conditional guides and unresolved skin. */
  export interface Result {
    /** Three actual regional station authorities and both observed guide planes. */
    curves: HumanSurface.Boundary[];
    /** Complete curve results retain endpoint objects and physical phase widths. */
    seams: HumanPelvisSeams.Result[];
    /** Borrowed inputs to regional fulljet identification; no second port owner. */
    networks: ReadonlyMap<"l"|"r",Network>;
    /** Source correspondence and unassembled topology remain separate. */
    limitations: string[];
  }

  /**
   * Both acquired support-relative guide planes intersect the complete current
   * hip and first-thigh functions. Leg identities belong to their own regional
   * ports. A global hemisphere never selects a whole leg component. Tangents
   * follow hip-to-leg outside and ascending/descending inner endpoints inside.
   * No original endpoint, source mesh or source normal is consumed.
   */
  export function build(body: IAutoMovieHumanBodyParameters, skeleton: HumanSkeleton.Result, trunk: HumanCurveFamily.Family, limbs: HumanLimbCurves.Result, hip: HumanStationPort.Result): Result {
    const hipMm: number | null = body.controls.hip.value, shape: number | null = body.controls.masculineFeminine.value;
    if (!(hipMm !== null && hipMm > 0 && shape !== null && Number.isFinite(shape))) throw new Error("Pelvic assembly requires current physical hip and shape controls");
    const first: HumanCurve.Section | undefined = trunk.sections[0];
    if (first === undefined) throw new Error("The common pelvis has no actual trunk boundary");
    if (hip.boundary.id !== "pelvis.port.hip") throw new Error("Pelvic assembly requires the sole whole-trunk Hip authority");
    const legs: Map<"l"|"r",HumanStationPort.Result> = new Map();
    for (const side of ["l","r"] as const) {
      const shaft: HumanLimbCurves.Region | undefined = limbs.regions.find((region: HumanLimbCurves.Region): boolean => region.id === "thigh-"+side);
      if (shaft === undefined) throw new Error("The common pelvis has no actual thigh domain");
      legs.set(side,HumanStationPort.build("pelvis.port.thigh-"+side,shaft.family,shaft.sectionAt(shaft.family.intervals[0]!.startMm)));
    }
    const curves: HumanSurface.Boundary[] = [hip.boundary,...[...legs.values()].map((port: HumanStationPort.Result): HumanSurface.Boundary => port.boundary)];
    const seams: HumanPelvisSeams.Result[] = [];
    const outer: Map<"l"|"r",HumanPelvisSeams.Result> = new Map();
    const posterior: Map<"l"|"r",HumanPelvisSeams.Result> = new Map();
    const acrossHip: Map<"l"|"r",HumanStationPort.Contact> = new Map(), posteriorHip: Map<"l"|"r",HumanStationPort.Contact> = new Map();
    const anterior:Map<"l"|"r",HumanPelvisSeams.Result>=new Map(),anteriorHip:Map<"l"|"r",HumanStationPort.Contact>=new Map();
    const acrossThigh:Map<"l"|"r",HumanStationPort.Contact>=new Map(),posteriorThigh:Map<"l"|"r",HumanStationPort.Contact>=new Map(),anteriorThigh:Map<"l"|"r",HumanStationPort.Contact>=new Map();
    for (const planeSide of ["l","r"] as const) {
      const thigh: HumanCurve.Vector | undefined = skeleton.supports.get("thigh_"+planeSide), calf: HumanCurve.Vector | undefined = skeleton.supports.get("calf_"+planeSide);
      if (thigh === undefined || calf === undefined) throw new Error("A pelvic guide has no common support plane");
      const plane: HumanPelvisSeams.GuidePlane = HumanPelvisSeams.guidePlane(thigh,calf);
      const h: HumanStationPort.Contact[] = pair(hip), l: HumanStationPort.Contact[] = pair(legs.get("l")!), r: HumanStationPort.Contact[] = pair(legs.get("r")!);
      const specifications: Array<[HumanPelvisSeams.Kind,HumanStationPort.Result,HumanStationPort.Contact,HumanStationPort.Result,HumanStationPort.Contact,1|-1]> = [
        ["outer-left",hip,h[0]!,legs.get("l")!,l[0]!,-1],
        ["inner",legs.get("l")!,l[1]!,legs.get("r")!,r[0]!,1],
        ["outer-right",hip,h[1]!,legs.get("r")!,r[1]!,-1],
      ];
      for (const [kind,a,pa,b,pb,startDirection] of specifications) {
        const seam: HumanPelvisSeams.Result = HumanPelvisSeams.build("pelvis.guide-"+planeSide+"."+kind,kind,endpoint(a,pa,startDirection),endpoint(b,pb,-1),plane,hipMm,shape);
        seams.push(seam); curves.push(seam.curve);
        if (planeSide === "l" && kind === "outer-left") {outer.set("l",seam);acrossHip.set("l",pa);acrossThigh.set("l",pb);}
        if (planeSide === "r" && kind === "outer-right") {outer.set("r",seam);acrossHip.set("r",pa);acrossThigh.set("r",pb);}
      }
      function pair(port: HumanStationPort.Result): HumanStationPort.Contact[] {
        const contacts: HumanStationPort.Contact[] = port.contacts(plane.normal,plane.coordinateMm);
        if (contacts.length !== 2) throw new Error("The actual pelvic port lacks two simple guide-plane crossings: "+port.boundary.id);
        contacts.sort((a: HumanStationPort.Contact,b: HumanStationPort.Contact): number => a.jet.positionMm[2]-b.jet.positionMm[2]);
        if (!(contacts[1]!.jet.positionMm[2] > contacts[0]!.jet.positionMm[2])) throw new Error("Pelvic within-port contact roles are unresolved");
        return contacts;
      }
    }
    for(const side of ["l","r"] as const) {
      const thigh:HumanCurve.Vector=skeleton.supports.get("thigh_"+side)!,calf:HumanCurve.Vector=skeleton.supports.get("calf_"+side)!;
      const plane:HumanPelvisMeridians.GuidePlane=HumanPelvisMeridians.guidePlane(thigh,calf);
      const forward:HumanCurve.Vector=HumanPelvisSeams.guidePlane(thigh,calf).normal;
      const leg:HumanStationPort.Result=legs.get(side)!;
      const h:HumanStationPort.Contact[]=hip.contacts(plane.normal,plane.coordinateMm),l:HumanStationPort.Contact[]=leg.contacts(plane.normal,plane.coordinateMm);
      if(h.length!==2||l.length!==2) throw new Error("The actual pelvic meridian ports lack two source-corresponding simple crossings");
      for(const contacts of [h,l]) contacts.sort((a:HumanStationPort.Contact,b:HumanStationPort.Contact):number=>dot(forward,b.jet.positionMm)-dot(forward,a.jet.positionMm));
      for(const [index,kind] of (["anterior","posterior"] as const).entries()) {
        const seam:HumanPelvisMeridians.Result=HumanPelvisMeridians.build("pelvis.meridian-"+side+"."+kind,kind,endpoint(hip,h[index]!,-1),endpoint(leg,l[index]!,-1),plane,hipMm,shape);
        seams.push(seam);curves.push(seam.curve);
        if (kind === "posterior") {posterior.set(side,seam);posteriorHip.set(side,h[index]!);posteriorThigh.set(side,l[index]!);}
        if (kind === "anterior") {anterior.set(side,seam);anteriorHip.set(side,h[index]!);anteriorThigh.set(side,l[index]!);}
      }
    }
    const networks: Map<"l"|"r",Network> = new Map();
    for (const side of ["l","r"] as const) {
      const thigh: HumanCurve.Vector = skeleton.supports.get("thigh_"+side)!, calf: HumanCurve.Vector = skeleton.supports.get("calf_"+side)!;
      const delta: HumanCurve.Vector = calf.map((value:number,axis:number):number=>value-thigh[axis]!) as HumanCurve.Vector;
      const length: number = Math.hypot(...delta), normal: HumanCurve.Vector = delta.map((value:number):number=>value/length) as HumanCurve.Vector;
      const across: HumanPelvisSeams.GuidePlane = HumanPelvisSeams.guidePlane(thigh,calf);
      const forward: HumanPelvisMeridians.GuidePlane = HumanPelvisMeridians.guidePlane(thigh,calf);
      const sign: number = side === "l" ? 1 : -1;
      networks.set(side,{hip,thigh:legs.get(side)!,across:outer.get(side)!,posterior:posterior.get(side)!,hipContacts:{across:acrossHip.get(side)!,posterior:posteriorHip.get(side)!,anterior:anteriorHip.get(side)!},anterior:anterior.get(side)!,thighContacts:{across:acrossThigh.get(side)!,posterior:posteriorThigh.get(side)!,anterior:anteriorThigh.get(side)!},planes:{
        hip:{normal:[0,1,0],coordinateMm:first.originMm[1]},
        thigh:{normal,coordinateMm:dot(normal,legs.get(side)!.boundary.evaluate(0))},
        across:{normal:across.normal,coordinateMm:across.coordinateMm},
        forward:{normal:forward.normal.map((value:number):number=>sign*value) as HumanCurve.Vector,coordinateMm:sign*forward.coordinateMm},
      }});
    }
    return {curves,seams,networks,limitations:[...seams.flatMap((seam: HumanPelvisSeams.Result): readonly string[] => seam.limitations),
      "Both acquired guide planes consume the same three actual generated ports; their across and forward meridians are construction candidates, not an assembled pelvic surface",
      "Lateral order distinguishes two contacts within each own port; it never assigns source components by global Z sign or forces the two inner endpoints into world-Z order",
      "Generated inner endpoint tangents ascend then descend in Y. Recovered material phase, transverse fields, diagonals and compatible corner twists remain unidentified",
      "Pelvic skin and semantic exclusion of genital domains remain unimplemented; this guide network fills no missing surface",
    ]};
  }

  function dot(a:HumanCurve.Vector,b:HumanCurve.Vector):number{return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}

  /** Choose the source-corresponding ascending or descending geometric tangent. */
  function endpoint(port: HumanStationPort.Result,contact: HumanStationPort.Contact,direction:1|-1): HumanPelvisSeams.Endpoint {
    if (contact.planeTangent[1] === 0) throw new Error("A pelvic guide endpoint has no directed vertical tangent");
    const sign: number = contact.planeTangent[1]*direction > 0 ? 1 : -1;
    return {curve:port.boundary,parameter:contact.phaseRadians,unitTangent:contact.planeTangent.map((value:number):number=>sign*value) as HumanCurve.Vector};
  }
}
