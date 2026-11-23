import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";
import { GOAL_BANDS } from "./GOAL_BANDS";
import type { createGoal } from "./createGoal";

/** Model coordinates in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * The recorded profiles, draw and shared post contacts for goal and net
 * producers.
 */
export namespace GoalBuild {
  /** The recorded dimension units, metres for lengths and kilograms for mass. */
  export const UNITS: Readonly<
    Record<createGoal.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    bar: "m",
    board: "m",
    thickness: "m",
    ring: "m",
    offset: "m",
    post: "m",
    mass: "kg",
  };

  /** The display names retained from the saved goal dispatcher. */
  export const NAMES: Readonly<Record<createGoal.Kind, string>> = {
    footballGoal: "football goal",
    fieldHockeyGoal: "field hockey goal",
    iceHockeyGoal: "ice hockey goal",
    lacrosseGoal: "lacrosse goal",
    handballGoal: "handball goal",
    basketballHoop: "basketball hoop",
    volleyballNet: "volleyball net",
    tennisNet: "tennis net",
  };

  /** The fixed FIVB top heights for the men's and women's volleyball nets. */
  export const NETS: Readonly<
    Partial<
      Record<
        createGoal.Kind,
        Readonly<
          Record<
            createGoal.Net,
            Readonly<Partial<Record<createGoal.Dimension, number>>>
          >
        >
      >
    >
  > = {
    volleyballNet: { men: { height: 2.43 }, women: { height: 2.24 } },
  };
  /** The bands declared for the original goal and net kinds. */
  export const BANDS: typeof GOAL_BANDS = GOAL_BANDS;

  /** What {@link draw} prepares for its caller. */
  export interface IDrawResult<Id extends createGoal.Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, createGoal.Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<createGoal.Dimension, number>>;
  }

  /**
   * Draw the supplied profile with its original goal seed and prepare a
   * builder.
   */
  export function draw<Id extends createGoal.Affordance>(
    kind: createGoal.Kind,
    params: Readonly<Omit<createGoal.IParams, "kind">>,
    seed: number | string | undefined,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<createGoal.Dimension> =
      new AutoMovieArchetypeDrawSession("goal", UNITS, seed, params);
    const net: AutoMovieArchetypeDrawSession.IModel<
      createGoal.Net,
      createGoal.Dimension
    > = draw.model("net", params.net, NETS[kind]);
    const d: Partial<Record<createGoal.Dimension, number>> = {
      ...draw.dimensions(BANDS[kind], BANDS),
      ...net.figures,
    };
    const builder: AutoMovieArchetypeBuilder<Id, createGoal.Dimension> =
      new AutoMovieArchetypeBuilder({
        material: "composite",
        id: params.id,
        name:
          net.name === undefined ? NAMES[kind] : `${net.name}'s ${NAMES[kind]}`,
        draw,
      });
    return { builder, d };
  }

  /**
   * Declare both post contacts at the drawn height and original lateral
   * positions.
   *
   * @param builder The goal or net builder that receives both bar contacts.
   * @param x The lateral distance to each post centre, in metres.
   * @param height The graspable height of each post measured from the floor, in
   *   metres.
   * @param aperture The post section in metres for a square bar. Omit it for a
   *   round post.
   */
  export function posts(
    builder: AutoMovieArchetypeBuilder<
      createGoal.Affordance,
      createGoal.Dimension
    >,
    x: number,
    height: number,
    aperture?: number,
  ): void {
    for (const [id, sign] of [
      ["leftPost", 1],
      ["rightPost", -1],
    ] as const)
      builder.affordance({
        id,
        kind: "bar",
        symmetry: aperture === undefined ? "round" : "half",
        frame: AutoMovieArchetypeFrame.facing(
          v(sign * x, height / 2, 0),
          v(0, 0, 1),
          v(0, 1, 0),
        ),
        extent: null,
        grip: "power",
        ...(aperture === undefined ? {} : { aperture }),
        length: height,
      });
  }
}
