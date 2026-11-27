import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalInertiaFactor } from "../../../physics/internal/physicalInertiaFactor";
import { physicalPrincipalAxes } from "../../../physics/internal/physicalPrincipalAxes";
import type { AirborneShapeStatistics } from "./AirborneShapeStatistics";

/*
 * Issue one physical instant with privately owned tensor sufficient statistics.
 *
 * The public inertia is the principal representation of a copy of the same
 * tensor, read afresh on each access; the tensor's factor is made with the
 * instant. Relative momentum is evaluated synchronously, never deferred into
 * playback.
 */
export function AirborneShapeInertia(
  matrix: number[][],
  relative: IAutoMovieVector3,
  statistics?: AirborneShapeStatistics.IStatistics,
  factor?: physicalInertiaFactor.IPrepared | null,
): IAutoMovieIntegrateAirborneRotation.IInstant & AirborneShapeInertia.IOwned {
  if (factor === undefined && statistics !== undefined)
    statistics.factorizations++;
  const state: AirborneShapeInertia.IState = {
    factor: factor === undefined ? physicalInertiaFactor(matrix) : factor,
  };
  return {
    shape: state,
    get inertia(): IAutoMoviePrincipalTensorFrame {
      if (statistics !== undefined) statistics.publicJacobi++;
      return physicalPrincipalAxes(
        matrix.map((row: number[]): number[] => [...row]),
      );
    },
    relative,
  };
}

/*
 * Numerical access belongs only to issued instants.
 */
export namespace AirborneShapeInertia {
  /*
   * One instant's tensor factor.
   */
  export interface IState {
    /*
     * Made with the instant; null after a refused SPD admission.
     */
    factor: physicalInertiaFactor.IPrepared | null | undefined;
  }

  /*
   * An issued instant carries the private tensor state it was made with.
   */
  export interface IOwned {
    /*
     * The private state; absent on an instant this owner did not issue.
     */
    readonly shape?: IState;
  }

  /*
   * Borrow the immutable factor of an issued instant.
   */
  export function factor(
    instant: IAutoMovieIntegrateAirborneRotation.IInstant & IOwned,
  ): physicalInertiaFactor.IPrepared | undefined {
    return instant.shape?.factor ?? undefined;
  }

  /*
   * End numeric eligibility while leaving an issued public instant readable.
   */
  export function release(
    instant: IAutoMovieIntegrateAirborneRotation.IInstant & IOwned,
  ): void {
    if (instant.shape !== undefined) instant.shape.factor = undefined;
  }
}
