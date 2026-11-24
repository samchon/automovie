import { type AutoMovieArchetype } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import type { createProjectile } from "./createProjectile";
import { stageTokenSphere } from "./stageTokenSphere";

/**
 * Small round display token.
 *
 * A sphere resting on the floor below a single precision handle at its centre.
 *
 * @param params The scene id and this digital form's catalogue or sizing
 *   options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageBallProp(
  params: createStageBallProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createStageBallProp.Affordance,
  createStageBallProp.Dimension
> {
  return StageTokenConstruction("ball", params, seed, (builder, d, model) =>
    stageTokenSphere(builder, d, "ball", model),
  );
}

/** Authoring options for {@link createStageBallProp}. */
export namespace createStageBallProp {
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

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "diameter" | "mass"
  >;
}
