import { type AutoMovieArchetype } from "../core/index";
import { createStageMatchlock as createStageMatchlockImplementation } from "./internal/createStageMatchlock";
import { StagePeriodGunConstruction } from "./internal/StagePeriodGunConstruction";

/** Public operations for Auto Movie Archetype Stage Matchlock. */
export namespace AutoMovieArchetypeStageMatchlock {
  /**
   * An inert matchlock silhouette for the screen.
   *
   * The gun lies along `+Z` from its butt plate to its muzzle, as
   * `StagePeriodGunConstruction` lays it. Its lock is a serpentine, the S-shaped
   * arm that lowers the glowing match into the pan, on the right of the breech,
   * and a coil of match cord hangs from it. The `serpentine` is the thumb's place
   * on the arm and the `match` the cord's burning end over the `pan`. No
   * mechanism moves: the prop is exterior geometry for the camera.
   *
   * @param params The optional scene id.
   * @returns The inert model and its contact frames, metres.
   */
  export function create(params?: AutoMovieArchetypeStageMatchlock.IParams): AutoMovieArchetype<
  AutoMovieArchetypeStageMatchlock.Affordance,
  AutoMovieArchetypeStageMatchlock.Dimension
> {
    return createStageMatchlockImplementation(params);
  }

  /**
   * The lock's contacts: the pan, the serpentine's thumb place and the match's
   * burning end.
   */
  export type Lock = "pan" | "serpentine" | "match";

  /** The shared handling and sling contacts and this lock's. */
  export type Affordance = StagePeriodGunConstruction.Contact | Lock;

  /** The read overall and barrel lengths and the mass. */
  export type Dimension = StagePeriodGunConstruction.Dimension;

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `stageMatchlock` when absent. */
    id?: string;
  }}
