import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";
import type { HumanPiecewiseStationPort } from "./HumanPiecewiseStationPort";
import type { HumanStationPort } from "./HumanStationPort";
import type { HumanPelvisSeams } from "../pelvis/HumanPelvisSeams";
import type { HumanPelvisNativePencilFamily } from "../pelvis/HumanPelvisNativePencilFamily";

/** Main-owned diagnostic adapter for the actual whole-Hip boundary.
 * Borrows the actual whole Hip and already chosen seam endpoint addresses.
 * A caller-specified directed original-piece arc fixes correspondence; no
 * shortest phase, nearest point, world-Z role or tangent average is selected.
 * Free-u lateral patches end on a newly generated true-quarter trace. That
 * trace is not joined to the existing first-shaft boundary by this adapter.
 */
export namespace HumanPelvisLateralPreviewAdapter {
  type V = HumanCurve.Vector;
  type Query = HumanPiecewiseStationPort.Query;
  type Contact = HumanPiecewiseStationPort.Contact;
  type Plane = HumanPelvisNativePencilFamily.Plane;

  /** One unchanged canonical-feature piece and its generated physical phase width. */
  export interface Piece {
    /** Original consecutive owner index, not a re-fitted arc. */
    index: number;

    /** Canonical feature phase at local t=0, radians; not geometric polar angle. */
    phaseStartRadians: number;

    /** Positive affine dpsi/dt, radians per normalized local parameter. */
    phaseWidthRadians: number;

    /** Actual whole-section physical phase width W at this Hip station. */
    physicalWidthMm: number;

    /** Main's existing feature-node qualification, before this piece. */
    joinBefore: "G1" | "C0" | "unsupported";
  }

  /** Existing seam endpoint bound to its exact original piecewise query address. */
  export interface BoundEndpoint {
    /** Existing network.across/posterior.endpoints[0], same whole-Hip boundary. */
    endpoint: HumanPelvisSeams.Endpoint;

    /** Exact selected original query address, including piece and side. */
    contact: Contact;

    /** Existing full query that owns this actual contact object. */
    query: Query;
  }

  /** Raw root evidence survives an ordinary StationPort selection failure. */
  export interface QueryReceipt {
    /** Main obtains this from its existing full piecewise query, including all
     * roots and partial/flat/multiple/rejected records. A failed StationPort
     * selection does not remove the preceding raw query evidence.
     */
    query: Query;

    /** Existing outer StationPort selector may reject unrelated roots. */
    stationPortFailure?: string;
  }

  /** Main supplies actual boundaries, root authority and one directed lateral arc. */
  export interface Input {
    /** Same transported whole-Hip port consumed by trunk and existing pelvic guides. */
    hip: HumanStationPort.Result;

    /** Every original ordered Hip piece, retaining its phase map and physical W. */
    pieces: readonly Piece[];

    /** Existing projected-forward plane defining the outer endpoint and v=0. */
    across: Plane;

    /** Existing own-side signed forward plane defining the posterior v=1 edge. */
    posterior: Plane;

    /** Already selected outer Hip contact; its point is reused without re-querying. */
    start: BoundEndpoint;

    /** Already selected posterior Hip contact on the same whole boundary. */
    end: BoundEndpoint;

    /** Main's source-corresponding canonical-feature direction. It is not
     * inferred from endpoint distances. For the established common Hip chart
     * the qualified left lateral arc decreases psi; the right increases psi.
     */
    direction: 1 | -1;

    /** Current generated proximal thigh_side support, mm in the common frame. */
    thighSupportMm: V;

    /** Current generated distal calf_side support, mm; fixes the directed bone chord. */
    calfSupportMm: V;

    /** Existing main root query callback, consuming a unit plane. It must
     * publish the complete Query even if its ordinary two-contact selector
     * throws. This adapter neither implements nor replaces root isolation.
     */
    query: (normal: V, coordinateMm: number) => QueryReceipt;

    /** Explicit bound on distinct cached v queries, including endpoints. */
    maxCachedV: number;
  }

