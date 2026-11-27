import { ArchetypeDraw, type AutoMovieArchetype, type IAutoMovieArchetypeBand, } from "../core";
import { FixtureDraw } from "./internal/FixtureDraw";
import { OBSTACLE_BANDS } from "./constants/OBSTACLE_BANDS";
import { AutoMovieArchetypeCrosstie } from "./AutoMovieArchetypeCrosstie";
import { AutoMovieArchetypeCrowdBarrier } from "./AutoMovieArchetypeCrowdBarrier";
import { AutoMovieArchetypeJerseyBarrier } from "./AutoMovieArchetypeJerseyBarrier";
import { AutoMovieArchetypeRopeStanchions } from "./AutoMovieArchetypeRopeStanchions";
import { AutoMovieArchetypeSandbag } from "./AutoMovieArchetypeSandbag";
/** Creates a deterministic obstacle fixture and exposes its construction parameters. */
export namespace AutoMovieArchetypeObstacle {
    /**
     * Read a saved obstacle recipe and call the corresponding fixed producer.
     *
     * @param params The saved kind and its recorded model, dimensions or
     *   identifier.
     * @param seed The seed used by the selected producer under the original draw
     *   key.
     * @returns The selected fixture in its original frame.
     * @throws {AutoMovieArchetypeRefusal} For an unknown kind or a rejected model
     *   or dimension.
     */
    export function create(params: AutoMovieArchetypeObstacle.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeObstacle.Affordance, AutoMovieArchetypeObstacle.Dimension> {
        const kind: AutoMovieArchetypeObstacle.Kind = ArchetypeDraw.choice("obstacle", "kind", params.kind, AutoMovieArchetypeObstacle.KINDS);
        return AutoMovieArchetypeObstacle.PRODUCERS[kind](params, seed);
    }

    /** The kinds of obstacle. */
    export type Kind = "crosstie" | "sandbag" | "jerseyBarrier" | "crowdBarrier" | "ropeAndPosts";
    /** Every kind, for a caller that reads one at run time. */
    export const KINDS: readonly Kind[] = [
        "crosstie",
        "sandbag",
        "jerseyBarrier",
        "crowdBarrier",
        "ropeAndPosts",
    ];
    /**
     * The affordance ids, by kind:
     *
     * - Crosstie, sandbag, jerseyBarrier: `top` (surface), `edge` (ledge, the top's
     *   front edge);
     * - Sandbag: also `leftEnd`, `rightEnd` (handles on its ends' tops, at `+X` and
     *   `-X`);
     * - CrowdBarrier: `rail` (bar, the top rail);
     * - RopeAndPosts: `rope` (bar), `leftPost`, `rightPost` (bars, the posts at
     *   `+X` and `-X`, each along `+Y`).
     */
    export type Affordance = "top" | "edge" | "leftEnd" | "rightEnd" | "rail" | "rope" | "leftPost" | "rightPost";
    /**
     * The free dimensions, metres unless stated:
     *
     * - `length`: along `X`; for the stanchions, the rope's.
     * - `height`: the top above the ground; for the stanchions, a post's.
     * - `width`: along `Z`, a crosstie's face or a sandbag's laid width; a concrete
     *   barrier's base.
     * - `top`, `curb`, `lowerFace`: a concrete barrier's top width, its vertical
     *   curb and the height of its lower sloped face.
     * - `tube`, `spacing`: a crowd barrier's tube and its pickets' spacing.
     * - `post`, `base`, `ropeDiameter`: a stanchion's post and base diameters and
     *   the rope's.
     * - `mass`: kilograms; `massPerMetre`: a concrete barrier's, kilograms per
     *   metre of length.
     */
    export type Dimension = "length" | "height" | "width" | "top" | "curb" | "lowerFace" | "tube" | "spacing" | "post" | "base" | "ropeDiameter" | "mass" | "massPerMetre";
    /** Each dimension's unit, which its band and any model's figure for it share. */
    export const UNITS: typeof FixtureDraw.obstacle = FixtureDraw.obstacle;
    /**
     * The parameters: the kind, and any free dimension fixed to a value inside
     * its band.
     */
    /**
     * A crosstie's sections read, depth by face in inches: FOR-108's most common
     * 7 x 9 and its 6 x 8 and 7 x 8.
     */
    export type Section = "7x9in" | "6x8in" | "7x8in";
    /**
     * A crosstie's lengths read: FOR-108's most common 8 ft 6 in, its standard 8
     * ft and its 9 ft.
     */
    export type TieLength = "8ft6in" | "8ft" | "9ft";
    /** The saved obstacle kind and optional authored dimensions. */
    export interface IParams extends Partial<Record<Dimension, number>> {
        /** Which obstacle. */
        kind: Kind;
        /** A crosstie's section, depth by face; drawn from the seed when absent. */
        section?: Section;
        /** A crosstie's length; drawn from the seed when absent. */
        tieLength?: TieLength;
        /** The model's id, unique in a scene; `obstacle` when absent. */
        id?: string;
    }
    /**
     * The angle of a concrete barrier's lower face from the ground, degrees, as
     * FHWA-RD-89-036 Figure 1 gives it.
     */
    export const LOWER_FACE: number = AutoMovieArchetypeJerseyBarrier.LOWER_FACE;
    /**
     * The construction sizes no source read gives, metres, each an estimate no
     * act reads and no band declares:
     *
     * - `foot`: a crowd barrier's foot, front to back; `bottomRail`: its bottom
     *   rail's height; `picket`: a picket's diameter.
     * - `plate`: a stanchion base's thickness.
     */
    export const ESTIMATES: Readonly<{
        foot: number;
        bottomRail: number;
        picket: number;
        plate: number;
    }> = {
        ...AutoMovieArchetypeCrowdBarrier.ESTIMATES,
        plate: AutoMovieArchetypeRopeStanchions.BASE_THICKNESS,
    };
    /** The band of each free dimension, by kind. */
    export const BANDS: Readonly<Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>> = OBSTACLE_BANDS;
    /** The fixed producer of each saved kind. */
    export const PRODUCERS = {
        crosstie: AutoMovieArchetypeCrosstie.create,
        sandbag: AutoMovieArchetypeSandbag.create,
        jerseyBarrier: AutoMovieArchetypeJerseyBarrier.create,
        crowdBarrier: AutoMovieArchetypeCrowdBarrier.create,
        ropeAndPosts: AutoMovieArchetypeRopeStanchions.create,
    } as const satisfies Readonly<Record<Kind, (...args: never[]) => AutoMovieArchetype>>;
}
