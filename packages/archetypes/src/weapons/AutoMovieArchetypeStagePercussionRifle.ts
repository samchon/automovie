import { type AutoMovieArchetype } from "../core/index";
import { createStagePercussionRifle as createStagePercussionRifleImplementation } from "./internal/createStagePercussionRifle";
import { StagePeriodGunConstruction } from "./StagePeriodGunConstruction";

/** Public operations for Auto Movie Archetype Stage Percussion Rifle. */
export namespace AutoMovieArchetypeStagePercussionRifle {
  /**
   * An inert percussion rifle silhouette for the screen.
   *
   * The gun lies along `+Z` from its butt plate to its muzzle, as
   * `StagePeriodGunConstruction` lays it. Its lock is a side hammer on the right
   * of the breech that falls on the `nipple`, the cone a percussion cap sits on;
   * the `hammer` is the thumb's place on its spur. No mechanism moves: the prop
   * is exterior geometry for the camera.
   *
   * @param params The optional scene id.
   * @returns The inert model and its contact frames, metres.
   */
  export function create(params?: AutoMovieArchetypeStagePercussionRifle.IParams): AutoMovieArchetype<
  AutoMovieArchetypeStagePercussionRifle.Affordance,
  AutoMovieArchetypeStagePercussionRifle.Dimension
> {
    return createStagePercussionRifleImplementation(params);
  }

  /** The lock's contacts: the nipple a cap sits on and the hammer's spur. */
  export type Lock = "nipple" | "hammer";

  /** The shared handling and sling contacts and this lock's. */
  export type Affordance = StagePeriodGunConstruction.Contact | Lock;

  /** The read overall and barrel lengths and the mass. */
  export type Dimension = StagePeriodGunConstruction.Dimension;

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `stagePercussionRifle` when absent. */
    id?: string;
  }}
