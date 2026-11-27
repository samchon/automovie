import { AutoMovieArchetypeStageShaftProp } from "../AutoMovieArchetypeStageShaftProp";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, type AutoMovieArchetype } from "../../core/index";
import { StageShaftConstruction } from "./StageShaftConstruction";


/**
 * Padded shaft stage prop.
 *
 * A digital upright shaft with a solid padded outline and one primary grip for
 * actor posing.
 *
 * @param params The scene identity and optional total display height in metres,
 *   with a choice of profile.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createStageShaftProp(
  params: AutoMovieArchetypeStageShaftProp.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageShaftProp.Affordance,
  AutoMovieArchetypeStageShaftProp.Dimension
> {
  const kind: AutoMovieArchetypeStageShaftProp.Kind = ArchetypeDraw.choice(
    "stageWeaponProp",
    "kind",
    params.kind,
    AutoMovieArchetypeStageShaftProp.KINDS,
  );
  return StageShaftConstruction(kind, params, seed, 0.8, (builder, height) => {
    const v: typeof Vector3.create = Vector3.create;
    const radius: number = (kind === "shuo" ? 0.052 : 0.027) * height;
    const lower: number = (kind === "shuo" ? 0.68 : 0.78) * height;
    builder.rod("ornament", radius, v(0, lower, 0), v(0, height - radius, 0), {
      color: "#968ccc",
      round: true,
    });
    if (kind === "halberd")
      builder.rod(
        "sideOrnament",
        0.058 * height,
        v(0, 0.83 * height, 0),
        v(0.15 * height, 0.8 * height, 0),
        { color: "#bca6df", round: true },
      );
  });
}
