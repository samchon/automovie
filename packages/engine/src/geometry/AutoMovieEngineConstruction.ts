import {
  type AutoMovieVector2Tuple,
  type AutoMovieVector3Tuple,
  type IAutoMovieAxis,
  type IAutoMovieConstruction,
  type IAutoMovieConstructionBridgeRealize,
  type IAutoMovieConstructionContinuation,
  type IAutoMovieConstructionCurve,
  type IAutoMovieConstructionKnownPortSource,
  type IAutoMovieConstructionNativeProfile,
  type IAutoMovieConstructionNode,
  type IAutoMovieConstructionPort,
  type IAutoMovieConstructionPortLoop,
  type IAutoMovieConstructionProfileBody,
  type IAutoMovieConstructionProfileLoop,
  type IAutoMovieConstructionProfilePiece,
  type IAutoMovieConstructionProfileRealize,
  type IAutoMovieConstructionProfileSource,
  type IAutoMovieConstructionRealization,
  type IAutoMovieConstructionSplit,
  type IAutoMovieConstructionState,
  type IAutoMovieFairSolidMesh,
  type IAutoMovieGridSolidMeshGrid,
  type IAutoMovieLoftChain,
  type IAutoMovieLoftViewSource,
  type IAutoMovieLoftWorldJetLocal,
  type IAutoMovieLoftWorldJetWorld,
  type IAutoMovieMark,
  type IAutoMovieOpenSolidMeshResult,
  type IAutoMoviePreparedConstructionKnownPort,
  type IAutoMovieSampleConstructionCurves,
  type IAutoMovieSolidAtlas,
  type IAutoMovieSolidBody,
  type IAutoMovieSolidMesh,
  type IAutoMovieSolidMeshConstraints,
  type IAutoMovieSolidMeshIncidence,
  type IAutoMovieSolidMeshPlan,
  type IAutoMovieSolidSurface,
  type IAutoMovieSolidTraceTrialTrial,
  type IAutoMovieViewAxis,
  type IAutoMovieViewHermite,
  type IAutoMovieViewLoftInputsInputs,
  type IAutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/interface";

import { type AutoMovieSolidTraceObservation as Observation } from "./construction/AutoMovieSolidTraceObservation";
import { AutoMovieConstructionBoundary as AutoMovieConstructionBoundaryImplementation } from "./construction/internal/AutoMovieConstructionBoundary";
import { AutoMovieConstructionBridgeRealize as AutoMovieConstructionBridgeRealizeImplementation } from "./construction/internal/AutoMovieConstructionBridgeRealize";
import { AutoMovieConstructionContinuationRealize as AutoMovieConstructionContinuationRealizeImplementation } from "./construction/internal/AutoMovieConstructionContinuationRealize";
import { AutoMovieConstructionKnownPort as AutoMovieConstructionKnownPortImplementation } from "./construction/internal/AutoMovieConstructionKnownPort";
import { AutoMovieConstructionNativeProfile as AutoMovieConstructionNativeProfileImplementation } from "./construction/internal/AutoMovieConstructionNativeProfile";
import { AutoMovieConstructionPortAddress as AutoMovieConstructionPortAddressImplementation } from "./construction/internal/AutoMovieConstructionPortAddress";
import { AutoMovieConstructionPortRadialRange as AutoMovieConstructionPortRadialRangeImplementation } from "./construction/internal/AutoMovieConstructionPortRadialRange";
import { AutoMovieConstructionPortRealize as AutoMovieConstructionPortRealizeImplementation } from "./construction/internal/AutoMovieConstructionPortRealize";
import { AutoMovieConstructionProfileRealize as AutoMovieConstructionProfileRealizeImplementation } from "./construction/internal/AutoMovieConstructionProfileRealize";
import { AutoMovieConstructionProfileSkin as AutoMovieConstructionProfileSkinImplementation } from "./construction/internal/AutoMovieConstructionProfileSkin";
import { AutoMovieConstructionProfileSurface as AutoMovieConstructionProfileSurfaceImplementation } from "./construction/internal/AutoMovieConstructionProfileSurface";
import { AutoMovieConstructionSplitRealize as AutoMovieConstructionSplitRealizeImplementation } from "./construction/internal/AutoMovieConstructionSplitRealize";
import { AutoMovieLoftViewWorldJet as AutoMovieLoftViewWorldJetImplementation } from "./construction/internal/AutoMovieLoftViewWorldJet";
import { AutoMovieLoftWorldJet as AutoMovieLoftWorldJetImplementation } from "./construction/internal/AutoMovieLoftWorldJet";
import { AutoMovieSolidTraceTrial as AutoMovieSolidTraceTrialImplementation } from "./construction/internal/AutoMovieSolidTraceTrial";
import { AutoMovieViewHermiteDerivativeRange as AutoMovieViewHermiteDerivativeRangeImplementation } from "./construction/internal/AutoMovieViewHermiteDerivativeRange";
import { AutoMovieViewLoftInputs as AutoMovieViewLoftInputsImplementation } from "./construction/internal/AutoMovieViewLoftInputs";
import { distanceAutoMovieViewOutline as distanceAutoMovieViewOutlineImplementation } from "./construction/internal/distanceAutoMovieViewOutline";
import { domainAutoMovieSolidMesh as domainAutoMovieSolidMeshImplementation } from "./construction/internal/domainAutoMovieSolidMesh";
import { faceAutoMovieSolidMesh as faceAutoMovieSolidMeshImplementation } from "./construction/internal/faceAutoMovieSolidMesh";
import { fairAutoMovieSolidMesh as fairAutoMovieSolidMeshImplementation } from "./construction/internal/fairAutoMovieSolidMesh";
import { gridAutoMovieSolidMesh as gridAutoMovieSolidMeshImplementation } from "./construction/internal/gridAutoMovieSolidMesh";
import { incircleAutoMovieSolidChart as incircleAutoMovieSolidChartImplementation } from "./construction/internal/incircleAutoMovieSolidChart";
import { insertAutoMovieSolidMeshPoints as insertAutoMovieSolidMeshPointsImplementation } from "./construction/internal/insertAutoMovieSolidMeshPoints";
import { legalizeAutoMovieSolidMesh as legalizeAutoMovieSolidMeshImplementation } from "./construction/internal/legalizeAutoMovieSolidMesh";
import { markAutoMovieConstructionCurves as markAutoMovieConstructionCurvesImplementation } from "./construction/internal/markAutoMovieConstructionCurves";
import { openAutoMovieSolidMesh as openAutoMovieSolidMeshImplementation } from "./construction/internal/openAutoMovieSolidMesh";
import { orientAutoMovieSolidChart as orientAutoMovieSolidChartImplementation } from "./construction/internal/orientAutoMovieSolidChart";
import { probeAutoMovieSolidMesh as probeAutoMovieSolidMeshImplementation } from "./construction/internal/probeAutoMovieSolidMesh";
import { realizeAutoMovieConstruction as realizeAutoMovieConstructionImplementation } from "./construction/internal/realizeAutoMovieConstruction";
import { rollAutoMovieViewAxis as rollAutoMovieViewAxisImplementation } from "./construction/internal/rollAutoMovieViewAxis";
import { rootsAutoMovieViewPolynomial as rootsAutoMovieViewPolynomialImplementation } from "./construction/internal/rootsAutoMovieViewPolynomial";
import { rootsAutoMovieViewSinPolynomial as rootsAutoMovieViewSinPolynomialImplementation } from "./construction/internal/rootsAutoMovieViewSinPolynomial";
import { sampleAutoMovieConstructionCurves as sampleAutoMovieConstructionCurvesImplementation } from "./construction/internal/sampleAutoMovieConstructionCurves";
import { supportAutoMovieViewOutline as supportAutoMovieViewOutlineImplementation } from "./construction/internal/supportAutoMovieViewOutline";
import { triangulateAutoMovieSolidBoundary as triangulateAutoMovieSolidBoundaryImplementation } from "./construction/internal/triangulateAutoMovieSolidBoundary";
import { witnessAutoMovieSolidChartTriangle as witnessAutoMovieSolidChartTriangleImplementation } from "./construction/internal/witnessAutoMovieSolidChartTriangle";

/** Public operations for Auto Movie Engine Construction. */
export namespace AutoMovieEngineConstruction {
  /** Realize an admitted construction tree with the requested skin behavior. */
  export function realize(
    construction: IAutoMovieConstruction,
    props: IAutoMovieConstructionRealization.IProps & { skin: false },
  ): IAutoMovieConstructionRealization.IWithoutSkin;
  export function realize(
    construction: IAutoMovieConstruction,
    props: IAutoMovieConstructionRealization.IProps & { skin?: true },
  ): IAutoMovieConstructionRealization.IRealization;
  export function realize(
    construction: IAutoMovieConstruction,
    props: IAutoMovieConstructionRealization.IProps,
  ):
    | IAutoMovieConstructionRealization.IRealization
    | IAutoMovieConstructionRealization.IWithoutSkin;
  export function realize(
    construction: IAutoMovieConstruction,
    props: IAutoMovieConstructionRealization.IProps,
  ):
    | IAutoMovieConstructionRealization.IRealization
    | IAutoMovieConstructionRealization.IWithoutSkin {
    return realizeAutoMovieConstructionImplementation(construction, props);
  }

  /**
   * Admit already matching native ends without rewriting either chain.
   *
   * Complete native scalar2 and signed frame2 determine every phase and mixed
   * derivative by the existing native and world product rules. Compatibility
   * rows are validated at their own density and remain unchanged. The admitted
   * additional displacement is absent or phase-constant lift2; reliefs and
   * phase-dependent lifts require another whole-boundary certificate.
   *
   * Regularity uses a sufficient analytic condition: the frame's first axis
   * derivatives lie in the section plane, and the complete station velocity has
   * a nonzero normal component. Thus it cannot be parallel to any nonzero
   * native phase tangent. A turning plane is explicitly unsupported by this
   * admission. Every compatibility row is checked, with the existing
   * source/span lookup costs, before constant-size boundary preparation.
   * Temporary source/frame records have call lifetime; no source fit or module
   * cache is introduced.
   */
  export function constructionBoundary(
    host: IAutoMovieLoftChain,
    hostEnd: "bottom" | "top",
    part: IAutoMovieLoftChain,
    partEnd: "bottom" | "top",
    sign: 1 | -1,
  ): string | null {
    return AutoMovieConstructionBoundaryImplementation(
      host,
      hostEnd,
      part,
      partEnd,
      sign,
    );
  }

  /**
   * Realize a continuation with a band
   * (`IAutoMovieConstructionContinuation.band`): the host's open end and the
   * part's ring at `rail` inside it joined by one band round the whole ring, so
   * two faces whose sections have different orders meet without either taking
   * the other's.
   *
   * The band is a split's band with one stretch, the host's whole end ring, and
   * no seam (`AutoMovieConstructionSplitBand.fan`): its start ribbon is the
   * host's own 2-jet along its station line out of its end, its end ribbon the
   * part's own 2-jet at the rail toward its kept side, both scaled by the
   * strip's one factor, so the band is G2 to both. The ring's vertices are the
   * host's end cycle and the band's start cycle, the rail's vertices the band's
   * end cycle and the part's rail cycle, each segment naming the face across
   * it, as a split's are.
   *
   * Steps: walk the host and admit its end (realized, no pole there, not
   * already cut); take the checkpoint; walk the part and admit its face and its
   * rail (realized after the checkpoint, the rail inside its domain, its side
   * not already cut); build the band; then add, in one step, the ring and rail
   * vertices, the band's face and its cycles, the host's end cycle and the
   * part's rail cycle. A broken premise restores the checkpoint and records one
   * diagnostic under the continuation's name; a foreign error restores it and
   * propagates.
   *
   * @param node The continuation, its band declared.
   * @param body The body the faces join.
   * @param state The walk's state.
   * @param walk Realizes a subtree.
   * @param report Records a diagnostic.
   */
  export function constructionBridgeRealize(
    node: IAutoMovieConstructionBridgeRealize.INode,
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
    walk: (node: IAutoMovieConstructionNode) => void,
    report: (node: string, contract: string, detail: string) => void,
  ): void {
    AutoMovieConstructionBridgeRealizeImplementation(
      node,
      body,
      state,
      walk,
      report,
    );
  }

  /**
   * Retain a continuation only while both actual open ends survive its subtree.
   *
   * The host is realized first. The ordinary continuation override then admits
   * or re-expresses the part's endpoint before its surface is published. After
   * all part operations, both endpoints must still be available before one ring
   * is allocated. Failed numeric admission restores the host checkpoint and
   * records the continuation's name. Foreign errors restore it and propagate
   * unchanged. Nested continuations targeting another end of the same leaf
   * apply every enclosing pending boundary before their own boundary. Each
   * pending owner records its actual result, and the previous map entry is
   * restored even when a subtree throws.
   *
   * The call mutates the existing body/state. Its snapshot costs O(F+C) for
   * existing faces and cycles; operator, source and O(samples) ring work retain
   * their existing owners. The checkpoint and callbacks have call lifetime.
   */
  export function constructionContinuationRealize(
    node: IAutoMovieConstructionContinuation,
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
    walk: (node: IAutoMovieConstructionNode) => void,
    report: (node: string, contract: string, detail: string) => void,
  ): void {
    AutoMovieConstructionContinuationRealizeImplementation(
      node,
      body,
      state,
      walk,
      report,
    );
  }

  /**
   * Actual-field C2 band using a quintic partition of unity, without contact
   * recovery.
   *
   * With P and Q the two complete pulled-back original fields, B=(1-h)P+hQ and
   * h=10v^3-15v^4+6v^5. At each rail h and its first two derivatives select the
   * corresponding whole field total2. Interior derivatives use both fields and
   * all chart/product-rule terms, so boundary jets are never extrapolated. The
   * emitted kernel chart is (transverse, original clock), so its second
   * coordinate carries the actual period. Swapping total2 and the outward sign
   * preserves the authored tangential-cross-transverse orientation.
   *
   * This returns a surface reader, not a final skin or a global topology proof.
   * Each actual jet query refuses nonfinite or rank-zero output; whole-domain
   * fold/self-intersection and sewn-rail atlas publication remain separate
   * realization obligations. Supplied neighboring fields/maps must be C2 on the
   * rectangle, including their explicit actual validity domains.
   */
  export function constructionKnownPort(
    source: IAutoMovieConstructionKnownPortSource,
  ): IAutoMoviePreparedConstructionKnownPort.IPrepared {
    return AutoMovieConstructionKnownPortImplementation(source);
  }

  /**
   * Exact native-source adapter to the original piecewise-profile reader.
   *
   * No raw loft or compatibility coefficients are constructed. Existing scalar,
   * cap, conic and physical2 owners remain authoritative; the actual axis is
   * borrowed. The source has one full-period piece with its original polar
   * clock, without imposing that representation on composed profile families.
   */
  export function constructionNativeProfile(
    part: IAutoMovieViewPart,
    identity: IAutoMovieConstructionNativeProfile.IIdentity,
  ): IAutoMovieConstructionProfileSource {
    return AutoMovieConstructionNativeProfileImplementation(part, identity);
  }

  /**
   * One original radial port-chart address in kernel mm and radians.
   *
   * The caller supplies the admitted loop, clock and radial share. Arithmetic
   * grouping is the existing PortCurve.chart law: (share*a)_cos(clock) and
   * ((share_sense)*b)*sin(clock). A mathematically equivalent regrouping can
   * cross a literal Float64 source-domain endpoint, so both operators and
   * numerical source constraints consume this function.
   */
  export function constructionPortAddress(
    loop: IAutoMovieConstructionPortLoop,
    clock: number,
    share: number,
  ): [number, number] {
    return AutoMovieConstructionPortAddressImplementation(loop, clock, share);
  }

  /**
   * A finite inward radial endpoint whose literal port address stays admitted.
   *
   * `station` is the actual closed source domain in kernel mm; `phase` is the
   * caller's closed chart branch in radians. Loop station inputs retain public
   * metres. The returned dimensionless Q is greater than originalShare > 0.
   * Both that original control and Q are certified with the actual address
   * owner. Fixed-clock rounded coordinates are monotone on their intervening
   * interval. The caller still admits any separately selected q=0 endpoint at
   * its source.
   *
   * For s=RN(y0+RN(RN(q*a)*c)), c>0 requires the rounded inner product to be at
   * most down(down(U-y0)/c). Dividing that threshold downward by positive a
   * bounds q. For c<0, use up(L-y0) before the negative division. Every
   * threshold is representable, so monotonic rounding preserves each sufficient
   * inequality. Phase uses the same proof: sense=+/-1 is an exact sign change
   * and RN is sign symmetric, while the final certificate retains the original
   * product order.
   *
   * This is a conservative inner endpoint, not the largest representable Q.
   * Nonfinite or unrepresentable inverse steps and failed literal certificates
   * refuse. A level root only at the omitted boundary need not remain
   * bracketed; no claim of complete finite-input support or root-branch
   * uniqueness is made.
   */
  export function constructionPortRadialRange(
    loop: IAutoMovieConstructionPortLoop,
    clock: number,
    station: readonly [number, number],
    phase: readonly [number, number],
    originalShare: number,
  ): number {
    return AutoMovieConstructionPortRadialRangeImplementation(
      loop,
      clock,
      station,
      phase,
      originalShare,
    );
  }

  /**
   * Realize a port (`IAutoMovieConstructionPort`): the host's port curve cut
   * out of its face as a hole, a band from that curve to the part's rail
   * (`AutoMovieConstructionSplitBand.strip`, the split's own strip with the
   * monotone ribbon scale), all sharing their boundary vertices.
   *
   * Steps: walk the host and admit its face; take the checkpoint; walk the part
   * and admit its face and rail (realized after the checkpoint, the rail inside
   * its domain, the rail's side not already cut; a curved rail, `rails`, is the
   * periodic cubic through its distances, every column's ring point, chart and
   * ribbon taken at that column's own station on it); build the band, whose
   * start ribbons are the host surface's 2-jet across the port curve (the
   * ellipse, each column scaled from the centre by the loop's share when it
   * declares a shape) toward the curve's centre; then add, in one step, the
   * port curve's vertices on the host (its hole cycle), the rail's vertices on
   * the part (its rail cycle) and the band face with its two station-end
   * cycles, every segment naming the face across it. The band's chain and
   * surface join the realization's chains and surfaces.
   *
   * A broken premise restores the checkpoint and records one diagnostic under
   * the port's name; a foreign error restores it and propagates unchanged.
   *
   * One owner per seam, read between the columns as well as at them: the port
   * curve (`AutoMovieConstructionPortCurve.curve`, the loop's ellipse with its
   * shares joined by the periodic cubic) is the host's seam, and the rail field
   * (one station, or the periodic cubic through `rails`) the part's. The host's
   * hole keeps the outside of that curve and maps a point inside it to the band
   * at its radial foot's clock; the band's face is the exact band
   * (`AutoMovieConstructionPortBand`), whose start edge is the host on that
   * curve and whose end edge is the part on its rail, each with the side's own
   * cross 2-jet; the band's start and end cycles and the part's rail cycle map
   * across by the same curve and correspondence
   * (`IAutoMovieSolidCycle.IExact`). No second interpolation of either seam
   * exists. The column strip still admits the columns, finds their ribbon
   * factors and publishes its chain as the band's column record. A profiled
   * band is the exact band carried in by its profiles' displacement
   * (`AutoMovieConstructionSplitBand.profiled`,
   * `AutoMovieConstructionPortBand.carried`), laid along the exact band's own
   * normal, so it keeps the same seams and readers; its published chain is the
   * profiled column strip.
   */
  export function constructionPortRealize(
    node: IAutoMovieConstructionPort,
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
    walk: (node: IAutoMovieConstructionNode) => void,
    report: (node: string, contract: string, detail: string) => void,
  ): void {
    AutoMovieConstructionPortRealizeImplementation(
      node,
      body,
      state,
      walk,
      report,
    );
  }

  /**
   * Resolve one pure profile leaf to its actual invocation-owned original
   * family.
   *
   * A detached declaration is compared structurally without property-order or
   * object-identity assumptions. Actual curve/frame functions then prepare the
   * retained atlas, physical2 grids and shared mesh boundaries once. Initial
   * source/preparation failures become a named leaf diagnostic, matching source
   * leaf admission; appended body/list changes roll back to the same
   * checkpoint. Exceptions from later retained readers keep their existing
   * operator policy.
   */
  export function constructionProfileRealize(
    node: IAutoMovieConstructionProfileRealize.INode,
    context:
      | ReadonlyMap<string, IAutoMovieConstructionProfileSource>
      | undefined,
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
    tolerance: number,
  ): void {
    AutoMovieConstructionProfileRealizeImplementation(
      node,
      context,
      body,
      state,
      tolerance,
    );
  }

  /**
   * Close actual collapsed profile tips through the drawn source boundary.
   *
   * Every ring arc must still occur in its own face's actual open mesh record,
   * and every tip address must remain in the analytic kept region. A complete
   * removed tip stays absent; a cutting loop meeting the original cap strip or
   * a partial or missing original ring is diagnosed without a replacement fan.
   * The actual tip Point0 requires no physical2.
   */
  export function constructionProfileSkin(
    body: IAutoMovieSolidBody.IBody,
    ends: readonly IAutoMovieConstructionProfileBody.IEnd[],
    open: readonly (readonly IAutoMovieSolidMesh.IOpen[])[],
    report: (node: string, contract: string, detail: string) => void,
  ): void {
    AutoMovieConstructionProfileSkinImplementation(body, ends, open, report);
  }

  /**
   * Exact world chart of one original interval, retained or in its actual
   * neighborhood.
   *
   * The default physical domain is the loop's retained metre interval converted
   * once to kernel mm. An explicit domain reads the same original curve/plane
   * on their actual supported neighborhood; it extends no function by fitting
   * or Taylor data. A complete periodic original permits its actual phase
   * aliases. Other piece charts retain their bounded normalized interval.
   */
  export function constructionProfileSurface(
    source: IAutoMovieConstructionProfileSource,
    family: string,
    loop: IAutoMovieConstructionProfileLoop,
    piece: IAutoMovieConstructionProfilePiece,
    curve: IAutoMovieConstructionProfileSource.ICurve,
    originalDomain?: readonly [number, number],
  ): IAutoMovieSolidSurface {
    return AutoMovieConstructionProfileSurfaceImplementation(
      source,
      family,
      loop,
      piece,
      curve,
      originalDomain,
    );
  }

  /**
   * Realize a split (`IAutoMovieConstructionSplit`): the host's open end
   * divided by the seam chord into both children's loops, each spanned to its
   * child's rail by a band (`AutoMovieConstructionSplitBand`), all sharing
   * their boundary vertices.
   *
   * Steps: walk the host and admit its end (realized, no pole there, not
   * already cut); take the checkpoint; build the curved seam once when a
   * profile is declared (`AutoMovieConstructionSplitSeam`, refused with the
   * split's diagnostic before either child is lofted); walk both children and
   * admit each face and rail (realized after the checkpoint, the rail inside
   * its domain, the rail's side not already cut); build both bands; then add to
   * the body, in one step, the ring vertices on the host's end (both arcs, the
   * seam's two corners shared), the chord's inner vertices (evaluated on band
   * 0, shared by band 1), each child's rail vertices, both band faces with
   * their two station-end cycles, the host's end cycle and each child's rail
   * cycle, every segment naming the face across it. The bands' chains and
   * surfaces join the realization's chains and surfaces, so every consumer of a
   * chain (the skin, a later join or trim naming a band) reads them as any
   * face.
   *
   * A broken premise restores the checkpoint and records one diagnostic under
   * the split's name: both children, both bands and the host's end stand as
   * they were, since one child alone would leave the shared chord open. A
   * foreign error restores the checkpoint and propagates unchanged.
   */
  export function constructionSplitRealize(
    node: IAutoMovieConstructionSplit,
    body: IAutoMovieSolidBody.IBody,
    state: IAutoMovieConstructionState.IState,
    walk: (node: IAutoMovieConstructionNode) => void,
    report: (node: string, contract: string, detail: string) => void,
  ): void {
    AutoMovieConstructionSplitRealizeImplementation(
      node,
      body,
      state,
      walk,
      report,
    );
  }

  /**
   * Read an original positive section's world total2 without first lofting it.
   *
   * Source and axis must belong to the same immutable original part. The axis's
   * physical jet must differentiate its at map in this same station coordinate.
   * This reads no chain, fitted frame, lift, relief or Cartesian Taylor
   * extension. A finite jet is not a regularity, outward-orientation or
   * owned-domain proof. Closed-pole/source failures and absent axis2 return a
   * named string. Exceptions from the actual axis callback or its returned
   * getters keep their identity.
   */
  export function loftViewWorldJet(
    source: IAutoMovieLoftViewSource.ISource,
    axis: IAutoMovieAxis,
    station: number,
    phase: number,
  ): IAutoMovieSolidSurface.IJet | string {
    return AutoMovieLoftViewWorldJetImplementation(
      source,
      axis,
      station,
      phase,
    );
  }

  /**
   * Apply the existing frame product rule to a complete local total2.
   *
   * The caller supplies all six local pairs and three complete nine-number
   * frame rows: origin/u/v value, first and second station derivatives. Station
   * derivatives share physical millimetres; phase units stay with the caller's
   * original or exactly mapped clock. Missing input is not zero. Input getters
   * and malformed-array exceptions propagate; a nonfinite computed world
   * reading raises the existing numeric admission error.
   */
  export function loftWorldJet(
    local: IAutoMovieLoftWorldJetLocal,
    f: number[][],
  ): IAutoMovieLoftWorldJetWorld {
    return AutoMovieLoftWorldJetImplementation(local, f);
  }

  /**
   * Read a feasible Newton host trial, using declared atlas adjacency at a
   * closed chart boundary.
   *
   * The atlas maps an exterior proposal to the nearest shared boundary's foot
   * in its neighbour. That is only a numerical initialization: the meeting
   * solver must evaluate its actual residual there and accept descent before
   * changing faces. No exterior source value or imagined continuation is read.
   * An optional internal observation records only the guard already executed;
   * it cannot change a trial, crossing budget or query sequence.
   */
  export function solidTraceTrial(
    host: IAutoMovieSolidAtlas,
    face: number,
    u: number,
    v: number,
    canCross: boolean,
    observation?: Observation.IState,
  ): IAutoMovieSolidTraceTrialTrial | null {
    return AutoMovieSolidTraceTrialImplementation(
      host,
      face,
      u,
      v,
      canCross,
      observation,
    );
  }

  /**
   * Enclose the existing Hermite reader's first derivative on its knot span.
   *
   * The immutable preparation is the existing owner's actual binary64 xs, first
   * knot derivatives and quintic increment coefficients. Derivative units are
   * per selected source parameter, not a normalized station or world speed.
   * Negative bounds are valid; a consumer requiring positivity checks lower>0.
   *
   * Each real degree-four derivative numerator is converted to Bernstein form
   * with outward arithmetic. Its convex hull bounds every rounded local t in
   * [0,1]: monotonic subtraction/division keeps the reader's t in that
   * interval. The actual span h=xs[i+1]-xs[i] and every literal knot derivative
   * are included.
   *
   * The literal reader contains thirteen arithmetic operations after t is
   * known, including the left-associated (t_5)_c5 term. With u=EPSILON/2,
   * eta=MIN_VALUE, Q=sum(j_abs(cj),j=1..5), its additional error is bounded by
   * gamma13_Q/h + eta*((11+abs(c5))/h+1)/(1-13u). Eleven predivide errors have
   * downstream weight at most 1/h; the t*5 error has weight abs(c5)/h, and the
   * final division has weight one. This is separate from outward coefficient
   * conversion. The inflated prefix magnitude must also be finite, so an
   * overflowing proof returns a named refusal.
   *
   * This is a sufficient enclosure, not exact extrema or universal finite-input
   * support. It changes no evaluator, parameter, coefficient or input array.
   *
   * @param curve Immutable preparation produced by the existing Hermite owner.
   * @returns Finite lower/upper derivative bounds, or a named
   *   invalid/unrepresentable-proof refusal.
   */
  export function viewHermiteDerivativeRange(
    curve: IAutoMovieViewHermite.ICurve,
  ): readonly [number, number] | string {
    return AutoMovieViewHermiteDerivativeRangeImplementation(curve);
  }

  /** Prepare ViewLoft's existing value readers, reusing retained direct sources. */
  export function viewLoftInputs(
    part: IAutoMovieViewPart,
    source: IAutoMovieLoftViewSource.ISource | null,
    report: (contract: string, detail: string) => void,
  ): IAutoMovieViewLoftInputsInputs | null {
    return AutoMovieViewLoftInputsImplementation(part, source, report);
  }

  /**
   * Numerical squared-distance candidates on an original scalar graph in a
   * fixed orthonormal chart.
   *
   * The caller supplies a fixed target (targetStation,targetValue), with both
   * coordinates and the source ordinate in the station's length unit. This is
   * the graph (s,r(s)); it does not interpret an affine/moving world origin or
   * a three-dimensional curve. The explicit finite closed interval must lie
   * within the original knots; a singleton returns its one endpoint. Angle
   * parameters and open extensions fail. Source endpoints, included named knots
   * and derivative-root candidates are returned, not an exact maximum,
   * certified enclosure or guarantee of separating ill-conditioned roots.
   *
   * @returns Sorted unique endpoint/knot/numerical critical stations, or a
   *   premise/arithmetic failure string.
   */
  export function distanceViewOutline(
    outline: IAutoMovieViewOutline.IOutline,
    targetStation: number,
    targetValue: number,
    domain: readonly [number, number],
  ): number[] | string {
    return distanceAutoMovieViewOutlineImplementation(
      outline,
      targetStation,
      targetValue,
      domain,
    );
  }

  /**
   * Assemble finite domain sides without subdividing an authoritative trim
   * edge.
   *
   * Existing points on each side are retained in order. A new sampling point
   * inside a trim segment is omitted; it would otherwise split one side of a
   * shared seam with an index that its neighbour never received. An exact
   * existing boundary point is reused before requesting a new grid point. The
   * callback extends only the caller's local point catalogue, not a mesh.
   */
  export function domainSolidMesh(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    trim: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    stations: readonly number[],
    phases: readonly number[],
    at: (i: number, j: number) => number,
    period?: number,
  ): IAutoMovieSolidMeshConstraints.ISegment[] | string {
    return domainAutoMovieSolidMeshImplementation(
      vertices,
      trim,
      stations,
      phases,
      at,
      period,
    );
  }

  /**
   * Prepare one complete source partition, then append its admitted face
   * atomically.
   *
   * Named planning refusals call onFailure and return no face, or throw when no
   * callback was supplied. Source/keeps/callback exceptions propagate
   * unchanged. No mesh owner or buffer is appended until preparation and all
   * diagnostics have completed. Ordinary mutable arrays and coherent
   * synchronous sources are required; diagnostic callbacks must not mutate or
   * reenter this mesh. Hostile array proxies and allocation failure are not
   * transactional.
   */
  export function faceSolidMesh(
    mesh: IAutoMovieSolidMesh.IMesh,
    input: IAutoMovieSolidMesh.IFace,
  ): IAutoMovieSolidMesh.IOpen[] {
    return faceAutoMovieSolidMeshImplementation(mesh, input);
  }

  /**
   * Fair a drawn mesh over the regions about given vertices: the discrete
   * thin-plate fill of a hole, the triangles within each region moved so that
   * the bi-Laplacian of their positions vanishes, with the two rings of
   * vertices outside the region held where they are.
   *
   * Where a construction leaves a corner that no single surface owns, as at a
   * split's fork, where the host's end and two bands meet, every band turns
   * sharply beside the corner and the skin shows a notch or a crease there;
   * where a part is merged onto its host, the narrow blend between them leaves
   * a notch wherever the trace turns sharply. The orthodox remedy in the
   * branching-surface literature trims a neighbourhood of the corner or the
   * seam from the meeting surfaces and fills the hole with a patch G1 to its
   * rim (Gabrielides, Ginnis and Kaklis 2007). On the realized mesh that patch
   * is the minimizer of the discrete thin-plate energy `sum_k |U x_k|^2` over
   * the region's vertices `x`: `U` the umbrella operator, `U x_k = sum_j (x_j -
   * x_k)` over the neighbours `j` of `k` (Kobbelt, Campagna, Vorsatz and Seidel
   * 1998, "Interactive multi-resolution modeling on arbitrary meshes"), its
   * rows taken at the region's vertices and the first ring outside it. Its
   * stationary point is `U^2 x = 0` on the region, the fairing fill of Botsch
   * and Kobbelt 2004 ("An intuitive framework for real-time freeform
   * modeling"), whose solution meets the fixed first ring with the tangent
   * planes the second ring gives it, so the fill is G1 to the skin it leaves.
   * The umbrella's weights are all one, so the system is linear and its weights
   * cannot change sign. The cotangent Laplacian (Pinkall and Polthier 1993),
   * which keeps a planar patch where it is, was tried first: a split's bands
   * are meshed in graded rows and fans, and round f1's forks their obtuse and
   * folded triangles gave negative weights that turned the fill's own triangles
   * over (edges folding by 90 degrees or more round the toes rose from 70 to
   * 106 to 170, as the negative weights were clamped at zero or kept); the
   * umbrella also slides each vertex toward its neighbours' mean, which evens
   * those fans out, and folded fewer (51).
   *
   * The mesh's coincident vertices are read as one (distinct IDs a shared
   * boundary may hold at one position) and moved together, so no seam opens. A
   * region is the vertices whose shortest path along the mesh's edges from the
   * nearest of its sources is shorter than its radius: one source is a disc
   * about a point, a curve's vertices a band along the curve. A region does not
   * reach across a gap to skin the path does not cross. Overlapping regions are
   * solved as one. The system is solved by conjugate gradients on the
   * displacements, symmetric and positive definite on a region whose rim holds
   * it; each coordinate is solved apart.
   *
   * A moved vertex keeps its owner and chart coordinates, which then name the
   * surface point it was moved from: the fill belongs to no surface. Topology,
   * indices and every vertex outside the regions are unchanged.
   *
   * @param mesh The drawn mesh, mm; its positions are changed in place.
   * @param regions Each region's sources as vertex indices of the mesh, at
   *   least one, and its radius along the mesh, mm, positive and finite.
   * @returns How many distinct positions were moved.
   */
  export function fairSolidMesh(
    mesh: IAutoMovieSolidMesh.IMesh,
    regions: IAutoMovieFairSolidMesh.IRegions,
  ): number {
    return fairAutoMovieSolidMeshImplementation(mesh, regions);
  }

  /**
   * Prepare a trimmed face's sampling grid without changing any mesh buffer.
   *
   * Surface jets are queried in station-major order and copied before the next
   * query can reuse a returned vector. Metric-margin corner selection is
   * retained, but a cell touching any trim segment's conservative chart
   * bounding box is left for residual triangulation. Original domain
   * authorities prevent unshared subdivision, while an exactly consumed full
   * side or isolated cell-corner contact can retain its cell. They are not
   * cutting loops. This prevents a small hole inside one cell from being filled
   * merely because its four corners are kept.
   *
   * Boundary points keep their original IDs and use ILoop.chart on this face,
   * independently of the coordinates their global mesh owner stores. Newly
   * reserved grid IDs remain local until a successful face plan is committed.
   * Source/grid/loop data must stay coherent during this synchronous
   * preparation. An explicit numeric physical2 admission failure is a named
   * refusal; actual source callback and ownership errors retain their original
   * thrown identity.
   */
  export function gridSolidMesh(
    mesh: IAutoMovieSolidMesh.IMesh,
    input: IAutoMovieSolidMesh.IFace,
  ): IAutoMovieGridSolidMeshGrid | null | string {
    return gridAutoMovieSolidMeshImplementation(mesh, input);
  }

  /**
   * Exact in-circle sign of a fourth represented binary64 chart point against
   * the circle through three others.
   *
   * The determinant is Lawson's and Guibas–Stolfi's lifted test, `| a-d,
   * |a-d|^2 ; b-d, |b-d|^2 ; c-d, |c-d|^2 |`, positive when `d` lies strictly
   * inside the circle through a counter-clockwise `(a, b, c)`. A conservative
   * floating filter (Shewchuk 1997's first-stage bound, here widened to `16
   * eps` times the permanent) accepts a determinant separated from its rounding
   * error; every other case, including inputs near the underflow range, is
   * evaluated as an integer determinant after the eight inputs are placed on
   * one common dyadic grid. This decides the represented points, without a
   * geometric tolerance, rounding or snapping.
   *
   * @param a First circle point.
   * @param b Second circle point, counter-clockwise after `a`.
   * @param c Third circle point, counter-clockwise after `b`.
   * @param d The point tested.
   * @returns +1 inside, -1 outside and 0 exactly on the circle; for a clockwise
   *   `(a, b, c)` the sign is reversed.
   * @throws RangeError for a nonfinite input coordinate.
   */
  export function incircleSolidChart(
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
    c: Readonly<AutoMovieVector2Tuple>,
    d: Readonly<AutoMovieVector2Tuple>,
  ): number {
    return incircleAutoMovieSolidChartImplementation(a, b, c, d);
  }

  /**
   * Insert admitted residual grid points by splitting the triangles that
   * contain them.
   *
   * Each kept point is located by the exact orientation signs of its
   * represented chart against every triangle occurrence. A point strictly
   * inside one triangle splits it into three; a point exactly on the relative
   * interior of a shared unconstrained diagonal splits the two triangles beside
   * it into four. This is the insertion step of Lawson's incremental
   * triangulation (Lawson 1977, Software for C1 surface interpolation) and of
   * Guibas and Stolfi's InsertSite (1985, ACM Transactions on Graphics 4(2));
   * de Berg et al. (2008, Computational Geometry, section 9.3) state the same
   * two cases. The Delaunay property is restored afterwards by the planner's
   * flips (`legalizeAutoMovieSolidMesh`), not here.
   *
   * Each new triangle is a containing triangle's side and the point, so its
   * orientation is that side's nonzero location sign. When one has no
   * represented strict centroid, a cavity may absorb adjacent triangles across
   * unconstrained sides to make a strict fan. If it reaches an authored
   * constraint, an open boundary or an original point it would remove, the
   * exact split stands and the planner reads membership from its
   * constraint-bounded region (regionAutoMovieSolidMesh).
   *
   * An exact predicate is consistent only on one fixed set of represented
   * coordinates (Shewchuk 1997, Adaptive precision floating-point arithmetic
   * and fast robust geometric predicates), and adding an integer number of
   * periods to a phase rounds, so the same three points read in two covers are
   * two sets. Every decision of one insertion is therefore read in one cover,
   * the inserted point's own: the point keeps its stored phase and each corner
   * stands at its lift relative to the point's sheet, a represented phase that
   * depends only on the corner and that relative lift. Two triangles that meet
   * the point in one sheet thus read their shared side at the same two
   * represented points, so the point is on that side in both or in neither.
   * Each new triangle is published in that same cover, the point first at lift
   * zero, the cover every consumer reads it in: its orientation there is the
   * location sign by construction and is not derived again. Locating in each
   * triangle's stored cover and rechecking each split in a cover that began at
   * the side's first corner read three covers: a grid node on a chord across
   * the phase seam stood 2^-52 rad inside the chord in the first and exactly on
   * it in the last, and the valid split was refused. The split triangles must
   * still span less than half a period in that cover (not exactly half when
   * indexed). Constraint vertices are left with the boundary owner. A point on
   * a source constraint or an unshared boundary has no authoritative
   * subdivision; a point on a vertex, outside the supplied triangles, in more
   * than two of them or in incompatible sheets of one diagonal is refused by
   * name, with its inserted chart and located triangles, before any result is
   * published.
   */
  export function insertSolidMeshPoints(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    constraints: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
    keeps: (u: number, v: number) => boolean,
    period?: number,
    indexed?: boolean,
  ): IAutoMovieSolidMeshPlan.ITriangle[] | string {
    return insertAutoMovieSolidMeshPointsImplementation(
      vertices,
      constraints,
      triangles,
      keeps,
      period,
      indexed,
    );
  }

  /**
   * Flip a triangulation's free diagonals until each is locally Delaunay in the
   * face's uniform metric: the constrained Delaunay triangulation (Lawson
   * 1977).
   *
   * A boundary-only ear triangulation fans a dense rail into triangles of its
   * own consecutive vertices before any interior point exists, and an interior
   * insertion never revisits them. Three points of one curve span its
   * osculating plane, which for a rail on a curved skin stands across the skin,
   * so those triangles stand edge-on and can face inward. Legalization flips a
   * diagonal whose quadrilateral's fourth vertex lies strictly inside the
   * circumcircle of a triangle. An ear's tip is convex, so the circle of three
   * nearly collinear rail vertices bulges into the face and holds the opposite
   * vertex; such a diagonal always flips, joining the tip to the interior.
   *
   * The in-circle test reads the chart with phase multiplied by `scale`:
   * Delaunay under a uniform anisotropic metric (George and Borouchaki 1998,
   * Delaunay Triangulation and Meshing, parametric surfaces), here the face's
   * mean first fundamental form without its shear term. The scale carries the
   * length unit (millimetres of skin per radian), so a body in another unit
   * scales station and scaled phase alike and reads the same decisions up to
   * the rounding of nearly cocircular quadruples, the premise the planner's
   * other rounded admissions already state. The in-circle sign is exact on the
   * represented scaled points of one canonical cover, and that one constant
   * linear map keeps Lawson's termination: a flip lowers the lifted paraboloid
   * surface, so a removed edge never returns and at most `n (n - 1) / 2` flips
   * occur for `n` vertices (Edelsbrunner 2001, Geometry and Topology for Mesh
   * Generation); a longer run is a named failure.
   *
   * A face whose metric changes across it is legalized in its local first
   * fundamental form instead (`local`): each quadrilateral is read about its
   * own centroid under the form its four points span, shear included, the
   * anisotropic Delaunay criterion of the same authors with the metric frozen
   * per test. A face's mean scale left the trunk's triangles beside the
   * armscye's loop, where the skin spans twice the mean per radian, 4 to 7
   * degrees thin on the skin; read without the shear, a twisted band took the
   * longer diagonal of its quads. A flip and its reverse read one quadrilateral
   * and so one form, so no pair of flips undoes itself; the lifting argument no
   * longer bounds longer cycles, and the same flip count stays the named
   * failure.
   *
   * Every source constraint (trim, domain and retained-cell boundaries) is
   * fixed, so the rails, their vertices and the seam they share with another
   * face are unchanged. A flip is admitted only when both new triangles keep
   * the planner's ear rules: positive chart orientation, a represented strict
   * interior (so a flip never makes a sliver; one an exact insertion split made
   * may stay, read by its region), a sub-half-period phase span (strict when
   * indexed), a new vertex pair absent from the face's edges, its constraints
   * and the occupied global pairs. Each quadrilateral is read in one canonical
   * cover, its least vertex ID's occurrence at lift zero, so a flip and its
   * reverse read the same four represented points. Free diagonals are visited
   * in triangle and corner order, and every flip queues its four outer sides in
   * that order.
   *
   * @param vertices Indexed native chart positions; no coordinate changes.
   * @param constraints Subdivided source constraints, never flipped.
   * @param triangles Positive triangle occurrences covering the region once.
   * @param period Positive phase period, absent for a planar chart.
   * @param indexed Whether the consumer drops lifts into a global index buffer,
   *   which forbids a half-period span.
   * @param occupied Prior global endpoint pairs `minID/maxID` a new diagonal
   *   cannot reuse.
   * @param scale Phase scale of the uniform metric, positive and finite, in
   *   length units per radian.
   * @param local A quadrilateral's own first fundamental form from its four
   *   vertex IDs and their chart points in its cover, as `[shear, scale]` for
   *   the map `(u, v) -> (u + shear v, scale v)`, read in place of `scale`, so
   *   the face is Delaunay in the metric each quadrilateral spans; absent,
   *   `scale` holds everywhere with no shear. A flip and its reverse read the
   *   same four points and so the same form.
   * @returns New positive triangle occurrences over the same region and
   *   vertices, or the broken premise.
   */
  export function legalizeSolidMesh(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    constraints: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
    period: number | undefined,
    indexed: boolean,
    occupied: ReadonlySet<string> | undefined,
    scale: number,
    local?: (
      ids: readonly number[],
      charts: readonly [number, number][],
    ) => [number, number],
  ): IAutoMovieSolidMeshPlan.ITriangle[] | string {
    return legalizeAutoMovieSolidMeshImplementation(
      vertices,
      constraints,
      triangles,
      period,
      indexed,
      occupied,
      scale,
      local,
    );
  }

  /**
   * Turn the construction curves of one built form into inspection marks that
   * follow the scene object the form was built into.
   *
   * Each curve becomes one polyline mark, closed for a section ring, of kind
   * `curve/section`, `curve/guide` or `curve/axis`. Its path is `anchor`
   * followed by the curve's `id`, such as `hero/torso/section/3`, so a pattern
   * that selects the form's object selects its curves, and one pattern can name
   * one ring. The curve's points are the form at rest in the object's local
   * frame, which is why the object is the anchor. A curve the sampler flagged
   * stays flagged.
   *
   * | Kind            | Label           | Colour         |
   * | --------------- | --------------- | -------------- |
   * | `curve/section` | `section curve` | Blue `59a0f4`  |
   * | `curve/guide`   | `guide curve`   | Green `59cb89` |
   * | `curve/axis`    | `axis curve`    | Cyan `00e5ff`  |
   *
   * ```ts
   * const marks = markAutoMovieConstructionCurves(
   *   sampleAutoMovieConstructionCurves(realization),
   *   "hero",
   * );
   * ```
   *
   * @param curves The curves of one form, as
   *   `sampleAutoMovieConstructionCurves` returns them.
   * @param anchor Path of the scene object the form was built into, or the
   *   empty string for the scene root.
   * @returns One mark per curve, in the curves' order.
   */
  export function markConstructionCurves(
    curves: readonly IAutoMovieConstructionCurve[],
    anchor: string,
  ): IAutoMovieMark[] {
    return markAutoMovieConstructionCurvesImplementation(curves, anchor);
  }

  /** Read exposed source-domain cycles from the complete positive index plan. */
  export function openSolidMesh(
    chart: ReadonlyMap<number, readonly [number, number]>,
    triangles: readonly IAutoMovieSolidMeshPlan.ITriangle[],
    constraints: readonly IAutoMovieSolidMeshConstraints.IEdge[],
    trimCount: number,
    domainCount: number,
    first: number,
    last: number,
    period?: number,
  ): IAutoMovieOpenSolidMeshResult | string {
    return openAutoMovieSolidMeshImplementation(
      chart,
      triangles,
      constraints,
      trimCount,
      domainCount,
      first,
      last,
      period,
    );
  }

  /**
   * Exact orientation sign of three represented binary64 chart points.
   *
   * A conservative arithmetic filter accepts a determinant separated from its
   * rounding error. Ambiguous, underflowed or overflowed arithmetic is
   * evaluated as an integer determinant after the six binary64 inputs are
   * placed on one common dyadic grid. This decides the represented points,
   * without a geometric tolerance, coordinate rounding, snapping or new
   * intersection construction.
   *
   * @param a First finite chart point.
   * @param b Second finite chart point.
   * @param c Third finite chart point.
   * @returns +1 for counterclockwise, -1 for clockwise and 0 for exact
   *   collinearity.
   * @throws RangeError for a nonfinite input coordinate.
   */
  export function orientSolidChart(
    a: Readonly<AutoMovieVector2Tuple>,
    b: Readonly<AutoMovieVector2Tuple>,
    c: Readonly<AutoMovieVector2Tuple>,
  ): number {
    return orientAutoMovieSolidChartImplementation(a, b, c);
  }

  /**
   * Select a represented left-side probe with an independently checked
   * corridor.
   *
   * A boundary walk is one face cycle: the face lies on the left of every one
   * of its edges, so a probe witnessed beside any edge reads that face's
   * membership. The edges are tried in walk order and the first witnessed
   * corridor is returned. Reading the first edge alone failed where a curve met
   * a straight constraint at a grazing angle: the curve's last vertex stood
   * 1e-14 off the line, a few units of the last place at the chart's scale, so
   * its short edge to the line had no represented corridor on either side,
   * though the face beside every other edge of the same walk was wide.
   */
  export function probeSolidMesh(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    walk: IAutoMovieSolidMeshIncidence.IWalk,
    period: number | undefined,
  ): Readonly<AutoMovieVector2Tuple> | string {
    return probeAutoMovieSolidMeshImplementation(vertices, edges, walk, period);
  }

  /**
   * Apply one explicitly requested C2 material rotation to an admitted base
   * axis.
   *
   * Input stations are millimetres. At `to`, the target's normal-plane
   * components determine the shortest signed angle from base u towards v, with
   * positive pi for the exact half turn. The shared scalar source's two knots
   * have zero normalized first/second jets, giving the quintic 10t^3-15t^4+6t^5
   * without another interpolator. Before from the base frame is returned
   * unchanged; after to its constant material rotation is transported by that
   * same base axis. Origin and normal plane are preserved throughout.
   *
   * Direction admission reuses the jointed initial-up policy: relative normal
   * projection must exceed 1e-9, limiting projection condition number to below
   * 1e9. This rejects some finite nonparallel directions. For endpoint
   * components (c,s), their first-order angle perturbation is bounded by
   * hypot(dc,ds)/hypot(c,s); a small projected norm amplifies input, frame and
   * dot-product error. This numerical conditioning policy is not an anatomical
   * tolerance, an exact-zero test or a universal absolute angle-accuracy
   * guarantee. The supplied base must already be an admitted orthonormal C2
   * axis. Its analytic-jet support, when present, is carried through the same
   * rotation in station or a requested pole coordinate; this wrapper does not
   * repair the base centreline. Queries use finite stations.
   *
   * @param base Admitted C2 orthonormal frame function.
   * @param from Finite transition start station, mm.
   * @param to Finite transition end station, mm, strictly greater than from.
   * @param up Signed endpoint target in the construction frame; direction only.
   * @returns Rotated axis or the named station/target/source admission failure.
   */
  export function rollViewAxis(
    base: IAutoMovieViewAxis.IAxis,
    from: number,
    to: number,
    up: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxis.IAxis | string {
    return rollAutoMovieViewAxisImplementation(base, from, to, up);
  }

  /**
   * Binary64 root candidates of a source polynomial of degree at most nine
   * inside the unit interval.
   *
   * Derivative-root candidates partition intervals before 60 bisections. A cut
   * whose residual is within 64 epsilon times the normalized coefficient sum is
   * retained as a multiple-root observation. Constant polynomials have no
   * isolated roots. Ill-conditioned or nearby multiple roots need not be
   * separated; near-zero cuts may add observations. This is not an interval
   * certificate or a root-completeness guarantee.
   *
   * @param coefficients Finite coefficients in increasing power order, at most
   *   ten; empty or constant rows return no isolated roots. Invalid rows throw
   *   RangeError.
   */
  export function rootsViewPolynomial(
    coefficients: readonly number[],
  ): number[] {
    return rootsAutoMovieViewPolynomialImplementation(coefficients);
  }

  /**
   * Binary64 zero candidates of P(t)+amplitude_sin(offset+span_t) on a closed
   * subinterval of [0,1].
   *
   * P has degree at most four and the angular interval lies in [0,pi]. After
   * degree(P)+1 derivatives only a sine or cosine remains, whose interior zeros
   * are known. Recursing back partitions each derivative into monotone
   * intervals; sign-changing brackets are bisected, while near-zero derivative
   * cuts retain multiple-root observations. The sine is evaluated as sine,
   * never fitted to a polynomial. This is a numerical critical-point
   * observation, not an interval certificate: roots closer than floating-point
   * resolution and near-multiple residuals need not be separately resolved.
   *
   * @param coefficients Finite polynomial coefficients in increasing power
   *   order, one through five.
   * @param offset Angular parameter at t=0, radians.
   * @param span Positive angular parameter interval, radians, wholly inside
   *   [0,pi].
   * @param amplitude Finite sine coefficient in the same units as P.
   * @param interval Requested closed local parameter subinterval.
   * @returns Interior root candidates or the numerical premise that failed.
   */
  export function rootsViewSinPolynomial(
    coefficients: readonly number[],
    offset: number,
    span: number,
    amplitude: number,
    interval?: readonly [number, number],
  ): number[] | string {
    return rootsAutoMovieViewSinPolynomialImplementation(
      coefficients,
      offset,
      span,
      amplitude,
      interval,
    );
  }

  /**
   * Sample the construction lines of every lofted chain of a realization as
   * polylines in metres: its section rings, its four guide rails and its axis,
   * so an inspection can draw what a form was built from.
   *
   * Each chain is read through the surface of its own name, a map from station
   * in millimetres and phase in radians to a point in millimetres, through
   * `point` when the surface has one and `jet(...).p` otherwise. The chain's
   * owned station range is the surface's `domain`, or its first to last layer
   * when the surface names none. Points are divided by
   * `AutoMovieConstructionViews.SCALE`, so they come out in metres in the
   * construction tree's frame.
   *
   * A `section` is the closed ring at one principal layer station inside the
   * owned range, sampled at `options.phases` uniform phases starting at phase
   * 0, and its id carries the layer's ordinal in the chain. A `guide` is the
   * open rail at one quarter phase, `0`, `pi / 2`, `pi` and `3 pi / 2` for
   * quarters 0 to 3. The `axis` is the open line through the mean of each
   * ring's samples. Guides and axis share one station list: both ends of the
   * owned range, every layer station inside it, and `options.steps` equal
   * subdivisions of each interval between consecutive ones, in ascending order.
   * A guide point is its ring's sample at that quarter, so guide 0 passes
   * through the first point of every section.
   *
   * The axis is the centroid line of the sampled rings, the plain mean of
   * uniform-phase samples. It is not the authored frame origin of the chain,
   * which a section need not surround evenly, and it is neither the arc-length
   * nor the area centroid of the ring.
   *
   * A sample with a non-finite component is left out and flags its curve. An
   * axis point is left out, and the axis flagged, whenever its ring has such a
   * sample. A curve left with fewer than two points is not returned. Every
   * curve of a chain whose name equals a diagnostic's `node` is flagged. Curves
   * come chain by chain in the realization's order: sections in layer order,
   * guides 0 to 3, then the axis.
   *
   * It throws a named `Error` for `phases` that is not a whole number of at
   * least 8 that four divides, for `steps` that is not a positive whole number,
   * for a chain with no surface of its name, and for a chain whose owned range
   * is not finite and ordered. An error thrown by the surface itself
   * propagates.
   *
   * @param realization The chains, their surfaces and the diagnostics of one
   *   realization. It is read and not changed.
   * @param options `phases` is the samples per ring, default 48. `steps` is the
   *   subdivisions of each station interval along a guide and the axis, default
   *   8.
   * @returns The curves of every chain, in the documented order.
   */
  export function sampleConstructionCurves(
    realization: Pick<
      IAutoMovieConstructionRealization.IRealization,
      "chains" | "surfaces" | "diagnostics"
    >,
    options?: IAutoMovieSampleConstructionCurves.IOptions,
  ): IAutoMovieConstructionCurve[] {
    return sampleAutoMovieConstructionCurvesImplementation(
      realization,
      options,
    );
  }

  /**
   * Candidate support stations for the fixed-chart scalar function
   * slope_s+valueScale_outline(s).
   *
   * The domain is a closed subset of the original knot span; open extensions
   * and moving frames are excluded. Named knots and domain endpoints join the
   * analytic derivative-root candidates. A constant offset has no effect on
   * these stations. Identity/root source parameters give polynomial
   * derivatives; the two-pole angle gives
   * P(theta)+slope_stationSpan/2_sin(theta), preserving its actual
   * trigonometric term. Critical roots are binary64 observations, not certified
   * interval enclosures or an exact extrema promise.
   *
   * @param outline Admitted original scalar source in kernel station units.
   * @param slope Affine-origin coefficient, output units per station unit.
   * @param valueScale Multiplier converting the original ordinate to output
   *   units.
   * @param domain Finite increasing closed subinterval of the original knot
   *   span.
   * @returns Endpoints, included named knots and numerical interior critical
   *   stations, or an explicit failure.
   */
  export function supportViewOutline(
    outline: IAutoMovieViewOutline.IOutline,
    slope: number,
    valueScale: number,
    domain: readonly [number, number],
  ): number[] | string {
    return supportAutoMovieViewOutlineImplementation(
      outline,
      slope,
      valueScale,
      domain,
    );
  }

  /**
   * Ear-remove one admitted positive, zero-winding native boundary walk.
   *
   * The incidence owner supplies a weakly simple face boundary after its hole
   * bridges. Repeated bridge endpoints are the same corner only when both their
   * original ID and cover lift agree. All other vertices, including collinear
   * subdivisions on a proposed diagonal, block the ear. Cover-aware output may
   * span half a phase period; indexed output requires strictly less because it
   * discards the lifts. Exhausted searches return a named failure with the
   * remaining prepared occurrences and edge turns, without another source
   * query.
   *
   * This is the same convex-ear principle used by the repository's trianglesOf,
   * with a different admission boundary: native mixed-unit charts use exact
   * represented-point signs, rather than the free-form region's absolute area
   * tolerance. No free-form geometry predicate or caller is changed.
   *
   * Every ear uses the shorter original occurrence arc, tip ID and lift as its
   * integer key. A periodic cut additionally stays within the maximum phase
   * travel of two adjacent primitives in the supplied original walk, including
   * its bridges. This sampling-locality limit prevents unconstrained long fans;
   * it neither changes a coordinate nor ranks near-equal coordinate groups.
   * Equal keys retain the first occurrence in the supplied linear walk, so
   * arbitrary weak-walk rotation is not promised. Identical occurrence order,
   * IDs/lifts and all admission decisions imply identical integer selections at
   * every length unit. Rounded geometric admission can still differ.
   *
   * Locality remains a bounded heuristic: long primitives/bridges can make it
   * loose, and a valid walk needing a longer diagonal can be refused. It is
   * neither a complete triangulator nor a continuous world chord/normal bound.
   * Optional occupied global endpoint pairs exclude new interior diagonals
   * while original boundary links retain their declared source identity. This
   * does not certify vertex manifoldness or repair inconsistent source
   * correspondence.
   */
  export function triangulateSolidBoundary(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    walk: IAutoMovieSolidMeshIncidence.IWalk,
    period?: number,
    indexed?: boolean,
    occupied?: ReadonlySet<string>,
  ): IAutoMovieSolidMeshPlan.ITriangle[] | string {
    return triangulateAutoMovieSolidBoundaryImplementation(
      vertices,
      walk,
      period,
      indexed,
      occupied,
    );
  }

  /**
   * Check the empty native triangle between a represented edge and a probe.
   *
   * A floating distance is useful for proposing a small probe, but its error is
   * not a topology proof. This reading checks represented boundary vertices and
   * segment intersections on the proposed triangle with exact orientation
   * signs. A successful probe is connected to the edge's open side through that
   * empty triangle. Source endpoints are ignored only by original ID and cover
   * image.
   *
   * Periodic checks use local images for one-period primitives and a probe
   * whose phase range is no larger than one period. Safe integer/image
   * arithmetic is required. This validates the represented local partition, not
   * an interval enclosure of a curved boundary, world distance or arbitrary
   * winding domain.
   */
  export function witnessSolidChartTriangle(
    vertices: ReadonlyMap<number, Readonly<AutoMovieVector2Tuple>>,
    edges: readonly IAutoMovieSolidMeshConstraints.ISegment[],
    edge: IAutoMovieSolidMeshConstraints.ISegment,
    probe: Readonly<AutoMovieVector2Tuple>,
    period?: number,
  ): boolean | string {
    return witnessAutoMovieSolidChartTriangleImplementation(
      vertices,
      edges,
      edge,
      probe,
      period,
    );
  }
}
