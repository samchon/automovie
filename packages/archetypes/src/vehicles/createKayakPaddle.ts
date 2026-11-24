import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core";
import { PaddleBlade } from "./PaddleBlade";

const SOURCE: string =
  "Werner Skagit FG adjustable straight shaft: https://wernerpaddles.com/products/werner-skagit-fg-adjustable-straight-shaft-kayak-paddle";
const v: typeof Vector3.create = Vector3.create;

/**
 * A double-bladed kayaking paddle with straight shaft and two non-feathered
 * blades. The shaft's +X points towards the named left blade at rest. Each hand
 * has a separate round shaft site for use across alternating strokes.
 *
 * @param params Optional scene identity and overall length override, metres.
 * @param seed Draws the adjustable shaft length within its declared range.
 * @returns The shaft, two blades and corresponding hand and tip sites.
 */
export function createKayakPaddle(
  params: createKayakPaddle.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createKayakPaddle.Affordance,
  createKayakPaddle.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createKayakPaddle.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "kayakPaddle",
      createKayakPaddle.UNITS,
      seed,
      params,
    );
  const d: Record<createKayakPaddle.Dimension, number> = draw.dimensions(
    createKayakPaddle.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createKayakPaddle.Affordance,
    createKayakPaddle.Dimension
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
  builder.rod("shaft", diameter / 2, v(-shoulder, 0, 0), v(shoulder, 0, 0), {
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
      v(sign * 0.27, 0, 0),
      v(-sign, 0, 0),
      diameter,
      0.15,
    );
    PaddleBlade.tip(builder, `${side}Tip`, sign * half, sign, d.bladeWidth);
  }
  return builder.build(d.mass);
}

/** The shaft dimensions, the two palm sites and the two wet blade edges. */
export namespace createKayakPaddle {
  /** Two real hand sites and separate blade tips. */
  export type Affordance = "leftGrip" | "rightGrip" | "leftTip" | "rightTip";
  /** Overall length, blade dimensions and mass. */
  export type Dimension = "length" | "bladeLength" | "bladeWidth" | "mass";
  /** Scene subject and selected reference figures. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene subject id. */
    id?: string;
  }
  /** Units of the manufacturer's specifications. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    bladeLength: "m",
    bladeWidth: "m",
    mass: "kg",
  };
  /** Manufacturer figures for the adjustable straight-shaft model. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(2.2, 2.6, SOURCE),
    bladeLength: AutoMovieArchetypeBand.metres(0.49, 0.49, SOURCE),
    bladeWidth: AutoMovieArchetypeBand.metres(0.156, 0.156, SOURCE),
    mass: AutoMovieArchetypeBand.of("kg", 1.042, 1.042, SOURCE),
  };
}
