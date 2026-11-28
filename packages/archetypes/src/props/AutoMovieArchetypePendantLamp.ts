import { type AutoMovieArchetype } from "../core/index";
import { createPendantLamp as createPendantLampImplementation } from "./internal/createPendantLamp";
import { type AutoMovieArchetypeLight } from "./AutoMovieArchetypeLight";

/**
 * Constructs a suspended lamp with a ceiling hook and downward shade socket.
 */
export namespace AutoMovieArchetypePendantLamp {
  /**
   * Build a pendant suspended from a ceiling hook at the model origin.
   *
   * The cord runs along `-Y`. The shade's `light` socket points down
   * from its mouth at the combined cord and shade depth.
   *
   * @param params Optional scene ID and finite cord drop, shade diameter and height, or mass
   *   within their bands. The ID defaults to `light`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   a 1.4986 metre cord,
   *   a 0.381 metre shade diameter and a 0.2794 metre shade height.
   * @returns The ceiling `hook`, side shade `grip` and downward `light` socket.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: AutoMovieArchetypePendantLamp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePendantLamp.Affordance,
  AutoMovieArchetypePendantLamp.Dimension
> {
    return createPendantLampImplementation(params, seed);
  }

  /**
   * Cord drop, shade height and shade diameter in metres. Mass is in kilograms.
   */
  export type Dimension = "cord" | "height" | "mass" | "shade";

  /** Ceiling `hook`, side shade `grip` and downward `light` at the mouth. */
  export type Affordance = "grip" | "hook" | "light";

  /**
   * Optional ID, finite cord drop, shade height and diameter in metres, and mass in kilograms.
   */
  export type IParams = Pick<
    AutoMovieArchetypeLight.IParams,
    "id" | "height" | "shade" | "cord" | "mass"
  >;}
