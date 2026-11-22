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
 * The saved measurements of ground-standing street objects and the round post contact shared by a bollard and lamp post.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the measured input and the shared post contact.
 * @evidence contracts/development/design.md#principled-representation The fixed profile supplies a band's range or a whole manufacturer model; a post contact uses the exact span and diameter of its shaft.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Assists the common draw and cylindrical shaft contact while the named producer builds all visible parts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The profile keeps model-owned values, the measured unit declaration and the original namespace.
 */
export namespace StreetFixtureDraw {
  /**
   * The street model's seeded dimensions and its empty builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the measurements and builder returned after drawing the profile.
   * @evidence contracts/development/design.md#principled-representation Dimensions retain the saved keys and metre or kilogram units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A producer needs the drawn values and its typed builder to construct the geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The builder holds provenance from the same session as the drawn values.
   */
  export interface IFixture<Id extends string> {
    /** A fresh builder with the drawn identity and physical material. */
    builder: AutoMovieArchetypeBuilder<Id, createStreetFixture.Dimension>;

    /** Recorded dimension values in metres or kilograms. */
    d: Partial<Record<createStreetFixture.Dimension, number>>;
  }

  /**
   * Pick a whole recorded model id where available and draw the fixture's other measurements.
   *
   * @param kind The fixture's fixed profile.
   * @param name The readable display name.
   * @param material Its physical material.
   * @param params The scene identifier, dimension overrides and optional model.
   * @param seed The seed for unresolved choices.
   * @returns The dimensions and a builder for the selected fixture.
   * @throws {AutoMovieArchetypeRefusal} For a supplied model or dimension the fixed fixture cannot admit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes the common inputs and gives ownership of choices to the profile.
   * @evidence contracts/development/implementation.md#principled-implementation Pick the model first so its fixed dimensions are validated, then draw the designated bands.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Perform two draws and open the builder.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserve the original seed and model key order and reject foreign known fields.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Draws only a fixed number of dimensions for the chosen producer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every street producer shares the same saved model validation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only the draws and fresh builder.
   */
  export function begin<Id extends string>(
    kind: createStreetFixture.Kind,
    name: string,
    material: AutoMovieArchetypeMaterial.Kind,
    params: Omit<createStreetFixture.IParams, "kind">,
    seed?: number | string,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the placement and units of the shaft contact.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the cylinder's real extent, centre and diameter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Derive one bar frame and give it the shaft's span and aperture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A lamp fixture's base and luminaire are outside its usable shaft.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Records one bar.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The bollard and lamp post share the identical bar definition.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the builder receives the contact.
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
