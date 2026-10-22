import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import { bindRecoveryOrderedFits } from "../internal/bindRecoveryOrderedFits";
import { observeRecoveryOrderedCuts } from "../internal/observeRecoveryOrderedCuts";
import type { IAutoMovieRecoveryHermiteCurve } from "../structures/curve/IAutoMovieRecoveryHermiteCurve";
import type { IAutoMovieRecoverySlabsInput } from "../structures/mesh/IAutoMovieRecoverySlabsInput";
import type { IAutoMovieRecoverySourceLineage } from "../structures/observation/IAutoMovieRecoverySourceLineage";

/** Acquisition owner for ordered source cuts and equality-gated saved-cubic correspondence.
 * Source bytes and stage receipts remain the existing program's responsibility.
 * Both operations return acquisition metadata and never replace generated or saved skin.
 *
 * @evidence contracts/common.md#principled-implementation The namespace exposes the existing exact cutter/saved-cut binder and the existing section fitter as separate operations; numerical geometry equality gates new fit correspondence but does not verify historical parameters or transverse surface jets.
 * @evidence contracts/common.md#clear-and-simple-design Input and result records keep source-cut identity separate from coefficient replay, so observeCuts never needs a fit target and bindSavedFits never recuts a source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person identity, expected measurement, source-normal fallback, closest-root selection or replacement curve is embedded in these declarations.
 * @evidence contracts/common.md#meaningful-documentation Members document original versus local addresses, physical units, caller byte verification, unavailable maps and the limits of replay qualification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Namespace initialization only groups declarations; observeCuts and bindSavedFits document their actual mesh preparation, copying, lookup and fitting costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace owns no shared request state or cache; operation-local reuse and the caller's stage receipts have separate owners.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The namespace acquires no handles or tasks; each operation owns temporary data and transfers copied results to its caller.
 */
export namespace AutoMovieRecoveryOrderedLineage {
  /** Registered immutable mesh and complete saved-plane population for one source selection.
   * Source identities are compared opaque strings; the adapter verifies actual bytes.
   *
   * @evidence contracts/common.md#principled-implementation Extending the existing slab input without slabPairs retains its mesh, physical frame, alias and complete saved-publication premises; originalTriangleIds adds the explicit local-to-original face injection checked by observeCuts.
   * @evidence contracts/common.md#clear-and-simple-design One input serves both metadata operations; only bindSavedFits separately receives saved coefficients and the original fitting policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration contains no anatomical selector, fitted coordinates, native control override or source-specific count; identities do not claim to hash borrowed arrays.
   * @evidence contracts/common.md#meaningful-documentation The added member identifies its ordinal spaces and direction; inherited members retain the slab contract's units, immutability and caller hash obligations.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface chooses no processing strategy; observeCuts owns mapping validation and indexing.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The interface stores no result or in-flight work; the caller's committed member and source selection establish reuse eligibility.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface acquires nothing; mesh arrays stay borrowed for the synchronous call, and the operations document their temporary and returned populations.
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
   *
   * @evidence contracts/common.md#principled-implementation Ordered CutPoint observations and directed cutter segments retain canonical connectivity, original emitting-edge witnesses, broad/exact face distinctions and actual chord lengths; these do not identify material phase or anatomy.
   * @evidence contracts/common.md#clear-and-simple-design A single record owns one raw contour's points, source publication and segment order; no independently reconstructed curve or normal field is stored.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Open paths, failed publications, contacts and all alias witnesses remain present; coordinate proximity never joins different contour words.
   * @evidence contracts/common.md#meaningful-documentation Members state original versus canonical addresses, closed-edge phase, physical millimetres and why an absent sourceEdges member is unsupported evidence.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data contract performs no cutting, chord calculation or copying; observeCuts owns those costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is one observation, not a cache or an equivalence decision; saved-cut admission checks belong to the producer.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring arrays acquires no resources; observeCuts transfers them to the caller and states their source/request-dependent bound and lack of a separate byte ceiling.
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
      p: C.Vector;

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
        pointMm: C.Vector;
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
   *
   * @evidence contracts/common.md#principled-implementation The record carries the actual normalized physical frame and complete admitted saved-plane population with original source/selection/artifact identities; identity strings still require caller byte verification.
   * @evidence contracts/common.md#clear-and-simple-design A plane groups its contours and exact saved-artifact dependency once; curve correspondence remains a separate Binding result.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No largest component, missing-plane substitution, native model copy or inferred transverse jet is represented as a completed fit.
   * @evidence contracts/common.md#meaningful-documentation Members define zero-origin frame units, opaque identity scope and the same-order all-plane/all-contour observation requirement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result defines no algorithm; indexed observation and copying costs belong to observeCuts.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The data object does not authorize reuse; the official program binds and verifies its source and stage bytes.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration opens no resource; the caller owns the copied result, whose retained population is documented by observeCuts.
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
      contours: Contour[];
    }>;
  }

  /** Explicit saved cubic and its caller-bound original numerical fit policy.
   * This operation supports the stored cubic basis only, not a reduction of another degree or rational curve.
   *
   * @evidence contracts/common.md#principled-implementation Physical plane/raw contour/artifact addresses select one immutable published cubic; its recorded tolerance, budget, corner policy and orientation define the existing fitter replay problem.
   * @evidence contracts/common.md#clear-and-simple-design Coefficients and fit policy are admitted only by bindSavedFits; coefficient-free observeCuts consumes neither.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The target has no person key, relaxed replacement policy, nearest-root hint or source mesh/normal fallback; its identity cannot certify historical accepted parameters.
   * @evidence contracts/common.md#meaningful-documentation Members state physical phase, raw-publication addressing, actual policy units and the caller's responsibility for byte-bound policy provenance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This erased target executes no fit; bindSavedFits owns selected replay, conversion and comparison costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A target is an immutable dependency, not a replay cache; duplicate target addresses are refused by the owning call.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires nothing; saved coefficients remain borrowed and replay outputs remain confined to bindSavedFits.
   */
  export interface Target {
    /** Original physical source plane in registered mm. */
    coordinateMm: number;

