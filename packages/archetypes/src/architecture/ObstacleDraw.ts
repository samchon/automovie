import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeMaterial,
} from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { OBSTACLE_BANDS } from "./OBSTACLE_BANDS";
import { TIE_SIZES } from "./TIE_SIZES";
import type { createObstacle } from "./createObstacle";

/**
 * The draw and forward-facing ledge shared by ground obstacles with a
 * rectangular top.
 */
export namespace ObstacleDraw {
  /** The obstacle's seeded dimensions and its empty builder. */
  export interface IObstacle<Id extends string> {
    /** A fresh builder with the drawn identity and physical material. */
    builder: AutoMovieArchetypeBuilder<Id, createObstacle.Dimension>;

    /** Values in metres, kilograms or kilograms per metre. */
    d: Partial<Record<createObstacle.Dimension, number>>;
  }

  /**
   * Admit a saved obstacle's section and length choices and draw its free
   * measurements.
   *
   * @param kind The fixed profile.
   * @param name The readable display name.
   * @param material The obstacle's physical material.
   * @param params The scene identifier, dimension overrides and optional
   *   crosstie sizes.
   * @param seed The seed for unresolved dimensions and choices.
   * @returns The dimensions and the builder awaiting the selected geometry.
   * @throws {AutoMovieArchetypeRefusal} For a model or dimension the given
   *   profile cannot admit.
   */
  export function begin<Id extends string>(
    kind: createObstacle.Kind,
    name: string,
    material: AutoMovieArchetypeMaterial.Kind,
    params: Omit<createObstacle.IParams, "kind">,
    seed?: number | string,
  ): IObstacle<Id> {
    const draw: AutoMovieArchetypeDrawSession<createObstacle.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "obstacle",
        FixtureDraw.obstacle,
        seed,
        params,
      );
    const section: Readonly<Partial<Record<createObstacle.Dimension, number>>> =
      draw.model("section", params.section, TIE_SIZES.section[kind]).figures;
    const length: Readonly<Partial<Record<createObstacle.Dimension, number>>> =
      draw.model("tieLength", params.tieLength, TIE_SIZES.length[kind]).figures;
    const d: Partial<Record<createObstacle.Dimension, number>> = {
      ...draw.dimensions(OBSTACLE_BANDS[kind], OBSTACLE_BANDS),
      ...section,
      ...length,
    };
    const builder: AutoMovieArchetypeBuilder<Id, createObstacle.Dimension> =
      new AutoMovieArchetypeBuilder({
        material,
        id: params.id,
        name,
        draw,
      });
    return { builder, d };
  }

  /** The contact ids {@link ledge} builds or reads. */
  export type LedgeContact = "top" | "edge";

  /**
   * Put a standing surface and a ledge on the top rectangle.
   *
   * @param builder The builder holding the obstacle's parts.
   * @param height The top above the floor, metres.
   * @param length The top measured along X, metres.
   * @param depth The top measured along Z, metres.
   * @param centre The middle of the top along Z, metres.
   */
  export function ledge(
    builder: FixtureDraw.IContactWriter<LedgeContact>,
    height: number,
    length: number,
    depth: number,
    centre: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, height, centre)),
      extent: null,
      width: length,
      depth,
    });
    builder.affordance({
      id: "edge",
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, height, centre + depth / 2),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      length,
    });
  }
}
