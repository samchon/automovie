import { AutoMovieHumanBodyConstruction } from "../../src/generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodySurface } from "../../src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftMesh } from "../../src/lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../../src/lofting/IAutoMovieHumanLoftChain";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import { HumanDebugTubeCentreline } from "./HumanDebugTubeCentreline";

/**
 * Loft the chains a set of globs names, alone, into a component document.
 *
 * The calibration is cut to the named chains, the events those chains parent (keeping only splits
 * into named children) and their poles, with no apertures or appendages. The production
 * `AutoMovieHumanBodySurface.generate` lofts exactly those chains and
 * `AutoMovieHumanBodyConstruction.generate` draws the same sections, axes, guides and web paths the
 * whole person draws. An end whose parent chain was cut away has no event, so the loft closes it as
 * a pole, a flat fan at the chain axis the whole person does not have: that lid is the cut.
 *
 * Coordinates stay calibration millimetres in the body frame. Skin parts are the generator's
 * interval groups `human.skin.<chain>/<k>` with their lofted normals; curves are the tubes'
 * centrelines (`HumanDebugTubeCentreline`), each on the interval it opens or else its chain's
 * first part.
 */
export namespace HumanDebugChainLoft {
  /**
   * Loft the named chains.
   *
   * @param calibration Whole-person calibration, mm.
   * @param globs Globs over whole chain names.
   * @returns The document; globs matching no chain throw with every chain name.
   */
  export function build(
    calibration: IAutoMovieHumanBodyCalibration,
    globs: readonly string[],
  ): IHumanDebugDocument {
    const started: number = performance.now();
    const owned: (name: string) => boolean = (name: string): boolean =>
      globs.some((glob: string): boolean => HumanDebugPattern.expression(glob).test(name));
    const subset: IAutoMovieHumanBodyCalibration = select(calibration, owned);
    const surface: AutoMovieHumanBodySurface.IOutput =
      AutoMovieHumanBodySurface.generate(subset, []);
    const pieces: AutoMovieHumanLoftMesh.IPiece[] = AutoMovieHumanLoftMesh.split(
      surface.mesh,
      surface.normals,
      surface.coordinates,
    );
    const tubes: AutoMovieHumanBodyConstruction.ICurve[] =
      AutoMovieHumanBodyConstruction.generate(subset, surface.construction);

    // Parts in chain order, then interval order, so the part list reads as the body does.
    const order: Map<string, number> = new Map(
      subset.chains.map((c: IAutoMovieHumanLoftChain, k: number): [string, number] => [c.name, k]),
    );
    pieces.sort(
      (a: AutoMovieHumanLoftMesh.IPiece, b: AutoMovieHumanLoftMesh.IPiece): number =>
        (order.get(chain(a.name)) ?? Infinity) - (order.get(chain(b.name)) ?? Infinity) ||
        interval(a.name) - interval(b.name),
    );
    const parts: IHumanDebugDocument.IPart[] = pieces.map(
      (piece: AutoMovieHumanLoftMesh.IPiece): IHumanDebugDocument.IPart => ({
        id: "human.skin." + piece.name,
        space: "body-mm",
        frame: { origin: [0, 0, 0], forward: [1, 0, 0], up: [0, 1, 0], left: [0, 0, 1] },
        points: triples(piece.positions),
        indices: piece.indices,
        normals: triples(piece.normals),
        curves: [],
      }),
    );

    // A section `<chain>/<k>` travels with the interval it opens; every other curve with its chain's first part.
    const byId: Map<string, IHumanDebugDocument.IPart> = new Map(
      parts.map((p: IHumanDebugDocument.IPart): [string, IHumanDebugDocument.IPart] => [p.id, p]),
    );
    const first: Map<string, IHumanDebugDocument.IPart> = new Map();
    for (const part of parts) {
      const name: string = chain(part.id.slice("human.skin.".length));
      if (!first.has(name)) first.set(name, part);
    }
    const orphans: string[] = [];
    for (const tube of tubes) {
      const owner: IHumanDebugDocument.IPart | undefined =
        byId.get("human.skin." + tube.id) ?? first.get(chain(tube.id));
      if (owner === undefined) {
        orphans.push(tube.id);
        continue;
      }
      owner.curves.push({
        id: "human.construction." + tube.id,
        ...HumanDebugTubeCentreline(tube.mesh.positions, tube.mesh.indices.length / 3, tube.id),
      });
    }
    // Per chain: its layers and ring phases, and the vertices whose coordinates are not finite,
    // which the renderer drops and the skin chart cannot flatten.
    const chains: Record<string, { layers: number; phases: number; vertices: number; nonFinite: number }> = {};
    for (const c of subset.chains) chains[c.name] = { layers: c.layers.length, phases: c.samples, vertices: 0, nonFinite: 0 };
    for (const piece of pieces) {
      const entry: { vertices: number; nonFinite: number } | undefined = chains[chain(piece.name)];
      if (entry === undefined) continue;
      for (let i: number = 0; i + 2 < piece.positions.length; i += 3) {
        entry.vertices += 1;
        if (!(Number.isFinite(piece.positions[i]!) && Number.isFinite(piece.positions[i + 1]!) && Number.isFinite(piece.positions[i + 2]!)))
          entry.nonFinite += 1;
      }
    }
    const broken: string[] = Object.entries(chains)
      .filter(([, v]: [string, { nonFinite: number }]): boolean => v.nonFinite > 0)
      .map(([k, v]: [string, { nonFinite: number; vertices: number }]): string => k + " " + v.nonFinite + "/" + v.vertices);
    if (broken.length !== 0) console.log("[human-debug loft] non-finite vertices: " + broken.join(", "));
    return {
      parts,
      provenance: {
        producer: "HumanDebugChainLoft",
        globs: [...globs],
        lofted: subset.chains.map((c: IAutoMovieHumanLoftChain): string => c.name),
        nonFinite: broken,
        chains,
        orphans,
        milliseconds: Math.round(performance.now() - started),
      },
    };
  }

