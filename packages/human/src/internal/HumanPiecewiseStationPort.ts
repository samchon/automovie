import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveFamily } from "./HumanCurveFamily";
import type { HumanPolynomialRoots } from "./HumanPolynomialRoots";
import type { HumanStationPort } from "./HumanStationPort";
import type { HumanSurface } from "./HumanSurface";

/** Nonradial station contacts; main owns selection and shared boundaries.
 * Each original closed local piece is queried independently. Exact binary64
 * scalar roots retain their addresses, including both sides of a C0 endpoint.
 * Owner jets remain the shape authority; polynomial coefficient formation and
 * representative evaluation do not certify upstream error or an exact jet at
 * an irrational root. No curve, phase, branch or source feature is fitted.
 *
 * @evidence contracts/common.md#principled-implementation Full ascending world powers form each plane polynomial; the injected exact root authority preserves all roots, multiplicities and unresolved sets. Analytic cross-product differentiation consumes the unchanged owner's one-sided jets.
 * @evidence contracts/common.md#clear-and-simple-design Query retains every piece result; explicit main selection is the sole adapter to the existing StationPort interface. Boundary identity and phase Jacobians remain caller-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No radial bounds, phase sampling, epsilon root merge, finite differences, source fallback or specimen selector occurs.
 * @evidence contracts/common.md#meaningful-documentation Public contracts distinguish local t, canonical radians, station mm, exact coefficient roots, numerical jet admissions and unresolved evidence.
 * @evidence contracts/performance.md#efficient-algorithms For K admitted pieces and N total coefficients, assembly and representative Horner checks cost O(N plus published roots times their piece degree); exact isolation has the injected budget's cost per piece, without repeated curve fitting.
 * @evidence contracts/performance.md#reuse-equivalent-work One query isolates each original piece once and retains its polynomial and isolation for every contact and the main selector; no cross-plane reuse is presumed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources maxPieces and per-piece coefficient/root budgets bound owned arrays. Query evidence is returned to its caller; a borrowed port retains its input callbacks only, with no global cache or resource handles.
 */
export namespace HumanPiecewiseStationPort {
  type V = HumanCurve.Vector;

  /** One unchanged local polynomial and its explicit one-sided analytic owner. */
  export interface Piece {
    /** Stable original arc identity, unique within this owner. */
    id: string;

    /** Canonical phase at t=0, radians; the trunk uses fixed feature psi,
     * not geometric polar angle or normalized physical phase phi.
     */
    phaseStartRadians: number;

    /** Positive affine dphase/dt, radians per local t, at this station. */
    phaseWidthRadians: number;

    /** Full ascending world powers in t on [0,1], mm, including all degrees. */
    worldPowersMm: readonly V[];

    /** Original jet at local t, including t=0 and t=1 on THIS piece's side.
     * Its phase derivatives use the declared affine canonical radians, and
     * longitudinal derivatives use the owner's physical station mm at fixed
     * canonical phase. Main supplies any feature/physical-phase Jacobian.
     */
    jetAtLocal: (t: number) => HumanCurveFamily.Jet;
  }

  /** Main supplies the same actual station function used by skin/construction.
   * Keep these borrowed inputs and callbacks unchanged during a query and for
   * the lifetime of a converted port; the adapter owns no shape snapshot.
   */
  export interface Owner {
    /** Stable analytic identity, independent of specimen or branch selection. */
    id: string;

    /** Original ordered pieces; no shared endpoint is epsilon-merged. */
    pieces: readonly Piece[];
  }

  /** Signed world plane n dot P = coordinateMm, with an already unit normal. */
  export interface Plane {
    /** Main-owned guide/plane identity. */
    id: string;

    /** Dimensionless world unit normal, validated without renormalization. */
    normal: V;

    /** Signed plane coordinate, mm. */
    coordinateMm: number;
  }