    /** Raw contour ordinal, not a fitted loop index. */
    contourIndex: number;

    /** Verified saved artifact dependency containing the target publication. */
    observationIdentity: string;

    /** Unchanged saved physical-h cubic in its original Bernstein or Hermite basis. */
    curve: C.Cubic | IAutoMovieRecoveryHermiteCurve;

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
   *
   * @evidence contracts/common.md#principled-implementation Exact saved-basis numeric equality gates the new accepted sample map; source ordering reversal and each incident span endpoint retain physical phase and one-sided derivative meaning.
   * @evidence contracts/common.md#clear-and-simple-design Unavailable targets retain addresses, diagnostics, completed milestones and any obtained replay quality but omit phase maps; successful targets carry correspondence, original endpoint jets and quality, never replacement coefficients.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate matcher, averaged tangent, successful-history claim or transverse surface jet is synthesized from the replay.
   * @evidence contracts/common.md#meaningful-documentation Optional members distinguish unavailable maps, completed internal milestones, retained replay error, new versus historical correspondence, raw/fitted phases and original physical one-sided jets.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The result interface performs no fitting, conversion or matching; bindSavedFits owns that work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record does not share effectful observations or admit equivalent inputs; source and stage byte validation remain outside this erased type.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring result arrays retains no handles; bindSavedFits documents their finite sample/span-dependent population and caller ownership.
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
    replayFitQualification?: unknown;

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
      start: C.Vector;

      /** Saved last endpoint in registered mm. */
      end: C.Vector;

      /** Saved right-sided start derivative in mm per physical phase mm. */
      startDerivative: C.Vector;

