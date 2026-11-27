import { type AutoMovieArchetype } from "../core/index";
import { createLacrosseCrosse as createLacrosseCrosseImplementation } from "./internal/createLacrosseCrosse";
import { type AutoMovieArchetypeStick } from "./AutoMovieArchetypeStick";

/** Public operations for Auto Movie Archetype Lacrosse Crosse. */
export namespace AutoMovieArchetypeLacrosseCrosse {
  /**
   * A lacrosse crosse with a mesh pocket, scoop and shaft grip.
   *
   * The head lies at the bottom, its face toward +Z. The pocket rests behind the
   * head and the scoop marks its front edge.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypeLacrosseCrosse.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeLacrosseCrosse.Affordance,
  AutoMovieArchetypeLacrosseCrosse.Dimension
> {
    return createLacrosseCrosseImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "head" | "length" | "mass" | "width";

  /** The named contacts on this stick or bat. */
  export type Affordance = "blade" | "grip" | "pocket" | "scoop";

  /** The identifier and overrides available within this profile. */
  export type IParams = Pick<
    AutoMovieArchetypeStick.IParams,
    "id" | "length" | "head" | "width" | "depth" | "mass"
  >;}