  /** Explicit numerical admissions, without coefficient or root deletion. */
  export interface Policy {
    /** Positive safe-integer cap on inspected pieces; excess range is retained. */
    maxPieces: number;

    /** Per-original-piece root budget; width is in local dimensionless t. */
    rootBudget: HumanPolynomialRoots.Budget;

    /** Positive upper bound on dimensionless abs(n dot n - 1). */
    normalUnitTolerance: number;

    /** Positive allowed owner minus world-power position norm, mm. */
    ownerPositionToleranceMm: number;

    /** Positive allowed first canonical-phase derivative discrepancy, mm/rad. */
    ownerFirstToleranceMmPerRadian: number;

    /** Positive allowed second canonical-phase derivative discrepancy, mm/rad². */
    ownerSecondToleranceMmPerRadianSquared: number;

    /** Positive allowed abs(n dot actual-owner P - coordinate), mm. */
    planeResidualToleranceMm: number;

    /** Positive floor for abs(n dot actual-owner P_phase), mm/rad. */
    minimumPhaseNormalSpeedMmPerRadian: number;

    /** Positive floor for norm((P_s cross P_phase) cross n), mm/rad. */
    minimumIntersectionTangentMmPerRadian: number;
  }

  /** Exact coefficient authority is injected; the pending adapter runs no fitter. */
  export type Isolate = typeof HumanPolynomialRoots.isolate;

  /** A root survives independently of numerical contact admission. */
  export interface Contact {
    /** Query-local piece/root address; not a material continuation identifier. */
    id: string;

    /** Index of the unchanged original piece. */
    pieceIndex: number;

    /** Original stable piece identity. */
    pieceId: string;

    /** Original root publication index within this piece. */
    rootIndex: number;

    /** Exact rational local-t bracket, multiplicity, direction and membership. */
    root: HumanPolynomialRoots.Root;

    /** Original t=0 side, t=1 side or interior; coincident endpoints stay separate. */
    side: "start" | "end" | "interior";

    /** Exact definition phase = offsetRadians + scaleRadians*t; the two given
     * binary64 numbers define the affine map, not rounded bracket endpoints.
     */
    phaseMap: { offsetRadians: number; scaleRadians: number };

    /** Rounded affine image of the local representative, never an exact root. */
    phaseRadiansApproximation: number;

    /** Local numerical admission only; every rejected root remains above. */
    admission: "simple-at-representative" | "multiple-contact" | "root-width-unresolved" | "representative-outside-bracket" | "owner-failure" | "missing-second-jet" | "owner-power-mismatch" | "residual-unresolved" | "nontransverse" | "nonfinite-contact";

    /** Diagnostic for rejection; no semantic branch label is inferred. */
    condition: string;

    /** Original family jet at the numerical local representative, when returned;
     * it can remain present as evidence when a later admission rejects it.
     */
    sourceJet?: HumanCurveFamily.Jet;

    /** Numeric owner-vs-power discrepancies for P, P_phase, P_phasephase in
     * mm, mm/rad and mm/rad² respectively; absent before comparison.
     */
    ownerDifferences?: readonly [number, number, number];

    /** Signed numerical owner plane residual, mm; absent before evaluation. */
    planeResidualMm?: number;

    /** Actual numerical n dot P_phase, mm/rad; absent before evaluation. */
    phaseNormalSpeedMmPerRadian?: number;

    /** Existing contact interface only after every simple numerical admission.
     * phaseRadians means the injected canonical radians (trunk feature psi).
     * Its derivatives are at the representative, not a certified exact root.
     */
    stationContact?: HumanStationPort.Contact;
  }

  /** Each original piece retains partial, flat or failed isolation evidence. */
  export interface PieceResult {
    /** Original array address, including a failed piece. */
    pieceIndex: number;

    /** Declared original identity. */
    pieceId: string;

    /** Full ascending rounded binary64 n dot P - coordinate powers, mm. */
    coefficientsMm?: readonly number[];

