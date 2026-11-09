import type { IAutoMovieModel } from "@automovie/interface";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";

import { HumanDebugReferenceCut } from "../compare/HumanDebugReferenceCut";
import { HumanDebugReferenceMesh } from "../compare/HumanDebugReferenceMesh";
import { HumanDebugReferenceModel } from "../compare/HumanDebugReferenceModel";
import { HumanDebugReferencePieces } from "../compare/HumanDebugReferencePieces";
import { HumanDebugViewCurves } from "../compare/HumanDebugViewCurves";
import { HumanDebugViewDeviation } from "../compare/HumanDebugViewDeviation";
import { HumanDebugViewParts } from "../compare/HumanDebugViewParts";
import { HUMAN_DEBUG_VIEW_PARTS } from "../compare/HUMAN_DEBUG_VIEW_PARTS";
import type { IHumanDebugReferencePack } from "../contracts/IHumanDebugReferencePack";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HumanDebugReferenceFiles } from "./HumanDebugReferenceFiles";
import { HumanDebugReferenceMeshFiles } from "./HumanDebugReferenceMeshFiles";
import type { IHumanDebugSubject } from "./IHumanDebugSubject";

/** Height between the reference sections the comparison keeps, mm. */
const STEP: number = 1;

/**
 * Load the reference underlay and actual production originals for one person's selected scope.
 *
 * Clay adopts the fixed private native mesh when compatible; section underlay and diagnosed
 * fallback read the separate private section pack. A scoped original display uses the same
 * canonical preparation as production, without composing unrelated face features or assembling
 * a whole tree. It samples only selected curves on apply and explicitly leaves aggregate deviation
 * not-run. A custom reference crop first needs its original outline bounds. The full-definition
 * route retains all source curves and its selected raw-station deviation table; part=* measures
 * the whole table. Full snapshots retain scope, original failures and displayed artifact identity
 * beyond the image header's length limit. Neither route performs final realization.
 *
 * @param person The person whose inputs build the curves.
 * @param reference Reference id, style, drawn reference pieces and compared-part diagnostic patterns.
 * @returns The subject; its key includes reference crop/style and the diagnostic part scope.
 *
 * @evidence contracts/common.md#principled-implementation Displays unchanged native triangles when compatible, otherwise diagnosed section support. Full-definition measurements and section underlays use the separate pack; scoped originals explicitly leave aggregate measurement not-run. Canonical producer diagnostics remain unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Construction reuse belongs to the one page-owned cache; reference/display work remains request-owned and the diagnostic owner returns rows with selected/support scope. Stage durations and actual work counts qualify the result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no generated part, fitted target, invented native region or hidden success. A scoped display omits neither a requested original failure nor its required parent. Missing required section data propagates; absent/incompatible native data retains the section fallback cause.
 * @evidence contracts/common.md#meaningful-documentation Separates displayed artifact identity/crop from section-based deviation, original source observation and not-run final realization; the image header may truncate provenance, while the page and batch snapshot retain it whole.
 * @evidence contracts/performance.md#efficient-algorithms Scoped native clay reads no section pack or aggregate cuts and samples only newly requested curve ids; canonical preparation remains real work on a miss. Full definitions retain all source curves, segment flattening and selected station cuts/distances. Native bytes and display adaptation remain per-load costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The page cache shares one alias/full-input canonical context across scoped/full/raw observations. Scoped subjects append requested point lists to their existing curve holders; reference/style/part scope changes still create their own display. Final realization is not run.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One latest canonical context belongs to the page cache. Each returned subject owns reference buffers, requested curve arrays, diagnostics and its lazy reader closure until view retirement; this loader itself acquires no GPU resource or texture handle.
 */
