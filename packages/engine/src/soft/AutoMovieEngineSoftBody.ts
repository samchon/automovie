import { projectSoftBodyContacts as projectSoftBodyContactsImplementation } from "./internal/projectSoftBodyContacts";
import { sampleSoftBody as sampleSoftBodyImplementation } from "./internal/sampleSoftBody";
import { simulateSoftBody as simulateSoftBodyImplementation } from "./internal/simulateSoftBody";
import { simulateSoftBodyCore as simulateSoftBodyCoreImplementation } from "./internal/simulateSoftBodyCore";
import { simulateSoftBodyWithBoundaries as simulateSoftBodyWithBoundariesImplementation } from "./internal/simulateSoftBodyWithBoundaries";
import { softBodyRestBuffer as softBodyRestBufferImplementation } from "./internal/softBodyRestBuffer";
import { softBodyRestConfiguration as softBodyRestConfigurationImplementation } from "./internal/softBodyRestConfiguration";

import { type IAutoMovieApplySoftBodyFriction, type IAutoMovieGatherSoftBodyCorrections, type IAutoMovieSoftBodyDomain, type IAutoMovieProjectSoftCordSelfContact, type IAutoMovieWearableSoftResult, type IAutoMovieSimulateWearableSoftBody, type IAutoMovieSoftBodyBudget, type IAutoMovieVector3, type IAutoMovieSoftBodyHeldLoads, type IAutoMovieSoftBodyState, type IAutoMovieSoftBodySurface, type IAutoMovieSoftBodySurfaceGeometry, type IAutoMovieSolveSoftBodyCompliantSweep, type IAutoMovieValidation, type IAutoMovieValidateSoftBodyDomain, type IAutoMovieViolationCollector, type IAutoMovieSoftCollider, type IAutoMovieSoftBodyResolvedCapsule, type IAutoMovieSoftBodyBoundarySample, type IAutoMovieSoftBodyObserver } from "@automovie/interface";
import { applySoftBodyFriction as applySoftBodyFrictionImplementation } from "./internal/applySoftBodyFriction";
import { gatherSoftBodyCorrections as gatherSoftBodyCorrectionsImplementation } from "./internal/gatherSoftBodyCorrections";
import { productionSoftBodyUsesMovingBoundary as productionSoftBodyUsesMovingBoundaryImplementation } from "./internal/productionSoftBodyUsesMovingBoundary";
import { projectSoftCordSelfContact as projectSoftCordSelfContactImplementation } from "./internal/projectSoftCordSelfContact";
import { readProductionLiveWearableSoftBodies as readProductionLiveWearableSoftBodiesImplementation } from "./internal/readProductionLiveWearableSoftBodies";
import { shortestRestLength as shortestRestLengthImplementation } from "./internal/shortestRestLength";
import { simulateAutoMovieWearableSoftBody as simulateAutoMovieWearableSoftBodyImplementation } from "./internal/simulateAutoMovieWearableSoftBody";
import { softBodyBudget as softBodyBudgetImplementation } from "./internal/softBodyBudget";
import { softBodyHeldLoads as softBodyHeldLoadsImplementation } from "./internal/softBodyHeldLoads";
import { softBodyNeighbourOf as softBodyNeighbourOfImplementation } from "./internal/softBodyNeighbourOf";
import { softBodyParticleDistance as softBodyParticleDistanceImplementation } from "./internal/softBodyParticleDistance";
import { softBodyStateDigest as softBodyStateDigestImplementation } from "./internal/softBodyStateDigest";
import { softBodyStepAt as softBodyStepAtImplementation } from "./internal/softBodyStepAt";
import { softBodySurfaceGeometry as softBodySurfaceGeometryImplementation } from "./internal/softBodySurfaceGeometry";
import { softBodyTravelNumber as softBodyTravelNumberImplementation } from "./internal/softBodyTravelNumber";
import { solveSoftBodyCompliantSweep as solveSoftBodyCompliantSweepImplementation } from "./internal/solveSoftBodyCompliantSweep";
import { validateSoftBodyDomain as validateSoftBodyDomainImplementation } from "./internal/validateSoftBodyDomain";
import { validateSoftCompliance as validateSoftComplianceImplementation } from "./internal/validateSoftCompliance";
import { validateSoftIdentity as validateSoftIdentityImplementation } from "./internal/validateSoftIdentity";
import { validateSoftInteger as validateSoftIntegerImplementation } from "./internal/validateSoftInteger";
import { validateSoftNumeric as validateSoftNumericImplementation } from "./internal/validateSoftNumeric";
import { validateSoftRestCoincidence as validateSoftRestCoincidenceImplementation } from "./internal/validateSoftRestCoincidence";
import { validateSoftVector as validateSoftVectorImplementation } from "./internal/validateSoftVector";

