import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanTrunkViewPart } from "./IAutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/** Type contracts exchanged by AutoMovieHumanTrunkLegs; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkLegs {
  /** Actual source preparation and its call-owned regional leg factory.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual source preparation and its call-owned regional leg factory.
   * @evidence contracts/development/design.md#principled-representation `views`: Same complete trunk views used by production. `top`: Same optional source-owned upper closure. `legs`: Retained standalone legs when no coupled factory was supplied.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkLegs.pair. Read by AutoMovieHumanTrunkLegs.pair, AutoMovieHumanTrunkLegs.trial. Also types AutoMovieHumanTrunkLegs.legs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `top`: Same optional source-owned upper closure. `legs`: Retained standalone legs when no coupled factory was supplied.
   */
  export interface IInput {
    /** Same complete trunk views used by production. */
    views: IAutoMovieHumanTrunkViews;
    /** Same optional source-owned upper closure. */
    top?: IAutoMovieHumanTrunkViewPart.ITop;
    /** Retained standalone legs when no coupled factory was supplied. */
    legs?: Record<"left" | "right", IAutoMovieHumanSiteViewPart.IDefinition>;
    /** Author and retain the regional leg against this identical parent and its named hip station. */
    bindLeg?(
      side: "left" | "right",
      parent: IAutoMovieHumanSiteViewPart.IDefinition,
      station: number,
    ): IAutoMovieHumanSiteViewPart.IDefinition;
  }
}
