import { AutoMovieArchetypeStageFootwear } from "../AutoMovieArchetypeStageFootwear";
import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core/index";
import {
  ArchetypeDraw,
} from "../../core/internal/ArchetypeDraw";

/*
 * An open-footwear stage prop with a clear upper cavity.
 *
 * The model sits on its sole, with +Z toward the toe. It has an independent
 * rear pull grip, a rectangular foot opening and a heel seat inside the sole.
 * Parameter params: The form, model identity, and any fixed clearance in metres.
 * Parameter seed: Selects dimensions left unbound by the author.
 * Returns: The shaped footwear and its three actor-facing contacts.
 * For an unavailable form or an out-of-band
 * size.
 */
export function createStageFootwear(
  params: AutoMovieArchetypeStageFootwear.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeStageFootwear.Affordance,
  AutoMovieArchetypeStageFootwear.Dimension
> {
  const kind: AutoMovieArchetypeStageFootwear.Kind = ArchetypeDraw.choice(
    "stageFootwear",
    "kind",
    params.kind,
    AutoMovieArchetypeStageFootwear.KINDS,
  );
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStageFootwear.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "stageFootwear",
      { length: "m", width: "m", height: "m" },
      seed,
      params,
    );
  const {
    length,
    width,
    height,
  }: Record<AutoMovieArchetypeStageFootwear.Dimension, number> = draw.dimensions(BANDS);
  const profile: (typeof PROFILES)[AutoMovieArchetypeStageFootwear.Kind] = PROFILES[kind];
  const wall: number = profile.thickness;
  const half: number = length / 2;
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeStageFootwear.Affordance,
    AutoMovieArchetypeStageFootwear.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: kind === "shoe" ? "stage slip-on shoe" : "stage ankle sock",
    material: "composite",
    draw,
  });
  const outerWidth: number = width + 2 * wall;
  const outerLength: number = length + 2 * wall;
  const color: AutoMovieArchetypeBuilder.IOptions = { color: profile.tint };
  const center: number = wall + height / 2;
  builder.box(
    "sole",
    v(outerWidth, wall, outerLength),
    v(0, wall / 2, 0),
    color,
  );
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.box(
      side + "-upper",
      v(wall, height, outerLength),
      v((sign * (width + wall)) / 2, center, 0),
      color,
    );
  for (const [side, sign] of [
    ["toe", 1],
    ["heel", -1],
  ] as const)
    builder.box(
      side,
      v(width, height, wall),
      v(0, center, sign * (half + wall / 2)),
      color,
    );
  const pullY: number = wall + height + 0.07;
  const pullZ: number = -half - wall - 0.017;
  for (const [name, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.rod(
      name + "-pull-stay",
      0.006,
      v(sign * 0.03, center, -half - wall / 2),
      v(sign * 0.03, pullY, pullZ),
      color,
    );
  builder.rod("pull", 0.013, v(-0.03, pullY, pullZ), v(0.03, pullY, pullZ), {
    color: "#eaaf54",
  });
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, pullY, pullZ),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    symmetry: "round",
    aperture: 0.026,
    length: 0.06,
  });
  builder.affordance({
    id: "opening",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, wall + height, half),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    width,
    height: length,
    extent: null,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0, wall, -half + 0.015)),
    extent: null,
  });
  return builder.build(profile.mass);
}

/*
 * Authored internal coarse footwear sizes in metres.
 */
const BANDS: Readonly<
  Record<AutoMovieArchetypeStageFootwear.Dimension, IAutoMovieArchetypeBand>
> = {
  length: AutoMovieArchetypeBand.metres(
    0.21,
    0.36,
    "Clear length of the coarse footwear proxy",
    true,
  ),
  width: AutoMovieArchetypeBand.metres(
    0.1,
    0.17,
    "Clear standing foot opening of the coarse proxy",
    true,
  ),
  height: AutoMovieArchetypeBand.metres(
    0.035,
    0.085,
    "Coarse footwear wall height above the sole",
    true,
  ),
};

/*
 * One kind's wall thickness in metres, colour and mass in kilograms.
 */
interface IFootwearProfile {
  /*
   * The upper's wall thickness, metres.
   */
  thickness: number;

  /*
   * The drawn colour.
   */
  tint: string;

  /*
   * The mass, kilograms.
   */
  mass: number;
}

/*
 * The coarse shoe and the thinner soft-looking sock are the same geometric
 * family.
 */
const PROFILES: Readonly<Record<AutoMovieArchetypeStageFootwear.Kind, IFootwearProfile>> = {
  shoe: { thickness: 0.012, tint: "#375d88", mass: 0.24 },
  sock: { thickness: 0.004, tint: "#a4645c", mass: 0.04 },
};
