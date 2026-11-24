import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/** Length, waist and binding spacing of the Burton Custom Camber 154, in metres. */
const SIZE: Readonly<{ length: number; waist: number; stance: number }> = {
  length: 1.54,
  waist: 0.25,
  stance: 0.53,
};

/** Provisional edge appearance, section thickness and tip rise, in metres. */
const FORM: Readonly<{
  hip: number;
  tip: number;
  thickness: number;
  rise: number;
}> = {
  hip: 0.29,
  tip: 0.17,
  thickness: 0.012,
  rise: 0.046,
};

/**
 * A coarse snowboard with distinct binding sites and visible raised ends. The
 * nose is along -Z. The waist, length and stance width follow Burton's 154 cm
 * Custom Camber. Adjacent panels share section vertices. Tip widths, thickness
 * and rise are provisional. Bindings are simple contact pads.
 * https://www.burton.com/en-us/products/mens-burton-custom-camber-snowboard-106881
 *
 * @param params Optional scene id and mass in kilograms.
 * @param seed Draws the mass if the author leaves it open.
 * @returns A board with a deck, binding sites and both edge markers.
 */
export function createSnowboard(
  params: createSnowboard.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createSnowboard.Affordance, "mass"> {
  const draw: AutoMovieArchetypeDrawSession<"mass"> =
    new AutoMovieArchetypeDrawSession(
      "snowboard",
      { mass: "kg" },
      seed,
      params,
    );
  const { mass }: Record<"mass", number> = draw.dimensions({
    mass: AutoMovieArchetypeBand.of(
      "kg",
      2.8,
      3.8,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  });
  const builder: AutoMovieArchetypeBuilder<createSnowboard.Affordance, "mass"> =
    new AutoMovieArchetypeBuilder({
      material: "composite",
      id: params.id,
      name: "snowboard",
      draw,
    });
  const v: typeof Vector3.create = Vector3.create;
  const d: typeof FORM = FORM;
  const profile: readonly (readonly [number, number, number])[] = [
    [-SIZE.length / 2, d.tip, d.rise],
    [-SIZE.length / 3, d.hip, 0],
    [0, SIZE.waist, 0],
    [SIZE.length / 3, d.hip, 0],
    [SIZE.length / 2, d.tip, d.rise],
  ];
  const rings: readonly IAutoMovieVector3[][] = profile.map(
    ([z, width, rise]: readonly [
      number,
      number,
      number,
    ]): IAutoMovieVector3[] => [
      v(-width / 2, rise, z),
      v(width / 2, rise, z),
      v(-width / 2, rise + d.thickness, z),
      v(width / 2, rise + d.thickness, z),
    ],
  );
  for (let i: number = 1; i < rings.length; ++i)
    builder.convex(`deck-${i}`, [...rings[i - 1]!, ...rings[i]!], undefined, {
      color: "#35999e",
    });
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.thickness, 0)),
    extent: null,
    width: SIZE.waist,
    depth: (2 * SIZE.length) / 3,
  });
  const padHeight: number = 0.015;
  const padDepth: number = 0.12;
  for (const [id, sign] of [
    ["frontBinding", -1],
    ["rearBinding", 1],
  ] as const) {
    const z: number = (sign * SIZE.stance) / 2;
    builder.box(
      id,
      v(SIZE.waist, padHeight, padDepth),
      v(0, d.thickness + padHeight / 2, z),
      { color: "#25384a" },
    );
    builder.affordance({
      id,
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, d.thickness + padHeight, z)),
      extent: null,
      width: SIZE.waist,
      depth: padDepth,
    });
  }
  for (const [id, sign] of [
    ["leftEdge", 1],
    ["rightEdge", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v((sign * SIZE.waist) / 2, 0, 0)),
      extent: null,
    });
  return builder.build(mass);
}

/** Inputs and affordances of the snowboard. */
export namespace createSnowboard {
  /** Top deck, both binding sites and lower edges at the waist. */
  export type Affordance =
    | "deck"
    | "frontBinding"
    | "rearBinding"
    | "leftEdge"
    | "rightEdge";

  /** Optional scene identity and fixed mass. */
  export interface IParams {
    /** Scene id, unique if a scene has multiple snowboards. */
    id?: string;

    /**
     * Mass in kilograms. Drawn from the documented provisional band when
     * absent.
     */
    mass?: number;
  }
}
