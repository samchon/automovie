import { type AutoMovieArchetype } from "../core/index";
import { createCostumeHelmet as createCostumeHelmetImplementation } from "./internal/createCostumeHelmet";
import { type AutoMovieArchetypeArmour } from "./AutoMovieArchetypeArmour";

/** Public operations for Auto Movie Archetype Costume Helmet. */
export namespace AutoMovieArchetypeCostumeHelmet {
  /**
   * Worn helmet costume.
   *
   * The piece keeps its existing open, closed or brimmed helmet cavity and is
   * fixed at its wear frame on the head.
   *
   * @param params The scene id and optional measurements and model choice of this
   *   costume.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params: AutoMovieArchetypeCostumeHelmet.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCostumeHelmet.Affordance,
  AutoMovieArchetypeCostumeHelmet.Dimension
> {
    return createCostumeHelmetImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "depth"
    | "height"
    | "mass"
    | "pad"
    | "thickness"
    | "width";

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "wear";

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["openHelmet", "closedHelmet", "brimmedHelmet"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeArmour.IParams,
    "id" | "pad" | "thickness" | "measure"
  > {
    /** The profile with the required outline. */
    kind: Kind;
    /** A model from this form's catalogue. */
    model?:
      | "met26453"
      | "met25388"
      | "met23232"
      | "met26508"
      | "met26512"
      | "met21972";
  }}
