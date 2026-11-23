import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieEnvironmentContribution } from "./IAutoMovieEnvironmentContribution";

/**
 * A reusable definition that emits a module after the environment places it.
 *
 * @param context The occurrence's world frame, stable namespace and reference access.
 * @returns The canonical records this occurrence contributes.
 *
 * @evidence contracts/development/design.md#principled-representation The definition receives the world-metre rigid frame once and constructs its geometry, support and points in that frame. It derives only instance-owned identifiers from the supplied scope.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The callback lets a producer consume the resolved placement before generating its records. The composer can run the same definition at distinct frames and derive its references without a second transform or a global catalogue.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal inputs and resolved references must produce equal records. TypeScript cannot enforce a producer's purity or repair an inconsistent set of emitted records.
 * @evidence contracts/development/common.md#meaningful-documentation States when the definition runs, its supplied placement and namespace, and what it returns.
 */
export type IAutoMovieEnvironmentModule = (
  context: IAutoMovieEnvironmentModule.IContext,
) => IAutoMovieEnvironmentContribution;

export namespace IAutoMovieEnvironmentModule {
  /**
   * The assigned instance identity, placement and dependency access.
   *
   * @evidence contracts/development/design.md#principled-representation The occurrence id is the environment id and local item key, the rigid frame is in world metres, and the seed is a deterministic stream key derived from the occurrence path when a root seed is supplied.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One reference function gives other modules' origins and exported anchors, so a module can place linked geometry without asking the composer to recognize its kind.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolver admits out-of-order references and refuses unknown paths and cycles. It never replaces a missing anchor with the origin or searches unnamed geometry.
   * @evidence contracts/development/common.md#meaningful-documentation States the id, world unit, seed omission, path spelling and lookup failure modes.
   */
  export interface IContext {
    /** Stable occurrence namespace, including the environment id. */
    readonly id: string;

    /** Seed for this occurrence, or undefined for the producer's unseeded defaults. */
    readonly seed: string | undefined;

    /** Instance frame in world metres with unit scale. */
    readonly frame: IAutoMovieTransform;

    /**
     * Look up another item's world-space origin or an anchor it exports during construction.
     *
     * @param id Environment-relative item key or `item/anchor` path.
     * @returns The named rigid frame, in world metres.
     * @throws If the referenced name is absent or the requested dependency creates a cycle.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the relative path, world frame and failure cases.
     */
    anchor(id: string): IAutoMovieTransform;
  }
}
