import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import { HumanPelvisNativePencilFamily } from "../pelvis/HumanPelvisNativePencilFamily";
import { HumanPelvisNativePencilRules } from "../pelvis/HumanPelvisNativePencilRules";
import { HumanPelvisLateralPreviewAdapter } from "./HumanPelvisLateralPreviewAdapter";
import type { HumanPelvisAssembly } from "./HumanPelvisAssembly";
import type { HumanTrunkAssembly } from "./HumanTrunkAssembly";
import type { HumanSkeleton } from "./HumanSkeleton";
import type { HumanCurve } from "./HumanCurve";
import type { HumanSurface } from "./HumanSurface";
import type { HumanPiecewiseStationPort } from "./HumanPiecewiseStationPort";
import type { HumanStationPort } from "./HumanStationPort";

/** Main-owned lateral diagnostic skin borrows the current Hip and native frame.
 * The two inferred quarter edges remain unjoined to the existing thigh shafts.
 */
export namespace HumanPelvisLateralAssembly {
  type V = HumanCurve.Vector;
  type Query = HumanPiecewiseStationPort.Query;

  /** Exact objects already constructed for the same actual lateral skin. */
  export interface Network {
    /** Complete current native-pencil function and analytic second jets. */
    family: HumanPelvisNativePencilFamily.Family;
    /** Same true-quarter plane, exact Hip inverse and full root evidence. */
    adapter: HumanPelvisLateralPreviewAdapter.Result;
    /** Same current whole Hip/thigh ports and original selected contacts. */
    network: HumanPelvisAssembly.Network;
  }
  /** Actual patches and their same-function generating traces. */
  export interface Result {
    /** Left and right lateral skins in world millimetres, with open quarter edges. */
    patches: HumanSurface.Patch[];

    /** Four exact restrictions per skin, shared with its declared mesh boundaries. */
    curves: HumanSurface.Boundary[];

    /** True support-quarter planes and complete Hip-contact selection provenance per side. */
    reports: Array<{/** Original generated side. */ side:"l"|"r"; /** Actual support-quarter plane without an endpoint coordinate correction. */ trueQuarter:HumanPelvisNativePencilFamily.Plane; /** Complete current Hip-contact and root-selection provenance. */ report:HumanPelvisLateralPreviewAdapter.Report}>;

    /** Read-only original functions and adapters for the official actual-context stage. */
    networks: ReadonlyMap<"l"|"r",Network>;

    /** Unqualified cross-boundary continuity, topology and morphology claims. */
    limitations: string[];
  }

