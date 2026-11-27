import { AutoMovieArchetypeStageFencingProp } from "../AutoMovieArchetypeStageFencingProp";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import { StageBladeConstruction } from "./StageBladeConstruction";


/*
 * Padded fencing stage prop.
 *
 * A round visual guard and capped shaft surround the one-hand grip. The
 * selected profile determines the visible guard and colour. Every profile
 * declares its point; the sabre, which also touches with its blade, declares
 * the edge of its whole blade above the guard.
 * Parameter params: The scene identity and optional display length in metres, with
 * the chosen fencing silhouette.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageFencingProp(
  params: AutoMovieArchetypeStageFencingProp.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageFencingProp.Affordance,
  AutoMovieArchetypeStageFencingProp.Dimension
> {
  const kind: AutoMovieArchetypeStageFencingProp.Kind = ArchetypeDraw.choice(
    "stageBladeProp",
    "kind",
    params.kind,
    AutoMovieArchetypeStageFencingProp.KINDS,
  );
  return StageBladeConstruction(
    kind,
    params,
    seed,
    false,
    (builder, profile) => {
      StageBladeConstruction.roundGuard(builder, profile);
      if (kind === "sabre") {
        const {
          gripLength,
          guardRadius,
          guardDepth,
        }: StageBladeConstruction.IProfile = profile;
        const v: typeof Vector3.create = Vector3.create;
        builder.rod(
          "guardBow",
          guardDepth,
          v(guardRadius * 0.82, gripLength, 0),
          v(guardRadius * 0.45, guardDepth, 0),
          { color: "#6f6687", round: true },
        );
      }
    },
    kind === "sabre" ? AutoMovieArchetypeStageFencingProp.SABRE_EDGE : undefined,
  );
}
