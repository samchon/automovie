import type { AutoMovieVector3Tuple, IAutoMoviePolylineFit, IAutoMovieCurve64, IAutoMovieRecoveryHermiteCurve, IAutoMovieRecoverySlabsInput, IAutoMovieRecoverySourceLineage } from "../../index";




/** Acquisition owner for ordered source cuts and equality-gated saved-cubic correspondence.
 * Source bytes and stage receipts remain the existing program's responsibility.
 * Both operations return acquisition metadata and never replace generated or saved skin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members document original versus local addresses, physical units, caller byte verification, unavailable maps and the limits of replay qualification.
 * @evidence contracts/development/design.md#principled-representation Original source/selection identities and saved-plane addresses distinguish raw cut incidence from equality-gated cubic replay correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface observeCuts and bindSavedFits consume IAutoMovieRecoveryOrderedLineage records; the host remains responsible for verifying actual bytes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A new accepted replay trace proves saved numeric cubic equality only, never historical trace identity, material phase or a replacement fitted surface.
 */

export namespace IAutoMovieRecoveryOrderedLineage {
/** Registered immutable mesh and complete saved-plane population for one source selection.
   * Source identities are compared opaque strings; the adapter verifies actual bytes.
   * @evidence contracts/development/design.md#principled-representation Extending the existing slab input without slabPairs retains its mesh, physical frame, alias and complete saved-publication premises; originalTriangleIds adds the explicit local-to-original face injection checked by observeCuts.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One input serves both metadata operations; only bindSavedFits separately receives saved coefficients and the original fitting policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration contains no anatomical selector, fitted coordinates, native control override or source-specific count; identities do not claim to hash borrowed arrays.
   * @evidence contracts/development/common.md#meaningful-documentation The added member identifies its ordinal spaces and direction; inherited members retain the slab contract's units, immutability and caller hash obligations.
   */
export interface Input extends Omit<
    IAutoMovieRecoverySlabsInput,
    "slabPairs"
  > {
 
   /** Injective local input face ordinal to complete original native face ordinal; no vertex remapping is implied. */
    originalTriangleIds: readonly number[];
  }

/** One whole raw contour, including contacts, with original source incidence and physical polyline phase.
   * Arrays are copied acquisition evidence and never become a generated surface fallback.
   * @evidence contracts/development/design.md#principled-representation Ordered CutPoint observations and directed cutter segments retain canonical connectivity, original emitting-edge witnesses, broad/exact face distinctions and actual chord lengths; these do not identify material phase or anatomy.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A single record owns one raw contour's points, source publication and segment order; no independently reconstructed curve or normal field is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Open paths, failed publications, contacts and all alias witnesses remain present; coordinate proximity never joins different contour words.
   * @evidence contracts/development/common.md#meaningful-documentation Members state original versus canonical addresses, closed-edge phase, physical millimetres and why an absent sourceEdges member is unsupported evidence.
   */
export interface Contour {
 
