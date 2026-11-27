import { type AutoMovieArchetype } from "../core/index";
import { createCanoe as createCanoeImplementation } from "./internal/createCanoe";
import { AutoMovieArchetypeBoat } from "./AutoMovieArchetypeBoat";

/** Public operations for Auto Movie Archetype Canoe. */
export namespace AutoMovieArchetypeCanoe {
  /**
   * Tandem canoe.
   *
   * The bow points along +Z at the waterline. Both thwarts face forward for
   * paddlers and the hull is drawn from its selected layup.
   *
   * @param params The scene identity and this hull's accepted dimensions and
   *   catalogue choices.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeCanoe.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCanoe.Affordance, AutoMovieArchetypeCanoe.Dimension> {
    return createCanoeImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model =
    | "prospector16"
    | "discovery169"
    | "spiritII"
    | "minnesotaII";

  /**
   * The boat construction's dimension set, which the rowing ride reads. This
   * producer records beam, depth, endHeight, length, mass, seatHeight.
   */
  export type Dimension = AutoMovieArchetypeBoat.Dimension;

  /**
   * The AutoMovieArchetypeBoat contact set its shared construction types. This
   * producer builds bow, floor, gunwale, stern, thwart0, thwart1.
   */
  export type Affordance = AutoMovieArchetypeBoat.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBoat.IParams,
    "id" | "seatHeight"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
    /** One of the selected hull model's documented layups. */
    layup?: AutoMovieArchetypeBoat.Layup;
  }}
