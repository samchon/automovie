import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { StageBladeConstruction } from "./StageBladeConstruction";
import type { createStageBladeProp } from "./createStageBladeProp";

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
export function createStageTwoHandedSwordProp(
  params: createStageTwoHandedSwordProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createStageTwoHandedSwordProp.Affordance,
  createStageTwoHandedSwordProp.Dimension
> {
  return StageBladeConstruction(
    "longsword",
    params,
    seed,
    true,
    (builder, { gripLength, guardRadius, guardDepth }) => {
      const v: typeof Vector3.create = Vector3.create;
      builder.rod(
        "guard",
        guardDepth,
        v(-guardRadius, gripLength, 0),
        v(guardRadius, gripLength, 0),
        { color: "#6f6687", round: true },
      );
    },
  );
}

/** Authoring options for {@link createStageTwoHandedSwordProp}. */
export namespace createStageTwoHandedSwordProp {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length";

  /**
   * The stage blades' shared contacts; this producer builds the grip and the
   * point and declares no edge.
   */
  export type Affordance = createStageBladeProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageBladeProp.IParams, "id" | "length">;
}
