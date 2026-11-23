import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeRide } from "./AutoMovieArchetypeRide";

/** The contact geometry returned by a towed ride sample. */
export namespace ArchetypeTowedGeometry {
  /**
   * One tow read, supplying only the selected current material and contact
   * frames.
   */
  export interface ITowedSample<Id extends string> {
    /** The towed model's world placement at the requested second. */
    readonly placement: IAutoMovieTransform;
    /**
     * A named trailer affordance's world frame. A missing id keeps the model's
     * refusal.
     */
    frame(id: Id): IAutoMovieTransform;
    /**
     * The two world endpoints of a named line's final segment, in draw order.
     * An unknown line returns undefined.
     */
    tail(
      id: string,
    ): readonly [IAutoMovieVector3, IAutoMovieVector3] | undefined;
  }

  /** A towed ride's demand-driven geometry at an arbitrary film second. */
  export interface ITowedRide<
    Id extends string,
    Dimension extends string,
  > extends AutoMovieArchetypeRide.IRide<Id, Dimension> {
    /** Share the leader and trailer reads among contacts of this film second. */
    geometry(seconds: number): ITowedSample<Id>;
  }
}
