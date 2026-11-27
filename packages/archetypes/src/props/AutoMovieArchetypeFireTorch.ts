import { type AutoMovieArchetype } from "../core/index";
import { createFireTorch as createFireTorchImplementation } from "./internal/createFireTorch";
import { type AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/** Public operations for Auto Movie Archetype Fire Torch. */
export namespace AutoMovieArchetypeFireTorch {
  /**
   * A period torch prop with a power grasp and an animated light frame.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeFireTorch.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeFireTorch.Affordance, AutoMovieArchetypeFireTorch.Dimension> {
    return createFireTorchImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "headDiameter" | "length" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "light";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    AutoMovieArchetypeLight.IParams,
    "id" | "length" | "diameter" | "headDiameter" | "mass"
  >;}
