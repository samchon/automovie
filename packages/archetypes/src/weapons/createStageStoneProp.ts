import { type AutoMovieArchetype } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import type { createProjectile } from "./createProjectile";
import { stageTokenSphere } from "./stageTokenSphere";

/**
 * Stage stone silhouette.
 *
 * A stone-like digital sphere with the authored one-hand contact above the
 * support plane.
 *
 * @param params The scene id and this digital form's catalogue or sizing
 *   options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageStoneProp(
  params: createStageStoneProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createStageStoneProp.Affordance,
  createStageStoneProp.Dimension
> {
  return StageTokenConstruction("stone", params, seed, (builder, d, model) =>
    stageTokenSphere(builder, d, "stone", model),
  );
}

/** Authoring options for {@link createStageStoneProp}. */
export namespace createStageStoneProp {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "gravity" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds body.
   */
  export type Affordance = createProjectile.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "mass" | "gravity"
  >;
}