/** Public operations for Auto Movie Engine Soft Body. */
export namespace AutoMovieEngineSoftBody {
  /**
   * Apply Coulomb friction to one particle a collider has just pushed out, in
   * place: the position-based friction of Macklin, Müller, Chentanez and Kim 2014
   * ("Unified particle physics for real-time applications", ACM TOG 33(4):153,
   * section 6.1), with one coefficient for sticking and sliding.
   *
   * The collider's push (the predicted position after contact projection less the
   * one before it) gives the contact normal and the penetration depth d. The
   * particle's travel over the step (its predicted position less its position at
   * the step's start) is split into its part along the normal and its tangential
   * part t. A tangential travel shorter than mu d is removed entirely, so the
   * particle sticks; a longer one is shortened by mu d, so it slides against a
   * force bounded by mu times the normal one. The collider is taken as still over
   * the step: a static collider is, and a moving body capsule's own travel is not
   * subtracted, so friction against a moving limb drags the cloth toward rest
   * rather than along with the limb.
   *
   * @param props The particle, the buffers, its position before projection and
   *   the coefficient.
   */
  export function applySoftBodyFriction(props: IAutoMovieApplySoftBodyFriction.IProps): void {
    applySoftBodyFrictionImplementation(props);
  }

  /**
   * Write one simultaneous Jacobi distance-constraint correction for every
   * particle.
   */
  export function gatherSoftBodyCorrections(props: IAutoMovieGatherSoftBodyCorrections.IProps): void {
    gatherSoftBodyCorrectionsImplementation(props);
  }

  /**
   * Identify whether a typed domain declares any moving anchor binding or
   * body-capsule collider. The declaration test does not resolve a pose, certify
   * samples or start a live solver.
   */
  export function productionSoftBodyUsesMovingBoundary(domain: Pick<IAutoMovieSoftBodyDomain, "anchors" | "colliders">): boolean {
    return productionSoftBodyUsesMovingBoundaryImplementation(domain);
  }

  /**
   * Project detected nonadjacent cord-segment penetrations along the line between
   * their closest points, with Coulomb friction, in place on predicted positions.
   * One ordered pass does not certify separation of every pair.
   *
   * A cord is a one-wide lattice, its particles in index order along it and
   * segment s joining particles s and s + 1. Each segment is a capsule of the
   * domain's `thickness` (its radius). For two segments, the closest points p =
   * a0 + s (a1 - a0) and q = b0 + t (b1 - b0) come from the clamped
   * segment-segment solution of Ericson ("Real-Time Collision Detection", 2005,
   * section 5.1.9). The non-penetration constraint C = |p - q| - 2r (r the
   * radius) has gradients (1 - s) n and s n on a0 and a1 and -(1 - t) n and -t n
   * on b0 and b1, n the unit direction from q to p; an active one (C < 0) is
   * projected as a position-based constraint with those gradients and the
   * particles' inverse masses (Müller, Heidelberger, Hennix and Ratcliff 2007,
   * "Position based dynamics", section 3.3).
   *
   * Friction is the position-based Coulomb model of Macklin, Müller, Chentanez
   * and Kim 2014 ("Unified particle physics for real-time applications", ACM TOG
   * 33(4):153, section 6.1), with one coefficient for sticking and sliding: the
   * relative tangential displacement of the two closest points over the step is
   * removed entirely while it is under mu times the penetration depth, and
   * shortened by mu times the depth above it, distributed over the four particles
   * as the normal correction is.
   *
   * Candidate pairs come from a uniform grid whose cell is the longest segment
   * plus two radii, so two segments within two radii of each other have midpoints
   * in neighbouring cells; segments are visited in index order and each one's
   * candidates in ascending order, so the result is deterministic. The grid
   * describes positions at the start of this call and is not rebuilt after each
   * projection. Closest-point coincidence has no separating direction and is
   * skipped. The declared `dt * referenceSpeed <= thickness` admission bound does
   * not clamp actual particle speed; this discrete projection is not continuous
   * collision detection and cannot rule out tunnelling.
   *
   * @param props The cord's particles, its previous and predicted positions,
   *   inverse masses and contact.
   * @returns How many pairs were in contact.
   */
  export function projectSoftCordSelfContact(props: IAutoMovieProjectSoftCordSelfContact.IProps): number {
    return projectSoftCordSelfContactImplementation(props);
  }

