import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";

/** Data and callback contracts shared by the ValidateSpace operations. */
export namespace IAutoMovieValidateSpace {
  /**
   * Admit ids/kinds, simple finite XZ footprint rings, strictly interior
   * disjoint holes and exactly one supported ground statement.
   */
  export type IProps = {
    /**
     * Borrowed surface and walkable metadata; XZ footprint coordinates are
     * checked while polygon Y is ignored.
     */
    space: IAutoMovieSpace;
  };
}
