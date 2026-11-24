import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalInertiaFactor } from "../physics/physicalInertiaFactor";
import { physicalPrincipalAxes } from "../physics/physicalPrincipalAxes";
import type { AirborneShapeStatistics } from "./AirborneShapeStatistics";

/**
 * Issue one physical instant with privately owned tensor sufficient statistics.
 *
 * Public inertia is the existing principal representation, computed on its
 * first access from a copy of the same tensor. Reading or replacing that
 * property permanently ends internal tensor eligibility for this instant:
 * thereafter the mutable principal values remain authoritative. Relative
 * momentum is evaluated synchronously, never deferred into playback.
 */
export function AirborneShapeInertia(
  matrix: number[][],
  relative: IAutoMovieVector3,
  statistics?: AirborneShapeStatistics.IStatistics,
  factor?: physicalInertiaFactor.IPrepared | null,
): IAutoMovieIntegrateAirborneRotation.IInstant {
  if (factor === undefined && statistics !== undefined)
    statistics.factorizations++;
  const state: AirborneShapeInertia.IState = {
    matrix,
    get: undefined,
    set: undefined,
    observed: false,
    factor: factor === undefined ? physicalInertiaFactor(matrix) : factor,
    statistics,
  };
  let principal: IAutoMoviePrincipalTensorFrame | undefined;
  const instant: IAutoMovieIntegrateAirborneRotation.IInstant &
    AirborneShapeInertia.IOwned = {
    shape: state,
    get inertia(): IAutoMoviePrincipalTensorFrame {
      state.observed = true;
      state.factor = undefined;
      if (principal === undefined) {
        if (state.statistics !== undefined) state.statistics.publicJacobi++;
        principal = physicalPrincipalAxes(
          matrix.map((row: number[]): number[] => [...row]),
        );
      }
      return principal;
    },
    set inertia(value: IAutoMoviePrincipalTensorFrame) {
      state.observed = true;
      state.factor = undefined;
      principal = value;
    },
    relative,
  };
  const descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(
    instant,
    "inertia",
  )!;
  state.get = descriptor.get;
  state.set = descriptor.set;
  return instant;
}

/** Numerical access belongs only to unchanged, unobserved issued instants. */
export namespace AirborneShapeInertia {
  /** One private tensor, its original accessor and its factor. */
  export interface IState {
    /** Owned rows, never exposed or passed to the mutating eigensolver. */
    matrix: number[][];

    /** The original own-property reader, compared before lending numeric work. */
    get: (() => IAutoMoviePrincipalTensorFrame) | undefined;

    /** Original assignment behavior; replacing it ends numeric eligibility. */
    set: ((value: IAutoMoviePrincipalTensorFrame) => void) | undefined;

    /** Public access may expose mutable principal coordinates, so ends reuse. */
    observed: boolean;

    /** Made with the instant; null after a refused SPD admission. */
    factor: physicalInertiaFactor.IPrepared | null | undefined;

    /** Optional native numeric counters, discarded when this history epoch ends. */
    statistics?: AirborneShapeStatistics.IStatistics;
  }

  /** An issued instant carries the private tensor state it was made with. */
  export interface IOwned {
    /** The private state; absent on an instant this owner did not issue. */
    readonly shape?: IState;
  }

  /**
   * Borrow the immutable factor only while the tensor is privately
   * authoritative.
   */
  export function factor(
    instant: IAutoMovieIntegrateAirborneRotation.IInstant & IOwned,
  ): physicalInertiaFactor.IPrepared | undefined {
    const state: IState | undefined = instant.shape;
    if (state === undefined || state.observed) return undefined;
    const descriptor: PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(instant, "inertia");
    if (descriptor?.get !== state.get || descriptor?.set !== state.set) {
      state.observed = true;
      state.factor = undefined;
      return undefined;
    }
    return state.factor ?? undefined;
  }

  /** End numeric eligibility while leaving an issued public instant readable. */
  export function release(
    instant: IAutoMovieIntegrateAirborneRotation.IInstant & IOwned,
  ): void {
    const state: IState | undefined = instant.shape;
    if (state !== undefined) {
      state.factor = undefined;
      state.get = undefined;
      state.set = undefined;
      state.statistics = undefined;
      state.observed = true;
    }
  }
}
