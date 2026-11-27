import { type AutoMovieArchetype } from "../core/index";
import { createStageHandBowProp as createStageHandBowPropImplementation } from "./internal/createStageHandBowProp";
import { AutoMovieArchetypeBow } from "./AutoMovieArchetypeBow";

/** Public operations for Auto Movie Archetype Stage Hand Bow Prop. */
export namespace AutoMovieArchetypeStageHandBowProp {
  /**
   * Hand-held bow silhouette for screen staging.
   *
   * The profile keeps its existing actor handle, resting seat and animated soft
   * display curve.
   *
   * @param params An inert display model, its silhouette dimensions, and the
   *   scene id.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params: AutoMovieArchetypeStageHandBowProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageHandBowProp.Affordance,
  AutoMovieArchetypeStageHandBowProp.Dimension
> {
    return createStageHandBowPropImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model =
    | "s1"
    | "s2"
    | "s3"
    | "hoyt68"
    | "hoyt70"
    | "warrior"
    | "zenith";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "brace"
    | "depth"
    | "draw"
    | "length"
    | "mass"
    | "nockHeight";

  /**
   * The createBow contact set its shared construction types. This producer
   * builds grip, lowerLimb, nock, rest, string, upperLimb.
   */
  export type Affordance = AutoMovieArchetypeBow.Affordance;

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["longbow", "recurve", "horseBow"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBow.IParams,
    "id" | "length" | "depth" | "brace" | "nockHeight" | "mass" | "draw"
  > {
    /** The profile with the required outline. */
    kind: Kind;
    /** A model from this form's catalogue. */
    model?: Model;
    /** A legacy catalogue selector available on the horse-bow silhouette. */
    weight?: AutoMovieArchetypeBow.Weight;
  }}