   /** Raw ordinal before fitting or rejection, in this saved physical plane. */
    contourIndex: number;

 
   /** Closure follows the exact cutter's graph walk, never an invented cap. */
    closed: boolean;

 
   /** Original closed/open/failed/degenerate publication, preserved independently of new traces. */
    publication: IAutoMovieRecoverySourceLineage["publication"];

 
   /** Broad original face support, including incident neighbors; not exact emitting membership. */
    sourceTriangleIds: number[];

 
   /** Original faces that actually emitted this contour or isolated contact. */
    exactSourceTriangleIds: number[];

 
   /** Ordered registered observations; p and each witness point are mm, t is dimensionless. */
    points: Array<{
 
     /** Physical point selected by the existing canonical cutter, not a representative vertex interpolation. */
      p: Readonly<AutoMovieVector3Tuple>;

 
     /** First canonical connectivity label of the cutter point's supporting edge or vertex. */
      a: number;

 
     /** Second canonical connectivity label; a==b denotes an on-plane vertex. */
      b: number;

 
     /** Cutter fraction oriented with canonical a/b; it is not a fitted curve phase. */
      t: number;

 
     /** Opt-in original edge aliases; omission means the trace cannot assert their original addresses. */
      sourceEdges?: Array<{
 
       /** First original input vertex of this emitted-edge witness. */
        a: number;

 
       /** Second original input vertex, distinct from any canonical representative. */
        b: number;

 
       /** Physical plane-crossing fraction in this original edge direction. */
        t: number;

 
       /** Original edge's registered physical witness in mm, retained even when aliases share connectivity. */
        pointMm: Readonly<AutoMovieVector3Tuple>;
      }>;
    }>;

 
   /** Chord phase at each raw point, starting at zero; closed closure has a separate final segment. */
    cumulativePolylineMm: number[];

 
   /** Full physical chord perimeter/length including a closed final edge; zero for an isolated contact. */
    totalPolylineMm: number;

 
   /** Directed emitted graph segments in point order, including all source faces for each contribution. */
    segments: Array<{
 
     /** Cutter graph-edge identity, interpreted only within this input cut. */
      id: string;

 
     /** Index into points at the directed segment start. */
      from: number;

 
     /** Index into points at the end; zero on a genuine closing edge. */
      to: number;

 
     /** Start of this original polyline segment in physical chord mm. */
      startMm: number;

 
     /** End in physical chord mm, retaining actual final closure width. */
      endMm: number;

 
     /** Complete native face ordinals emitting this directed contribution, not endpoint-star supersets. */
      originalTriangleIds: number[];
    }>;
  }

/** Complete requested source-plane trace, independent of coefficient fitting.
   * Empty planes and unsupported contours remain distinguishable from omitted planes.
   * @evidence contracts/development/design.md#principled-representation The record carries the actual normalized physical frame and complete admitted saved-plane population with original source/selection/artifact identities; identity strings still require caller byte verification.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A plane groups its contours and exact saved-artifact dependency once; curve correspondence remains a separate Binding result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No largest component, missing-plane substitution, native model copy or inferred transverse jet is represented as a completed fit.
   * @evidence contracts/development/common.md#meaningful-documentation Members define zero-origin frame units, opaque identity scope and the same-order all-plane/all-contour observation requirement.
   */
export interface Cuts {
 
   /** Identity of the new metadata observation, without replacing the old curve collection. */
    name: string;

 
   /** Caller-verified original native-byte identity; no hashing occurs in this record. */
    sourceIdentity: string;

 
   /** Caller-verified registration, selection and original-ordinal identity. */
    sourceSelectionIdentity: string;

 
   /** Actual zero-origin projection frame in registered mm, with directed unit axes. */
    frame: IAutoMovieRecoverySlabsInput["savedSections"][number]["frame"];

 
   /** Same requested saved-plane order, including empty contour populations. */
    sections: Array<{
 
     /** Signed physical mm along frame.n. */
      coordinateMm: number;

 
     /** Caller-verified artifact containing this plane's original publications. */
      observationIdentity: string;

 
     /** Every raw contour, including failed or degenerate publications. */
      contours: IAutoMovieRecoveryOrderedLineage.Contour[];
    }>;
  }

/** Explicit saved cubic and its caller-bound original numerical fit policy.
   * This operation supports the stored cubic basis only, not a reduction of another degree or rational curve.
   * @evidence contracts/development/design.md#principled-representation Physical plane/raw contour/artifact addresses select one immutable published cubic; its recorded tolerance, budget, corner policy and orientation define the existing fitter replay problem.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Coefficients and fit policy are admitted only by bindSavedFits; coefficient-free observeCuts consumes neither.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target has no person key, relaxed replacement policy, nearest-root hint or source mesh/normal fallback; its identity cannot certify historical accepted parameters.
   * @evidence contracts/development/common.md#meaningful-documentation Members state physical phase, raw-publication addressing, actual policy units and the caller's responsibility for byte-bound policy provenance.
   */
export interface Target {
 
