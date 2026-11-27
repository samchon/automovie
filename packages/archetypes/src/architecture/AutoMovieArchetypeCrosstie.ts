import { type AutoMovieArchetype } from "../core/index";
import { createCrosstie as createCrosstieImplementation } from "./internal/createCrosstie";
import { type AutoMovieArchetypeObstacle } from "./AutoMovieArchetypeObstacle";
/** Public operations for Auto Movie Archetype Crosstie. */
export namespace AutoMovieArchetypeCrosstie {
    /**
     * A timber railway crosstie with its upper face and forward edge available to a
     * stepping act.
     *
     * The chosen section fixes the rise and depth and the chosen tie length fixes
     * the X span. The object stands on Y = 0 and is approached from +Z.
     *
     * @param params The scene identifier, optional section and length choices, and
     *   free mass.
     * @param seed The seed for the draws the author leaves open.
     * @returns The fixed model with its typed contacts.
     * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
     *   selected profile.
     */
    export function create(params?: AutoMovieArchetypeCrosstie.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCrosstie.Affordance, AutoMovieArchetypeCrosstie.Dimension> {
        return createCrosstieImplementation(params, seed);
    }
    /** The named contacts built by this producer. */
    export type Affordance = "edge" | "top";
    /** The dimensions an author may fix, in the same units. */
    export type Fixed = "mass";
    /**
     * The dimensions this producer draws or derives, in metres unless the draw
     * records kilograms.
     */
    export type Dimension = "height" | "length" | "mass" | "width";
    /**
     * The numeric overrides and optional scene identifier. Its section and length
     * each select a complete measured profile.
     */
    export interface IParams extends Partial<Record<Fixed, number>> {
        /** A unique scene identifier, defaulting to the saved family name. */
        id?: string;
        /** The measured section, drawn from the seed when omitted. */
        section?: AutoMovieArchetypeObstacle.Section;
        /** The measured length, drawn from the seed when omitted. */
        tieLength?: AutoMovieArchetypeObstacle.TieLength;
    }
}
