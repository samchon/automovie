import { type AutoMovieArchetype } from "../core/index";
import { createFireTorch as createFireTorchImplementation } from "./internal/createFireTorch";
import { type AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/**
 * Constructs a period scene torch with a shaft hold and an upward tip socket.
 */
export namespace AutoMovieArchetypeFireTorch {
  /**
   * Build a decorative period torch upright along model `+Y`.
   *
   * The power grip faces `-Z` at mid-shaft. An upward `light` socket
   * at the top of the head supports a separate staged emitter.
   *
   * @param params Optional scene ID and finite length, shaft diameter, head diameter or mass
   *   within their bands. The ID defaults to `light`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.508 metres tall,
   *   with a 0.035 metre shaft and 0.065 metre head diameter.
   * @returns The shaft and head with their local `grip` and `light` contacts.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeFireTorch.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeFireTorch.Affordance, AutoMovieArchetypeFireTorch.Dimension> {
    return createFireTorchImplementation(params, seed);
  }

  /**
   * Shaft and head diameters and overall axial length in metres. Mass is in kilograms.
   */
  export type Dimension = "diameter" | "headDiameter" | "length" | "mass";

  /** Power `grip` on the shaft and `light` pointing up at the head. */
  export type Affordance = "grip" | "light";

  /**
   * Optional scene ID, finite length and shaft and head diameters in metres, and mass in kilograms.
   */
  export type IParams = Pick<
    AutoMovieArchetypeLight.IParams,
    "id" | "length" | "diameter" | "headDiameter" | "mass"
  >;}
