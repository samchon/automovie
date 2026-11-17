import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
} from "@automovie/interface";

/**
 * The rig, frame and placed-geometry records shared by arm trajectories.
 * HumanArmGeometry keeps its existing public interfaces by inheriting these fields.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines each record's coordinate frame, units, shape/probe ordering and borrowed ownership, including the setup's unchanged-operation scope.
 * @evidence contracts/development/design.md#principled-representation Separates fixed rig metadata, per-instant collision geometry and resulting FK points, with world metres, clinical degrees and unit quaternion rotations imported from their existing owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface These five records are the existing geometry, trajectory, Jacobian and clearance consumers' shared data; HumanArmGeometry interfaces inherit these shapes and preserve their established declaration-merging surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No new motion or collider representation is introduced; parallel probe arrays and nine-coordinate arrays still require caller-consistent ordering and sizes.
 */
export namespace HumanArmGeometryTypes {
  /**
   * The interface contract (IAutoMovieMotionHumanArmGeometry.IShape).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents HumanArmGeometryTypes.IShape: The interface contract (IAutoMovieMotionHumanArmGeometry.IShape).
   * @evidence contracts/development/design.md#principled-representation The record is the interface's (`IAutoMovieMotionHumanArmGeometry.IShape`); the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type IShape = IAutoMovieMotionHumanArmGeometry.IShape;

  /**
   * The interface contract (IAutoMovieMotionHumanArmGeometry.ISetup).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents HumanArmGeometryTypes.ISetup: The interface contract (IAutoMovieMotionHumanArmGeometry.ISetup).
   * @evidence contracts/development/design.md#principled-representation The record is the interface's (`IAutoMovieMotionHumanArmGeometry.ISetup`); the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type ISetup = IAutoMovieMotionHumanArmGeometry.ISetup;

  /**
   * The interface contract (IAutoMovieMotionHumanArmGeometry.IFrame).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents HumanArmGeometryTypes.IFrame: The interface contract (IAutoMovieMotionHumanArmGeometry.IFrame).
   * @evidence contracts/development/design.md#principled-representation The record is the interface's (`IAutoMovieMotionHumanArmGeometry.IFrame`); the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type IFrame = IAutoMovieMotionHumanArmGeometry.IFrame;

  /**
   * The interface contract (IAutoMovieMotionHumanArmGeometry.IPlaced).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents HumanArmGeometryTypes.IPlaced: The interface contract (IAutoMovieMotionHumanArmGeometry.IPlaced).
   * @evidence contracts/development/design.md#principled-representation The record is the interface's (`IAutoMovieMotionHumanArmGeometry.IPlaced`); the alias adds nothing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept so this owner's readers name the record by its owner, as master keeps such aliases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No copy of the record: one declaration, in `@automovie/interface`.
   */
  export type IPlaced = IAutoMovieMotionHumanArmGeometry.IPlaced;

  /**
   * A pose and external collider placements used to construct one arm frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that moving-arm joints are ignored and that the other bodies' colliders are already posed in the world.
   * @evidence contracts/development/design.md#principled-representation A borrowed canonical pose provides unchanged parents and nonmoving body parts, while external placed segments supply the surrounding geometry; the frame builder owns their interpretation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanArmFrame and trajectory contexts consume exactly these two inputs, reusing the pose and placed-collider owners' types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts External bodies are data instead of fixture-specific fields, and readonly collider membership does not claim deep immutability of borrowed geometry.
   */
  export interface IBase {
    /** The pose; the moving arms' joints are ignored by the frame builder. */
    pose: IAutoMoviePose;

    /** Other bodies' placed colliders in world coordinates. */
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[];

    /** The ones among `others` the hand rests on, whose contact with the hand is not a collision; none when absent. */
    rests?: readonly IAutoMovieMotionHumanColliders.IPlaced[];
  }
}