  /**
   * Copy the authored ordered production live-soft id list. A repeated id throws;
   * id existence and moving-boundary compatibility belong to shot selection.
   */
  export function readProductionLiveWearableSoftBodies(selected: readonly string[]): string[] {
    return readProductionLiveWearableSoftBodiesImplementation(selected);
  }

  /**
   * Find the shortest horizontal or vertical lattice rest edge; return Infinity
   * for no structural edge or a mismatched coordinate-array length.
   */
  export function shortestRestLength(domain: IAutoMovieSoftBodyDomain): number {
    return shortestRestLengthImplementation(domain);
  }

  /**
   * Resolve admitted node/bone moving anchors and body capsules from complete
   * absolute primary-motion snapshots, then replay cloth. This exported resolver
   * currently has portable test consumers and no production/viewer live host.
   */
  export function simulateAutoMovieWearableSoftBody(props: IAutoMovieSimulateWearableSoftBody.IProps): IAutoMovieWearableSoftResult {
    return simulateAutoMovieWearableSoftBodyImplementation(props);
  }

  /**
   * Measure declared cloth topology, final state bytes and worst-case neighbour
   * gathers without integrating a frame. The report counts two output xyz arrays,
   * not every solver working buffer or supplied moving-boundary record.
   */
  export function softBodyBudget(domain: IAutoMovieSoftBodyDomain): IAutoMovieSoftBodyBudget {
    return softBodyBudgetImplementation(domain);
  }

  /**
   * The force each held particle (an anchor, of zero inverse mass) bears from the
   * compliant constraints that tie it to the rest of the lattice, at the end of a
   * step: the pull a hand holding a cord's end feels.
   *
   * In XPBD a constraint's force is its gradient times its multiplier over the
   * step squared (Macklin, Müller and Chentanez 2016, MIG 2016, equation 9's
   * relation f = grad C^T lambda / dt^2). For an edge from particle i to k with
   * unit direction n from k to i, the force on k is -lambda n / dt^2; a stretched
   * edge has a negative multiplier, so the force points from the held particle
   * into the body that hangs from it. The direction is read at the step's final
   * positions, where the last sweep left the edge.
   *
   * @param props The lattice, the step's positions, the inverse masses, the rest
   *   lengths, the multipliers and the step.
   * @returns The force on every held particle that a constraint pulls, newtons,
   *   world frame, by particle.
   */
  export function softBodyHeldLoads(props: IAutoMovieSoftBodyHeldLoads.IProps): ReadonlyMap<number, IAutoMovieVector3> {
    return softBodyHeldLoadsImplementation(props);
  }

  /**
   * Find one row-major particle's ordered lattice neighbour, or -1 beyond the
   * rectangular lattice.
   */
  export function softBodyNeighbourOf(columns: number, rows: number, column: number, row: number, at: number): number {
    return softBodyNeighbourOfImplementation(columns, rows, column, row, at);
  }

  /**
   * Measure the Euclidean distance between two particle triples in a flat
   * position array.
   */
  export function softBodyParticleDistance(values: ArrayLike<number>, a: number, b: number): number {
    return softBodyParticleDistanceImplementation(values, a, b);
  }

  /**
   * Produce a deterministic 32-bit FNV-1a diagnostic of selected numeric cloth
   * fields encoded as little-endian float64 bytes. Equal digests are not proof of
   * equal states: collisions exist and domain/time metadata is omitted.
   */
  export function softBodyStateDigest(state: IAutoMovieSoftBodyState): string {
    return softBodyStateDigestImplementation(state);
  }

  /**
   * Convert finite shot seconds to a nonnegative absolute step, or null for
   * nonfinite time. A fixed 1e-9 step-space allowance handles near-boundary
   * floating rounding; the caller admits positive finite clock spacing and checks
   * the step budget.
   */
  export function softBodyStepAt(domain: IAutoMovieSoftBodyDomain, time: number): number | null {
    return softBodyStepAtImplementation(domain, time);
  }

  /**
   * Derive fresh panel mesh arrays from a solved row-major particle field. Two
   * fixed triangles cover each lattice quad, UVs follow lattice coordinates and
   * zero accumulated normals use +Y. Bounds include indexed triangle vertices; a
   * cord or point with no quads returns null bounds.
   */
  export function softBodySurfaceGeometry(props: IAutoMovieSoftBodySurfaceGeometry.IProps): IAutoMovieSoftBodySurface {
    return softBodySurfaceGeometryImplementation(props);
  }

  /**
   * Report dt*declared reference speed divided by the shortest structural rest
   * edge; no-edge Infinity yields zero. This authored travel ratio is an
   * admission heuristic, not a guarantee against collider tunnelling.
   */
  export function softBodyTravelNumber(domain: IAutoMovieSoftBodyDomain): number {
    return softBodyTravelNumberImplementation(domain);
  }

