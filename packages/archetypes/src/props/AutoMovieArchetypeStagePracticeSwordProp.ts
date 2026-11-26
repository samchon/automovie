import { type AutoMovieArchetype } from "../core/index";
import { createStagePracticeSwordProp as createStagePracticeSwordPropImplementation } from "./internal/createStagePracticeSwordProp";
import { StageBladeConstruction } from "./StageBladeConstruction";
import { type createStageBladeProp } from "./createStageBladeProp";

/** Public operations for Auto Movie Archetype Stage Practice Sword Prop. */
export namespace AutoMovieArchetypeStagePracticeSwordProp {
  /**
   * Padded practice sword silhouette.
   *
   * A digital training-sword silhouette with a padded cap, visible binding and a
   * long two-hand grip along +Y. It declares its point and the edge of its
   * monouchi, the striking part.
   *
   * @param params The scene identity and optional display length in metres.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStagePracticeSwordProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStagePracticeSwordProp.Affordance,
  AutoMovieArchetypeStagePracticeSwordProp.Dimension
> {
    return createStagePracticeSwordPropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length";

  /** The contacts this producer builds: the grip, the point and the edge. */
  export type Affordance = "grip" | "point" | "edge";

  /**
   * The striking part as shares of the length from the handle's end: the
   * monouchi, from the nakayui binding at 0.77 to the tip (FIK, The Regulations
   * of Kendo Shiai and Shinpan, 2023 revision, Article 13: the datotsu-bu is
   * the jin-bu of the monouchi).
   */
  export const EDGE: StageBladeConstruction.Span = [0.77, 1];

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageBladeProp.IParams, "id" | "length">;}
