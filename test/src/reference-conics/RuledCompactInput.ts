import { type IAutoMovieCurve64 as G } from "@automovie/engine";
import { convertAutoMovieRecoveryCurves } from "@automovie/recovery";
import type { IAutoMovieRecoveryOpenContinuation } from "../../../packages/recovery/src/structures/curve/IAutoMovieRecoveryOpenContinuation";
import { createHash } from "node:crypto";
import { once } from "node:events";
import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

/** Exact input binding and streaming canonical publications for the whole ruled comparison. */
export namespace RuledCompactInput {
  /** An exact original or derived byte commitment, not a substituted historical identity. */
  export interface Member {
    /** Actual or historical path, explicitly distinguished by its enclosing receipt. */
    path: string;
    /** Exact UTF-8 or compressed byte length. */
    bytes: number;
    /** SHA-256 of those exact bytes. */
    sha256: string;
  }
  /** Original fit measurements become unavailable after refitting without the original observations. */
  export interface Quality {
    /** Original point residual, or explicitly unavailable on a new coefficient fit. */
    sampleMaximumMm: number | null;
    /** Original polyline estimate, or unavailable without re-observation. */
    polylineUpperEstimateMm: number | null;
    /** False on every adopted curve: the original 0.2 mm acquisition target is not re-proved. */
    toleranceMet: boolean;
    /** Original acquisition density, or unavailable for the refitted representation. */
    observationsPerSpan: number | null;
    /** New cubic refitting uses no handle fallback. */
    handleFallbacks: number;
  }
  /** Narrow writable view; all other decoded fields remain on the original objects. */
  export interface Bundle {
    /** Complete original closed topology and its current cubic authorities. */
    loft: { sections: { coordinateMm: number; loops: { curve: G.Cubic }[] }[] };
    /** Original section identities, closed qualification and all open observations. */
    reports: { coordinateMm: number; fits: Quality[]; open: (Quality & { curve: G.Cubic })[]; diagnostics: string[] }[];
    /** Original acquisition policy, not a new native-precision claim. */
    policy: { toleranceMm: number };
    /** Actual whole-artifact span count is adjusted after adopted replacements. */
    summary: { spans: number };
    /** Historical diagnostics and explicit new qualification notice. */
    diagnostics: string[];
  }
  /** Incidence is unchanged; only its separate coefficient derivation commitment changes. */
  export interface Graph extends IAutoMovieRecoveryOpenContinuation {
    /** Coefficient, source and historical-registration commitments. */
    provenance: { sourceEpoch: string; curveBundleSha256: string; sourceModel: Member; registration: object; policy: object; derivation?: object };
  }
  /** One consumed coefficient authority, with a direct replacement slot and qualification owner. */
  export interface Entry {
    /** Closed profile or graph-consumed open arc. */
    kind: "closed" | "open";
    /** Original section index, unchanged by refitting. */
    section: number;
    /** Original closed/open ordinal, unchanged by refitting. */
    ordinal: number;
    /** The original data slot, not a copied coefficient graph. */
    holder: { curve: G.Cubic };
    /** Its original qualification record, aligned by section and ordinal. */
    quality: Quality;
  }
  /** One mutable Bezier graph and its unchanged source relationships. */
  export interface Loaded {
    /** Entire decoded coefficient artifact, including observations not consumed by the graph. */
    bundle: Bundle;
    /** Original open incidence and material orientations. */
    graph: Graph;
    /** Supply-selected original recipe. */
    recipe: { schema: string; operator: string; sourceEpoch: string; curves: Member; continuation: Member; originalModel: Member; observationContext: Member };
    /** Exact original byte identities with current file addresses. */
    identities: { original: Member; actual: string }[];
    /** All closed and every unique graph-used open curve. */
    cohort: Entry[];
    /** Raw open observations not selected by any ordinary graph pair. */
    unusedOpen: number;
    /** Logical source-free incidence identity, excluding coefficient provenance. */
    topologySha256: string;
  }