  /**
   * Run one sweep of compliant distance constraints over a lattice, in place:
   * every edge of the lattice, its row and column neighbours, its diagonals and
   * its second neighbours, projected one after another with its Lagrange
   * multiplier, the extended position-based dynamics of Macklin, Müller and
   * Chentanez 2016 ("XPBD: position-based simulation of compliant constrained
   * dynamics", MIG 2016, pp. 49-54, equations 18 and 17).
   *
   * For an edge between particles i and k with rest length l, the constraint is C
   * = |x_i - x_k| - l, its gradient the unit direction n from k to i, and the
   * time-scaled compliance alpha~ = alpha / dt^2 with alpha the family's
   * compliance in metres per newton. The multiplier's increment is dlambda = (-C
   *
   * - Alpha~ lambda) / (w_i + w_k + alpha~), and the particles move by w_i dlambda
   *   n and -w_k dlambda n, w the inverse masses. Unlike the relaxation weight of
   *   the plain position-based solver, compliance represents a physical
   *   constitutive parameter with explicit step scaling (the paper's section 4).
   *   Finite Gauss-Seidel iteration leaves residual error: four and sixteen
   *   sweeps need not produce identical stretch or bend. Zero compliance requests
   *   an inextensible edge but does not certify convergence. On a cord, a
   *   one-wide lattice, the second neighbours are its bending constraint in
   *   distance form: the distance between the ends of two consecutive segments,
   *   which is regular at a straight rest where the angle between the segments is
   *   not differentiable.
   *
   * Edges are visited in a fixed order (row-major particles, each with the
   * neighbours that follow it in `SOFT_BODY_NEIGHBOURS`), so a solve is
   * deterministic. `lambda` holds one multiplier per particle and neighbour slot
   * and is reset by the caller at the start of each step.
   *
   * @param props The lattice, the working buffers and the step.
   */
  export function solveSoftBodyCompliantSweep(props: IAutoMovieSolveSoftBodyCompliantSweep.IProps): void {
    solveSoftBodyCompliantSweepImplementation(props);
  }

  /**
   * Validate typed soft-body fields, structural rest edges, reference joins and
   * the authored travel heuristic.
   *
   * A travel ratio that overflows still exceeds the travel limit. Its violation
   * has no measured overshoot.
   */
  export function validateSoftBodyDomain(props: IAutoMovieValidateSoftBodyDomain.IProps): IAutoMovieValidation {
    return validateSoftBodyDomainImplementation(props);
  }

  /**
   * Admit a domain's compliance and contact: every compliance finite and not
   * negative, the thickness finite and positive, the friction finite and not
   * negative; and, when a cord asks for self-collision, a step that cannot carry
   * a segment past another unseen.
   *
   * A cord's self-contact is found at the end of a step, so a segment that
   * travels farther than the cord's radius in one step can pass through another
   * between two checks. The domain's declared design speed bounds the travel:
   * `fixedStepSeconds * referenceSpeed <= thickness` is required, the same
   * declared-speed premise the structural travel number rests on. Self collision
   * is evaluated only on a cord, a one-wide lattice; a sheet that asks for it is
   * refused, since the solver does not evaluate cloth on cloth.
   *
   * @param out The collector the domain's validation writes to.
   * @param root The domain's path.
   * @param domain The domain.
   */
  export function validateSoftCompliance(out: IAutoMovieViolationCollector, root: string, domain: IAutoMovieSoftBodyDomain): void {
    validateSoftComplianceImplementation(out, root, domain);
  }

  /** Report a duplicate sibling identity, then record the identity as seen. */
  export function validateSoftIdentity(out: IAutoMovieViolationCollector, path: string, label: string, id: string, seen: Set<string>): void {
    validateSoftIdentityImplementation(out, path, label, id, seen);
  }

  /** Append a type violation for a value outside a safe-integer interval. */
  export function validateSoftInteger(out: IAutoMovieViolationCollector, path: string, label: string, value: number, min: number, max: number): void {
    validateSoftIntegerImplementation(out, path, label, value, min, max);
  }

  /**
   * Append a range violation for a non-finite scalar or an open/closed interval
   * failure.
   */
  export function validateSoftNumeric(out: IAutoMovieViolationCollector, path: string, label: string, value: number, min: number, exclusive: boolean, max: number): void {
    validateSoftNumericImplementation(out, path, label, value, min, exclusive, max);
  }

