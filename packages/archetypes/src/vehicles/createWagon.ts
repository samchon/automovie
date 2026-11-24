import { type AutoMovieArchetype } from "../core";
import { CartCoach } from "./CartCoach";
import { CartConstruction } from "./CartConstruction";
import type { createCart } from "./createCart";

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
export function createWagon(
  params: createWagon.IParams = {},
  seed?: number,
): AutoMovieArchetype<createWagon.Affordance, createWagon.Dimension> {
  return CartConstruction("wagon", params, seed, CartCoach.wagon);
}

/** Authoring options for {@link createWagon}. */
export namespace createWagon {
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
