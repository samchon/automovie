import type { AutoMovieArchetype } from "../core";
import type { createCart } from "./createCart";
import { createWagon } from "./cart/createWagon";

/** Canonical producer and authoring contract for Wagon. */
export namespace AutoMovieArchetypeWagon {
  /**
   * Four-wheeled wagon.
   *
   * The rear axle crosses X at the origin. The front axle steers the pole and the
   * bed supports freight.
   *
   * @param params The scene identity and the dimensions and catalogue choices
   *   this carrier admits.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(
    params: AutoMovieArchetypeWagon.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeWagon.Affordance,
    AutoMovieArchetypeWagon.Dimension
  > {
    return createWagon(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "bedDepth"
    | "frontWheelDiameter"
    | "length"
    | "mass"
    | "poleLength"
    | "track"
    | "wheelDiameter"
    | "wheelbase"
    | "width";

  /**
   * The createCart contact set its shared construction types. This producer
   * builds bed, coupling, drawbarPitch, frontAxle, frontLeftSpin,
   * frontRightSpin, rearLeftSpin, rearRightSpin.
   */
  export type Affordance = createCart.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createCart.IParams,
    | "id"
    | "frontWheelDiameter"
    | "wheelDiameter"
    | "track"
    | "wheelbase"
    | "poleLength"
    | "length"
    | "width"
    | "bedDepth"
    | "mass"
  >;
}