  /** Verify the same explicit original f1 supply/recipe used by ReferenceRuledBaseline before one basis conversion. */
  export async function load(root: string): Promise<Loaded> {
    const person: string = path.join(root, "test/.shots/f1");
    const epoch: string = "432cb0b72031588f3c0f45770413e3a276947e1e372d0f843955a54ee63c1fb2";
    const recipeId: string = "de308faf2422cd0e07d06fbc5cd8cb6eddadf00d81285388dc084ded5729dbc9";
    const observation: string = path.join(person, "recovery-diagnostics", epoch);
    const supply: { ruledCapture: Member; members: Member[]; modelSha256: string } = JSON.parse(await fs.readFile(path.join(person, "reference-supply.json"), "utf8")) as { ruledCapture: Member; members: Member[]; modelSha256: string };
    const recipeMember: Member | undefined = supply.members.find((m: Member): boolean => m.path === path.join(path.dirname(supply.ruledCapture.path), "recipe.json"));
    if (recipeMember?.sha256 !== recipeId) throw new Error("The supply no longer selects the investigated original ruled recipe");
    const identities: Loaded["identities"] = [];
    const read = async (actual: string, original: Member): Promise<Buffer> => {
      const bytes: Buffer = await fs.readFile(actual);
      if (bytes.length !== original.bytes || hash(bytes) !== original.sha256) throw new Error("Original byte commitment differs: " + actual);
      identities.push({ original, actual });
      return bytes;
    };
    const recipe: Loaded["recipe"] = JSON.parse((await read(path.join(observation, "direct-render", recipeId, "recipe.json"), recipeMember)).toString("utf8")) as Loaded["recipe"];
    if (recipe.schema !== "reference-recovery-direct-render-v1" || recipe.operator !== "ruled" || recipe.sourceEpoch !== epoch || recipe.originalModel.sha256 !== supply.modelSha256) throw new Error("Original recipe scope differs");
    const graph: Graph = JSON.parse((await read(path.join(observation, "continuation.json"), recipe.continuation)).toString("utf8")) as Graph;
    if (graph.provenance.sourceEpoch !== epoch || graph.provenance.curveBundleSha256 !== recipe.curves.sha256 || graph.provenance.sourceModel.sha256 !== recipe.originalModel.sha256) throw new Error("Original graph binding differs");
    await read(path.join(person, "reference-model.json"), recipe.originalModel);
    let bytes: Buffer = await read(path.join(observation, "hermite-curves.json"), recipe.curves);
    let original: unknown = JSON.parse(bytes.toString("utf8"));
    bytes = Buffer.alloc(0);
    const bundle: Bundle = convertAutoMovieRecoveryCurves(original, "bezier") as Bundle;
    original = undefined;
    const graphOpen: Set<string> = new Set();
    for (const interval of graph.intervals) for (const pair of interval.pairs) {
      graphOpen.add(interval.beforeSection + ":" + pair.before);
      graphOpen.add(interval.afterSection + ":" + pair.after);
    }
    const cohort: Entry[] = [];
    for (const [section, item] of bundle.loft.sections.entries())
      for (const [ordinal, holder] of item.loops.entries()) cohort.push({ kind: "closed", section, ordinal, holder, quality: bundle.reports[section]!.fits[ordinal]! });
    let unusedOpen: number = 0;
    for (const [section, report] of bundle.reports.entries()) for (const [ordinal, holder] of report.open.entries()) {
      if (graphOpen.has(section + ":" + ordinal)) cohort.push({ kind: "open", section, ordinal, holder, quality: holder });
      else ++unusedOpen;
    }
    if (cohort.filter((e: Entry): boolean => e.kind === "open").length !== graphOpen.size) throw new Error("A graph-used open authority is absent");
    return { bundle, graph, recipe, identities, cohort, unusedOpen, topologySha256: topology(graph) };
  }

  /** Hash incidence independently of the separately changing coefficient commitment. */
  export function topology(graph: Graph): string {
    const { provenance: _provenance, ...incidence }: Graph = graph;
    return hash(JSON.stringify(incidence));
  }

  /** Stream an identical cubic-only schema for the exact same old/new consumed cohort. */
  export async function publishCohort(file: string, entries: readonly Entry[], frame: object): Promise<{ raw: Member; gzip: Member; curves: number; spans: number; coefficientFloat64Entries: number; frameNumericEntries: number; float64Entries: number }> {
    const stream: ReturnType<typeof createWriteStream> = createWriteStream(file);
    const digest: ReturnType<typeof createHash> = createHash("sha256");
    let bytes: number = 0;
    const write = async (text: string): Promise<void> => {
      bytes += Buffer.byteLength(text);
      digest.update(text);
      if (!stream.write(text)) await once(stream, "drain");
    };
    await write('{"schema":"same-frame-selected-cubic-v1","frame":' + JSON.stringify(frame) + ',"curves":[');
    let spans: number = 0;
    for (const [i, entry] of entries.entries()) {
      if (i !== 0) await write(",");
      await write(JSON.stringify(entry.holder.curve));
      spans += entry.holder.curve.spans.length;
    }
    await write("]}");
    stream.end();
    await once(stream, "finish");
    const compressed: string = file + ".gz";
    await pipeline(createReadStream(file), createGzip(), createWriteStream(compressed));
    const numeric = (value: unknown): number => typeof value === "number" ? 1 : value !== null && typeof value === "object" ? Object.values(value).reduce((n: number, child: unknown): number => n + numeric(child), 0) : 0;
    const frameNumericEntries: number = numeric(frame);
    return { raw: { path: file, bytes, sha256: digest.digest("hex") }, gzip: await member(compressed), curves: entries.length, spans, coefficientFloat64Entries: 13 * spans, frameNumericEntries, float64Entries: 13 * spans + frameNumericEntries };
  }

  /** Publish one logical derived graph; gzip streaming avoids retaining another complete encoded copy. */
  export async function publish(file: string, value: object): Promise<{ raw: Member; gzip: Member }> {
    let text: string = JSON.stringify(value);
    const raw: Member = { path: file, bytes: Buffer.byteLength(text), sha256: hash(text) };
    await fs.writeFile(file, text);
    text = "";
    const compressed: string = file + ".gz";
    await pipeline(createReadStream(file), createGzip(), createWriteStream(compressed));
    return { raw, gzip: await member(compressed) };
  }

  /** Stream byte identity without loading an old generated scene or native mesh into the generator. */
  export async function member(file: string): Promise<Member> {
    const digest: ReturnType<typeof createHash> = createHash("sha256");
    let bytes: number = 0;
    for await (const value of createReadStream(file)) { digest.update(value); bytes += value.length; }
    return { path: file, bytes, sha256: digest.digest("hex") };
  }

  /** Exact SHA-256 of a UTF-8 text or existing byte buffer. */
  export function hash(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
}
