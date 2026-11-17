import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodySources } from "./IAutoMovieHumanBodySources";
import type { IAutoMovieHumanSkeletonLaw } from "./IAutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanTrunkConstruction } from "./IAutoMovieHumanTrunkConstruction";
import type { IAutoMovieHumanHeadLane } from "./head/IAutoMovieHumanHeadLane";

/**
 * Complete production preparation over the original body context, including head, eye and bind metadata.
 *
 * The interface package owns these declarations; AutoMovieHumanBodyPreparation in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Complete production preparation over the original body context, including head, eye and bind metadata. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IOutput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IOutput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanBodyPreparation exchanges the named IOutput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanBodyPreparation {
  /** Explicit production preparation adds actual head/eye and whole bind metadata to the same original context.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explicit production preparation adds actual head/eye and whole bind metadata to the same original context.
   * @evidence contracts/development/design.md#principled-representation `neckConnection`: Actual completed receiver boundary, requested only by production or legacy body consumers. `seat`: Same original cut's legacy support interpretation. `head`: Actual prepared head, requested by complete.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyPreparation.of, AutoMovieHumanBodyPreparation.complete.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `neckConnection`, `seat`, `head`, `standing`, `trunkPlacement`, `anatomy`; callers supply the complete record.
   */
  export interface IOutput
    extends
      IAutoMovieHumanBodySources.IOriginal,
      IAutoMovieHumanBodySources.ICommon {
    /** Actual completed receiver boundary, requested only by production or legacy body consumers. */
    readonly neckConnection: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["neckBoundary"]
    >["connection"];

    /** Same original cut's legacy support interpretation. */
    readonly seat: ReturnType<
      IAutoMovieHumanBodySources.IOriginal["neckBoundary"]
    >["seat"];

    /** Actual prepared head, requested by complete. */
    readonly head: IAutoMovieHumanHeadLane.IPrepared;

    /** Placement metadata with actual head records; raw chains remain unrequested. */
    readonly standing: IAutoMovieHumanBodyCalibration;

    /** Same original trunk solution and its production metadata. */
    readonly trunkPlacement: IAutoMovieHumanTrunkConstruction.IPlacement;

    /** Complete actual bind skeleton, including head/eye-owned bones. */
    readonly anatomy: IAutoMovieHumanSkeletonLaw.IOutput;
  }
}
