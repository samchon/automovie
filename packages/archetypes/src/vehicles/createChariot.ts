import { type AutoMovieArchetype } from "../core";
import { CartConstruction } from "./CartConstruction";
import { CartDrawn } from "./CartDrawn";
import type { createCart } from "./createCart";

/**
 * Two-wheeled standing chariot.
 *
 * The pole coupling leads along +Z from the axle. The platform and rail support
 * standing performers.
 *
 * @param params The scene identity and the dimensions and catalogue choices
 *   this carrier admits.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createChariot(
  params: createChariot.IParams = {},
  seed?: number,
): AutoMovieArchetype<createChariot.Affordance, createChariot.Dimension> {
  return CartConstruction("chariot", params, seed, CartDrawn.chariot);
}

/** Authoring options for {@link createChariot}. */
export namespace createChariot {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "floorDepth"
    | "floorWidth"
    | "mass"
    | "poleLength"
    | "railHeight"
    | "track"
    | "wheelDiameter"
    | "withersHeight";

  /**
   * The createCart contact set its shared construction types. This producer
   * builds coupling, floor, leftSpin, rightSpin, rim.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createCart.IParams,
    | "id"
    | "wheelDiameter"
    | "track"
    | "floorWidth"
    | "floorDepth"
    | "railHeight"
    | "poleLength"
    | "withersHeight"
    | "mass"
  > {
    /** A model from this form's catalogue. */
    model?:
      | "carter120"
      | "carter121"
      | "carter122"
      | "carter161"
      | "carter332"
      | "carter333";
  }
}