    /** Complete root authority result when it returned, including flatInterval. */
    isolation?: HumanPolynomialRoots.Isolation;

    /** Every root returned by that authority, including unsupported contacts. */
    contacts: readonly Contact[];
  }

  /** Exceptions and incomplete regions never erase earlier piece evidence. */
  export interface Failure {
    /** Failed boundary/input, piece, authority or original owner evaluation. */
    stage: "input" | "piece" | "isolation" | "contact";

    /** Original piece index when failure is local. */
    pieceIndex?: number;

    /** Original root index when failure is local to a published root. */
    rootIndex?: number;

    /** Explicit admission or caught exception text. */
    condition: string;
  }

  /** Whole query evidence; partial does not imply an absent intersection. */
  export interface Query {
    /** Complete requires complete isolation and admitted simple contacts. */
    status: "complete" | "partial" | "invalid";

    /** Original analytic identity; no phase/feature correspondence is added. */
    ownerId: string;

    /** Borrowed plane declaration. */
    plane: Plane;

    /** Every inspected original piece, including empty and flat intersections. */
    pieces: readonly PieceResult[];

    /** Every published root in piece/discovery order; shared endpoints duplicate. */
    contacts: readonly Contact[];

    /** Admission failures and caught exceptions, without swallowed evidence. */
    failures: readonly Failure[];

    /** Original uninspected index range [start,end), when maxPieces stopped work. */
    uninspectedPieceRange?: readonly [number, number];
  }

  /** Main explicitly selects a supported subset after seeing the whole Query. */
  export interface Selection {
    /** Exact query-local IDs; duplicates and unsupported contacts are rejected. */
    contactIds: readonly string[];

    /** Main's branch qualification reason, without an automatic nearest rule. */
    reason: string;

    /** Main-owned evidence/policy binding, not produced by this adapter. */
    evidenceId: string;
  }

  /** Boundary identity, endpoint side policy and complete curve remain main-owned. */
  export interface BorrowedBoundary {
    /** The actual shared object, with its original canonical-radian domain.
     * Main binds its complete piece coverage, unit and representation identity;
     * this adapter neither infers nor certifies those from endpoint proximity.
     */
    boundary: HumanSurface.Boundary;

    /** Original default-side canonical jet; explicit contacts use Piece.jetAtLocal. */
    jet: (phaseRadians: number) => HumanCurveFamily.Jet;

    /** Original default-side second angular derivative, mm/rad². */
    secondDerivative: (phaseRadians: number) => V;
  }

