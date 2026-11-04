import { AutoMovieHumanSkinChart } from "../../src/appearance/AutoMovieHumanSkinChart";
import { AutoMovieHumanBodyConstruction } from "../../src/generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodyLaw } from "../../src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftMesh } from "../../src/lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../../src/lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanRig } from "../../src/skeleton/AutoMovieHumanRig";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import type { IHumanDebugPiece } from "./IHumanDebugPiece";

/**
 * `timing`: where one person's generation spends its time, measured on the production stages the
 * whole figure runs, and the raw skin they make.
 *
 * The stages are called as `AutoMovieHuman` calls them, each timed alone: the body law's
 * calibration, the body surface (`AutoMovieHumanBodySurface.generate`, without the lip refinement
 * box), its split into skin pieces, the construction curves, the skin chart per chart group (the
 * charts `AutoMovieHumanSkinChart` flattens independently: `head`, `trunk` and every other chain
 * alone, before packing) and the rig. Per chain the provenance lists its layers, its ring phases
 * and its layers times phases. Every number goes to the console as `[human-debug timing]` lines,
 * which the capture session repeats in the server log. The parts are the skin pieces in body
 * millimetres.
 */
export const HumanDebugPieceTiming: IHumanDebugPiece = {
  name: "timing",
  region: "body",
  description: "Milliseconds per generation stage, skin chart and chain, with each chain's layers and phases",
  arguments: [],
  build: (person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument => {
    if (argument !== null) throw new Error("timing takes no argument; got " + argument);
    const stages: Record<string, number> = {};
    const time = <T>(stage: string, task: () => T): T => {
      const started: number = performance.now();
      const value: T = task();
      stages[stage] = Math.round(performance.now() - started);
      return value;
    };
    const calibration: IAutoMovieHumanBodyCalibration = time(
      "calibrate",
      (): IAutoMovieHumanBodyCalibration => AutoMovieHumanBodyLaw.calibrate(person.parameters).body,
    );
    const surface: AutoMovieHumanBodySurface.IOutput = time(
      "surface",
      (): AutoMovieHumanBodySurface.IOutput => AutoMovieHumanBodySurface.generate(calibration, []),
    );
    const pieces: AutoMovieHumanLoftMesh.IPiece[] = time(
      "split",
      (): AutoMovieHumanLoftMesh.IPiece[] => AutoMovieHumanLoftMesh.split(surface.mesh, surface.normals, surface.coordinates),
    );
    time(
      "construction",
      (): AutoMovieHumanBodyConstruction.ICurve[] =>
        AutoMovieHumanBodyConstruction.generate(calibration, surface.construction),
    );

    // One chart group at a time, as the chart flattens them; a failing chart is named, not thrown.
    const charts: Map<string, AutoMovieHumanLoftMesh.IPiece[]> = new Map();
    for (const piece of pieces) {
      const key: string = chart(piece.name.slice(0, piece.name.lastIndexOf("/")));
      charts.set(key, [...(charts.get(key) ?? []), piece]);
    }
    const chartTimes: Record<string, number | string> = {};
    const chartStarted: number = performance.now();
    for (const [key, members] of charts) {
      const started: number = performance.now();
      try {
        AutoMovieHumanSkinChart.generate(members, calibration.chains);
        chartTimes[key] = Math.round(performance.now() - started);
      } catch (error) {
        chartTimes[key] = "failed after " + Math.round(performance.now() - started) + " ms: " + String(error);
      }
    }
    stages.skinChart = Math.round(performance.now() - chartStarted);
    time("rig", (): AutoMovieHumanRig.IRig => AutoMovieHumanRig.prepare(calibration, 0.001));

    const chains: Record<string, { layers: number; phases: number; cells: number }> = {};
    for (const c of calibration.chains)
      chains[c.name] = { layers: c.layers.length, phases: c.samples, cells: c.layers.length * c.samples };
    console.log(
      "[human-debug timing] person=" + person.alias + " stages " +
        Object.entries(stages).map(([k, v]: [string, number]): string => k + "=" + v + "ms").join(" "),
    );
    console.log("[human-debug timing] person=" + person.alias + " charts " + JSON.stringify(chartTimes));
    console.log(
      "[human-debug timing] person=" + person.alias + " chains " +
        Object.entries(chains)
          .sort((a: [string, { cells: number }], b: [string, { cells: number }]): number => b[1].cells - a[1].cells)
          .map(([k, v]: [string, { layers: number; phases: number }]): string => k + "=" + v.layers + "x" + v.phases)
          .join(" "),
    );
    return {
      parts: pieces.map(
        (piece: AutoMovieHumanLoftMesh.IPiece): IHumanDebugDocument.IPart => ({
          id: "human.skin." + piece.name,
          space: "body-mm",
          frame: { origin: [0, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], left: [0, 0, 1] },
          points: triples(piece.positions),
          indices: piece.indices,
          normals: triples(piece.normals),
          curves: [],
        }),
      ),
      provenance: {
        piece: "timing",
        person: person.alias,
        stages,
        charts: chartTimes,
        chains,
        vertices: surface.mesh.positions.length / 3,
        triangles: surface.mesh.indices.length / 3,
        chainCount: calibration.chains.map((c: IAutoMovieHumanLoftChain): string => c.name).length,
      },
    };
  },
};

/**
 * The chart group of a chain, as `AutoMovieHumanSkinChart` groups its pieces.
 *
 * @param chain Chain name.
 * @returns `head` for the head chains, `trunk` for the trunk chains, else the chain.
 */
function chart(chain: string): string {
  if (chain === "head" || chain.startsWith("head.")) return "head";
  if (chain === "upper" || chain === "trunk") return "trunk";
  return chain;
}

/**
 * Flat values as point triples.
 *
 * @param values Flat `[x, y, z, ...]`.
 * @returns The points.
 */
function triples(values: readonly number[]): IHumanDebugDocument.Point[] {
  const out: IHumanDebugDocument.Point[] = [];
  for (let i: number = 0; i + 2 < values.length; i += 3) out.push([values[i]!, values[i + 1]!, values[i + 2]!]);
  return out;
}
