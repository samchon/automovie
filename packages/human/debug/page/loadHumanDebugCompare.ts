import type { IAutoMovieModel } from "@automovie/interface";

import { HumanDebugReferenceCut } from "../compare/HumanDebugReferenceCut";
import { HumanDebugReferenceMesh } from "../compare/HumanDebugReferenceMesh";
import { HumanDebugReferenceModel } from "../compare/HumanDebugReferenceModel";
import { HumanDebugReferencePieces } from "../compare/HumanDebugReferencePieces";
import { HumanDebugViewCurves } from "../compare/HumanDebugViewCurves";
import { HumanDebugViewDeviation } from "../compare/HumanDebugViewDeviation";
import { HumanDebugViewParts } from "../compare/HumanDebugViewParts";
import { HumanDebugViewPartsCache } from "../compare/HumanDebugViewPartsCache";
import type { IHumanDebugReferencePack } from "../contracts/IHumanDebugReferencePack";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";
import { HumanDebugReferenceFiles } from "./HumanDebugReferenceFiles";
import { HumanDebugReferenceMeshFiles } from "./HumanDebugReferenceMeshFiles";
import type { IHumanDebugSubject } from "./IHumanDebugSubject";

/** Height between the reference sections the comparison keeps, mm. */
const STEP: number = 1;

/** One loaded page retains only the latest person's comparison construction. */
const VIEW_PARTS: HumanDebugViewPartsCache = new HumanDebugViewPartsCache();

/**
 * Load the view comparison: one reference person from the private pack as the underlay, and over
 * it the view curves of every part the current source builds from one person's inputs.
 *
 * The pack is read from the checkout's private `.references` at run time (`HumanDebugReferenceFiles`).
 * The parts are `HumanDebugViewParts` of the person, their curves `HumanDebugViewCurves` with one
 * colour per part. Clay adopts the fixed native static mesh when available, with an explicit
 * section-wall fallback; loft style keeps section curves. The existing `part` selection
 * bounds diagnostic station work, while `part=*` retains the complete source table. Each selected part's
 * deviation from the reference cut by its own planes (`HumanDebugViewDeviation`) goes to the
 * provenance, worst first, after observation/source/scope metadata. The image header can truncate
 * that record; the batch snapshot retains the complete table and diagnostics.
 *
 * @param person The person whose inputs build the curves.
 * @param reference Reference id, style, drawn reference pieces and compared-part diagnostic patterns.
 * @returns The subject; its key includes reference crop/style and the diagnostic part scope.
 *
 * @evidence contracts/common.md#principled-implementation Displays unchanged native f1 triangles when compatible, otherwise diagnosed section support; measurements still use the separate sampled section pack. The real producer's source diagnostics pass through unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Construction reuse belongs to the one page-owned cache; reference/display work remains request-owned and the diagnostic owner returns rows with selected/support scope. Stage durations and actual work counts qualify the result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no generated part, fitted reference target, invented native region or diagnostic exemption. Missing section data still fails before construction acquisition; an absent/incompatible native artifact preserves section display with its cause.
 * @evidence contracts/common.md#meaningful-documentation Separates displayed artifact identity/crop from section-based deviation, original source observation and not-run final realization; the image header may truncate provenance, while the page and batch snapshot retain it whole.
 * @evidence contracts/performance.md#efficient-algorithms A miss assembles all production source definitions without final joins. Every load still reads reference bytes, prepares all source curves and flattens reference segments; only selected raw stations run diagnostic cuts and 52 distances per supported station. A cache hit is not a constant-time load.
 * @evidence contracts/performance.md#reuse-equivalent-work Only raw source definitions with the same alias/full input and loaded source are shared. Reference bytes, crop, style, source curves and diagnostic rows are evaluated on every load. Final realization is not run here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module owns one bounded latest raw construction; each returned subject owns its reference mesh, curve and provenance arrays until the view is disposed. This loader creates no GPU resources or texture handle.
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
  const pack: IHumanDebugReferencePack = await HumanDebugReferenceFiles(
    reference.id,
    STEP,
  );
  const packRead: number = performance.now();
  const meshFile: Awaited<
    ReturnType<typeof HumanDebugReferenceMeshFiles>
  > | null =
    reference.style === "clay"
      ? await HumanDebugReferenceMeshFiles(reference.id)
      : null;
  const read: number = performance.now();
  const built: HumanDebugViewParts.IOutput = VIEW_PARTS.get(
    person.alias,
    person.parameters,
  );
  const generated: number = performance.now();
  const drawn: ReturnType<typeof HumanDebugViewCurves.of> =
    HumanDebugViewCurves.of(built);
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
  const underlay: ReturnType<typeof HumanDebugReferenceModel.of> =
    native === null
      ? HumanDebugReferenceModel.of(pack, reference.style, keep)
      : { parts: native.parts, curves: [] };
  const referenceDrawn: number = performance.now();
  const regions: HumanDebugReferenceCut.IRegion[] =
    HumanDebugReferenceCut.regions(pack);
  const flattened: number = performance.now();
  const deviation: HumanDebugViewDeviation.IOutput = HumanDebugViewDeviation.of(
    built,
    regions,
    reference.comparedParts,
  );
  const rows: HumanDebugViewDeviation.IRow[] = deviation.rows.sort(
    (
      a: HumanDebugViewDeviation.IRow,
      b: HumanDebugViewDeviation.IRow,
    ): number => (b.edge?.max ?? b.touch.max) - (a.edge?.max ?? a.touch.max),
  );
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
  const round = (n: number): number => Math.round(n * 10) / 10;
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
    textures: null,
    legend: drawn.legend,
    provenance: {
      observation: built.observation,
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
        deviationSource:
          ".references/curves/" +
          reference.id +
          " sampled sections; independent of displayed native mesh",
      },
      deviationScope: deviation.scope,
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
      curveProducers: {
        outlines: "AutoMovieViewCurves original source in actual axis frame",
        top: "raw admitted fullness sections at front-positive knot indices",
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
        read: Math.round(read - started),
        packRead: Math.round(packRead - started),
        nativeRead: Math.round(read - packRead),
        generate: Math.round(generated - read),
        sourceCurves: Math.round(curvesDrawn - generated),
        referenceDisplay: Math.round(referenceDrawn - curvesDrawn),
        referenceSegments: Math.round(flattened - referenceDrawn),
        deviation: Math.round(measured - flattened),
        compare: Math.round(performance.now() - generated),
      },
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
        ...deviation.work,
      },
    },
    milliseconds: performance.now() - started,
  };
}
