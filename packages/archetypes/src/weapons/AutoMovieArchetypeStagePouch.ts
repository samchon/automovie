import { type AutoMovieArchetype } from "../core/index";
import { createStagePouch as createStagePouchImplementation } from "./internal/createStagePouch";
import { type AutoMovieArchetypeHolster } from "./AutoMovieArchetypeHolster";

/** Public operations for Auto Movie Archetype Stage Pouch. */
export namespace AutoMovieArchetypeStagePouch {
  /**
   * Worn stage pouch.
   *
   * A costume box with a separately articulated lid, belt or strap hooks and
   * individually addressed display-token sites.
   *
   * @param params The scene id, optional display dimensions and this carrier's
   *   own fit options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStagePouch.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeStagePouch.Affordance, AutoMovieArchetypeStagePouch.Dimension> {
    return createStagePouchImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "length" | "mass" | "thickness" | "width";

  /**
   * The createHolster contact set its shared construction types. This producer
   * builds belt, lid, slot1, slot10, slot11, slot12, slot13, slot14, slot15,
   * slot16, slot17, slot18, slot19, slot2, slot20, slot3, slot4, slot5, slot6,
   * slot7, slot8, slot9, strap.
   */
  export type Affordance = AutoMovieArchetypeHolster.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    AutoMovieArchetypeHolster.IParams,
    "id" | "length" | "thickness" | "depth" | "width" | "mass"
  >;}