  /** Report a structural rest edge whose squared displacement vanishes. */
  export function validateSoftRestCoincidence(out: IAutoMovieViolationCollector, root: string, domain: IAutoMovieSoftBodyDomain, a: number, b: number): void {
    validateSoftRestCoincidenceImplementation(out, root, domain, a, b);
  }

  /**
   * Validate three authored vector components through the shared finite-scalar
   * policy.
   */
  export function validateSoftVector(out: IAutoMovieViolationCollector, path: string, value: IAutoMovieVector3): void {
    validateSoftVectorImplementation(out, path, value);
  }

  /**
   * Project one unanchored particle through authored static colliders, then
   * resolved moving capsules, preserving the running contact count.
   */
  export function projectSoftBodyContacts(colliders: IAutoMovieSoftCollider[], capsules: readonly IAutoMovieSoftBodyResolvedCapsule[] | null, predicted: Float64Array, particle: number, contacts: number): number {
    return projectSoftBodyContactsImplementation(colliders, capsules, predicted, particle, contacts);
  }

  /**
   * Sample the static cloth trajectory at a shot second by snapping to its
   * fixed-clock step. Nonfinite time throws; negative finite time samples rest.
   * This public sampling API currently has no production/viewer caller.
   */
  export function sampleSoftBody(domain: IAutoMovieSoftBodyDomain, time: number, state?: string | null): IAutoMovieSoftBodyState {
    return sampleSoftBodyImplementation(domain, time, state);
  }

  /**
   * Replay one admitted cloth domain without resolved moving samples to an
   * absolute fixed-clock step. Body capsules are refused; moving anchor binding
   * metadata is currently ignored in favor of static/rest targets. Domain
   * admission is the caller's responsibility. No production/viewer consumer
   * currently invokes this public solver, while portable unit cases exercise its
   * numerical output.
   */
  export function simulateSoftBody(domain: IAutoMovieSoftBodyDomain, step: number, state?: string | null): IAutoMovieSoftBodyState {
    return simulateSoftBodyImplementation(domain, step, state);
  }

  /**
   * Integrate an admitted cloth lattice from its authored rest boundary to one
   * absolute fixed step. Without declared compliance and contact the solve is the
   * plain position-based one, operation for operation. With compliance, each
   * sweep projects the lattice's edges as compliant constraints with their own
   * multipliers (`solveSoftBodyCompliantSweep`); with contact, a collider's push
   * is followed by Coulomb friction (`applySoftBodyFriction`) and a cord that
   * asks for self-collision keeps its segments apart after each sweep
   * (`projectSoftCordSelfContact`). A moving anchor a boundary sample lists as
   * released regains its mass for that step, leaving with the velocity its target
   * last moved at. Each position and rate must be representable at the step
   * boundary. An observer reads every completed step, with the force each held
   * particle bears when the solve is compliant.
   */
  export function simulateSoftBodyCore(domain: IAutoMovieSoftBodyDomain, step: number, state: string | null, boundaries: readonly IAutoMovieSoftBodyBoundarySample[] | null, observer?: IAutoMovieSoftBodyObserver | null): IAutoMovieSoftBodyState {
    return simulateSoftBodyCoreImplementation(domain, step, state, boundaries, observer);
  }

  /**
   * Replay cloth against a complete resolved moving boundary for every absolute
   * step from zero through the target. Static colliders remain active. Each
   * sample holds every authored moving anchor or releases it; an observer reads
   * every completed step. This public API currently reaches portable tests
   * through the wearable resolver; no production/viewer host wires that live
   * solver.
   */
  export function simulateSoftBodyWithBoundaries(domain: IAutoMovieSoftBodyDomain, step: number, boundaries: readonly IAutoMovieSoftBodyBoundarySample[], state?: string | null, observer?: IAutoMovieSoftBodyObserver | null): IAutoMovieSoftBodyState {
    return simulateSoftBodyWithBoundariesImplementation(domain, step, boundaries, state, observer);
  }

  /**
   * Allocate the authored rest coordinates with static anchors and one named
   * state's targets applied.
   */
  export function softBodyRestBuffer(domain: IAutoMovieSoftBodyDomain, state: string | null): Float64Array {
    return softBodyRestBufferImplementation(domain, state);
  }

  /**
   * Return fresh plain coordinates for the authored rest mesh with static anchors
   * and one selected state's targets applied. Production furnishing validation
   * consumes this configuration; moving targets require the separate
   * complete-boundary solver.
   */
  export function softBodyRestConfiguration(domain: IAutoMovieSoftBodyDomain, state?: string | null): number[] {
    return softBodyRestConfigurationImplementation(domain, state);
  }
}
