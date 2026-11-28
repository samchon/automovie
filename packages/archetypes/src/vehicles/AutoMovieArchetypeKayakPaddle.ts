import "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { PaddleBlade } from "./internal/PaddleBlade";
import { AutoMovieArchetypeKayakPaddleData } from "./internal/AutoMovieArchetypeKayakPaddleData";


/** Constructs the kayak paddle archetype from its recipe. */
export namespace AutoMovieArchetypeKayakPaddle {
  /**
   * Build a straight kayak paddle with two non-feathered blades.
   *
   * Local `+X` points toward `leftTip`. Both hand grips sit on the shaft,
   * 0.27 m either side of its origin. `leftTip` and `rightTip` move with the
   * chosen overall length.
   *
   * @param params Optional scene ID and fixed values admitted by {@link BANDS}.
   *   Overall length ranges from 2.2 to 2.6 m. Blade size and mass are fixed.
   * @param seed Draws omitted length within its band, or uses 2.4 m when absent.
   * @returns The paddle with separate left and right grips and blade tips.
   * @throws {AutoMovieArchetypeRefusal} For a fixed value outside its band.
   */
export function create(
  params: AutoMovieArchetypeKayakPaddle.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeKayakPaddle.Affordance,
  AutoMovieArchetypeKayakPaddle.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeKayakPaddle.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "kayakPaddle",
      AutoMovieArchetypeKayakPaddle.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeKayakPaddle.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeKayakPaddle.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeKayakPaddle.Affordance,
    AutoMovieArchetypeKayakPaddle.Dimension
  > = new AutoMovieArchetypeBuilder({
    name: "kayak paddle",
    material: "composite",
    id: params.id,
    draw,
  });
  const half: number = d.length / 2;
  const shoulder: number = half - d.bladeLength;

  // The shaft's 29 mm diameter is authored.
  const diameter: number = 0.029;
  builder.rod("shaft", diameter / 2, AutoMovieArchetypeKayakPaddleData.v(-shoulder, 0, 0), AutoMovieArchetypeKayakPaddleData.v(shoulder, 0, 0), {
    color: "#353b40",
  });
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    PaddleBlade.draw(
      builder,
      `${side}-blade`,
      sign * shoulder,
      sign,
      d.bladeLength,
      d.bladeWidth,
      0.011,
      "#e3af2b",
    );
    PaddleBlade.grip(
      builder,
      `${side}Grip`,
      AutoMovieArchetypeKayakPaddleData.v(sign * 0.27, 0, 0),
      AutoMovieArchetypeKayakPaddleData.v(-sign, 0, 0),
      diameter,
      0.15,
    );
    PaddleBlade.tip(builder, `${side}Tip`, sign * half, sign, d.bladeWidth);
  }
  return builder.build(d.mass);
}

  /* The shaft dimensions, the two palm sites and the two wet blade edges. */
  /**
   * Left and right shaft grips and the tip at each blade's outer end.
   */
  export type Affordance = "leftGrip" | "rightGrip" | "leftTip" | "rightTip";
  /**
   * Overall length and blade dimensions in metres, mass in kilograms.
   */
  export type Dimension = "length" | "bladeLength" | "bladeWidth" | "mass";
  /**
   * Optional scene ID and fixed values within each dimension's band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * Scene subject ID. Defaults to `kayakPaddle`.
     */
    id?: string;
  }
  /**
   * Units for the adjustable overall length, fixed blade size and mass.
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
   * Adjustable straight-shaft length and fixed reference blade size and mass.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(2.2, 2.6, AutoMovieArchetypeKayakPaddleData.SOURCE),
    bladeLength: AutoMovieArchetypeBand.metres(0.49, 0.49, AutoMovieArchetypeKayakPaddleData.SOURCE),
    bladeWidth: AutoMovieArchetypeBand.metres(0.156, 0.156, AutoMovieArchetypeKayakPaddleData.SOURCE),
    mass: AutoMovieArchetypeBand.of("kg", 1.042, 1.042, AutoMovieArchetypeKayakPaddleData.SOURCE),
  };
}
