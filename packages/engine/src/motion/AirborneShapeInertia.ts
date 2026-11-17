import type { IAutoMovieVector3 } from "@automovie/interface";

import type { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { physicalPrincipalAxes } from "../physics/physicalPrincipalAxes";
import type { integrateAirborneRotation } from "./integrateAirborneRotation";
import type { AirborneShapeStatistics } from "./AirborneShapeStatistics";

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

  /** Optional native numeric counters, discarded when this history epoch ends. */
  statistics?: AirborneShapeStatistics.IStatistics;
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
 * @evidence contracts/development/common.md#meaningful-documentation States lazy principal materialization from the same root-frame tensor, eager relative momentum, permanent public-observation fallback, borrowed factor operations and explicit release. Optional native counters record actual factor/Jacobi calls only during the live history epoch, including refused preparations.
 * @evidence contracts/development/implementation.md#principled-implementation Euler's equation needs the symmetric tensor, so eigenvectors are materialized only for public principal demand through the existing Jacobi owner. The history performs original scale admission before stencil evaluation. Private tensor ownership plus an unchanged unobserved accessor justify factor reuse; positive Cholesky admission stays with physicalInertiaFactor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One native accessor owns the mutable public principal record. A private weak entry lends the numerical factor before that accessor is observed or replaced; factor delegates SPD work, and release discards preparation and unregisters the instant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Issued-object identity proves provenance only: intact accessor identity and unobserved ownership also establish tensor authority. Public get/set or descriptor replacement permanently select the original mutable-principal path; foreign and non-SPD records fall back without a caller flag, repaired tensor or changed error bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms Retains the history's three owned tensor rows without another admission scan. Public Jacobi copies rows only on its first actual demand. Factor lookup adds constant weak/descriptor checks and at most one fixed-size factorization per eligible instant; repeated failures remember null. Optional instrumentation adds guarded scalar increments, without callbacks or query arrays.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The exact private tensor and one factor serve all current right-hand sides before public observation, without caching attitude, momentum or relative-motion answers. First public materialization retains its mutable principal record instead. Repeated release is harmless and never recreates numerical eligibility.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each weakly keyed instant owns nine tensor scalars and optional fixed-size factor/principal state. Observation discards its now-unused factor. Release explicitly clears factor/get/set/statistics references before deleting the weak entry, including when an old public accessor remains externally held; that accessor retains only numeric materialization data, with no body, pose, model or shape callback.
 */
export function AirborneShapeInertia(
  matrix: number[][],
  relative: IAutoMovieVector3,
  statistics?: AirborneShapeStatistics.IStatistics,
): integrateAirborneRotation.IInstant {
  const state: IState = { matrix, get: undefined, set: undefined, observed: false, statistics };
  let principal: resolveAutoMovieMomentum.IPrincipal | undefined;
  const instant: integrateAirborneRotation.IInstant = {
    get inertia(): resolveAutoMovieMomentum.IPrincipal {
      state.observed = true;
      state.factor = undefined;
      if (principal === undefined) {
        if (state.statistics !== undefined) state.statistics.publicJacobi++;
        principal = physicalPrincipalAxes(matrix.map((row: number[]): number[] => [...row]));
      }
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
    if (state.factor === undefined) {
      if (state.statistics !== undefined) state.statistics.factorizations++;
      state.factor = physicalInertiaFactor(state.matrix);
    }
    return state.factor ?? undefined;
  }

  /**
   * End numeric eligibility while leaving an issued public instant readable.
   *
   */
  export function release(instant: integrateAirborneRotation.IInstant): void {
    const state: IState | undefined = OWNERS.get(instant);
    if (state !== undefined) {
      state.factor = undefined;
      state.get = undefined;
      state.set = undefined;
      state.statistics = undefined;
    }
    OWNERS.delete(instant);
  }
}