  /** Isolate all original piece roots; C0 joins require no global Lipschitz bound.
   * The exact authority concerns the assembled binary64 scalar powers only.
   * Dot products, basis conversion, owner agreement and numerical jet admissions
   * are not coefficient-error proofs. Tangencies, flat sets and budgets remain
   * partial evidence, and no anatomical or material branch is selected here.
   */
  export function query(owner: Owner, plane: Plane, policy: Policy, isolate: Isolate): Query {
    const pieces: PieceResult[] = [], contacts: Contact[] = [], failures: Failure[] = [];
    const positive: number[] = [policy.normalUnitTolerance, policy.ownerPositionToleranceMm, policy.ownerFirstToleranceMmPerRadian,
      policy.ownerSecondToleranceMmPerRadianSquared, policy.planeResidualToleranceMm, policy.minimumPhaseNormalSpeedMmPerRadian,
      policy.minimumIntersectionTangentMmPerRadian];
    if (!owner.id || !plane.id || !Array.isArray(owner.pieces) || !vector(plane.normal) || !Number.isFinite(plane.coordinateMm) ||
        !Number.isSafeInteger(policy.maxPieces) || policy.maxPieces < 1 || !positive.every((x: number): boolean => Number.isFinite(x) && x > 0) ||
        !Number.isSafeInteger(policy.rootBudget.maxCoefficientCount) || policy.rootBudget.maxCoefficientCount < 1 ||
        !(dot(plane.normal, plane.normal) > 0) || Math.abs(dot(plane.normal, plane.normal) - 1) > policy.normalUnitTolerance) {
      failures.push({ stage: "input", condition: "Finite original pieces, unit plane and positive explicit admissions are required" });
      return { status: "invalid", ownerId: owner.id, plane, pieces, contacts, failures };
    }
    const names: Set<string> = new Set();
    const count: number = Math.min(owner.pieces.length, policy.maxPieces);
    let complete: boolean = owner.pieces.length > 0 && count === owner.pieces.length;
    for (let pieceIndex: number = 0; pieceIndex < count; pieceIndex++) {
      const piece: Piece | undefined = owner.pieces[pieceIndex];
      const record: PieceResult = { pieceIndex, pieceId: piece?.id ?? "", contacts: [] };
      pieces.push(record);
      let stage: Failure["stage"] = "piece";
      try {
        if (piece === undefined || !piece.id || names.has(piece.id)) throw new Error("Original piece identities must be nonempty and unique");
        names.add(piece.id);
        if (!Number.isFinite(piece.phaseStartRadians) || !(piece.phaseWidthRadians > 0 && Number.isFinite(piece.phaseWidthRadians)) ||
            !(piece.phaseStartRadians + piece.phaseWidthRadians > piece.phaseStartRadians && Number.isFinite(piece.phaseStartRadians + piece.phaseWidthRadians)) ||
            !Array.isArray(piece.worldPowersMm) || piece.worldPowersMm.length < 1 || piece.worldPowersMm.length > policy.rootBudget.maxCoefficientCount)
          throw new Error("Original phase map and full world powers require a finite admitted piece");
        const scalar: number[] = [];
        for (let k: number = 0; k < piece.worldPowersMm.length; k++) {
          const power: V = piece.worldPowersMm[k]!;
          if (!vector(power)) throw new Error("Every original world coefficient must be a finite 3-vector");
          const value: number = dot(plane.normal, power) - (k === 0 ? plane.coordinateMm : 0);
          if (!Number.isFinite(value)) throw new Error("Plane coefficient assembly is nonfinite");
          scalar.push(value);
        }
        record.coefficientsMm = scalar;
        stage = "isolation";
        const isolation: HumanPolynomialRoots.Isolation = isolate(scalar, { start: 0, end: 1 }, policy.rootBudget);
        record.isolation = isolation;
        if (isolation.status !== "complete") complete = false;
        const local: Contact[] = [];
        record.contacts = local;
        stage = "contact";
        for (let rootIndex: number = 0; rootIndex < isolation.roots.length; rootIndex++) {
          const root: HumanPolynomialRoots.Root = isolation.roots[rootIndex]!;
          const contact: Contact = inspect(piece, pieceIndex, rootIndex, root, plane, policy);
          local.push(contact); contacts.push(contact);
          if (contact.admission !== "simple-at-representative") {
            complete = false;
            failures.push({ stage: "contact", pieceIndex, rootIndex, condition: contact.condition });
          }
        }
      } catch (error) {
        complete = false;
        failures.push({ stage, pieceIndex, condition: message(error) });
      }
    }
    if (owner.pieces.length === 0) failures.push({ stage: "input", condition: "No original pieces were supplied" });
    if (count < owner.pieces.length) failures.push({ stage: "input", condition: "maxPieces; the remaining original piece range is uninspected" });
    return { status: complete ? "complete" : "partial", ownerId: owner.id, plane, pieces, contacts, failures,
      ...(count < owner.pieces.length ? { uninspectedPieceRange: [count, owner.pieces.length] as const } : {}) };
  }

