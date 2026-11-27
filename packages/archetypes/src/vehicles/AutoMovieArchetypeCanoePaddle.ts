import "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { PaddleBlade } from "./internal/PaddleBlade";
import { AutoMovieArchetypeCanoePaddleData } from "./internal/AutoMovieArchetypeCanoePaddleData";


/** Constructs the canoe paddle archetype from its recipe. */
export namespace AutoMovieArchetypeCanoePaddle {
/**
 * A single-bladed wooden canoe paddle. The blade extends along -X and the
 * transverse T-grip forms the +X end. The shaft hand takes the lower handle.
 * This prop uses the published 56 inch reference envelope and overall mass.
 *
 * @param params Optional scene identity or exact reference overrides.
 * @param seed Provenance seed. The reference dimensions are fixed.
 * @returns The paddle, lower shaft grip, top T-grip and one blade-tip face.
 */
export function create(
  params: AutoMovieArchetypeCanoePaddle.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeCanoePaddle.Affordance,
  AutoMovieArchetypeCanoePaddle.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCanoePaddle.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "canoePaddle",
      AutoMovieArchetypeCanoePaddle.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeCanoePaddle.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeCanoePaddle.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCanoePaddle.Affordance,
    AutoMovieArchetypeCanoePaddle.Dimension
  > = new AutoMovieArchetypeBuilder({
    name: "canoe paddle",
    material: "wood",
    id: params.id,
    draw,
  });
  const half: number = d.length / 2;
  const shoulder: number = -half + d.bladeLength;
  const diameter: number = 0.031;
  const top: number = half - 0.017;
  const handleSpan: number = 0.11;
  const wood: string = "#b7854d";
  builder.rod("shaft", diameter / 2, AutoMovieArchetypeCanoePaddleData.v(shoulder, 0, 0), AutoMovieArchetypeCanoePaddleData.v(top, 0, 0), {
    color: wood,
  });
  builder.rod(
    "top-grip",
    0.017,
    AutoMovieArchetypeCanoePaddleData.v(top, 0, -handleSpan / 2),
    AutoMovieArchetypeCanoePaddleData.v(top, 0, handleSpan / 2),
    {
      color: "#5d3c25",
    },
  );
  PaddleBlade.draw(
    builder,
    "blade",
    shoulder,
    -1,
    d.bladeLength,
    d.bladeWidth,
    0.003,
    wood,
  );
  PaddleBlade.grip(
    builder,
    "shaftGrip",
    AutoMovieArchetypeCanoePaddleData.v(shoulder + 0.24, 0, 0),
    AutoMovieArchetypeCanoePaddleData.v(1, 0, 0),
    diameter,
    0.14,
  );
  PaddleBlade.grip(
    builder,
    "topGrip",
    AutoMovieArchetypeCanoePaddleData.v(top, 0, 0),
    AutoMovieArchetypeCanoePaddleData.v(0, 0, 1),
    0.034,
    handleSpan,
    AutoMovieArchetypeCanoePaddleData.v(1, 0, 0),
  );
  PaddleBlade.tip(builder, "bladeTip", -half, -1, d.bladeWidth);
  return builder.build(d.mass);
}

  /* Shaft and blade dimensions and three contact ids of the single-bladed paddle. */
  /** Shaft hand, T-grip hand, and the edge that crosses the water. */
  export type Affordance = "shaftGrip" | "topGrip" | "bladeTip";
  /** Overall length, blade envelope and published product mass. */
  export type Dimension = "length" | "bladeLength" | "bladeWidth" | "mass";
  /** Scene identity and exact reference overrides. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of each published figure. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    bladeLength: "m",
    bladeWidth: "m",
    mass: "kg",
  };
  /** One manufacturer catalogue size and its blade and mass. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      56 * AutoMovieArchetypeUnits.INCH,
      56 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeCanoePaddleData.SOURCE,
    ),
    bladeLength: AutoMovieArchetypeBand.metres(
      19 * AutoMovieArchetypeUnits.INCH,
      19 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeCanoePaddleData.SOURCE,
    ),
    bladeWidth: AutoMovieArchetypeBand.metres(
      8.2 * AutoMovieArchetypeUnits.INCH,
      8.2 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeCanoePaddleData.SOURCE,
    ),
    mass: AutoMovieArchetypeBand.of("kg", 0.68, 0.68, AutoMovieArchetypeCanoePaddleData.SOURCE),
  };
}
