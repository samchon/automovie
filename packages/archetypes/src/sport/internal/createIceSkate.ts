import type { AutoMovieArchetypeIceSkate } from "../AutoMovieArchetypeIceSkate";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../../core/index";

/*
 * One coarse hockey skate, resting on the runner with the toe toward +Z. Its
 * intended foot length and runner length are from the CCM 2016 size guide. The
 * boot, holder and steel cross section use provisional outer dimensions.
 * https://www.iceglace.com/catalogues/Catalogue_ICE_CCM_2016.pdf
 * Parameter params: The scene id and optional mass in kilograms.
 * Parameter seed: Draws the mass if the author leaves it open.
 * Returns: A skate with a boot socket and three runner contact sites.
 */
export function createIceSkate(
  params: AutoMovieArchetypeIceSkate.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeIceSkate.Affordance, "mass"> {
  const draw: AutoMovieArchetypeDrawSession<"mass"> =
    new AutoMovieArchetypeDrawSession("iceSkate", { mass: "kg" }, seed, params);
  const { mass }: Record<"mass", number> = draw.dimensions({
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.7,
      1.1,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  });
  const builder: AutoMovieArchetypeBuilder<AutoMovieArchetypeIceSkate.Affordance, "mass"> =
    new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: "hockey skate",
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const d: typeof GEOMETRY = GEOMETRY;
  const sole: number = d.steel + d.holder;
  const heel: number = -FIT.foot / 4;
  builder.box(
    "boot",
    v(d.width, d.sole, FIT.foot),
    v(0, sole + d.sole / 2, 0),
    { color: "#182432" },
  );
  builder.box(
    "ankle-shell",
    v(d.width, d.collar, FIT.foot / 2),
    v(0, sole + d.sole + d.collar / 2, heel),
    { color: "#273645" },
  );
  builder.box(
    "runner",
    v(d.thickness, d.steel, FIT.blade),
    v(0, d.steel / 2, 0),
    { color: "#adb8c0" },
  );
  for (const [end, sign] of [
    ["front", 1],
    ["rear", -1],
  ] as const)
    builder.box(
      `holder-${end}`,
      v(d.width / 3, d.holder, FIT.blade / 5),
      v(0, d.steel + d.holder / 2, (sign * FIT.blade) / 3),
      { color: "#ecf0ee" },
    );
  const boot: IAutoMovieVector3 = v(0, sole + d.sole, heel);
  builder.affordance({
    id: "boot",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(boot),
    extent: null,
  });
  for (const [id, x] of [
    ["blade", 0],
    ["leftEdge", d.thickness / 2],
    ["rightEdge", -d.thickness / 2],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(x, 0, 0)),
      extent: null,
    });
  return builder.build(mass);
}

/*
 * CCM 2016 men's size 6 chart, in metres.
 */
const FIT: Readonly<{ foot: number; blade: number }> = {
  foot: 0.252,
  blade: 0.263,
};

/*
 * Provisional outer dimensions of the shell, holder and runner, in metres.
 */
const GEOMETRY: Readonly<{
  width: number;
  sole: number;
  collar: number;
  holder: number;
  steel: number;
  thickness: number;
}> = {
  width: 0.1,
  sole: 0.045,
  collar: 0.115,
  holder: 0.029,
  steel: 0.015,
  thickness: 0.003,
};