  /** Borrow the exact main-owned boundary and convert only main-selected contacts.
   * Each contacts call first delivers the complete Query to select, including
   * unresolved regions. Selecting a simple subset does not qualify the whole
   * query, material phase or global embedding. Invalid selections throw after
   * select has received the evidence. No boundary or default-side jet is rebuilt.
   */
  export function toStationPort(owner: Owner, boundary: BorrowedBoundary, policy: Policy, isolate: Isolate,
    select: (result: Query) => Selection): HumanStationPort.Result {
    return { boundary: boundary.boundary, jet: boundary.jet, secondDerivative: boundary.secondDerivative,
      contacts: (normal: V, coordinateMm: number): HumanStationPort.Contact[] => {
        const result: Query = query(owner, { id: owner.id + ".plane-query", normal, coordinateMm }, policy, isolate);
        const selected: Selection = select(result);
        if (result.status === "invalid" || !selected.reason || !selected.evidenceId || !Array.isArray(selected.contactIds) || selected.contactIds.length > result.contacts.length)
          throw new Error("Main must explicitly qualify a simple contact subset from the complete query");
        const byId: Map<string, Contact> = new Map(result.contacts.map((contact: Contact): [string, Contact] => [contact.id, contact]));
        const used: Set<string> = new Set(), output: HumanStationPort.Contact[] = [];
        for (const id of selected.contactIds) {
          const item: Contact | undefined = byId.get(id);
          if (used.has(id) || item?.admission !== "simple-at-representative" || item.stationContact === undefined)
            throw new Error("Selected contact is duplicated, absent or not numerically simple; retain its Query evidence");
          used.add(id); output.push(item.stationContact);
        }
        return output;
      } };
  }

