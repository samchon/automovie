import { type AutoMovieArchetype } from "../core/index";
import { createStageRoundProp as createStageRoundPropImplementation } from "./internal/createStageRoundProp";
import { type createProjectile } from "./createProjectile";

/** Public operations for Auto Movie Archetype Stage Round Prop. */
export namespace AutoMovieArchetypeStageRoundProp {
  /**
   * Heavy round display silhouette.
   *
   * A round, floor-supported stage form with its model-space two-hand contact at
   * the centre.
   *
   * @param params The scene id and this digital form's catalogue or sizing
   *   options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageRoundProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageRoundProp.Affordance,
  AutoMovieArchetypeStageRoundProp.Dimension
> {
    return createStageRoundPropImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "sixPounder" | "twelvePounder";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds body.
   */
  export type Affordance = createProjectile.Affordance;

  /** The model identity and this form's catalogue choices. */
  export interface IParams extends Pick<createProjectile.IParams, "id"> {
    /** A model from this form's catalogue. */
    model?: Model;
  }}
