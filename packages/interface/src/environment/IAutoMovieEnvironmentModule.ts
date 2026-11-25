import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieEnvironmentContribution } from "./IAutoMovieEnvironmentContribution";

/**
 * A reusable definition that emits a module after the environment places it.
 *
 * @param context The occurrence's world frame, stable namespace and reference
 *   access.
 * @returns The canonical records this occurrence contributes.
 */
export type IAutoMovieEnvironmentModule = (
  context: IAutoMovieEnvironmentModule.IContext,
) => IAutoMovieEnvironmentContribution;

export namespace IAutoMovieEnvironmentModule {
  /** The assigned instance identity, placement and dependency access. */
  export interface IContext {
    /** Stable occurrence namespace, including the environment id. */
    readonly id: string;

    /**
     * Seed for this occurrence, an integer derived from the recipe seed and
     * this occurrence's id, or undefined for the producer's unseeded defaults.
     */
    readonly seed: number | undefined;

    /** Instance frame in world metres with unit scale. */
    readonly frame: IAutoMovieTransform;

    /**
     * Look up another item's world-space origin or an anchor it exports during
     * construction.
     *
     * @param id Environment-relative item key or `item/anchor` path.
     * @returns The named rigid frame, in world metres.
     * @throws If the referenced name is absent or the requested dependency
     *   creates a cycle.
     */
    anchor(id: string): IAutoMovieTransform;
  }
}
