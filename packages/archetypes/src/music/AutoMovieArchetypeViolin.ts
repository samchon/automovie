import { type AutoMovieArchetype } from "../core/index";
import { createViolin as createViolinImplementation } from "./internal/createViolin";
import { type AutoMovieArchetypeInstrument } from "./AutoMovieArchetypeInstrument";

/** Public operations for Auto Movie Archetype Violin. */
export namespace AutoMovieArchetypeViolin {
  /**
   * A violin with four bowed-string contacts and a neck grasp.
   *
   * The violin lies on its back with the neck along +X and string1 on its -Z
   * edge. The bow is made separately with createViolinBow.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeViolin.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeViolin.Affordance, AutoMovieArchetypeViolin.Dimension> {
    return createViolinImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "bodyLength"
    | "bridgeHeight"
    | "bridgeSpacing"
    | "fingerboard"
    | "lowerBout"
    | "mass"
    | "neck"
    | "neckThickness"
    | "nutSpacing"
    | "rib"
    | "scale"
    | "upperBout"
    | "waist";

  /** The named playing and carrying contacts. */
  export type Affordance = "neck" | `string${number}`;

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    AutoMovieArchetypeInstrument.IParams,
    | "id"
    | "bodyLength"
    | "scale"
    | "neck"
    | "upperBout"
    | "waist"
    | "lowerBout"
    | "rib"
    | "neckThickness"
    | "fingerboard"
    | "nutSpacing"
    | "bridgeSpacing"
    | "bridgeHeight"
    | "mass"
  >;}