  /**
   * Cut a calibration to the chains a predicate owns.
   *
   * @param calibration Whole-person calibration, mm.
   * @param owned Chain-name predicate.
   * @returns The subset; it shares the original's records, which stay unmutated.
   */
  export function select(
    calibration: IAutoMovieHumanBodyCalibration,
    owned: (name: string) => boolean,
  ): IAutoMovieHumanBodyCalibration {
    const chains: IAutoMovieHumanLoftChain[] = calibration.chains.filter(
      (c: IAutoMovieHumanLoftChain): boolean => owned(c.name),
    );
    if (chains.length === 0)
      throw new Error(
        "No chain matches; chains are " +
          calibration.chains.map((c: IAutoMovieHumanLoftChain): string => c.name).join(", "),
      );
    return {
      ...calibration,
      chains,
      events: calibration.events
        .filter((e: IAutoMovieHumanBodyCalibration.IEvent): boolean => owned(e.parent))
        .map(
          (e: IAutoMovieHumanBodyCalibration.IEvent): IAutoMovieHumanBodyCalibration.IEvent => ({
            ...e,
            splits: e.splits.filter((s: IAutoMovieHumanBodyCalibration.ISplit): boolean => owned(s.child)),
          }),
        )
        .filter((e: IAutoMovieHumanBodyCalibration.IEvent): boolean => e.splits.length !== 0),
      poles: calibration.poles.filter((p: IAutoMovieHumanBodyCalibration.IPole): boolean => owned(p.chain)),
      apertures: [],
      appendages: undefined,
    };
  }

  /** Chain name of `<chain>/<k>`. */
  function chain(name: string): string {
    return name.slice(0, name.lastIndexOf("/"));
  }

  /** Interval index of `<chain>/<k>`. */
  function interval(name: string): number {
    return Number(name.slice(name.lastIndexOf("/") + 1));
  }

  /** Flat values as triples rounded to a micrometre (or a millionth of a unit normal). */
  function triples(values: readonly number[]): IHumanDebugDocument.Point[] {
    const out: IHumanDebugDocument.Point[] = [];
    for (let i: number = 0; i + 2 < values.length; i += 3)
      out.push([round(values[i]!), round(values[i + 1]!), round(values[i + 2]!)]);
    return out;
  }

  /** One value rounded to six decimals. */
  function round(value: number): number {
    return Math.round(value * 1e6) / 1e6;
  }
}
