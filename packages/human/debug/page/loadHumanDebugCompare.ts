import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanDebugReferencePack } from "../contracts/IHumanDebugReferencePack";
import { HumanDebugReferenceCut } from "../compare/HumanDebugReferenceCut";
import { HumanDebugReferenceModel } from "../compare/HumanDebugReferenceModel";
import { HumanDebugReferencePieces } from "../compare/HumanDebugReferencePieces";
import { HumanDebugViewCurves } from "../compare/HumanDebugViewCurves";
import { HumanDebugViewDeviation } from "../compare/HumanDebugViewDeviation";
import { HumanDebugViewParts } from "../compare/HumanDebugViewParts";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HumanDebugReferenceFiles } from "./HumanDebugReferenceFiles";
import type { IHumanDebugSubject } from "./IHumanDebugSubject";

/** Height between the reference sections the comparison keeps, mm. */
const STEP: number = 1;

/**
 * Load the view comparison: one reference person from the private pack as the underlay, and over
 * it the view curves of every part the current source builds from one person's inputs.
 *
 * The pack is read from the checkout's private `.references` at run time (`HumanDebugReferenceFiles`).
 * The parts are `HumanDebugViewParts` of the person, their curves `HumanDebugViewCurves` with one
 * colour per part, the underlay `HumanDebugReferenceModel` in the chosen style. Every part's
 * deviation from the reference cut by its own planes (`HumanDebugViewDeviation`) goes to the
 * provenance, worst first, first of its fields so the image route's header carries it.
 *
 * @param person The person whose inputs build the curves.
 * @param reference Reference id, drawing style and drawn pieces (`HumanDebugReferencePieces`).
 * @returns The subject; its key's piece is `reference:<id>:<style>:<pieces>`.
 */
export async function loadHumanDebugCompare(
  person: IHumanDebugPerson,
  reference: { id: string; style: "clay" | "loft"; parts: string[] },
): Promise<IHumanDebugSubject> {
  const started: number = performance.now();
  const pack: IHumanDebugReferencePack = await HumanDebugReferenceFiles(reference.id, STEP);
  const read: number = performance.now();
  const built: HumanDebugViewParts.IOutput = HumanDebugViewParts.of(person.parameters);
  const generated: number = performance.now();
  const underlay: ReturnType<typeof HumanDebugReferenceModel.of> = HumanDebugReferenceModel.of(pack, reference.style, HumanDebugReferencePieces(reference.parts, built));
  const drawn: ReturnType<typeof HumanDebugViewCurves.of> = HumanDebugViewCurves.of(built);
  const rows: HumanDebugViewDeviation.IRow[] = HumanDebugViewDeviation.of(built, HumanDebugReferenceCut.regions(pack)).sort(
    (a: HumanDebugViewDeviation.IRow, b: HumanDebugViewDeviation.IRow): number => (b.edge?.max ?? b.touch.max) - (a.edge?.max ?? a.touch.max),
  );
  const model: IAutoMovieModel = {
    id: "human.debug.compare",
    name: "Human view comparison",
    origin: "generated",
    skeleton: null,
    body: null,
    asset: null,
    materials: [],
    parts: underlay.parts,
  };
  const round = (n: number): number => Math.round(n * 10) / 10;
  return {
    key: { person: person.alias, piece: "reference:" + reference.id + ":" + reference.style + ":" + reference.parts.join(","), pose: null },
    model,
    curves: [...underlay.curves, ...drawn.curves],
    textures: null,
    legend: drawn.legend,
    provenance: {
      // Each row: name, E (largest edge deviation, mean, share of breadth or depth, edge, place along
      // the axis, nearest site), B (mean signed deviation of +u, +v, -u, -v), T (touch distance largest,
      // mean), R (section distance largest, mean), mm; worst first.
      // URL-safe characters only, so the image route's cut provenance header holds every row.
      deviation: rows.map((r: HumanDebugViewDeviation.IRow): string =>
        [
          r.name,
          r.edge === null
            ? "E-"
            : ["E" + round(r.edge.max), round(r.edge.mean), round(r.edge.share * 100) + "pc", r.edge.edge, round(r.edge.at * 100) + "pc", r.edge.site.replace(/[^A-Za-z0-9.-]/g, "-")].join("_"),
          r.bias === null ? "B-" : "B" + r.bias.map(round).join("_"),
          "T" + round(r.touch.max) + "_" + round(r.touch.mean),
          "R" + round(r.ring.max) + "_" + round(r.ring.mean),
        ].join("_"),
      ),
      producer: "HumanDebugViewParts + reference pack",
      person: person.alias,
      reference: reference.id,
      style: reference.style,
      scale: built.scale,
      headFailure: built.headFailure,
      repeats: built.repeats,
      milliseconds: { read: Math.round(read - started), generate: Math.round(generated - read), compare: Math.round(performance.now() - generated) },
    },
    milliseconds: performance.now() - started,
  };
}
