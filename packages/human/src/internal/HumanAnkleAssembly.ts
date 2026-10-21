import { HumanAnklePencilGuide } from "../extremities/HumanAnklePencilGuide";
import type { HumanFootBody } from "../extremities/HumanFootBody";
import type { HumanLimbCurves } from "../limbs/HumanLimbCurves";
import { HumanAreaMinimum } from "./HumanAreaMinimum";
import type { HumanCurve } from "./HumanCurve";
import { HumanFootWaist } from "./HumanFootWaist";
import type { HumanSkeleton } from "./HumanSkeleton";
import { HumanStationPort } from "./HumanStationPort";
import type { HumanSurface } from "./HumanSurface";

/** Actual feature ports and their shared guides precede ankle skin assembly. */
export namespace HumanAnkleAssembly {
  /** Regional methods borrow one actual main-owned feature and guide network. */
  export interface Network {
    /** Complete area-minimum shank authority and unchanged second jets. */
    before: HumanStationPort.Result;
    /** Literal physical station selected by the same area-minimum owner, mm. */
    readonly beforeStationMm: number;
    /** Complete actual foot breadth-waist authority. */
    after: HumanStationPort.Result;
    /** Literal physical station selected by the same breadth-waist owner, mm. */
    readonly afterStationMm: number;
    /** The original selected contacts, in dorsal then heel-plantar order. */
    readonly contacts: { /** Original incoming contacts in dorsal/heel order. */ readonly before: readonly [HumanStationPort.Contact, HumanStationPort.Contact]; /** Original outgoing contacts in dorsal/heel order. */ readonly after: readonly [HumanStationPort.Contact, HumanStationPort.Contact] };
    /** Actual shared foot rig support, also the acquired sigma-zero datum. */
    footSupportMm: HumanCurve.Vector;
    /** Unchanged physical port and guide planes. */
    planes: HumanAnklePencilGuide.Planes;
    /** Actual rational guide functions, endpoint objects and full second jets. */
    guides: ReadonlyMap<"dorsal"|"heel-plantar",HumanAnklePencilGuide.Result>;
  }
  /** Construction consumes the exact regional functions and generated guides. */
  export interface Result {
    /** Same objects retained by the common port and guide owners. */
    curves: HumanSurface.Boundary[];
    /** Read-only regional identification inputs; the main retains port ownership. */
    networks: ReadonlyMap<"l"|"r",Network>;
    /** Conditional guide and unresolved surface limitations. */
    limitations: string[];
  }

