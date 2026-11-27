import { AutoMovieArchetypeStageShaftToken } from "../AutoMovieArchetypeStageShaftToken";
import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";
import { StageTokenConstruction } from "./StageTokenConstruction";
import { AutoMovieArchetypeProjectile } from "../AutoMovieArchetypeProjectile";

/*
 * Slender shaft stage token.
 *
 * The arrow and bolt silhouettes share a model-space handle, seat and tip mark
 * along the shaft.
 * Parameter params: The scene id and this digital form's catalogue or sizing
 * options.
 * Parameter seed: Uses the original named draw session to resolve omitted settings.
 * Returns: The digital model and its authored contact frames.
 * For inputs the selected catalogue profile
 * cannot use.
 */
export function createStageShaftToken(
  params: AutoMovieArchetypeStageShaftToken.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageShaftToken.Affordance,
  AutoMovieArchetypeStageShaftToken.Dimension
> {
  const kind: AutoMovieArchetypeStageShaftToken.Kind = ArchetypeDraw.choice(
    "projectile",
    "kind",
    params.kind,
    AutoMovieArchetypeStageShaftToken.KINDS,
  );
  return StageTokenConstruction(kind, params, seed, (builder, d, model) => {
    const v: typeof Vector3.create = Vector3.create;
    const length: number = d.length!;
    const head: number = kind === "bolt" ? d.head! : 0;
    const r: number = d.diameter! / 2;
    builder.rod("shaft", r, v(0, 0, 0), v(0, length - head, 0), {
      color: "#b98d5b",
      surface: "wood",
    });
    if (kind === "bolt")
      builder.rod(
        "head",
        d.headWidth! / 2,
        v(0, length - head, 0),
        v(0, length, 0),
        {
          color: "#55595f",
          density: AutoMovieArchetypeProjectile.STEEL_OVER_ASH,
          surface: "steel",
        },
      );
    builder.affordance({
      id: "shaft",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, (length - head) / 2, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * r,
      length: length - head,
    });
    // Where the fingers pinch the shaft to set the nock on a string: just
    // ahead of the nock, a pinch's width along it.
    builder.affordance({
      id: "nockGrip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, PINCH, 0),
        v(0, 0, -1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * r,
      length: PINCH,
    });
    builder.affordance({
      id: "nock",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, 0),
        v(0, -1, 0),
        v(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "tip",
      kind: "surface",
      direction: "along",
      frame: AutoMovieArchetypeFrame.upright(v(0, length, 0)),
      extent: null,
    });
    return builder.build(d.mass!, {
      rests: "wood",
      ...AutoMovieArchetypeProjectile.flight(kind, model, r),
    });
  });
}

/*
 * How far ahead of the nock the fingers pinch the shaft to nock it, metres: a
 * fingertip pad's width (provisional).
 */
const PINCH: number = 0.03;
