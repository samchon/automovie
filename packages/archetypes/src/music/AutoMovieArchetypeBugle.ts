import { type AutoMovieArchetype } from "../core/index";
import { createBugle as createBugleImplementation } from "./internal/createBugle";
import { type createInstrument } from "./createInstrument";

/** Public operations for Auto Movie Archetype Bugle. */
export namespace AutoMovieArchetypeBugle {
  /**
   * A bugle with a hand grip and lip socket.
   *
   * The bugle lies on its side with the bell toward +X. The mouthpiece is the
   * socket a wind performance meets.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeBugle.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBugle.Affordance, AutoMovieArchetypeBugle.Dimension> {
    return createBugleImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "bell" | "length" | "mass";

  /** The named playing and carrying contacts. */
  export type Affordance = "grip" | "mouthpiece";

  /** The identifier and dimension overrides for this instrument. */
  export type IParams = Pick<
    createInstrument.IParams,
    "id" | "length" | "bell" | "mass"
  >;}
