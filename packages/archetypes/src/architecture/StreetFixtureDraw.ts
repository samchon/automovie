import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeMaterial,
} from "../core";
import { FixtureDraw } from "./FixtureDraw";
import { STREET_FIXTURE_BANDS } from "./STREET_FIXTURE_BANDS";
import { STREET_FIXTURE_MODELS } from "./STREET_FIXTURE_MODELS";
import type { createStreetFixture } from "./createStreetFixture";

/**
 * The saved measurements of ground-standing street objects and the round post
 * contact shared by a bollard and lamp post.
 */
export namespace StreetFixtureDraw {
  /** The street model's seeded dimensions and its empty builder. */
  export interface IFixture<Id extends string> {
    /** A fresh builder with the drawn identity and physical material. */
    builder: AutoMovieArchetypeBuilder<Id, createStreetFixture.Dimension>;

    /** Recorded dimension values in metres or kilograms. */
    d: Partial<Record<createStreetFixture.Dimension, number>>;
  }

  /**
   * Pick a whole recorded model id where available and draw the fixture's other
   * measurements.
   *
   * @param kind The fixture's fixed profile.
   * @param name The readable display name.
   * @param material Its physical material.
   * @param params The scene identifier, dimension overrides and optional model.
   * @param seed The seed for unresolved choices.
   * @returns The dimensions and a builder for the selected fixture.
   * @throws {AutoMovieArchetypeRefusal} For a supplied model or dimension the
   *   fixed fixture cannot admit.
   */
  export function begin<Id extends string>(
    kind: createStreetFixture.Kind,
    name: string,
    material: AutoMovieArchetypeMaterial.Kind,
    params: Omit<createStreetFixture.IParams, "kind">,
    seed?: number,
  ): IFixture<Id> {
    const draw: AutoMovieArchetypeDrawSession<createStreetFixture.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "streetFixture",
        FixtureDraw.streetFixture,
        seed,
        params,
      );
    const model: AutoMovieArchetypeDrawSession.IModel<
      createStreetFixture.Model,
      createStreetFixture.Dimension
    > = draw.model("model", params.model, STREET_FIXTURE_MODELS[kind]);
    const d: Partial<Record<createStreetFixture.Dimension, number>> = {
      ...draw.dimensions(STREET_FIXTURE_BANDS[kind], STREET_FIXTURE_BANDS),
      ...model.figures,
    };
    const builder: AutoMovieArchetypeBuilder<
      Id,
      createStreetFixture.Dimension
    > = new AutoMovieArchetypeBuilder({
      material,
      id: params.id,
      name: model.name === undefined ? name : `${name} ${model.name}`,
      draw,
    });
    return { builder, d };
  }

  /**
   * Place a round bar contact on the centreline of its vertical shaft.
   *
   * @param builder The street builder with the shaft geometry.
   * @param low The lower end of the shaft from the ground, metres.
   * @param high The upper end of the shaft from the ground, metres.
   * @param diameter The exposed shaft diameter, metres.
   */
  export function shaft(
    builder: FixtureDraw.IContactWriter<"post">,
    low: number,
    high: number,
    diameter: number,
  ): void {
    builder.affordance({
      id: "post",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(0, (low + high) / 2, 0),
        Vector3.create(0, 0, 1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: diameter,
      length: high - low,
    });
  }
}
