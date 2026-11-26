import { type AutoMovieArchetype } from "../core/index";
import { createStageHolster as createStageHolsterImplementation } from "./internal/createStageHolster";
import { type createHolster } from "./createHolster";

/** Public operations for Auto Movie Archetype Stage Holster. */
export namespace AutoMovieArchetypeStageHolster {
  /**
   * Worn belt holster silhouette.
   *
   * A separate little carrier with a raised or lowered socket and a wearer-facing
   * belt hook.
   *
   * @param params The scene id, optional display dimensions and this carrier's
   *   own fit options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageHolster.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageHolster.Affordance,
  AutoMovieArchetypeStageHolster.Dimension
> {
    return createStageHolsterImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "mass" | "ride";

  /**
   * The createHolster contact set its shared construction types. This producer
   * builds belt, socket.
   */
  export type Affordance = createHolster.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createHolster.IParams,
    "id" | "depth" | "mass"
  > {
    /** A model from this form's catalogue. */
    model?: createHolster.Ride;
  }}
