import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * The base record an arm frame is built from, shared by arm trajectories.
 * HumanArmGeometry keeps its existing public `IBase` by inheriting it.
 */
export namespace HumanArmGeometryTypes {
  /**
   * A pose and external collider placements used to construct one arm frame.
   */
  export interface IBase {
    /** The pose; the moving arms' joints are ignored by the frame builder. */
    pose: IAutoMoviePose;

    /** Other bodies' placed colliders in world coordinates. */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /** The ones among `others` the hand rests on, whose contact with the hand is not a collision; none when absent. */
    rests?: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /** The performer's own segments the hand rests on, whose contact with the hand is not a collision; none when absent. */
    restsOwn?: IAutoMovieHumanLimbGoal.OwnRests;

    /** Colliders of subjects that are no human body (a prop, an animal), in world coordinates, kept clear of as `others` are; none when absent. */
    externals?: readonly IAutoMovieMotionHumanColliders.IExternal[];
  }
}
