import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import { createProjectile } from "./createProjectile";
import { stageTokenSphere } from "./stageTokenSphere";

/**
 * Rounded period stage silhouette.
 *
 * The ornamental top and round body are an inert digital model with a single
 * actor grip at the body's centre.
 *
 * @param params The scene id and this digital form's catalogue or sizing
 *   options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageGrenadeProp(
  params: createStageGrenadeProp.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createStageGrenadeProp.Affordance,
  createStageGrenadeProp.Dimension
> {
  return StageTokenConstruction(
    "grenade",
    params,
    seed,
    (builder, d, model) => {
      const v: typeof Vector3.create = Vector3.create;
      const top: number = d.length!;
      builder.rod(
        "fuze",
        d.diameter! * createProjectile.FUZE,
        v(0, d.diameter!, 0),
        v(0, top, 0),
        { color: "#3f4a3a" },
      );
      return stageTokenSphere(builder, d, "grenade", model);
    },
  );
}

/** Authoring options for {@link createStageGrenadeProp}. */
export namespace createStageGrenadeProp {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds body.
   */
  export type Affordance = createProjectile.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "diameter" | "length" | "mass"
  >;
}
