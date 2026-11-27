import { type AutoMovieArchetype } from "../core/index";
import { createStageFencingProp as createStageFencingPropImplementation } from "./internal/createStageFencingProp";
import { StageBladeConstruction } from "./internal/StageBladeConstruction";
import { type AutoMovieArchetypeStageBladeProp } from "./AutoMovieArchetypeStageBladeProp";

/** Public operations for Auto Movie Archetype Stage Fencing Prop. */
export namespace AutoMovieArchetypeStageFencingProp {
  /**
   * Padded fencing stage prop.
   *
   * A round visual guard and capped shaft surround the one-hand grip. The
   * selected profile determines the visible guard and colour. Every profile
   * declares its point; the sabre, which also touches with its blade, declares
   * the edge of its whole blade above the guard.
   *
   * @param params The scene identity and optional display length in metres, with
   *   the chosen fencing silhouette.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params: AutoMovieArchetypeStageFencingProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageFencingProp.Affordance,
  AutoMovieArchetypeStageFencingProp.Dimension
> {
    return createStageFencingPropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length";

  /**
   * The contacts this producer builds: the grip, the point and, on the sabre,
   * the edge.
   */
  export type Affordance = "grip" | "point" | "edge";

  /**
   * The sabre's striking part, as shares of its length from the handle's end:
   * its whole blade above the guard, which a sabre touch may land with (FIE
   * Technical Rules, the sabre's valid hit), taken from the guard's end at
   * 0.2.
   */
  export const SABRE_EDGE: StageBladeConstruction.Span = [0.2, 1];

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["foil", "epee", "sabre"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeStageBladeProp.IParams,
    "id" | "length"
  > {
    /** The profile with the required outline. */
    kind: Kind;
  }}
