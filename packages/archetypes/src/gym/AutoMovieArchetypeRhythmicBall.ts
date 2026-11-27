import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import * as AutoMovieArchetypeRhythmicBallData from "./internal/AutoMovieArchetypeRhythmicBallData";

/** Constructs the rhythmic ball archetype from its recipe. */
export namespace AutoMovieArchetypeRhythmicBall {
/**
 * A rubber competition ball for rhythmic gymnastics. It rests at the origin.
 * `grip` gives throws and catches its centre and diameter. `palm` marks the
 * lower pole where the upward-facing hand can bear the ball in a held pose.
 *
 * @param params Fixed dimensions inside their admitted bands and its model id.
 * @param seed Draws unspecified dimensions within their bands; absent selects
 *   their midpoints.
 * @returns The ball with its handling and palm contacts.
 * @throws {AutoMovieArchetypeRefusal} When a fixed dimension lies outside its
 *   band.
 */
export function create(
  params: AutoMovieArchetypeRhythmicBall.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeRhythmicBall.Affordance,
  AutoMovieArchetypeRhythmicBall.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRhythmicBall.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "rhythmicBall",
      AutoMovieArchetypeRhythmicBall.UNITS,
      seed,
      params,
    );
  const values: Record<AutoMovieArchetypeRhythmicBall.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeRhythmicBall.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRhythmicBall.Affordance,
    AutoMovieArchetypeRhythmicBall.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "rubber",
    id: params.id,
    name: "rhythmic gymnastics ball",
    draw,
  });
  const point: typeof Vector3.create = Vector3.create;
  const radius: number = values.diameter / 2;
  const centre = point(0, radius, 0);
  builder.ball("ball", radius, centre, { color: "#e84d71" });
  builder.affordance({
    id: "grip",
    kind: "handle",
    extent: null,
    frame: AutoMovieArchetypeFrame.upright(centre),
    aperture: values.diameter,
    symmetry: "round",
  });
  builder.affordance({
    id: "palm",
    kind: "surface",
    extent: null,
    frame: AutoMovieArchetypeFrame.facing(point(0, 0, 0), point(0, -1, 0)),
  });
  return builder.build(values.mass);
}

  /* The rhythmic ball dimensions and its handling contacts. */
  /** The centre and lower surface of the ball. */
  export type Affordance = "grip" | "palm";

  /** Diameter in metres and mass in kilograms. */
  export type Dimension = "diameter" | "mass";

  /** Fixed dimensions and the scene model id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Model id, defaulting to the producer id. */
    id?: string;
  }

  /** Units shared by all admitted dimensions and bands. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    mass: "kg",
  };

  /** Official diameter band and a provisional range just above the minimum mass. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    diameter: AutoMovieArchetypeBand.metres(0.18, 0.2, AutoMovieArchetypeRhythmicBallData.NORMS),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.4,
      0.42,
      "Provisional upper mass. World Gymnastics RG 4 and SASAKI Gym Star both give a 400 g minimum (https://www.sasakisports-onlineshop.jp/products/m20af).",
      true,
    ),
  };
}
