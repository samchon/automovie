import { type AutoMovieArchetype } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import type { createProjectile } from "./createProjectile";
import { stageTokenSphere } from "./stageTokenSphere";

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
export function createStageRoundProp(
  params: createStageRoundProp.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createStageRoundProp.Affordance,
  createStageRoundProp.Dimension
> {
  return StageTokenConstruction(
    "roundShot",
    params,
    seed,
    (builder, d, model) => stageTokenSphere(builder, d, "roundShot", model),
  );
}

/** Authoring options for {@link createStageRoundProp}. */
export namespace createStageRoundProp {
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
  }
}
