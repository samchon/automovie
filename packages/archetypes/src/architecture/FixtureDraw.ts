import type { IAutoMovieAffordance } from "@automovie/interface";
import { type AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, } from "../core";
import type { AutoMovieArchetypeAppliance } from "./AutoMovieArchetypeAppliance";
import type { AutoMovieArchetypeMachine } from "./AutoMovieArchetypeMachine";
import type { AutoMovieArchetypeObstacle } from "./AutoMovieArchetypeObstacle";
import type { AutoMovieArchetypeSanitary } from "./AutoMovieArchetypeSanitary";
import type { AutoMovieArchetypeStreetFixture } from "./AutoMovieArchetypeStreetFixture";
/**
 * The units of saved architectural recipes and the dimension-only draw used by
 * wall-backed fixtures.
 */
export namespace FixtureDraw {
    /** The part of a fixture builder that writes a particular set of contacts. */
    export interface IContactWriter<Id extends string> {
        /**
         * Record an affordance with one of this helper's contact identifiers.
         *
         * @param contact The frame and fields produced for the stated identifier.
         */
        affordance(contact: IAutoMovieAffordance & {
            id: Id;
        }): void;
    }
    /** Units of the recorded appliance dimensions. */
    export const appliance: Readonly<Record<AutoMovieArchetypeAppliance.Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
        height: "m",
        width: "m",
        depth: "m",
        pullHeight: "m",
        cavityHeight: "m",
        cavityWidth: "m",
        cavityDepth: "m",
        door: "m",
        mass: "kg",
    };
    /** Units of the recorded machine dimensions. */
    export const machine: Readonly<Record<AutoMovieArchetypeMachine.Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
        width: "m",
        height: "m",
        depth: "m",
        mass: "kg",
    };
    /** Units of the recorded sanitary dimensions. */
    export const sanitary: Readonly<Record<AutoMovieArchetypeSanitary.Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
        rim: "m",
        basinDepth: "m",
        width: "m",
        depth: "m",
        length: "m",
        bowlWidth: "m",
        bowlDepth: "m",
        tapHeight: "m",
        tapReach: "m",
        tapOutlet: "m",
        seat: "m",
        seatDepth: "m",
        tankWidth: "m",
        tankDepth: "m",
        tankTop: "m",
        wellLength: "m",
        wellWidth: "m",
        waterDepth: "m",
        interior: "m",
        wallHeight: "m",
        threshold: "m",
        control: "m",
        mass: "kg",
    };
    /** Units of the recorded streetFixture dimensions. */
    export const streetFixture: Readonly<Record<AutoMovieArchetypeStreetFixture.Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
        height: "m",
        diameter: "m",
        nozzleHeight: "m",
        pumperReach: "m",
        hoseReach: "m",
        base: "m",
        baseHeight: "m",
        head: "m",
        headHeight: "m",
        mass: "kg",
    };
    /** Units of the recorded obstacle dimensions. */
    export const obstacle: Readonly<Record<AutoMovieArchetypeObstacle.Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
        length: "m",
        height: "m",
        width: "m",
        top: "m",
        curb: "m",
        lowerFace: "m",
        tube: "m",
        spacing: "m",
        post: "m",
        base: "m",
        ropeDiameter: "m",
        mass: "kg",
        massPerMetre: "kg",
    };
    /** The values {@link installed} accepts at this place in its signature. */
    export type InstalledFamily = "appliance" | "sanitary";
    /**
     * Draw the measured bands and build one composite appliance or plumbing
     * fixture.
     *
     * @param family The existing seed namespace.
     * @param name The displayed model name.
     * @param units The original unit record.
     * @param bands The selected producer's bands.
     * @param familyBands The original bands used to refuse fields belonging to a
     *   different variant.
     * @param params The fixed dimensions and optional id.
     * @param seed The seed for unfixed dimensions.
     * @param construct The selected producer's construction.
     * @returns The fixture and its contact frames.
     * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside the
     *   selected fixture's bands.
     */
    export function installed<Id extends string, D extends string>(family: InstalledFamily, name: string, units: Readonly<Record<D, AutoMovieArchetypeDrawSession.Unit>>, bands: Readonly<Partial<Record<D, IAutoMovieArchetypeBand>>>, familyBands: Readonly<Record<string, Readonly<Partial<Record<D, IAutoMovieArchetypeBand>>>>>, params: Partial<Record<D, number>> & {
        id?: string;
    }, seed: number | undefined, construct: (builder: AutoMovieArchetypeBuilder<Id, D>, dimensions: Partial<Record<D, number>>) => void): AutoMovieArchetype<Id, D> {
        const draw: AutoMovieArchetypeDrawSession<D> = new AutoMovieArchetypeDrawSession(family, units, seed, params);
        const measured: Partial<Record<D, number>> & {
            mass?: number;
        } = draw.dimensions(bands, familyBands);
        const builder: AutoMovieArchetypeBuilder<Id, D> = new AutoMovieArchetypeBuilder({
            material: "composite",
            id: params.id,
            name,
            draw,
        });
        construct(builder, measured);
        return builder.build(measured.mass!);
    }
}