      /** Saved left-sided end derivative in mm per physical phase mm. */
      endDerivative: C.Vector;
    }>;
  }

  /** Reobserve requested saved planes without reading or fitting a coefficient.
   * The caller verifies native and saved artifact bytes; this function compares
   * their declared source/selection/frame identities and rechecks complete raw
   * populations, closure and broad/exact face sets through the official binder.
   * Binary64 cutting is not certified exact arithmetic. No aggregate metadata
   * byte ceiling or cancellation hook is provided; the synchronous caller bounds
   * its selected mesh and saved-plane request and keeps borrowed inputs immutable.
   *
   * @evidence contracts/common.md#principled-implementation The admitted mesh, normalized frame, scalar interval index and existing exact-zero cutter produce each raw contour; saved-cut binding verifies its ordinal, full support and closure before original face remapping and physical chord accumulation. Opaque identities do not verify bytes or semantic phase, and extreme finite chord arithmetic is not separately range-certified.
   * @evidence contracts/common.md#clear-and-simple-design One prepared mesh, one face map and one scalar index serve the requested planes; this operation only emits complete source-cut evidence, leaving coefficient correspondence to bindSavedFits and hash verification to the existing processor.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no anatomical/person selector, largest-component filter, coordinate weld, nearest-root choice, coefficient replacement or normal fallback; empty planes, contacts, failed publications and every emitted alias witness survive.
   * @evidence contracts/common.md#meaningful-documentation The input/result comments distinguish canonical labels, original edges, broad versus exact faces, raw chord phase and copied acquisition evidence; this comment states caller identity, binary64, cancellation and byte-budget limitations.
   * @evidence contracts/performance.md#efficient-algorithms For V vertices, T selected faces, K planes and per-plane active faces A, points P, incident-face visits I and original-edge witness visits W, admission/indexing costs O(V+T log T); indexed cuts and copied outputs add active-face sorting, P/I traversal, segment face sorting and the cutter's per-point linear witness deduplication, which can reach O(W squared) for many aliases. Complete saved populations are revisited to verify their binding; no whole named curve collection is fitted.
   * @evidence contracts/performance.md#reuse-equivalent-work A local-to-original injection, admitted incidence registry, vertex heights, interval index and cutter closure are reused only for this immutable source/frame/selection. Each distinct plane is cut once after duplicate rejection; persistent reuse is the processor's byte-verified named-stage responsibility, not identity-string caching here.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The call borrows source arrays and owns O(V+T) preparation plus active cut/binding data; its output grows with all requested contour points, witnesses and face addresses. Temporary references expire on return or throw and copied results transfer to the caller. There is no independent aggregate output-byte limit, handle, background task or cancellation listener.
   */
  export function observeCuts(input: Input): Cuts {
    return observeRecoveryOrderedCuts(input);
  }

  /** Recover a new pointwise correspondence for explicitly requested saved cubics.
   * The caller byte-verifies cuts, target publications and their actual policies.
   * The original section fitter replays each target once; conversion to the saved
   * cubic basis must reproduce its JSON numeric geometry and physical h exactly.
   * A per-target failure retains completed milestones and any obtained replay
   * quality, but returns unavailable without samples or replacement coefficients.
   * Source/physical-frame admission failures throw before targets.
   * Historical accepted parameters, independent control effects and surface
   * transverse jets are not qualified. This synchronous call has no cancellation
   * hook or aggregate byte budget beyond the caller's finite targets/fit budgets.
   *
   * @evidence contracts/common.md#principled-implementation The saved raw publication and immutable original fit policy define the established section-fitter problem; its accepted-parameter observer supplies new sample parameters. Exact type/unit/closure/h/span JSON numeric equality gates the map, then reversal maps indices back to raw order. This is a new replay registration, not proof of historical accepted parameters, exact source-surface fit, high-degree/rational conversion or bitwise signed-zero identity.
   * @evidence contracts/common.md#clear-and-simple-design Cut admission is consumed as a separate committed input without recutting; one target loop owns lookup, existing fitter replay, same-basis comparison and unavailable outcomes. Original and replay fit qualities remain separate; already obtained replay quality and completed milestones survive later rejection, while unavailable maps and replacement coefficients never escape.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-point/root matcher, relaxed policy, person table, averaged knot tangent, source mesh/normal fallback or replacement fit is emitted. Duplicate targets and coefficient mismatches remain unavailable; source-wide identity/frame mismatch refuses the call.
   * @evidence contracts/common.md#meaningful-documentation Target and Binding members document physical h, reversal, original one-sided curve derivatives, optional failure fields and caller policy provenance; the function documents the distinction between admission throws, per-target unavailable and unverified historical/surface claims.
   * @evidence contracts/performance.md#efficient-algorithms For V vertices, T faces, K saved planes, C contours per target plane, N targets, P target samples and S fitted spans, each call prepares O(V+T) incidence and at most two O(T) orientation closures. Repeated find operations cost O(N(K+C)); selected fits retain the existing balanced O(P log S), worst O(P squared) fitter cost. Per-target point copying, conversion, JSON comparison, sample mapping and endpoint copying add O(P+S); no cut or unselected curve fit runs.
   * @evidence contracts/performance.md#reuse-equivalent-work Immutable ordered cuts are reused for every target, incidence is prepared once, and material orientations are reused per actual sign. Duplicate raw addresses are rejected, while differing targets keep their own policies and saved coefficients; no effectful replay is shared across calls or accepted from a matching string alone.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Preparation/orientation maps live for this synchronous call; each target owns temporary copied points, accepted trace and replay/converted spans, which expire after its outcome. Returned maps and saved endpoint jets grow with target samples/spans and transfer to the caller; no aggregate byte ceiling, host handle, task, listener or global cache is added. Per-target errors retain diagnostics, completed milestones and obtained scalar replay-quality metadata but no maps or replacement coefficients; an admission throw releases call-local references.
   */
  export function bindSavedFits(
    input: Input,
    cuts: Cuts,
    targets: readonly Target[],
  ): Binding[] {
    return bindRecoveryOrderedFits(input, cuts, targets);
  }
}