  /** One actual v query or reused endpoint, including every unsupported root record. */
  export interface Sample {
    /** Dimensionless outer-to-posterior pencil coordinate in the closed unit interval. */
    v: number;

    /** Unnormalized affine plane used by the implicit differentiation formulas. */
    rawPlane: Plane;

    /** Geometrically equivalent unit plane supplied to the existing root API. */
    normalizedQueryPlane: Plane;

    /** Unchanged all-piece root query, including rejected and outside-route contacts. */
    originalQuery: Query;

    /** Outer selector's error, if its rejection preceded this retained raw receipt. */
    stationPortFailure?: string;

    /** All route candidates remain original addresses; endpoint aliases are
     * resolved only by the declared ordinary-G1 following-side policy.
     */
    routeContactIds: readonly string[];

    /** Original query-local contact ID, set before implicit-jet admission. */
    selectedContactId?: string;

    /** Rounded original fixed-feature psi representative, radians. */
    canonicalPhaseRadians?: number;

    /** dpsi/dv, radians per dimensionless pencil coordinate, when evaluated. */
    phaseFirst?: number;

    /** d2psi/dv2, radians per dimensionless v squared, when evaluated. */
    phaseSecond?: number;

    /** Raw plane equation evaluated on the unchanged actual owner point, mm. */
    rawPlaneResidualMm?: number;

    /** Raw normal dot dP/dpsi, mm/radian; exposes transversality and direction. */
    rawNormalPhaseSpeedMmPerRadian?: number;

    /** Local admission failure; all preceding addresses and numeric evidence remain. */
    failure?: string;
  }

  /** Bounded query history and unresolved domain facts for the diagnostic strip. */
  export interface Report {
    /** Complete original outer/posterior endpoint queries, borrowed before continuation. */
    originalEndpointQueries: readonly [Query, Query];

    /** Every callback query, including rejected/unsupported candidates. */
    samples: Sample[];

    /** Original intermediate node identities whose C0 or unknown class blocks this arc. */
    unsupportedArcNodes: { index: number; classification: Piece["joinBefore"] }[];

    /** Original adjacent phase-map endpoints in radians, without epsilon gap closure. */
    phaseMapJoins: { previousPiece: number; nextPiece: number; leftEndRadians: number; rightStartRadians: number }[];

    /** Callback failures that returned no raw receipt, retaining v and the queried plane. */
    unpublishedQueries: { v: number; normalizedPlane: Plane; condition: string }[];

    /** Remaining phase, source, first-shaft join and whole-pelvis qualifications. */
    limitations: readonly string[];
  }

  /** True-quarter plane and cached actual-Hip inverse jets for one lateral family. */
  export interface Result {
    /** Plane at one quarter of the actual directed thigh-to-calf support chord. */
    trueQuarter: Plane;

    /** Borrow P and derive exact chart jets on the main-prescribed original arc. */
    hip: (v: number) => HumanPelvisNativePencilFamily.HipJet;

    /** Live retained endpoint/root evidence; this does not certify embedding or fidelity. */
    report: Report;
  }

