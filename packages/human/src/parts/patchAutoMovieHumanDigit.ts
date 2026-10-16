import { IAutoMovieSurfaceNetwork } from "@automovie/engine";
import { sweepAutoMovieHumanDigit } from "./sweepAutoMovieHumanDigit";
/**
 * Patch one digit onto its part: a bridge from its loop on the part to the digit's first section, the digit's sweep in bands, and a cap over its tip.
 *
 * The bridge leaves the part's loop tangent to the part (`across`) and enters the digit along its spine (`forward`), two rows deep. The sweep is cut into bands at the given marks along it, each eight columns round, so its rows fall at the joints and the dome; the last section, the small disc at the tip, is closed by one Coons patch of four quads, its sides the disc's quarters.
 *
 * Each patch's place on the digit's chart runs from the bridge's start (`u` 0) to the tip (`u` 1), the bridge taking the first `share`; `v` runs round the digit with the sweep's turn, and over the cap it is the turn about the apex, NaN at the apex itself.
 *
 * @param props.name The digit's sweep in the network
 * @param props.digit The digit's sweep and its stations' `u`
 * @param props.loop The part's edges round the digit's root, in the digit's turn from its first section's start
 * @param props.marks `u` along the digit's sweep where its bands meet, from the first emitted section to 1
 * @param props.rows Rows of each band
 * @param props.tension The bridge's tangent over its chord
 * @param props.share The share of the digit's chart the bridge takes
 * @returns The patches in order, bridge, bands and cap, and each one's place map
 */
export function patchAutoMovieHumanDigit(props: {
    name: string;
    digit: sweepAutoMovieHumanDigit.IOutput;
    loop: IAutoMovieSurfaceNetwork.IEdge[];
    marks: number[];
    rows: number[];
    tension: number;
    share: number;
}): patchAutoMovieHumanDigit.IOutput {
    const { name, share }: typeof props = props;
    const root: number = props.marks[0]!;
    const edge: (from: IAutoMovieSurfaceNetwork.IDomainPoint, to: IAutoMovieSurfaceNetwork.IDomainPoint, segments: number) => IAutoMovieSurfaceNetwork.ISweepEdge = (from: IAutoMovieSurfaceNetwork.IDomainPoint, to: IAutoMovieSurfaceNetwork.IDomainPoint, segments: number): IAutoMovieSurfaceNetwork.ISweepEdge => ({
        type: "sweep",
        sweep: name,
        from,
        to,
        segments: fixed(segments),
    });
    const patches: IAutoMovieSurfaceNetwork.IPatch[] = [
        {
            type: "bridge",
            name: `${name}.bridge`,
            from: { edges: props.loop, tangent: "across" },
            to: {
                edges: [edge({ u: root, v: 0 }, { u: root, v: 1 }, 8)],
                tangent: "forward",
            },
            rows: fixed(2),
            tension: props.tension,
        },
    ];
    const places: patchAutoMovieHumanDigit.IPlace[] = [
        (s: number, t: number): {
            u: number;
            v: number;
        } => ({ u: share * t, v: wrap(s) }),
    ];
    props.rows.forEach((rows: number, i: number): void => {
        const u: [
            number,
            number
        ] = [props.marks[i]!, props.marks[i + 1]!];
        patches.push({
            type: "sweep",
            name: `${name}.${i}`,
            sweep: name,
            u,
            v: [0, 1],
            rows: fixed(rows),
            columns: fixed(8),
        });
        places.push((s: number, t: number): {
            u: number;
            v: number;
        } => ({
            u: share + (1 - share) * ((u[0] + (u[1] - u[0]) * t - root) / (1 - root)),
            v: s,
        }));
    });
    patches.push({
        type: "coons",
        name: `${name}.cap`,
        sides: [0, 1, 2, 3].map((q: number): IAutoMovieSurfaceNetwork.ISweepEdge => edge({ u: 1, v: q / 4 }, { u: 1, v: (q + 1) / 4 }, 2)) as [
            IAutoMovieSurfaceNetwork.IEdge,
            IAutoMovieSurfaceNetwork.IEdge,
            IAutoMovieSurfaceNetwork.IEdge,
            IAutoMovieSurfaceNetwork.IEdge
        ],
    });
    places.push((s: number, t: number): {
        u: number;
        v: number;
    } => ({
        u: 1,
        v: s === 0.5 && t === 0.5
            ? Number.NaN
            : wrap((Math.atan2(t - 0.5, s - 0.5) + (3 * Math.PI) / 4) / (2 * Math.PI)),
    }));
    return { patches, places };
}
/** Output types of {@link patchAutoMovieHumanDigit}. */
export namespace patchAutoMovieHumanDigit {
    /** A patch point's place on the digit's chart by its patch coordinates. */
    export type IPlace = (s: number, t: number) => {
        u: number;
        v: number;
    };
    /**
     * The digit's patches.
     *
     * @author Samchon
     */
    export interface IOutput {
        /** Bridge, bands and cap. */
        patches: IAutoMovieSurfaceNetwork.IPatch[];
        /** Each patch's place map, in patch order. */
        places: IPlace[];
    }
}
const fixed: (n: number) => IAutoMovieSurfaceNetwork.ICounts = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
    lowest: n,
    low: n,
    medium: n,
    high: n,
});
const wrap: (v: number) => number = (v: number): number => ((v % 1) + 1) % 1;
