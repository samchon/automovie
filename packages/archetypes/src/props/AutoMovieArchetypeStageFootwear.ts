import { type AutoMovieArchetype } from "../core/index";
import { createStageFootwear as createStageFootwearImplementation } from "./internal/createStageFootwear";

/** Public operations for Auto Movie Archetype Stage Footwear. */
export namespace AutoMovieArchetypeStageFootwear {
  /**
   * An open-footwear stage prop with a clear upper cavity.
   *
   * The model sits on its sole, with +Z toward the toe. It has an independent
   * rear pull grip, a rectangular foot opening and a heel seat inside the sole.
   *
   * @param params The form, model identity, and any fixed clearance in metres.
   * @param seed Selects dimensions left unbound by the author.
   * @returns The shaped footwear and its three actor-facing contacts.
   * @throws {AutoMovieArchetypeRefusal} For an unavailable form or an out-of-band
   *   size.
   */
  export function create(params: AutoMovieArchetypeStageFootwear.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageFootwear.Affordance,
  AutoMovieArchetypeStageFootwear.Dimension
> {
    return createStageFootwearImplementation(params, seed);
  }

  /** The fixed profile identifiers. */
  export const KINDS = ["shoe", "sock"] as const;

  /** The selected coarse footwear form. */
  export type Kind = (typeof KINDS)[number];

  /** The rear pull, open top and heel wear seat. */
  export type Affordance = "hold" | "opening" | "wear";

  /** Metres of cavity length, width and height. */
  export type Dimension = "length" | "width" | "height";

  /** Input constraints and optional model identity. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The shape rendered by the scene. */
    kind: Kind;
    /** A stable scene identity. */
    id?: string;
  }}
