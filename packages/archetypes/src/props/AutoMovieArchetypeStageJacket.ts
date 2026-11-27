import { type AutoMovieArchetype } from "../core/index";
import { createStageJacket as createStageJacketImplementation } from "./internal/createStageJacket";

/** Public operations for Auto Movie Archetype Stage Jacket. */
export namespace AutoMovieArchetypeStageJacket {
  /**
   * An open-front short-sleeve stage jacket with two hollow sleeve passages.
   *
   * The model's origin is at the middle of the upper back. Positive Y points up
   * and positive Z faces forward. Each sleeve's opening faces up in model space
   * and fits around the wearer's upper arm. One visible zipper pull travels along
   * the placket from its lower stop toward the neck.
   *
   * @param params An optional identity and authored dimensions in metres.
   * @param seed Selects dimensions left unbound by the author.
   * @returns A model with separate front and back collar holds, wear, sleeve,
   *   exit and closure contacts.
   * @throws {AutoMovieArchetypeRefusal} When an authored dimension is outside its
   *   band.
   */
  export function create(params?: AutoMovieArchetypeStageJacket.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageJacket.Affordance,
  AutoMovieArchetypeStageJacket.Dimension
> {
    return createStageJacketImplementation(params, seed);
  }

  /**
   * Distinct sleeve opening/exit sites, the front collar hold, the back collar
   * hold a dresser behind the wearer takes, the wear site and the zip.
   */
  export type Affordance =
    | "leftSleeveOpening"
    | "leftSleeveExit"
    | "rightSleeveOpening"
    | "rightSleeveExit"
    | "hold"
    | "backCollar"
    | "wear"
    | "zip";

  /** The overall torso, clear short sleeves and zipper travel as metre values. */
  export type Dimension =
    | "width"
    | "depth"
    | "length"
    | "sleeveWidth"
    | "sleeveLength"
    | "zipTravel";

  /** Input constraints and optional scene identity. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The garment's stable scene identity. */
    id?: string;
  }}