  /** Numerical checks never remove the exact root record or use an adjacent side. */
  function inspect(piece: Piece, pieceIndex: number, rootIndex: number, root: HumanPolynomialRoots.Root, plane: Plane, policy: Policy): Contact {
    const t: number = root.approximation;
    const phase: number = piece.phaseStartRadians + piece.phaseWidthRadians * t;
    const contact: Contact = { id: pieceIndex + ":" + rootIndex, pieceIndex, pieceId: piece.id, rootIndex, root,
      side: root.location, phaseMap: { offsetRadians: piece.phaseStartRadians, scaleRadians: piece.phaseWidthRadians },
      phaseRadiansApproximation: phase, admission: "owner-failure", condition: "Original owner evaluation is unavailable" };
    if (root.multiplicity !== 1) return withAdmission(contact, "multiple-contact", "Multiplicity is retained; only simple contacts convert to StationPort");
    if (!root.targetWidthMet) return withAdmission(contact, "root-width-unresolved", "The exact root bracket has not met the caller's local refinement width");
    if (!root.approximationInBracket || !Number.isFinite(t) || t < 0 || t > 1 || !Number.isFinite(phase))
      return withAdmission(contact, "representative-outside-bracket", "Rounded local representative is outside its exact ownership or finite phase domain");
    try {
      const jet: HumanCurveFamily.Jet = piece.jetAtLocal(t);
      contact.sourceJet = jet;
      const vectors: V[] = [jet.positionMm, jet.longitudinalDerivative, jet.phaseDerivativeMmPerRadian, jet.longitudinalPhaseDerivativePerRadian];
      if (!vectors.every(vector)) return withAdmission(contact, "owner-failure", "Original one-sided position/first/mixed jets are nonfinite");
      const pp: V | undefined = jet.phaseSecondDerivativeMmPerRadianSquared;
      if (pp === undefined) return withAdmission(contact, "missing-second-jet", "Actual one-sided angular second derivative is required");
      if (!vector(pp)) return withAdmission(contact, "owner-failure", "Original angular second jet is nonfinite");
      const p: V = power(piece.worldPowersMm, t, 0), d: V = scale(power(piece.worldPowersMm, t, 1), 1 / piece.phaseWidthRadians);
      const dd: V = scale(scale(power(piece.worldPowersMm, t, 2), 1 / piece.phaseWidthRadians), 1 / piece.phaseWidthRadians);
      const differences: readonly [number, number, number] = [distance(p, jet.positionMm), distance(d, jet.phaseDerivativeMmPerRadian), distance(dd, pp)];
      contact.ownerDifferences = differences;
      if (!differences.every(Number.isFinite) || differences[0] > policy.ownerPositionToleranceMm ||
          differences[1] > policy.ownerFirstToleranceMmPerRadian || differences[2] > policy.ownerSecondToleranceMmPerRadianSquared)
        return withAdmission(contact, "owner-power-mismatch", "Full powers and actual owner jet disagree at the numerical representative");
      const residual: number = dot(plane.normal, jet.positionMm) - plane.coordinateMm;
      const speed: number = dot(plane.normal, jet.phaseDerivativeMmPerRadian);
      contact.planeResidualMm = residual; contact.phaseNormalSpeedMmPerRadian = speed;
      if (!Number.isFinite(residual) || Math.abs(residual) > policy.planeResidualToleranceMm)
        return withAdmission(contact, "residual-unresolved", "Actual owner plane residual exceeds numerical admission");
      if (!Number.isFinite(speed) || Math.abs(speed) <= policy.minimumPhaseNormalSpeedMmPerRadian ||
          (speed > 0 ? "increasing" : "decreasing") !== root.orientation)
        return withAdmission(contact, "nontransverse", "Actual canonical-phase plane speed is small, nonfinite or disagrees with exact root orientation");
      const normal: V = cross(jet.longitudinalDerivative, jet.phaseDerivativeMmPerRadian);
      const normalPhase: V = add(cross(jet.longitudinalPhaseDerivativePerRadian, jet.phaseDerivativeMmPerRadian), cross(jet.longitudinalDerivative, pp));
      const tangent: V = cross(normal, plane.normal), tangentPhase: V = cross(normalPhase, plane.normal);
      const length: number = Math.hypot(...tangent);
      if (!vector(normal) || !vector(normalPhase) || !vector(tangent) || !vector(tangentPhase) || !Number.isFinite(length) || length <= policy.minimumIntersectionTangentMmPerRadian)
        return withAdmission(contact, "nontransverse", "The actual surface/plane intersection tangent is degenerate or nonfinite");
      const unit: V = scale(tangent, 1 / length);
      const unitPhase: V = scale(add(tangentPhase, scale(unit, -dot(unit, tangentPhase))), 1 / length);
      if (!vector(unit) || !vector(unitPhase)) return withAdmission(contact, "nonfinite-contact", "Unit intersection tangent or its exact angular derivative is nonfinite");
      contact.stationContact = { phaseRadians: phase, jet, planeTangent: unit, planeTangentPhaseDerivative: unitPhase };
      return withAdmission(contact, "simple-at-representative", "Original one-sided owner jet admitted at a rounded root representative only");
    } catch (error) { return withAdmission(contact, "owner-failure", message(error)); }
  }

  /** Preserve evidence while recording the current numerical admission. */
  function withAdmission(contact: Contact, admission: Contact["admission"], condition: string): Contact {
    contact.admission = admission; contact.condition = condition; return contact;
  }
  /** Full-power Horner derivative, in original dimensionless local t. */
  function power(powers: readonly V[], t: number, order: 0 | 1 | 2): V {
    const value: V = [0, 0, 0];
    for (let k: number = powers.length - 1; k >= order; k--) {
      const factor: number = order === 0 ? 1 : order === 1 ? k : k * (k - 1);
      for (let axis: number = 0; axis < 3; axis++) value[axis] = value[axis]! * t + factor * powers[k]![axis]!;
    }
    return value;
  }
  function vector(value: V): boolean { return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite); }
  function message(error: unknown): string { return error instanceof Error ? error.message : "Unknown original-owner or authority failure"; }
  function dot(a: V, b: V): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function scale(a: V, s: number): V { return [a[0] * s, a[1] * s, a[2] * s]; }
  function add(a: V, b: V): V { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function distance(a: V, b: V): number { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
  function cross(a: V, b: V): V { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
}
