import { IAutoMovieSurfaceNetwork } from "@automovie/engine";
import { gridAutoMovieHumanSweep } from "../gridAutoMovieHumanSweep";
import { transitionAutoMovieHumanSweep } from "../transitionAutoMovieHumanSweep";
import { splitAutoMovieHumanWebs } from "../splitAutoMovieHumanWebs";
import { AUTOMOVIE_HUMAN_HAND_TOPOLOGY } from "./AUTOMOVIE_HUMAN_HAND_TOPOLOGY";
import { AutoMovieHumanHandChart } from "./AutoMovieHumanHandChart";
import { networkAutoMovieHumanHand } from "./networkAutoMovieHumanHand";
import { sweepAutoMovieHumanPalm } from "./sweepAutoMovieHumanPalm";
import { sliceAutoMovieHumanPalm } from "./sliceAutoMovieHumanPalm";
/**
 * Lay palm sections and meridians as one shared anatomical fan. The engine's
 * reduction strips retain their topology, while a common monotone address
 * field approaches the finger roots over both metacarpal bands. The logical
 * texture network consumes the same blocks with identity-independent stations.
 * @param props Shared palm stations, end section and finger-root routing
 * @returns Shared patches and both physical and logical address families
 */
export function layoutAutoMovieHumanPalm(props: {
    at: sweepAutoMovieHumanPalm.IOutput["at"];
    end: sliceAutoMovieHumanPalm.ISlice;
    reach: number;
    roots: splitAutoMovieHumanWebs.IOutput;
}): {
    patches: IAutoMovieSurfaceNetwork.IPatch[];
    addresses: networkAutoMovieHumanHand.IAddress[];
    atlasAddresses: AutoMovieHumanHandChart.IAddress[];
    main: (u: number, v: number) => networkAutoMovieHumanHand.IPoint;
    thenar: number;
} {
    const C: typeof AutoMovieHumanHandChart = AutoMovieHumanHandChart;
    const { at, end, reach }: typeof props = props;
    const R: number = props.roots.count;
    const rootAt: splitAutoMovieHumanWebs.IOutput["at"] = props.roots.at;
    const uCarpus: number = at.carpus;
    const uMid: number = at.midPalm;
    const THENAR: number = AUTOMOVIE_HUMAN_HAND_TOPOLOGY.thenar;
    const STEP: number = AUTOMOVIE_HUMAN_HAND_TOPOLOGY.step;
    const THUMB: number = AUTOMOVIE_HUMAN_HAND_TOPOLOGY.thumb;
    const SHIFT: number = AUTOMOVIE_HUMAN_HAND_TOPOLOGY.shift;
    const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
    const addresses: networkAutoMovieHumanHand.IAddress[] = [];
    const atlasAddresses: AutoMovieHumanHandChart.IAddress[] = [];
    const atlas: typeof AutoMovieHumanHandChart.point = C.point;
    const palmU: (u: number) => number = (u: number): number => (u * end.centre.x) / reach / 2;
    const main: (u: number, v: number) => networkAutoMovieHumanHand.IPoint = (u: number, v: number): networkAutoMovieHumanHand.IPoint => ({
        branch: null,
        u: palmU(u),
        v: wrap(v),
    });
    const sweepPatch: (name: string, u: [
        number,
        number
    ], v: [
        number,
        number
    ], rows: number, columns: number, chart: [
        number,
        number
    ]) => void = (name: string, u: [
        number,
        number
    ], v: [
        number,
        number
    ], rows: number, columns: number, chart: [
        number,
        number
    ]): void => {
        patches.push({
            type: "sweep",
            name,
            sweep: "palm",
            u,
            v,
            rows: fixed(rows),
            columns: fixed(columns),
        });
        addresses.push((s: number, t: number): networkAutoMovieHumanHand.IPoint => main(u[0] + (u[1] - u[0]) * t, v[0] + (v[1] - v[0]) * s));
        atlasAddresses.push((s: number, t: number): AutoMovieHumanHandChart.IPoint => atlas(chart[0] + (chart[1] - chart[0]) * t, v[0] + (v[1] - v[0]) * s));
    };
    // ring to collar, eight columns
    sweepPatch("palm.ring", [0, at.collar], [0, 1], 1, 8, [
        C.palm("wrist"),
        C.palm("collar"),
    ]);
    // the ring's eight columns turn into twelve round the carpus, the thenar zone keeps twelve with the thumb's opening astride the radial palmar corner, and twelve turn into eighteen and then the roots' twenty-six before the heads, each change a transition band of 2-to-1 reduction strips
    const uCollar: number = at.collar;
    const transition: (name: string, u: [
        number,
        number
    ], from: number, to: number, rows: number, chart: [
        number,
        number
    ], v?: [
        number,
        number
    ]) => void = (name: string, u: [
        number,
        number
    ], from: number, to: number, rows: number, chart: [
        number,
        number
    ], v: [
        number,
        number
    ] = [0, 1]): void => {
        patches.push({
            type: "transition",
            name,
            sweep: "palm",
            u,
            v,
            start: fixed(from),
            end: fixed(to),
            rows: fixed(rows),
        });
        addresses.push((s: number, t: number): networkAutoMovieHumanHand.IPoint => main(u[0] + (u[1] - u[0]) * t, v[0] + (v[1] - v[0]) * s));
        atlasAddresses.push((s: number, t: number): AutoMovieHumanHandChart.IPoint => atlas(chart[0] + (chart[1] - chart[0]) * t, v[0] + (v[1] - v[0]) * s));
    };
    const grid: (laid: gridAutoMovieHumanSweep.IOutput, chart: gridAutoMovieHumanSweep.IOutput) => void = (laid: gridAutoMovieHumanSweep.IOutput, chart: gridAutoMovieHumanSweep.IOutput): void => laid.patches.forEach((patch: IAutoMovieSurfaceNetwork.ICoonsPatch, k: number): void => {
        patches.push(patch);
        addresses.push((s: number, t: number): networkAutoMovieHumanHand.IPoint => {
            const p: IAutoMovieSurfaceNetwork.IDomainPoint = gridAutoMovieHumanSweep.locate(laid.corners[k]!, s, t);
            return main(p.u, p.v);
        });
        atlasAddresses.push((s: number, t: number): AutoMovieHumanHandChart.IPoint => {
            const p: IAutoMovieSurfaceNetwork.IDomainPoint = gridAutoMovieHumanSweep.locate(chart.corners[k]!, s, t);
            return atlas(p.u, p.v);
        });
    });
    // the carpus widens fastest at the borders, so its band is split there and each half reduces in its middle, palmar and dorsal, where the surface is gently curved
    transition("palm.carpus.palmar", [uCollar, uCarpus], 4, THENAR / 2, 2, [C.palm("collar"), C.palm("carpus")], [-0.25, 0.25]);
    transition("palm.carpus.dorsal", [uCollar, uCarpus], 4, THENAR / 2, 2, [C.palm("collar"), C.palm("carpus")], [0.25, 0.75]);
    const uThenar: number = (uCarpus + uMid) / 2;
    grid(gridAutoMovieHumanSweep({
        sweep: "palm",
        name: "palm.thenar",
        rows: [uCarpus, uThenar, uMid],
        columns: THENAR,
        v: (_: number, i: number): number => i / THENAR,
        skip: (_: number, i: number): boolean => i === THUMB - 1 || i === THUMB,
    }), C.grid("palm.thenar", ["carpus", "thenar", "midPalm"], THENAR, (_: number, i: number): boolean => i === THUMB - 1 || i === THUMB));
    // The root meridians fan across both metacarpal bands, not only the last row.
    const fan: (u: number, v: number) => number = (u: number, v: number): number => {
        const index: number = v * R + SHIFT;
        const lower: number = Math.floor(index);
        const fraction: number = index - lower;
        const target: number = rootAt(lower) + (rootAt(lower + 1) - rootAt(lower)) * fraction;
        const t: number = Math.max(0, Math.min(1, (u - uMid) / (1 - uMid)));
        const blend: number = t * t * (3 - 2 * t);
        return v + (target - v) * blend;
    };
    const uStep: number = at.metacarpals;
    // Count transitions finish on the flatter metacarpal shafts; the distal
    // band follows the four-MCP field without imposing one planar head ridge.
    const uShaft: number = (uMid + uStep) / 2;
    const chartShaft: number = (C.palm("midPalm") + C.palm("metacarpals")) / 2;
    grid(transitionAutoMovieHumanSweep({
        sweep: "palm", name: "palm.metacarpals", u: [uMid, uShaft],
        start: THENAR, end: STEP, rows: 1, turn: fan,
    }), transitionAutoMovieHumanSweep({ sweep: "palm", name: "palm.metacarpals.chart", u: [C.palm("midPalm"), chartShaft], start: THENAR, end: STEP, rows: 1, turn: (_u: number, v: number): number => v }));
    grid(transitionAutoMovieHumanSweep({
        sweep: "palm", name: "palm.heads", u: [uShaft, uStep],
        start: STEP, end: R, rows: 1, turn: fan,
    }), transitionAutoMovieHumanSweep({ sweep: "palm", name: "palm.heads.chart", u: [chartShaft, C.palm("metacarpals")], start: STEP, end: R, rows: 1, turn: (_u: number, v: number): number => v }));
    grid(gridAutoMovieHumanSweep({
        sweep: "palm",
        name: "palm.roots",
        rows: [uStep, 1],
        columns: R,
        v: (r: number, i: number): number => fan(r === 0 ? uStep : 1, i / R),
    }), C.grid("palm.roots", ["metacarpals", "roots"], R));
    return { patches, addresses, atlasAddresses, main, thenar: uThenar };
}
const fixed: (n: number) => IAutoMovieSurfaceNetwork.ICounts = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({ lowest: n, low: n, medium: n, high: n });
const wrap: (v: number) => number = (v: number): number => ((v % 1) + 1) % 1;