  /** Prepare only the free-u diagnostic candidate's Hip/root adapter.
   * Full C1 normal-v jets are intentionally absent: they require the actual
   * shared surface field and a separately identified fixed-C1-u2 law.
   */
  export function build(input: Input): Result {
    const pieces: readonly Piece[] = input.pieces;
    const totalPhase: number = input.hip.boundary.end - input.hip.boundary.start;
    const physicalTotal: number = pieces.reduce((sum: number, piece: Piece): number => sum + piece.physicalWidthMm, 0);
    if (!pieces.length || !Number.isSafeInteger(input.maxCachedV) || input.maxCachedV < 2 ||
        (input.direction !== 1 && input.direction !== -1) ||
        pieces.some((p: Piece, i: number): boolean => p.index !== i || !(p.phaseWidthRadians > 0 && p.physicalWidthMm > 0) ||
          ![p.phaseStartRadians, p.phaseWidthRadians, p.physicalWidthMm].every(Number.isFinite)) ||
        input.hip.boundary.start !== 0 || !(totalPhase > 0 && Number.isFinite(totalPhase) && Number.isFinite(physicalTotal)))
      throw new Error("Original ordered piece/physical phase authority and a bounded query policy are required.");
    for (let i: number = 0; i < pieces.length; ++i) {
      if ((i === 0 && pieces[i]!.phaseStartRadians !== 0) ||
          (i > 0 && pieces[i]!.phaseStartRadians <= pieces[i - 1]!.phaseStartRadians))
        throw new Error("Main must supply the unchanged ordered canonical-feature piece maps.");
    }
    const start: number = input.start.endpoint.parameter;
    const end: number = input.end.endpoint.parameter;
    const mod = (x: number): number => {
      const remainder: number = x % totalPhase;
      return remainder < 0 ? remainder + totalPhase : remainder;
    };
    const directed = (phase: number): number => mod(input.direction * (phase - start));
    const width: number = directed(end);
    if (!(width > 0 && width < totalPhase)) throw new Error("Distinct endpoints and an explicit directed lateral arc are required.");
    const quarter: Plane = trueQuarter(input.thighSupportMm, input.calfSupportMm);
    const report: Report = { originalEndpointQueries: [input.start.query, input.end.query], samples: [], unsupportedArcNodes: [],
      phaseMapJoins: pieces.map((piece: Piece, i: number): Report["phaseMapJoins"][number] => ({ previousPiece: i,
        nextPiece: (i + 1) % pieces.length, leftEndRadians: piece.phaseStartRadians + piece.phaseWidthRadians,
        rightStartRadians: i + 1 === pieces.length ? totalPhase : pieces[i + 1]!.phaseStartRadians })), unpublishedQueries: [], limitations: [
      "Two free-u diagnostic lateral patches only; the new quarter trace is not the existing first-shaft boundary and is not joined to it.",
      "Original raw and normalized plane-query representations, all polynomial roots, rejected contacts and unresolved sets remain evidence.",
      "Implicit derivatives use raw affine-pencil coefficients. Binary64 normalized-query root representatives are not exact roots of the raw unrounded pencil equation.",
      "Physical phase p, fixed feature psi and pencil v retain their explicit Jacobians; physical width is not source arc length or source h.",
      "C0, unqualified joins, tangent/reversing/ambiguous routes and incomplete route-piece root sets are unsupported, without point movement or an alternate arc.",
      "Interior/anterior/male extra branching domains, embedding, actual target fidelity and whole-pelvis assembly remain unqualified.",
    ] };
    const relevantPieces: Set<number> = new Set();
    for (const piece of pieces) {
      const a: number = input.direction * (piece.phaseStartRadians - start);
      const b: number = input.direction * (piece.phaseStartRadians + piece.phaseWidthRadians - start);
      for (const turn of [-1, 0, 1])
        if (Math.max(a, b) + turn * totalPhase > 0 && Math.min(a, b) + turn * totalPhase < width)
          relevantPieces.add(piece.index);
      const distance: number = directed(piece.phaseStartRadians);
      if (distance > 0 && distance < width && piece.joinBefore !== "G1")
        report.unsupportedArcNodes.push({ index: piece.index, classification: piece.joinBefore });
    }
    const physicalPrefix: number[] = [0];
    for (const piece of pieces) physicalPrefix.push(physicalPrefix.at(-1)! + piece.physicalWidthMm);
    const cache: Map<number, HumanPelvisNativePencilFamily.HipJet | Error> = new Map();

    const pullback = (contact: Contact, raw: Plane, record: Sample): HumanPelvisNativePencilFamily.HipJet => {
      const owner: HumanCurveFamily.Jet | undefined = contact.sourceJet;
      const second: V | undefined = owner?.phaseSecondDerivativeMmPerRadianSquared;
      if (contact.admission !== "simple-at-representative" || owner === undefined || second === undefined)
        throw new Error("The retained original address has no admitted one-sided second jet.");
      const P: V = owner.positionMm;
      const D: V = owner.phaseDerivativeMmPerRadian;
      const deltaN: V = subtract(input.posterior.normal, input.across.normal);
      const deltaC: number = input.posterior.coordinateMm - input.across.coordinateMm;
      const denominator: number = dot(raw.normal, D);
      const first: number = (deltaC - dot(deltaN, P)) / denominator;
      const secondPhase: number = -(dot(raw.normal, second) * first * first + 2 * dot(deltaN, D) * first) / denominator;
      record.selectedContactId = contact.id;
      record.canonicalPhaseRadians = contact.phaseRadiansApproximation;
      record.phaseFirst = first; record.phaseSecond = secondPhase;
      record.rawPlaneResidualMm = dot(raw.normal, P) - raw.coordinateMm;
      record.rawNormalPhaseSpeedMmPerRadian = denominator;
      if (![denominator, first, secondPhase].every(Number.isFinite) || denominator === 0 || first * input.direction <= 0)
        throw new Error("Actual implicit Hip root is tangent, reversing or nonfinite on the prescribed directed arc.");
      const piece: Piece = pieces[contact.pieceIndex]!;
      const phase: number = contact.phaseRadiansApproximation;
      const local: number = contact.root.approximation;
      const turns: number = input.direction === 1 ? (phase < start ? 1 : 0) : (phase > start ? -1 : 0);
      const phaseScale: number = piece.physicalWidthMm / piece.phaseWidthRadians;
      const physical: readonly [number, number, number] = [
        physicalPrefix[contact.pieceIndex]! + piece.physicalWidthMm * local + turns * physicalTotal,
        phaseScale * first, phaseScale * secondPhase,
      ];
      return { P, Pv: scale(D, first), Pvv: add(scale(second, first * first), scale(D, secondPhase)), physicalPhaseMm: physical };
    };

    const rawPlane = (v: number): Plane => ({
      normal: input.across.normal.map((x: number, i: number): number => (1 - v) * x + v * input.posterior.normal[i]!) as V,
      coordinateMm: (1 - v) * input.across.coordinateMm + v * input.posterior.coordinateMm,
    });
    const endpoint = (v: 0 | 1, bound: BoundEndpoint): void => {
      if (bound.endpoint.curve !== input.hip.boundary || !bound.query.contacts.includes(bound.contact) ||
          bound.contact.stationContact?.phaseRadians !== bound.endpoint.parameter)
        throw new Error("Main must bind the existing endpoint's exact selected original contact, not a nearest phase.");
      const raw: Plane = rawPlane(v);
      const record: Sample = { v, rawPlane: raw, normalizedQueryPlane: bound.query.plane,
        originalQuery: bound.query, routeContactIds: [bound.contact.id] };
      report.samples.push(record);
      try { cache.set(v, pullback(bound.contact, raw, record)); }
      catch (error) { const failure: Error = new Error(message(error)); record.failure = failure.message; cache.set(v, failure); }
    };
    endpoint(0, input.start); endpoint(1, input.end);

    const sample = (v: number): HumanPelvisNativePencilFamily.HipJet => {
      if (!Number.isFinite(v) || v < 0 || v > 1) throw new Error("Pencil v must stay in the main-owned lateral interval.");
      if (report.unsupportedArcNodes.length) throw new Error("The prescribed arc crosses retained C0 or unqualified nodes: " + JSON.stringify(report.unsupportedArcNodes));
      const previous: HumanPelvisNativePencilFamily.HipJet | Error | undefined = cache.get(v);
      if (previous instanceof Error) throw previous;
      if (previous !== undefined) return previous;
      if (cache.size >= input.maxCachedV) throw new Error("Distinct implicit Hip queries exceed the explicit cache/query budget.");
      const raw: Plane = rawPlane(v);
      const length: number = Math.hypot(...raw.normal);
      if (!(length > 0 && Number.isFinite(length))) throw new Error("Pencil guide normal degenerates before root isolation.");
      const normalized: Plane = { normal: scale(raw.normal, 1 / length), coordinateMm: raw.coordinateMm / length };
      let receipt: QueryReceipt;
      try { receipt = input.query(normalized.normal, normalized.coordinateMm); }
      catch (error) {
        const failure: Error = new Error(message(error));
        report.unpublishedQueries.push({ v, normalizedPlane: normalized, condition: failure.message });
        cache.set(v, failure); throw failure;
      }
      const query: Query = receipt.query;
      const route: Contact[] = query.contacts.filter((contact: Contact): boolean => directed(contact.phaseRadiansApproximation) <= width);
      const record: Sample = { v, rawPlane: raw, normalizedQueryPlane: normalized, originalQuery: query,
        stationPortFailure: receipt.stationPortFailure, routeContactIds: route.map((contact: Contact): string => contact.id) };
      report.samples.push(record);
      try {
        if (query.status === "invalid" || [...relevantPieces].some((index: number): boolean =>
          query.pieces.find((piece: HumanPiecewiseStationPort.PieceResult): boolean => piece.pieceIndex === index)?.isolation?.status !== "complete"))
          throw new Error("A relevant original Hip piece has a flat, partial, invalid or uninspected root set.");
        const groups: Map<string, Contact[]> = new Map();
        for (const contact of route) {
          const node: number = (contact.pieceIndex + (contact.side === "end" ? 1 : 0)) % pieces.length;
          const key: string = contact.side === "interior" ? "interior:" + contact.id : "node:" + node;
          const group: Contact[] = groups.get(key) ?? []; group.push(contact); groups.set(key, group);
        }
        const selected: Contact[] = [];
        for (const [key, group] of groups) {
          if (key.startsWith("interior:")) { selected.push(group[0]!); continue; }
          const node: number = Number(key.slice(5));
          const following: Contact | undefined = group.find((contact: Contact): boolean => contact.side === "start" && contact.pieceIndex === node);
          if (pieces[node]?.joinBefore !== "G1" || group.length !== 2 || !group.every((contact: Contact): boolean => contact.root.exactRational) || !following)
            throw new Error("An original endpoint alias has no declared paired ordinary-G1 following-side authority.");
          selected.push(following);
        }
        if (selected.length !== 1) throw new Error("Prescribed arc has zero or multiple root candidates; no alternate branch is inferred.");
        const value: HumanPelvisNativePencilFamily.HipJet = pullback(selected[0]!, raw, record);
        cache.set(v, value); return value;
      } catch (error) {
        const failure: Error = new Error(message(error)); record.failure = failure.message; cache.set(v, failure); throw failure;
      }
    };
    return { trueQuarter: quarter, hip: sample, report };
  }

