import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { HumanSurface } from "../internal/HumanSurface";
import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import { HumanShoulderArcGraph } from "./HumanShoulderArcGraph";
import { HumanShoulderGuides } from "./HumanShoulderGuides";
import { HumanShoulderSkin } from "./HumanShoulderSkin";
import { HumanShoulderSkinMath as M } from "./HumanShoulderSkinMath";

/** Pending adapter from existing common v6 q laws and current main-owned
 * generated supports to an isolated six-chart skin. No source file, person
 * coefficient row, mesh, normal, or reference curve is a runtime input.
 */
export namespace HumanShoulderSkinAdapter {
  /** Three shared fitted cut-role proxy coefficients; not anatomical planes. */
  export interface StationLaw {
    /** Prevent a source sampling-role fit from being labeled anatomical identification. */
    scope:"source-conditioned-cut-role-proxy";

    /** Constant coefficient of center/bicep in the observed common support gauge. */
    centerConstant:number;

    /** Existing unitless shape coefficient of center/bicep; correlated-source fit only. */
    centerShape:number;

    /** Positive common acquisition-role width in mm, separately fitted from actual slab bounds. */
    widthMm:number;
  }
  /** Current main-owned support and physical q inputs; no new skeleton is built. */
  export interface Input {
    /** Stable side-specific region identity for skin and construction. */
    id:string;

    /** Current authored public body controls; physical lengths are mm. */
    body:IAutoMovieHumanBodyParameters;

    /** Existing generated common support authority, never a native support table. */
    skeleton:HumanSkeleton.Result;

    /** Geometric side label used only for the established mirrored across axis. */
    side:"l"|"r";

    /** Main's actual retained shaft boundary; it is never relabeled as native-role C. */
    retainedShaftBoundary:HumanSurface.Boundary;

    /** Preferred common station prediction, fitted offline over all eight source shoulders. */
    stationLaw?:StationLaw;

    /** Explicit alternative owned by main; cannot be supplied together with a fitted law. */
    principalStations?:HumanShoulderArcGraph.Stations;
  }
  /** Existing common q graph, generated frame and actual isolated skin result. */
  export interface Result {
    /** The existing v6 pure producer's complete ABC and five guide functions. */
    graph:HumanShoulderArcGraph.Graph;

    /** Derived only from current main-owned shoulder/elbow supports. */
    frame:HumanShoulderGuides.Frame;

    /** Actual support-relative physical plane coordinates used by this candidate. */
    stations:HumanShoulderArcGraph.Stations;

    /** Pending six-chart skin and shared construction; no joined-neighbor claim. */
    skin:HumanShoulderSkin.Result;

    /** Declares whether main supplied planes or a source-conditioned common proxy. */
    stationAuthority:"main-explicit-physical-planes"|"common-source-conditioned-proxy";

