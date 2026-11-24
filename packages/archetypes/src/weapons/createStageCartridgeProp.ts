import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { StageTokenConstruction } from "./StageTokenConstruction";
import type { createProjectile } from "./createProjectile";

/**
 * Paper cylinder stage silhouette.
 *
 * A display cylinder with a precision hand contact at mid-height and an end
 * mark along +Y.
 *
 * @param params The scene id and this digital form's catalogue or sizing
 *   options.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageCartridgeProp(
  params: createStageCartridgeProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createStageCartridgeProp.Affordance,
  createStageCartridgeProp.Dimension
> {
  return StageTokenConstruction("cartridge", params, seed, (builder, d) => {
    const v: typeof Vector3.create = Vector3.create;
    const r: number = d.diameter! / 2;
    builder.rod("paper", r, v(0, 0, 0), v(0, d.length!, 0), {
      color: "#d8cfb8",
    });
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, d.length! / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: d.diameter!,
    });
    builder.affordance({
      id: "end",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(v(0, d.length!, 0)),
      extent: null,
    });
    return builder.build(d.mass!);
  });
}

/** Authoring options for {@link createStageCartridgeProp}. */
export namespace createStageCartridgeProp {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /**
   * The createProjectile contact set its shared construction types. This
   * producer builds end, grip.
   */
  export type Affordance = createProjectile.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createProjectile.IParams,
    "id" | "diameter" | "length" | "mass"
  >;
}