  /** Reuse the existing main StationPort call and its live raw-query receipt
   * array. Even a rejected ordinary two-contact selector leaves its complete
   * preceding polynomial query available. No root solver is duplicated.
   */
  export function queryFromAssembly(hip: HumanStationPort.Result, liveQueries: readonly Query[]): Input["query"] {
    return (normal: V, coordinateMm: number): QueryReceipt => {
      const before: number = liveQueries.length;
      let failure: string | undefined;
      try { hip.contacts(normal, coordinateMm); }
      catch (error) { failure = message(error); }
      const added: readonly Query[] = liveQueries.slice(before);
      if (added.length !== 1)
        throw new Error("The borrowed main Hip must publish exactly one complete raw query receipt per contacts call; observed " + added.length);
      return { query: added[0]!, ...(failure === undefined ? {} : { stationPortFailure: failure }) };
    };
  }

  /** Same directed support chart as the original native thigh work interval.
   * Ideal .25 has no special original acquired closed section: the historical
   * observer's first chosen closed port was the separate 10 mm ceil grid cut.
   */
  export function trueQuarter(thigh: V, calf: V): Plane {
    const delta: V = subtract(calf, thigh);
    const length: number = Math.hypot(...delta);
    if (![...thigh, ...calf].every(Number.isFinite) || !(length > 0 && Number.isFinite(length)))
      throw new Error("True quarter requires finite distinct actual thigh-to-calf supports.");
    const normal: V = scale(delta, 1 / length);
    const point: V = add(thigh, scale(delta, 0.25));
    return { normal, coordinateMm: dot(normal, point) };
  }

  const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const subtract = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (a: V, value: number): V => [a[0] * value, a[1] * value, a[2] * value];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const message = (error: unknown): string => error instanceof Error ? error.message : String(error);
}