    /** Independent q response, smooth-fold scanning and C-to-shaft integration remain separate. */
    limitations:readonly string[];
  }
  /** Consume current q/supports and call only HumanShoulderArcGraph.build.
   * Its pooled coefficients are HumanShoulderArcRules, with critical placement
   * from HumanShoulderGuides.features. Full P/T/DD, physical h-derived generated
   * widths, contacts and one-sided jets pass directly to the skin operator.
   * Existing attach is not called; it has a different parallel-plane contract.
   */
  export function build(input:Input):Result {
    if ((input.stationLaw === undefined) === (input.principalStations === undefined)) throw new Error("Main must supply exactly one common station law or explicit physical station pair");
    const parameters:HumanShoulderArcGraph.Parameters = {bicepMm:length("bicep"),chestMm:length("chest"),acrossShoulderMm:length("acrossShoulder"),shape:shape()};
    const origin:M.V = support("upperarm_"+input.side), elbow:M.V = support("lowerarm_"+input.side);
    const axial:M.V = M.unit(M.sub(elbow,origin));
    const forward:M.V = M.unit(M.sub([1,0,0],M.mul(axial,axial[0])));
    // The v6 source frame was [section.v, section.n, sideSign*section.u],
    // with section.u = projectedForward cross nativeArmAxis. This reproduces
    // that common bilateral convention using generated supports only.
    const across:M.V = M.mul(M.unit(M.cross(forward,axial)),input.side === "l" ? 1 : -1);
    const frame:HumanShoulderGuides.Frame = {originMm:origin,forward,across,axial};
    const stations:HumanShoulderArcGraph.Stations = input.stationLaw ? predictStations(parameters,input.stationLaw) : {...input.principalStations!};
    const graph:HumanShoulderArcGraph.Graph = HumanShoulderArcGraph.build(parameters,frame,stations);
    const planeNormal:M.V = M.cross(frame.forward,frame.across);
    const ports:Record<"A"|"B"|"C",HumanShoulderSkin.Authority> = {} as Record<"A"|"B"|"C",HumanShoulderSkin.Authority>;
    for (const role of ["A","B","C"] as const) {
      const curve:HumanShoulderArcGraph.Curve = graph.ports[role];
      ports[role] = {curve,contacts:{...graph.contacts},canonicalDirection:1,
        outwardAt:(p:number):M.V => M.unit(M.cross(curve.boundary.derivative(p),planeNormal)),featureParameters:corners(curve)};
    }
    const skin:HumanShoulderSkin.Result = HumanShoulderSkin.build({id:input.id,boundaryMode:"isolated-source-conditioned",ports,guides:graph.guides,
      // The common B0 law runs B.A -> B.C on the AF side. The skin's B.C ->
      // B.A front restriction therefore has direction -1. Source role evidence:
      // shoulder-common-fit-v1.json, all eight B0 forward-side records.
      bodyFrontDirection:-1,shaftContinuation:{nativeC:graph.ports.C.boundary,retainedShaft:input.retainedShaftBoundary,status:"unresolved"}});
    return {graph,frame,stations,skin,stationAuthority:input.stationLaw ? "common-source-conditioned-proxy" : "main-explicit-physical-planes",limitations:[...graph.limitations,...skin.limitations,
      "This adapter renders common source-identified q functions, never raw source-conditioned specimen curves.",
      "Principal stations are a main-owned plane choice or a source-conditioned cut-role proxy; acquisition grid is not an anatomical layer law.",
      "Current generated support placement/course-to-chord errors remain outside this adapter; it does not rebuild or correct the skeleton.",
      "All non-C1 generating knots are retained without a fixed count. Smooth polar folds/births require the separate whole-polynomial HumanShoulderArcFeatures inspector.",
      "Native-role C and retained shaft remain different boundaries; this isolated skin does not close their unidentified continuation."]};
    function length(key:"bicep"|"chest"|"acrossShoulder"):number {
      const value:number|null = input.body.controls[key].value;
      if (!(value !== null && Number.isFinite(value) && value > 0)) throw new Error("Shoulder common q law requires a finite positive mm control: "+key);
      return value;
    }
    function shape():number {
      const value:number|null = input.body.controls.masculineFeminine.value;
      if (value === null || !Number.isFinite(value)) throw new Error("Shoulder common q law requires the existing finite unitless shape control");
      return value;
    }
    function support(key:string):M.V {
      const value:M.V|undefined = input.skeleton.supports.get(key);
      if (!value || !M.finite(value)) throw new Error("Current main skeleton lacks finite generated support "+key);
      return value;
    }
  }
  /** Predict physical sampling-role planes from three common offline coefficients.
   * Their shared center scales with actual public bicep mm and existing shape.
   * Width is the separately observed acquisition-role span, not new anatomy.
   */
  export function predictStations(parameters:HumanShoulderArcGraph.Parameters,law:StationLaw):HumanShoulderArcGraph.Stations {
    if (law.scope !== "source-conditioned-cut-role-proxy" || ![law.centerConstant,law.centerShape,law.widthMm].every(Number.isFinite) || !(law.widthMm > 0)) throw new Error("Shoulder station proxy needs finite common coefficients and positive observed-role width");
    const center:number = parameters.bicepMm*(law.centerConstant+law.centerShape*parameters.shape);
    const beforeAxialMm:number = center-law.widthMm/2, afterAxialMm:number = center+law.widthMm/2;
    if (!(Number.isFinite(beforeAxialMm) && Number.isFinite(afterAxialMm) && afterAxialMm > beforeAxialMm)) throw new Error("Shoulder common station prediction collapses its physical interval");
    return {beforeAxialMm,afterAxialMm};
  }
  /** Inspect exact one-sided generating derivatives at every actual piece join.
   * Binary64-scale continuity keeps genuine C0 knots and permits feature death;
   * neither the two learned corner names nor a fixed event count is imposed.
   */
  function corners(curve:HumanShoulderArcGraph.Curve):number[] {
    if (!curve.pieces) throw new Error("Common v6 shoulder producer lost its complete physical pieces");
    const result:number[] = [];
    let phase:number = curve.boundary.start;
    for (const piece of curve.pieces) {
      const jets:M.OneSidedJets = curve.oneSidedJets(phase);
      const jump:number = M.norm(M.sub(jets.left.derivativeMm,jets.right.derivativeMm));
      if (jump > 512*Number.EPSILON*Math.max(1,M.norm(jets.left.derivativeMm),M.norm(jets.right.derivativeMm))) result.push(phase);
      phase += piece.widthMm;
    }
    return result;
  }
}