export async function loadHumanDebugCompare(
  person: IHumanDebugPerson,
  reference: {
    id: string;
    style: "clay" | "loft";
    parts: string[];
    comparedParts: string[];
  },
): Promise<IHumanDebugSubject> {
  const started: number = performance.now();
  const meshFile: Awaited<
    ReturnType<typeof HumanDebugReferenceMeshFiles>
  > | null =
    reference.style === "clay"
      ? await HumanDebugReferenceMeshFiles(reference.id)
      : null;
  const read: number = performance.now();
  const built: HumanDebugViewParts.IOutput = HUMAN_DEBUG_VIEW_PARTS.get(
    person.alias,
    person.parameters,
    reference.comparedParts,
  );
  const generated: number = performance.now();
  const deferred: boolean = built.observation.stage === "scoped-source-definition";
  const crop: boolean = deferred && reference.parts.some((name: string): boolean => !["*", "body", "head"].includes(name));
  const drawn: ReturnType<typeof HumanDebugViewCurves.of> = deferred && !crop ? { curves: [], legend: [], diagnostics: [], topSources: {} } : HumanDebugViewCurves.of(built, reference.comparedParts, deferred ? { curves: ["view.*"], curveHide: [], views: ["front", "side"], axis: false, kinds: ["section", "axis", "guide", "path"], known: [] } : undefined);
  const sourceDisplay: { calls: number; milliseconds: number; curves: number } = { calls: 0, milliseconds: 0, curves: 0 };
  const curvesDrawn: number = performance.now();
  const keep: ReturnType<typeof HumanDebugReferencePieces> =
    HumanDebugReferencePieces(reference.parts, drawn.curves);
  let native: ReturnType<typeof HumanDebugReferenceMesh> | null = null;
  let referenceDiagnostic: string | null = meshFile?.diagnostic ?? null;
  if (meshFile !== null && meshFile.model !== null)
    try {
      native = HumanDebugReferenceMesh(meshFile.model, keep);
    } catch (error: unknown) {
      referenceDiagnostic =
        "Incompatible native reference: " +
        (error instanceof Error ? error.message : String(error)) +
        "; using section support";
    }
  const packStarted: number = performance.now();
  const pack: IHumanDebugReferencePack | null = deferred && native !== null ? null : await HumanDebugReferenceFiles(reference.id, STEP);
  const packRead: number = performance.now() - packStarted;
  const underlay: ReturnType<typeof HumanDebugReferenceModel.of> =
    native === null
      ? HumanDebugReferenceModel.of(pack!, reference.style, keep)
      : { parts: native.parts, curves: [] };
  const referenceDrawn: number = performance.now();
  const regions: HumanDebugReferenceCut.IRegion[] =
    deferred ? [] : HumanDebugReferenceCut.regions(pack!);
  const flattened: number = performance.now();
  const deviation: HumanDebugViewDeviation.IOutput | null = deferred ? null : HumanDebugViewDeviation.of(
    built,
    regions,
    reference.comparedParts,
  );
  const rows: HumanDebugViewDeviation.IRow[] = deviation?.rows.sort(
    (
      a: HumanDebugViewDeviation.IRow,
      b: HumanDebugViewDeviation.IRow,
    ): number => (b.edge?.max ?? b.touch.max) - (a.edge?.max ?? a.touch.max),
  ) ?? [];
  const measured: number = performance.now();
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
  const round: (n: number) => number = (n: number): number => Math.round(n * 10) / 10;
  return {
    key: {
      person: person.alias,
      piece:
        "reference:" +
        reference.id +
        ":" +
        reference.style +
        ":" +
        reference.parts.join(",") +
        ":view:" +
        reference.comparedParts.join(","),
      pose: null,
    },
    model,
    curves: [...underlay.curves, ...drawn.curves],
    prepareCurves: deferred ? (options: IHumanDebugOptions, known: readonly string[]): (typeof drawn.curves) => {
      const started: number = performance.now();
      const next: ReturnType<typeof HumanDebugViewCurves.of> = HumanDebugViewCurves.of(built, reference.comparedParts, { ...options, known });
      if (next.sourceFailures !== undefined && next.sourceFailures.length !== 0)
        throw new AggregateError(next.sourceFailures.map((failure: HumanDebugViewCurves.ISourceFailure): unknown => failure.error), "Requested original top source failed: " + next.sourceFailures.map((failure: HumanDebugViewCurves.ISourceFailure): string => failure.part + "/" + failure.phase + ": " + (failure.error instanceof Error ? failure.error.stack ?? failure.error.message : String(failure.error))).join("\n"), { cause: next.sourceFailures[0]!.error });
      for (const entry of next.legend) if (!drawn.legend.some((item: typeof entry): boolean => item.label === entry.label)) drawn.legend.push(entry);
      for (const fault of next.diagnostics) if (!drawn.diagnostics.some((item: typeof fault): boolean => item.producer === fault.producer && item.detail === fault.detail && item.contract === fault.contract)) drawn.diagnostics.push(fault);
      Object.assign(drawn.topSources, next.topSources);
      sourceDisplay.calls++;
      sourceDisplay.milliseconds += performance.now() - started;
      sourceDisplay.curves += next.curves.length;
      return next.curves;
    } : undefined,
    textures: null,
    legend: drawn.legend,
    provenance: {
      observation: built.observation,
      sourceAcquisition: built.sourceAcquisition,
      referenceDisplay: {
        representation:
          native === null ? "sampled-section-support" : "native-static-mesh",
        source:
          native === null
            ? ".references/curves/" + reference.id
            : meshFile!.source,
        sha256: native === null ? null : meshFile!.sha256,
        bytes: native === null ? null : meshFile!.bytes,
        attemptedArtifact:
          meshFile === null
            ? null
            : { source: meshFile.source, sha256: meshFile.sha256 },
        nativeRegions: native?.regions ?? null,
        crop: native?.crop ?? "section-edge-exclusion",
        diagnostic: referenceDiagnostic,
        sectionPackRead: pack !== null,
        deviationSource:
          (deferred ? "not-run: " : "") + ".references/curves/" +
          reference.id +
          " sampled sections; independent of displayed native mesh",
      },
      deviationScope: deviation?.scope ?? { status: "not-run", requestedParts: reference.comparedParts, reason: "Scoped original-curve display does not require the complete raw-station aggregate table." },
      // Each row: name, E (largest edge deviation, mean, share of breadth or depth, edge, place along
      // the axis, nearest site), B (mean signed deviation of +u, +v, -u, -v), T (touch distance largest,
      // mean), R (section distance largest, mean), mm; worst first.
      // Compact URL-safe summaries; the cut image header can omit rows, unlike the full snapshot.
      deviation: rows.map((r: HumanDebugViewDeviation.IRow): string =>
        [
          r.name,
          r.edge === null
            ? "E-"
            : [
                "E" + round(r.edge.max),
                round(r.edge.mean),
                round(r.edge.share * 100) + "pc",
                r.edge.edge,
                round(r.edge.at * 100) + "pc",
                r.edge.site.replace(/[^A-Za-z0-9.-]/g, "-"),
              ].join("_"),
          r.bias === null ? "B-" : "B" + r.bias.map(round).join("_"),
          "T" + round(r.touch.max) + "_" + round(r.touch.mean),
          "R" + round(r.ring.max) + "_" + round(r.ring.mean),
        ].join("_"),
      ),
      diagnostics: built.diagnostics,
      sourceRecords: built.sourceRecords,
      sourceCurveDiagnostics: drawn.diagnostics,
      sourceTopProducers: drawn.topSources,
      sourceDisplay,
      curveProducers: {
        outlines: "AutoMovieViewCurves original source in actual axis frame",
        top: "named-knot fullness sections; sourceTopProducers distinguishes returned raw sections from original value/section observation, not complete loft admission",
        finalLoft:
          "ordinary person/piece chain curves, absent from this comparison",
      },
      producer: "HumanDebugViewParts + reference pack",
      person: person.alias,
      reference: reference.id,
      style: reference.style,
      scale: built.scale,
      repeats: built.repeats,
      milliseconds: {
        read: Math.round(read - started + packRead),
        packRead: Math.round(packRead),
        nativeRead: Math.round(read - started),
        generate: Math.round(generated - read),
        sourceCurves: Math.round(curvesDrawn - generated),
        referenceDisplay: Math.round(referenceDrawn - curvesDrawn - packRead),
        referenceSegments: Math.round(flattened - referenceDrawn),
        deviation: Math.round(measured - flattened),
        compare: Math.round(performance.now() - generated),
      },
      // Initial load counts; sourceDisplay records subsequent selected-curve evaluation.
      work: {
        sourceParts: built.parts.length,
        sourceCurves: drawn.curves.length,
        sourceCurvePoints: drawn.curves.reduce(
          (sum: number, curve: (typeof drawn.curves)[number]): number =>
            sum + curve.points.length,
          0,
        ),
        referenceRegions: regions.length,
        referenceSegments: regions.reduce(
          (sum: number, region: HumanDebugReferenceCut.IRegion): number =>
            sum + region.segments.length / 6,
          0,
        ),
        ...(deviation?.work ?? { diagnosticParts: 0, rawStations: 0, measuredStations: 0, cutQueries: 0, distanceQueries: 0, rows: 0 }),
      },
    },
    milliseconds: performance.now() - started,
  };
}
