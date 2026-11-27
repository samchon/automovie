import type { IAutoMovieHumanSourceDefinition } from "./IAutoMovieHumanSourceDefinition";
import type { IAutoMovieHumanTrunkViewPart } from "./IAutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "./IAutoMovieHumanTrunkViews";

/**
 * Trunk views and explicit side-qualified factories binding legs to the
 * identical parent. Runtime construction and admission remain with
 * AutoMovieHumanTrunkLegs in Human.
 */
export namespace IAutoMovieHumanTrunkLegs {
  /** Actual source preparation and its call-owned regional leg factory. */
  export interface IInput {
    /** Same complete trunk views used by production. */
    views: IAutoMovieHumanTrunkViews;
    /** Same optional source-owned upper closure. */
    top?: IAutoMovieHumanTrunkViewPart.ITop;
    /** Retained standalone legs when no coupled factory was supplied. */
    legs?: Record<"left" | "right", IAutoMovieHumanSourceDefinition>;
    /**
     * Author and retain the regional leg against this identical parent and its
     * named hip station.
     */
    bindLeg?(
      side: "left" | "right",
      parent: IAutoMovieHumanSourceDefinition,
      station: number,
    ): IAutoMovieHumanSourceDefinition;
  }
}