  /**
   * Locate physical features on the actual generated functions. The original
   * independent foot/calf surfaces remain visible until compatible whole-sheet
   * transverse fields are identified; these guides never hide their overlap.
   * Plane separation, two actual crossings and finite tau jets are admission
   * conditions. No bisector ring, parallel-plane crop or nominal knot is used.
   */
  export function build(skeleton:HumanSkeleton.Result,limbs:HumanLimbCurves.Result,feet:ReadonlyMap<"l"|"r",{body:HumanFootBody.Result}>):Result {
    const curves:HumanSurface.Boundary[]=[],limitations:string[]=[];
    const networks:Map<"l"|"r",Network>=new Map();
    for(const [side,foot] of feet) {
      const shaft:HumanLimbCurves.Region|undefined=limbs.regions.find((region:HumanLimbCurves.Region):boolean=>region.id==="shank-"+side);
      const ankle:HumanCurve.Vector|undefined=skeleton.supports.get("foot_"+side),knee:HumanCurve.Vector|undefined=skeleton.supports.get("calf_"+side);
      if(shaft===undefined||shaft.areaSpans===undefined||ankle===undefined||knee===undefined) throw new Error("An ankle feature has no actual generated shank authority");
      const incoming:HumanCurve.Vector=unit(subtract(ankle,knee)),length:number=Math.hypot(...subtract(ankle,knee));
      const feature:HumanAreaMinimum.Result=HumanAreaMinimum.build(shaft.areaSpans,.75*length,length);
      const shankSection:HumanCurve.Section=shaft.sectionAt(feature.stationMm);
      const before:HumanStationPort.Result=HumanStationPort.build("ankle."+side+".shank-area-minimum",shaft.family,shankSection);
      const waist:HumanFootWaist.Result=HumanFootWaist.build(foot.body.family);
      const after:HumanStationPort.Result=HumanStationPort.fromPolynomial("ankle."+side+".foot-breadth-waist",foot.body.family,waist.waistMm);
      const outgoing:HumanCurve.Vector=unit(cross(foot.body.family.sections[0]!.axisU,foot.body.family.sections[0]!.axisV));
      const c0:number=dot(incoming,before.boundary.evaluate(0)),c1:number=dot(outgoing,after.boundary.evaluate(0));
      const proximal:ReturnType<typeof HumanStationPort.projectionFromSection>=HumanStationPort.projectionFromSection(shaft.family,shankSection,outgoing);
      const distal:ReturnType<typeof HumanStationPort.projectionExtrema>=HumanStationPort.projectionExtrema(foot.body.family,waist.waistMm,incoming);
      if(!(proximal.maximumValueMm<c1&&distal.minimumValueMm>c0)) throw new Error("The actual generated ankle feature ports are not strictly separated");
      const forward:HumanCurve.Vector=unit(subtract([1,0,0],scale(incoming,incoming[0]))),planeNormal:HumanCurve.Vector=unit(cross(forward,incoming));
      const starts:HumanStationPort.Contact[]=before.contacts(planeNormal,dot(planeNormal,ankle)),ends:HumanStationPort.Contact[]=after.contacts(planeNormal,dot(planeNormal,ankle));
      if(starts.length!==2||ends.length!==2) throw new Error("The ankle guide plane lacks the two observed branch crossings");
      starts.sort((a:HumanStationPort.Contact,b:HumanStationPort.Contact):number=>dot(forward,b.jet.positionMm)-dot(forward,a.jet.positionMm));
      ends.sort((a:HumanStationPort.Contact,b:HumanStationPort.Contact):number=>dot(incoming,a.jet.positionMm)-dot(incoming,b.jet.positionMm));
      curves.push(before.boundary,after.boundary);
      const planes:HumanAnklePencilGuide.Planes={incomingNormal:incoming,incomingCoordinateMm:c0,outgoingNormal:outgoing,outgoingCoordinateMm:c1,guidePlaneNormal:planeNormal,guidePlaneCoordinateMm:dot(planeNormal,ankle)};
      const guides:Map<"dorsal"|"heel-plantar",HumanAnklePencilGuide.Result>=new Map();
      for(const [index,branch] of (["dorsal","heel-plantar"] as const).entries()) {
        const first:HumanStationPort.Contact=starts[index]!,last:HumanStationPort.Contact=ends[index]!;
        const b:number=c1-dot(outgoing,first.jet.positionMm),a:number=dot(incoming,last.jet.positionMm)-c0;
        const guide:HumanAnklePencilGuide.Result=HumanAnklePencilGuide.build("ankle."+side+"."+branch,branch,planes,{
          start:{pointMm:first.jet.positionMm,derivativeTauMm:scale(first.planeTangent,b/dot(incoming,first.planeTangent))},
          end:{pointMm:last.jet.positionMm,derivativeTauMm:scale(last.planeTangent,a/dot(outgoing,last.planeTangent))},
        });
        curves.push(guide.boundary);limitations.push(...guide.limitations);
        guides.set(branch,guide);
      }
      networks.set(side,{before,after,beforeStationMm:feature.stationMm,afterStationMm:waist.waistMm,contacts:{before:[starts[0]!,starts[1]!],after:[ends[0]!,ends[1]!] },footSupportMm:ankle,planes,guides});
      limitations.push(...feature.limitations,...waist.limitations);
    }
    return {curves,networks,limitations:[...limitations,
      "Actual area-minimum and breadth-waist port curves plus dorsal/heel guides are construction candidates; compatible lateral cross fields and ankle skin remain unimplemented",
      "The independent foot and calf interiors remain present. Their earlier intersections, open heels and toes are neither removed nor accepted by this guide construction",
      "Branch labels use the source-observed anterior proximal and superior distal dorsal contacts; no nearest-point pairing or copied source endpoint is used",
    ]};
  }
  function dot(a:HumanCurve.Vector,b:HumanCurve.Vector):number{return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function scale(a:HumanCurve.Vector,s:number):HumanCurve.Vector{return[a[0]*s,a[1]*s,a[2]*s];}
  function subtract(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
  function cross(a:HumanCurve.Vector,b:HumanCurve.Vector):HumanCurve.Vector{return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function unit(a:HumanCurve.Vector):HumanCurve.Vector{const length:number=Math.hypot(...a);if(!(length>0&&Number.isFinite(length)))throw new Error("An ankle feature frame is singular");return scale(a,1/length);}
}
