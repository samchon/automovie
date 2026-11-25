import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype } from "../core";
import { StageBladeConstruction } from "./StageBladeConstruction";
import type { createStageBladeProp } from "./createStageBladeProp";

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
  params: createStagePracticeSwordProp.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createStagePracticeSwordProp.Affordance,
  createStagePracticeSwordProp.Dimension
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
    createStagePracticeSwordProp.EDGE,
  );
}

/** Authoring options for {@link createStagePracticeSwordProp}. */
export namespace createStagePracticeSwordProp {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length";

  /** The contacts this producer builds: the grip, the point and the edge. */
  export type Affordance = "grip" | "point" | "edge";

  /**
   * The striking part as shares of the length from the handle's end: the
   * monouchi, from the nakayui binding at 0.77 to the tip (FIK, The Regulations
   * of Kendo Shiai and Shinpan, 2023 revision, Article 13: the datotsu-bu is
   * the jin-bu of the monouchi).
   */
  export const EDGE: StageBladeConstruction.Span = [0.77, 1];

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageBladeProp.IParams, "id" | "length">;
}