  /** Consume existing boundary objects and the source-corresponding lateral chart.
   * No skeleton, Hip curve, source mesh, root isolator or coefficient law is rebuilt.
   */
  export function build(body: IAutoMovieHumanBodyParameters, skeleton: HumanSkeleton.Result,
    trunk: HumanTrunkAssembly.Result, pelvis: HumanPelvisAssembly.Result): Result {
    const hipMm: number|null = body.controls.hip.value, shape: number|null = body.controls.masculineFeminine.value;
    if (hipMm === null || shape === null) throw new Error("Lateral pelvic generation requires current Hip and shape");
    const section: typeof trunk.source.nativePrincipals[number]["section"] = trunk.source.nativePrincipals[0]!.section;
    const pieces: HumanPelvisLateralPreviewAdapter.Piece[] = section.primitive.pieces.map((_piece, index: number): HumanPelvisLateralPreviewAdapter.Piece => ({
      index,phaseStartRadians:index*2*Math.PI/8,phaseWidthRadians:2*Math.PI/8,
      physicalWidthMm:section.physicalWidthJets[index]![0],
      joinBefore:index===4&&section.posteriorEvent.featureClass==="C0"?"C0":"G1",
    }));
    const patches: HumanSurface.Patch[] = [], curves: HumanSurface.Boundary[] = [], reports: Result["reports"] = [];
    const limitations: string[] = [];
    const networks:Map<"l"|"r",Network>=new Map();
    const bind: (endpoint: HumanPelvisLateralPreviewAdapter.BoundEndpoint["endpoint"], contact: HumanStationPort.Contact) => HumanPelvisLateralPreviewAdapter.BoundEndpoint = (endpoint: HumanPelvisLateralPreviewAdapter.BoundEndpoint["endpoint"], contact: HumanStationPort.Contact): HumanPelvisLateralPreviewAdapter.BoundEndpoint => {
      const matches: Array<{query:Query;contact:HumanPiecewiseStationPort.Contact}> = trunk.hipQueries.flatMap((query: Query): Array<{query:Query;contact:HumanPiecewiseStationPort.Contact}> =>
        query.contacts.filter((candidate: HumanPiecewiseStationPort.Contact): boolean => candidate.stationContact===contact).map((candidate: HumanPiecewiseStationPort.Contact): {query:Query;contact:HumanPiecewiseStationPort.Contact} => ({query,contact:candidate})));
      if (matches.length!==1) throw new Error("An existing pelvic endpoint lacks one exact original query/contact identity");
      return {endpoint,...matches[0]!};
    };
    for (const side of ["l","r"] as const) {
      const network: HumanPelvisAssembly.Network|undefined = pelvis.networks.get(side);
      const thigh: V|undefined = skeleton.supports.get("thigh_"+side), calf: V|undefined = skeleton.supports.get("calf_"+side);
      if (network===undefined||thigh===undefined||calf===undefined) throw new Error("Lateral pelvic skin lacks its existing skeleton/network owner");
      const adapter: HumanPelvisLateralPreviewAdapter.Result = HumanPelvisLateralPreviewAdapter.build({hip:trunk.hip,pieces,
        across:network.planes.across,posterior:network.planes.forward,
        start:bind(network.across.endpoints[0],network.hipContacts.across),end:bind(network.posterior.endpoints[0],network.hipContacts.posterior),
        direction:side==="l"?-1:1,thighSupportMm:thigh,calfSupportMm:calf,
        query:HumanPelvisLateralPreviewAdapter.queryFromAssembly(trunk.hip,trunk.hipQueries),maxCachedV:129});
      const family: HumanPelvisNativePencilFamily.Family = HumanPelvisNativePencilFamily.build({
        planes:{hip:network.planes.hip,thigh:adapter.trueQuarter,across:network.planes.across,posterior:network.planes.forward},
        referenceMm:thigh,orientation:side==="l"?-1:1,hipMm,shape,
        hip:adapter.hip,hipAuthority:trunk.hip.boundary,law:HumanPelvisNativePencilRules,domainU:[0,1]});
      networks.set(side,{family,adapter,network});
      const id: string = "pelvis.lateral."+side;
      const trace: (name: string, value: HumanPelvisNativePencilFamily.Trace, unit: string) => HumanSurface.Boundary = (name: string, value: HumanPelvisNativePencilFamily.Trace, unit: string): HumanSurface.Boundary => ({
        id:id+"."+name,start:0,end:1,unit,
        evaluate:(t: number):V=>value.jet(t).P,derivative:(t:number):V=>value.jet(t).D,
      });
      const uUnit: string = "normalized-hip-true-quarter-plane-pencil", vUnit: string = "normalized-across-posterior-plane-pencil";
      const hip: HumanSurface.Boundary = trace("hip",family.section(0),vUnit), quarter: HumanSurface.Boundary = trace("inferred-quarter",family.quarter,vUnit);
      const across: HumanSurface.Boundary = trace("across",family.across,uUnit), posterior: HumanSurface.Boundary = trace("posterior",family.posterior,uUnit);
      curves.push(hip,quarter,across,posterior);
      patches.push({id,u:{start:0,end:1,unit:uUnit},v:{start:0,end:1,unit:vUnit},
        outwardSign:side==="l"?1:-1,
        jet:(u:number,v:number):ReturnType<HumanSurface.Patch["jet"]>=>{const value:HumanPelvisNativePencilFamily.Jet=family.jet(u,v);return {positionMm:value.P,derivativeU:value.Pu,derivativeV:value.Pv};},
        boundaries:{u0:{curve:hip,orientation:1},u1:{curve:quarter,orientation:1},v0:{curve:across,orientation:1},v1:{curve:posterior,orientation:1}}});
      reports.push({side,trueQuarter:adapter.trueQuarter,report:adapter.report});
      limitations.push(...family.limitations,...adapter.report.limitations);
    }
    limitations.push("Two source-conditioned free-u lateral pelvic patches are diagnostic candidates; matching shared Hip positions does not establish C1 attachment, embedding, whole-pelvis topology or unseen morphology",
      "The true-quarter trace is inferred at exactly one quarter of the current thigh-to-calf support interval. Original ceil-grid source cuts and the current first-thigh boundary remain separate addresses",
      "Original across/posterior seams retain their separate first-shaft construction. New lateral skin consumes its own same-function traces, borrowing only their exact existing Hip endpoint contacts",
      "Inner/anterior pelvic skin, additional male branches and quarter-to-shaft attachment remain unimplemented");
    return {patches,curves,reports,networks,limitations};
  }
}
