import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/** Length, waist and binding spacing of the Burton Custom Camber 154, in metres. */
const SIZE: Readonly<{ length: number; waist: number; stance: number }> = {
  length: 1.54,
  waist: 0.25,
  stance: 0.53,
};

/** Provisional edge appearance, section thickness and tip rise, in metres. */
const FORM: Readonly<{ hip: number; tip: number; thickness: number; rise: number }> = {
  hip: 0.29,
  tip: 0.17,
  thickness: 0.012,
  rise: 0.046,
};

/**
 * A coarse snowboard with distinct binding sites and visible raised ends.
 * The nose is along -Z. The waist, length and stance width follow Burton's
 * 154 cm Custom Camber. Adjacent panels share section vertices. Tip widths,
 * thickness and rise are provisional. Bindings are simple contact pads.
 * https://www.burton.com/en-us/products/mens-burton-custom-camber-snowboard-106881
 *
 * @param params Optional scene id and mass in kilograms.
 * @param seed Draws the mass if the author leaves it open.
 * @returns A board with a deck, binding sites and both edge markers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the orientation, primary sizing, approximations and affordances.
 * @evidence contracts/development/implementation.md#principled-implementation Builds adjacent sections from common rings and derives the binding and lower edge markers from the same dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A fixed symmetric profile, two binding pads and named deck and edge readings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The piecewise board approximates the outline and tip rise without claiming measured camber or binding articulation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five section rings and four convex panels per board.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call constructs a board with its own draw and scene identity.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No state is retained after build.
 */
export function createSnowboard(
  params: createSnowboard.IParams = {},
  seed?: number | string,
): Archetype<createSnowboard.Affordance, "mass"> {
  const draw: ArchetypeDrawSession<"mass"> = new ArchetypeDrawSession(
    "snowboard", { mass: "kg" }, seed, params,
  );
  const { mass }: Record<"mass", number> = draw.dimensions({
    mass: ArchetypeBand.of("kg", 2.8, 3.8, ArchetypeBand.TYPICAL_MASS, true),
  });
  const builder: ArchetypeBuilder<createSnowboard.Affordance, "mass"> =
    new ArchetypeBuilder({
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
    ([z, width, rise]: readonly [number, number, number]): IAutoMovieVector3[] => [
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
    id: "deck", kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.thickness, 0)),
    extent: null, width: SIZE.waist, depth: 2 * SIZE.length / 3,
  });
  const padHeight: number = 0.015;
  const padDepth: number = 0.12;
  for (const [id, sign] of [["frontBinding", -1], ["rearBinding", 1]] as const) {
    const z: number = sign * SIZE.stance / 2;
    builder.box(
      id,
      v(SIZE.waist, padHeight, padDepth),
      v(0, d.thickness + padHeight / 2, z),
      { color: "#25384a" },
    );
    builder.affordance({
      id, kind: "surface",
      frame: ArchetypeFrame.upright(v(0, d.thickness + padHeight, z)),
      extent: null, width: SIZE.waist, depth: padDepth,
    });
  }
  for (const [id, sign] of [["leftEdge", 1], ["rightEdge", -1]] as const)
    builder.affordance({
      id, kind: "socket",
      frame: ArchetypeFrame.upright(v(sign * SIZE.waist / 2, 0, 0)),
      extent: null,
    });
  return builder.build(mass);
}

/**
 * Inputs and affordances of the snowboard.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the mass unit and describes the deck, binding and edge sites.
 * @evidence contracts/development/design.md#principled-representation Names the physical board sites in a closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the mass input and stance and edge readings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Binding centers and board edge markers remain in the geometry's own frame.
 */
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

    /** Mass in kilograms. Drawn from the documented provisional band when absent. */
    mass?: number;
  }
}
