import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { AutoMovieHumanUvLayout } from "../../junction/AutoMovieHumanUvLayout";
import { gridAutoMovieHumanSweep } from "../gridAutoMovieHumanSweep";
/**
 * The hand's identity-independent texture charts, separate from its physical sweep parameters.
 *
 * Equal named bands are a texture convention, never measured anatomy. The seven palm bands leave a distal eighth for three web rectangles. The digit bridge keeps its declared share; the subsequent sweep blocks and square cap each receive one logical band. The cut follows the first semantic column, because transition rings with 12, 18 and 26 columns cannot all cut at a quarter turn. Texture addresses are already local rectangle coordinates: the tube cut is unwrapped per face, while webs and caps keep their planar square domains. Packing them must not apply a second modular wrap, which would fold a cap at its half-turn.
 */
export namespace AutoMovieHumanHandChart {
    /** One texture chart address in the hand frame. */
    export interface IPoint {
        /** Digit branch, or null for the palm and web rectangles. */
        branch: AutoMovieHumanBranch<"hand"> | null;
        /** Longitudinal logical coordinate. */
        u: number;
        /** Horizontal logical rectangle coordinate before handedness conversion; the tube cut is unwrapped per face. */
        v: number;
    }
    /** Texture address at a network patch parameter. */
    export type IAddress = (s: number, t: number) => IPoint;
    /** A named palm texture station. */
    export type Station = "wrist" | "collar" | "carpus" | "thenar" | "midPalm" | "metacarpals" | "heads" | "roots" | "web";
    /** Longitudinal address of a named station. */
    export const palm: (station: Station) => number = (station: Station): number => STATIONS.indexOf(station) / (STATIONS.length - 1);
    /** A palm chart point, cut at its first semantic column. */
    export const point: (u: number, v: number) => IPoint = (u: number, v: number): IPoint => ({
        branch: null,
        u,
        v: wrap(v),
    });
    /** Logical counterpart of a palm grid, with exactly the same declared cell order and omissions. */
    export const grid: (name: string, rows: Station[], columns: number, skip?: (row: number, column: number) => boolean) => gridAutoMovieHumanSweep.IOutput = (name: string, rows: Station[], columns: number, skip?: (row: number, column: number) => boolean): gridAutoMovieHumanSweep.IOutput => gridAutoMovieHumanSweep({
        sweep: "palm",
        name,
        rows: rows.map(palm),
        columns,
        v: (_: number, column: number): number => column / columns,
        skip,
    });
    /** One web's square texture domain; both sides remain distinct instead of collapsing to one line. */
    export const web: (index: number, count: number) => IAddress = (index: number, count: number): IAddress => (s: number, t: number): IPoint => point(palm("roots") + (1 - palm("roots")) * t, (index + s) / count);
    /** Pack local logical rectangles into the published hand atlas without a second tube wrap. A cap is planar, so its opposite edges must remain 0 and 1, not both 0. */
    export const pack: (side: AutoMovieHumanSide, keep: boolean, corners: IPoint[]) => Array<[
        number,
        number
    ]> = (side: AutoMovieHumanSide, keep: boolean, corners: IPoint[]): Array<[
        number,
        number
    ]> => {
        const chart: AutoMovieHumanUvLayout.IChart | undefined = AUTOMOVIE_HUMAN_UV_LAYOUT.charts.find((candidate: AutoMovieHumanUvLayout.IChart): boolean => candidate.part === "hand" &&
            candidate.side === side &&
            candidate.branch === corners[0]!.branch);
        if (chart === undefined)
            throw new Error(`UV layout has no chart for ${side} hand ${corners[0]!.branch ?? "palm"}`);
        return corners.map((corner: IPoint): [
            number,
            number
        ] => [
            chart.x + chart.width * (keep ? corner.v : 1 - corner.v),
            chart.y + chart.height * corner.u,
        ]);
    };
    /** One digit block's chart; its final cap has a square domain rather than a collapsed polar boundary. */
    export const digit: (branch: AutoMovieHumanBranch<"hand">, band: number, bands: number, share: number) => IAddress = (branch: AutoMovieHumanBranch<"hand">, band: number, bands: number, share: number): IAddress => (s: number, t: number): IPoint => ({
        branch,
        u: band === 0 ? share * t : share + (1 - share) * ((band - 1 + t) / bands),
        v: s,
    });
}
/** The named block boundaries; the last band is partitioned among the webs. */
const STATIONS: readonly AutoMovieHumanHandChart.Station[] = [
    "wrist",
    "collar",
    "carpus",
    "thenar",
    "midPalm",
    "metacarpals",
    "heads",
    "roots",
    "web",
];
const wrap: (turn: number) => number = (turn: number): number => ((turn % 1) + 1) % 1;
