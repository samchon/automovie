import { type AutoMovieArchetype } from "../core/index";
import { createPullingBoat as createPullingBoatImplementation } from "./internal/createPullingBoat";
import { AutoMovieArchetypeBoat } from "./AutoMovieArchetypeBoat";

/** Public operations for Auto Movie Archetype Pulling Boat. */
export namespace AutoMovieArchetypePullingBoat {
  /**
   * Pulling boat.
   *
   * A launch hull with five fixed thwarts facing aft. The waterline origin and
   * bow along +Z define its boarding and crew frame.
   *
   * @param params The scene identity and this hull's accepted dimensions and
   *   catalogue choices.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypePullingBoat.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePullingBoat.Affordance,
  AutoMovieArchetypePullingBoat.Dimension
> {
    return createPullingBoatImplementation(params, seed);
  }

  /**
   * The boat construction's dimension set, which the rowing ride reads. This
   * producer records beam, depth, length, mass.
   */
  export type Dimension = AutoMovieArchetypeBoat.Dimension;

  /**
   * The AutoMovieArchetypeBoat contact set its shared construction types. This
   * producer builds bow, floor, gunwale, stern, thwart0, thwart1, thwart2,
   * thwart3, thwart4.
   */
  export type Affordance = AutoMovieArchetypeBoat.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    AutoMovieArchetypeBoat.IParams,
    "id" | "length" | "beam" | "depth" | "mass"
  >;}
