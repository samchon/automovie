import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./internal/GroomingPropDraw";
import { createComb as createCombImplementation } from "./internal/createComb";

/**
 * Constructs a pocket comb with a sideways spine grip and downward working edge.
 */
export namespace AutoMovieArchetypeComb {
  /**
   * Build a pocket comb with its length along model `+Z`.
   *
   * The teeth are one block below the spine. The grip faces `+X` and
   * the teeth's `face` points down along `-Y`.
   *
   * @param params Optional scene ID and finite length, width, thickness or mass
   *   admitted by the bands. The ID defaults to `careItem`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.133 metres long, 0.026 metres tall,
   *   0.0035 metres thick and 0.015 kilograms.
   * @returns The comb with a lateral spine grip and a full-length working edge.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass" | "thickness"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeComb.Affordance, AutoMovieArchetypeComb.Dimension> {
    return createCombImplementation(params, seed);
  }

  /** Lateral `grip` along the spine and downward `face` along the teeth. */
  export type Affordance = "face" | "grip";

  /**
   * Metre-valued length along Z, height as `width` and thickness along X. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";}
