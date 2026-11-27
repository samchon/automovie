import { type AutoMovieArchetype } from "../core/index";
import { createStageTwoHandedSwordProp as createStageTwoHandedSwordPropImplementation } from "./internal/createStageTwoHandedSwordProp";
import { type AutoMovieArchetypeStageBladeProp } from "./AutoMovieArchetypeStageBladeProp";

/** Public operations for Auto Movie Archetype Stage Two Handed Sword Prop. */
export namespace AutoMovieArchetypeStageTwoHandedSwordProp {
  /**
   * Padded two-handed sword silhouette.
   *
   * A long padded silhouette with a visible crossguard and a two-hand grip
   * extending along +Y from the model origin.
   *
   * @param params The scene identity and optional display length in metres.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageTwoHandedSwordProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageTwoHandedSwordProp.Affordance,
  AutoMovieArchetypeStageTwoHandedSwordProp.Dimension
> {
    return createStageTwoHandedSwordPropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length";

  /**
   * The stage blades' shared contacts; this producer builds the grip and the
   * point and declares no edge.
   */
  export type Affordance = AutoMovieArchetypeStageBladeProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<AutoMovieArchetypeStageBladeProp.IParams, "id" | "length">;}
