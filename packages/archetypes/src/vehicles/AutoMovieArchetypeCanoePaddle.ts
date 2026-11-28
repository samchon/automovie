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
   * Build a single-blade wooden canoe paddle with a transverse T-grip.
   *
   * The blade points along local `-X`. `shaftGrip` lies along the shaft near
   * the blade. The transverse `topGrip` is at the `+X` end. `bladeTip` marks
   * the opposite end. The reference is the published 56-inch model.
   *
   * @param params Optional scene ID and explicit reference figures in metres
   *   or kilograms as listed in {@link UNITS}.
   * @param seed Optional seed for the factory. The dimension bands are fixed.
   * @returns The wooden paddle with its two grips and blade tip.
   * @throws {AutoMovieArchetypeRefusal} For a value other than the fixed figure.
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
  /**
   * `shaftGrip` is the lower grip, `topGrip` the T-grip, and `bladeTip` the wet end.
   */
  export type Affordance = "shaftGrip" | "topGrip" | "bladeTip";
  /**
   * Overall length and blade dimensions in metres, mass in kilograms.
   */
  export type Dimension = "length" | "bladeLength" | "bladeWidth" | "mass";
  /**
   * Optional scene ID and values equal to the fixed figures in {@link BANDS}.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * Scene subject ID. Defaults to `canoePaddle`.
     */
    id?: string;
  }
  /**
   * Units for the paddle envelope, blade size and mass.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    bladeLength: "m",
    bladeWidth: "m",
    mass: "kg",
  };
  /**
   * Fixed 56-inch model envelope, blade dimensions and product mass.
   */
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
