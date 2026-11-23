/**
 * Data and callback contracts shared by the ClassifyLocomoteGroundDisplacement
 * operations.
 */
export namespace IAutoMovieClassifyLocomoteGroundDisplacement {
  /**
   * Classify an admitted finite root displacement in metres into no travel,
   * vertical-only travel or ground-plan travel using the shared locomotion
   * epsilon.
   */
  export type IResult = {
    /** Horizontal XZ displacement length, metres. */
    groundDistance: number;

    /** Full XYZ displacement length, metres. */
    travelDistance: number;

    /** Full displacement is strictly below the shared epsilon. */
    alreadyThere: boolean;

    /** Meaningful full travel with horizontal travel strictly below epsilon. */
    verticalOnly: boolean;
  };
}
