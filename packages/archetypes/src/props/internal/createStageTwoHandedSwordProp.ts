import type { AutoMovieArchetypeStageTwoHandedSwordProp } from "../AutoMovieArchetypeStageTwoHandedSwordProp";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../../core/index";
import { StageBladeConstruction } from "./StageBladeConstruction";


/*
 * Padded two-handed sword silhouette.
 *
 * A long padded silhouette with a visible crossguard and a two-hand grip
 * extending along +Y from the model origin.
 * Parameter params: The scene identity and optional display length in metres.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageTwoHandedSwordProp(
  params: AutoMovieArchetypeStageTwoHandedSwordProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageTwoHandedSwordProp.Affordance,
  AutoMovieArchetypeStageTwoHandedSwordProp.Dimension
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