   /** Original physical source plane in registered mm. */
    coordinateMm: number;

 
   /** Raw contour ordinal, not a fitted loop index. */
    contourIndex: number;

 
   /** Verified saved artifact dependency containing the target publication. */
    observationIdentity: string;

 
   /** Unchanged saved physical-h cubic in its original Bernstein or Hermite basis. */
    curve: IAutoMovieCurve64.Cubic | IAutoMovieRecoveryHermiteCurve;

 
   /** Caller-bound actual historical fitting settings; no inference from output size. */
    policy: {
 
     /** Requested source-polyline correspondence tolerance in mm. */
      toleranceMm: number;

 
     /** Original fitter span budget, a positive integer. */
      maxSpans: number;

 
     /** Declared C0-corner threshold in degrees. */
      cornerDegrees: number;

 
     /** Actual material-side orientation convention, not inferred anatomical direction. */
      sourceOrientationSign: 1 | -1;
    };
  }

/** Equality-gated new replay correspondence or an explicit unavailable result.
   * Success certifies saved JSON numeric geometry equality, not historical trace identity or surface continuity.
   * @evidence contracts/development/design.md#principled-representation Exact saved-basis numeric equality gates the new accepted sample map; source ordering reversal and each incident span endpoint retain physical phase and one-sided derivative meaning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Unavailable targets retain addresses, diagnostics, completed milestones and any obtained replay quality but omit phase maps; successful targets carry correspondence, original endpoint jets and quality, never replacement coefficients.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No coordinate matcher, averaged tangent, successful-history claim or transverse surface jet is synthesized from the replay.
   * @evidence contracts/development/common.md#meaningful-documentation Optional members distinguish unavailable maps, completed internal milestones, retained replay error, new versus historical correspondence, raw/fitted phases and original physical one-sided jets.
   */
export interface Binding {
 
   /** Target's unchanged signed physical source plane, mm. */
    coordinateMm: number;

 
   /** Target's original raw contour address. */
    contourIndex: number;

 
   /** Verified saved coefficient-artifact dependency. */
    observationIdentity: string;

 
   /** Bound means exact saved numeric cubic equality; unavailable carries no correspondence map. */
    status: "bound-exact-saved-cubic" | "unavailable";

 
   /** Qualification limit or failure cause, including original-policy/geometry mismatch. */
    diagnostic: string;

 
   /** Completed target milestones, retained on later rejection; none authorizes publishing an unavailable map. */
    completedStages?: Array<
      | "replay-fit"
      | "saved-geometry-equality"
      | "accepted-sample-map"
      | "saved-endpoint-jets"
    >;

 
   /** Existing fitter's new replay quality, retained once obtained even if later geometry/map/endpoint validation fails; separate from original source-fit quality. */
    replayFitQualification?: Omit<IAutoMoviePolylineFit, "curve">;

 
   /** False records that historical accepted parameters were not retained or independently proven. */
    historicalAcceptedTraceVerified?: false;

 
   /** Whether the existing section owner reversed raw point order before fitting. */
    reversed?: boolean;

 
   /** Accepted replay samples; repeated knot observations retain each incident span separately. */
    samples?: Array<{
 
     /** Index in the original raw points array, after undoing any fitting reversal. */
      rawPointIndex: number;

 
     /** Incident saved cubic span whose own accepted parameter is retained. */
      spanIndex: number;

 
     /** Dimensionless accepted parameter on that individual span. */
      localParameter: number;

 
     /** Saved span-start phase plus localParameter times the actual saved h, in mm. */
      fittedPhaseMm: number;
    }>;

 
   /** Saved span endpoints and derivatives; these are curve tangents, not transverse surface jets. */
    endpointJets?: Array<{
 
     /** Original saved span address. */
      spanIndex: number;

 
     /** Actual nonuniform physical h of this saved span, mm. */
      widthMm: number;

 
     /** Saved first endpoint in registered mm. */
      start: Readonly<AutoMovieVector3Tuple>;

 
     /** Saved last endpoint in registered mm. */
      end: Readonly<AutoMovieVector3Tuple>;

 
     /** Saved right-sided start derivative in mm per physical phase mm. */
      startDerivative: Readonly<AutoMovieVector3Tuple>;

 
     /** Saved left-sided end derivative in mm per physical phase mm. */
      endDerivative: Readonly<AutoMovieVector3Tuple>;
    }>;
  }
}

