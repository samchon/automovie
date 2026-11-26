import type { AutoMovieArchetype } from "../core";
import type { createCart } from "./createCart";
import { createLimberImpl } from "./cart/createLimber";

/** Canonical producer and authoring contract for Limber. */
export namespace AutoMovieArchetypeLimber {
  /**
   * Two-wheeled towing limber.
   *
   * The forward draw contact leads along +Z from the axle. The rear coupling and
   * placed chest move with its frame.
   *
   * @param params The scene identity and the dimensions and catalogue choices
   *   this carrier admits.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(
    params: AutoMovieArchetypeLimber.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeLimber.Affordance,
    AutoMovieArchetypeLimber.Dimension
  > {
    return createLimberImpl(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "length"
    | "mass"
    | "poleLength"
    | "track"
    | "wheelDiameter";

  /**
   * The createCart contact set its shared construction types. This producer
   * builds chest, coupling, leftSpin, pintle, rightSpin, seat.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createCart.IParams,
    "id" | "wheelDiameter" | "track" | "length" | "poleLength" | "mass"
  >;
}
