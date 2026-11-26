import { AutoMovieArchetypeStagePracticeSwordProp } from "../AutoMovieArchetypeStagePracticeSwordProp";
import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../../core/index";
import { StageBladeConstruction } from "../StageBladeConstruction";


/**
 * Padded practice sword silhouette.
 *
 * A digital training-sword silhouette with a padded cap, visible binding and a
 * long two-hand grip along +Y. It declares its point and the edge of its
 * monouchi, the striking part.
 *
 * @param params The scene identity and optional display length in metres.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStagePracticeSwordProp(
  params: AutoMovieArchetypeStagePracticeSwordProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStagePracticeSwordProp.Affordance,
  AutoMovieArchetypeStagePracticeSwordProp.Dimension
> {
  return StageBladeConstruction(
    "shinai",
    params,
    seed,
    true,
    (builder, profile) => {
      StageBladeConstruction.roundGuard(builder, profile);
      const { length, shaftRadius }: StageBladeConstruction.IProfile = profile;
      const v: typeof Vector3.create = Vector3.create;
      builder.rod(
        "binding",
        shaftRadius + 0.003,
        v(0, 0.74 * length, 0),
        v(0, 0.77 * length, 0),
        { color: "#fff0b2" },
      );
    },
    AutoMovieArchetypeStagePracticeSwordProp.EDGE,
  );
}
