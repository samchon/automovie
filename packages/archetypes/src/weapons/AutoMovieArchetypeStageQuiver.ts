import { type AutoMovieArchetype } from "../core/index";
import { createStageQuiver as createStageQuiverImplementation } from "./internal/createStageQuiver";
import { type createHolster } from "./createHolster";

/** Public operations for Auto Movie Archetype Stage Quiver. */
export namespace AutoMovieArchetypeStageQuiver {
  /**
   * Worn quiver silhouette.
   *
   * The upright tube exposes a common top socket, separate display slots, a belt
   * hook and a strap hook.
   *
   * @param params The scene id, optional display dimensions and this carrier's
   *   own fit options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageQuiver.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageQuiver.Affordance,
  AutoMovieArchetypeStageQuiver.Dimension
> {
    return createStageQuiverImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The createHolster contact set its shared construction types. This producer
   * builds belt, slot1, slot10, slot11, slot12, slot2, slot3, slot4, slot5,
   * slot6, slot7, slot8, slot9, socket, strap.
   */
  export type Affordance = createHolster.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createHolster.IParams,
    "id" | "length" | "diameter" | "mass"
  > {
    /** Whole number of display sites within the original slot capacity. */
    slots?: number;
  }}
