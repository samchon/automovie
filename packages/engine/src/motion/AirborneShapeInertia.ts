import type { IAutoMovieVector3 } from "@automovie/interface";

import type { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { physicalPrincipalAxes } from "../physics/physicalPrincipalAxes";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";

/** Only this owner can issue an unobserved numeric tensor capability. */
const OWNERS: WeakMap<integrateAirborneRotation.IInstant, IState> = new WeakMap();

/** One private tensor, its original accessor and an optional lazy factor. */
interface IState {
  /** Owned rows, never exposed or passed to the mutating eigensolver. */
  matrix: number[][];

  /** The original own-property reader, compared before lending numeric work. */
  get: (() => resolveAutoMovieMomentum.IPrincipal) | undefined;

  /** Original assignment behavior; replacing it ends numeric eligibility. */
  set: ((value: resolveAutoMovieMomentum.IPrincipal) => void) | undefined;

  /** Public access may expose mutable principal coordinates, so ends reuse. */
  observed: boolean;

  /** Undefined before the first demand, null after a refused SPD admission. */
  factor?: physicalInertiaFactor.IPrepared | null;
}

/**
 * Issue one physical instant with privately owned tensor sufficient statistics.
 *
 * Public inertia is the existing principal representation, computed on its
 * first access from a copy of the same tensor. Reading or replacing that
 * property permanently ends internal tensor eligibility for this instant:
 * thereafter the mutable principal values remain authoritative. Relative
 * momentum is evaluated synchronously, never deferred into playback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States lazy principal materialization, unchanged numeric tensor, eager relative momentum and permanent public-observation fallback.
 * @evidence contracts/development/implementation.md#principled-implementation The symmetric tensor itself suffices for Euler's equation; choosing eigenvectors is unnecessary until a public principal value is requested. The history performs the existing positive-scale admission before stencil evaluation, and the principal reader delegates to the existing Jacobi owner.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One native accessor owns the public principal record, while a private weak entry lends a numerical factor only before that record can be observed or replaced.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Issued-object identity proves provenance only. Unobserved ownership plus an unchanged own accessor descriptor prove the tensor is still authoritative; any public observation or assignment selects the original mutable principal path.
 * @evidence contracts/development/implementation.md#efficient-algorithms Retains the history's three already-owned tensor rows without another admission scan. Jacobi and its copied rows occur only on public principal demand, and factorization only on numerical demand. Relative momentum keeps its original synchronous cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable numeric tensor and one factor serve every physical/tangent read of this exact instant until public access. A failed factor is remembered as null, without caching any momentum-dependent answer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each issued instant owns nine tensor scalars and optional fixed-size factor/principal data. Public observation discards the unused factor; clear additionally drops factor/accessor references and the weak registration. An externally held old instant retains only its numeric lazy principal data, with no model, bones or shape callback.
 */
export function AirborneShapeInertia(
  matrix: number[][],
  relative: IAutoMovieVector3,
): integrateAirborneRotation.IInstant {
  const state: IState = { matrix, get: undefined, set: undefined, observed: false };
  let principal: resolveAutoMovieMomentum.IPrincipal | undefined;
  const instant: integrateAirborneRotation.IInstant = {
    get inertia(): resolveAutoMovieMomentum.IPrincipal {
      state.observed = true;
      state.factor = undefined;
      principal ??= physicalPrincipalAxes(matrix.map((row: number[]): number[] => [...row]));
      return principal;
    },
    set inertia(value: resolveAutoMovieMomentum.IPrincipal) {
      state.observed = true;
      state.factor = undefined;
      principal = value;
    },
    relative,
  };
  const descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(instant, "inertia")!;
  state.get = descriptor.get;
  state.set = descriptor.set;
  OWNERS.set(instant, state);
  return instant;
}

/**
 * Numerical access belongs only to unchanged, unobserved issued instants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation factor states undefined fallback and release states weak capability invalidation without changing public numeric validity.
 * @evidence contracts/development/design.md#principled-representation A private capability distinguishes an owned symmetric tensor from externally observable principal records; both represent the same root-frame kg m squared inertia.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AirborneShapeHistory delegates factor lookup and release; the ODE receives the existing physicalInertiaFactor operator without a second public instant model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No externally writable trusted flag or numerical cache field enters IInstant, and foreign or publicly observed records retain their original path.
 */
export namespace AirborneShapeInertia {
  /**
   * Borrow the immutable factor only while the tensor is privately authoritative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns undefined for foreign, observed, replaced or non-SPD records; a successful factor is borrowed and has independent-output methods.
   * @evidence contracts/development/implementation.md#principled-implementation Private tensor ownership and the unchanged unobserved accessor prove equivalence; finite positive Cholesky admission is supplied by physicalInertiaFactor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check provenance and public-observation state, check the accessor descriptor, then lazily prepare the sole tensor factor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changing a getter, setter, data property or public principal value cannot certify stale tensor reuse; fallback leaves established error and principal behavior intact.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant weak lookup and accessor comparisons per demand, with at most one constant-size factorization per eligible instant and no eigensolve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the exact owned tensor of this instant supplies all right-hand-side solves; neither world attitude nor momentum is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The factor stays in this instant's weak state until release or collection, without retaining a query reader, pose or model.
   */
  export function factor(
    instant: integrateAirborneRotation.IInstant,
  ): physicalInertiaFactor.IPrepared | undefined {
    const state: IState | undefined = OWNERS.get(instant);
    if (state === undefined || state.observed) return undefined;
    const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(instant, "inertia");
    if (descriptor?.get !== state.get || descriptor?.set !== state.set) {
      state.observed = true;
      state.factor = undefined;
      return undefined;
    }
    if (state.factor === undefined) state.factor = physicalInertiaFactor(state.matrix);
    return state.factor ?? undefined;
  }

  /**
   * End numeric eligibility while leaving an issued public instant readable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Invalidates the private capability without modifying independent principal or relative output values.
   * @evidence contracts/development/implementation.md#principled-implementation Deleting the weak registration makes later internal consumers follow the same public principal path as an arbitrary ordinary instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Discard factor/accessor references, then remove the weak registration under the history's existing explicit epoch release.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No public record is cleared, clamped or made unusable by releasing private numerical work.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time and no traversal of tensor or principal coordinates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated release is harmless and never recreates a private capability.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Clears preparation even when an externally retained instant's accessor still holds its numeric state, then deletes the weak entry. Only the tensor needed for later lazy public materialization and independent public values remain with that instant.
   */
  export function release(instant: integrateAirborneRotation.IInstant): void {
    const state: IState | undefined = OWNERS.get(instant);
    if (state !== undefined) {
      state.factor = undefined;
      state.get = undefined;
      state.set = undefined;
    }
    OWNERS.delete(instant);
  }
}
