import { type AutoMovieArchetype } from "../core/index";
import { createPracticeBaton as createPracticeBatonImplementation } from "./internal/createPracticeBaton";
import { type AutoMovieArchetypeClub } from "./AutoMovieArchetypeClub";

/** Public operations for Auto Movie Archetype Practice Baton. */
export namespace AutoMovieArchetypePracticeBaton {
  /**
   * An inert straight practice baton for film staging.
   *
   * The digital prop stands on its butt along +Y. The saved grip and contact
   * frames remain available to existing takes.
   *
   * @param params The identifier, existing display profile and any free
   *   dimensions set within their bands.
   * @param seed The seed selects an unspecified profile and draws free
   *   dimensions. Without a seed, it uses the first profile and band midpoints.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(params?: AutoMovieArchetypePracticeBaton.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePracticeBaton.Affordance,
  AutoMovieArchetypePracticeBaton.Dimension
> {
    return createPracticeBatonImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "grip" | "strike";

  /** The recorded digital prop profiles. */
  export type Model = "mp24" | "mp26";

  /** The identifier, recorded model choice and adjustable dimensions. */
  export interface IParams extends Pick<
    AutoMovieArchetypeClub.IParams,
    "id" | "diameter" | "mass"
  > {
    /**
     * A recorded profile. Omission uses the seed or the first profile without a
     * seed.
     */
    model?: Model;
  }}
