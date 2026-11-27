import { Vector3 } from "@automovie/engine";
import { AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, type AutoMovieArchetypeMaterial, } from "../../core";
import { FixtureDraw } from "./FixtureDraw";
import { STREET_FIXTURE_BANDS } from "../constants/STREET_FIXTURE_BANDS";
import { STREET_FIXTURE_MODELS } from "../constants/STREET_FIXTURE_MODELS";
import type { AutoMovieArchetypeStreetFixture } from "../AutoMovieArchetypeStreetFixture";
/*
 * The saved measurements of ground-standing street objects and the round post
 * contact shared by a bollard and lamp post.
 */
export namespace StreetFixtureDraw {
    /*
     * The street model's seeded dimensions and its empty builder.
     */
    export interface IFixture<Id extends string> {
        /*
         * A fresh builder with the drawn identity and physical material.
         */
        builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeStreetFixture.Dimension>;
        /*
         * Recorded dimension values in metres or kilograms.
         */
        d: Partial<Record<AutoMovieArchetypeStreetFixture.Dimension, number>>;
    }
    /*
     * Pick a whole recorded model id where available and draw the fixture's other
     * measurements.
     * Parameter kind: The fixture's fixed profile.
     * Parameter name: The readable display name.
     * Parameter material: Its physical material.
     * Parameter params: The scene identifier, dimension overrides and optional model.
     * Parameter seed: The seed for unresolved choices.
     * Returns: The dimensions and a builder for the selected fixture.
     * For a supplied model or dimension the
     * fixed fixture cannot admit.
     */
    export function begin<Id extends string>(kind: AutoMovieArchetypeStreetFixture.Kind, name: string, material: AutoMovieArchetypeMaterial.Kind, params: Omit<AutoMovieArchetypeStreetFixture.IParams, "kind">, seed?: number): IFixture<Id> {
        const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeStreetFixture.Dimension> = new AutoMovieArchetypeDrawSession("streetFixture", FixtureDraw.streetFixture, seed, params);
        const model: AutoMovieArchetypeDrawSession.IModel<AutoMovieArchetypeStreetFixture.Model, AutoMovieArchetypeStreetFixture.Dimension> = draw.model("model", params.model, STREET_FIXTURE_MODELS[kind]);
        const d: Partial<Record<AutoMovieArchetypeStreetFixture.Dimension, number>> = {
            ...draw.dimensions(STREET_FIXTURE_BANDS[kind], STREET_FIXTURE_BANDS),
            ...model.figures,
        };
        const builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeStreetFixture.Dimension> = new AutoMovieArchetypeBuilder({
            material,
            id: params.id,
            name: model.name === undefined ? name : `${name} ${model.name}`,
            draw,
        });
        return { builder, d };
    }
    /*
     * Place a round bar contact on the centreline of its vertical shaft.
     * Parameter builder: The street builder with the shaft geometry.
     * Parameter low: The lower end of the shaft from the ground, metres.
     * Parameter high: The upper end of the shaft from the ground, metres.
     * Parameter diameter: The exposed shaft diameter, metres.
     */
    export function shaft(builder: FixtureDraw.IContactWriter<"post">, low: number, high: number, diameter: number): void {
        builder.affordance({
            id: "post",
            kind: "bar",
            symmetry: "round",
            frame: AutoMovieArchetypeFrame.facing(Vector3.create(0, (low + high) / 2, 0), Vector3.create(0, 0, 1), Vector3.create(0, 1, 0)),
            extent: null,
            grip: "power",
            aperture: diameter,
            length: high - low,
        });
    }
}
