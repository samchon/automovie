import { HUMAN_INSPECTION_PARTS } from "../inspection/HUMAN_INSPECTION_PARTS";
import { HumanInspectionCurves } from "../inspection/HumanInspectionCurves";
import type { HumanInspectionParts } from "../inspection/HumanInspectionParts";
import { HumanInspectionSourceParts } from "../inspection/HumanInspectionSourceParts";
import type { IHumanInspectionDocument } from "../inspection/IHumanInspectionDocument";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanNodeInput } from "./HumanNodeInput";
import type { NodeCanvasInventoryTypes as T } from "./NodeCanvasInventoryTypes";
import { NodeCanvasPairInput as P } from "./NodeCanvasPairInput";
import { NodeCanvasPairs as Q } from "./NodeCanvasPairs";
import { NodeCanvasSourceDisplay as D } from "./NodeCanvasSourceDisplay";

/** Exact receipt selection activates only requested tops and raw-clay producers in one retained context. */
export async function NodeCanvasComparison(
  session: N.Session,
  pairsPath: string,
): Promise<T.IOutcome> {
  const input: T.PairSet = await P.read(session, pairsPath);
  const names: string[] = [
    ...new Set(input.rows.flatMap((row: T.Pair): string[] => row.names)),
  ].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  const rawNames: string[] = [
    ...new Set(
      input.rows
        .filter((row: T.Pair): boolean => row.stage === "raw-clay")
        .flatMap((row: T.Pair): string[] => row.names),
    ),
  ].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  const requestedIds: string[] = [
    ...new Set(
      input.rows
        .filter((row: T.Pair): boolean => row.stage === "original")
        .flatMap((row: T.Pair): string[] => row.ids),
    ),
  ];
  const originals: IHumanInspectionDocument.ICurve[] = [];
  const raws: Map<string, T.Raw> = new Map();
  const failures: { name: string; error: string }[] = [];
  const rawPhases: {
    name: string;
    producerMilliseconds: number;
    adaptationMilliseconds: number;
    status: string;
    error?: string;
  }[] = [];
  let displayDiagnostics: number = 0;
  let failedSources: number = 0;
  const facts: Record<string, unknown> = {
    names,
    rawNames,
    requestedIds,
    failures,
    rawPhases,
    policy:
      "Receipt selection is validated first. Original rows request no raw loft; only actual selected top IDs may demand full C. Crop support uses the same four original edges. Failed raw suppliers are not retried by another camera.",
  };
  session.details.comparisonSource = facts;
  if (names.length !== 0) {
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> =
      await HumanNodeInput.of();
    const started: number = performance.now();
    const built: HumanInspectionParts.IOutput = HUMAN_INSPECTION_PARTS.get(
      "f1",
      person.parameters,
      names,
    );
    const generated: number = performance.now();
    const originalNames: string[] = [
      ...new Set(
        input.rows
          .filter((row: T.Pair): boolean => row.stage === "original")
          .flatMap((row: T.Pair): string[] => row.names),
      ),
    ];
    const selection: string[] = [
      ...requestedIds,
      ...originalNames.flatMap((name: string): string[] =>
        ["front.*", "side.*"].map(
          (suffix: string): string =>
            HumanInspectionCurves.PREFIX + name + "/" + suffix,
        ),
      ),
    ];
    const drawn: ReturnType<typeof HumanInspectionCurves.of> | null =
      originalNames.length === 0
        ? null
        : HumanInspectionCurves.of(built, originalNames, {
            curves: selection,
            curveHide: [],
            views: ["front", "side", "top"],
            axis: true,
            kinds: ["section", "axis", "guide", "path"],
            known: [],
          });
    if (drawn !== null) originals.push(...drawn.curves);
    const displayed: number = performance.now();
    displayDiagnostics = drawn?.diagnostics.length ?? 0;
    failedSources = drawn?.sourceFailures?.length ?? 0;
    for (const name of rawNames) {
      const rawStarted: number = performance.now();
      let generatedAt: number | null = null;
      try {
        const document: IHumanInspectionDocument =
          HumanInspectionSourceParts.build(person, name);
        generatedAt = performance.now();
        const raw: T.Raw = D.adapt(document);
        raws.set(name, raw);
        rawPhases.push({
          name,
          producerMilliseconds: generatedAt - rawStarted,
          adaptationMilliseconds: performance.now() - generatedAt,
          status: raw.issues.length === 0 ? "available" : "available-partial",
          ...(raw.issues.length === 0 ? {} : { error: raw.issues.join("\n") }),
        });
      } catch (error: unknown) {
        const ended: number = performance.now();
        failures.push({ name, error: R.message(error) });
        rawPhases.push({
          name,
          producerMilliseconds: (generatedAt ?? ended) - rawStarted,
          adaptationMilliseconds:
            generatedAt === null ? 0 : ended - generatedAt,
          status: generatedAt === null ? "producer-threw" : "adapter-threw",
          error: R.message(error),
        });
      }
    }
    session.details.comparisonSource = {
      ...facts,
      parameters: person.parameters,
      runtimeInputSha256: R.hash(JSON.stringify(person.parameters)),
      observation: built.observation,
      diagnostics: built.diagnostics,
      sourceRecords: built.sourceRecords,
      displayDiagnostics: drawn?.diagnostics ?? [],
      sourceFailures: drawn === null ? [] : D.sourceFailures(drawn),
      topSources: drawn?.topSources ?? {},
      requestedIds,
      cropGuideSelection: selection,
      rawProducers: [...raws].map(([name, raw]: [string, T.Raw]): unknown => ({
        name,
        provenance: raw.provenance,
        issues: raw.issues,
      })),
      milliseconds: {
        originalGeneration: generated - started,
        originalDisplay: displayed - generated,
        rawAndAdaptation: performance.now() - displayed,
        acquisition: built.sourceAcquisition,
      },
    };
  }
  await Q.render(session, input, originals, raws);
  const counts: Record<string, number> = {
    ...Q.counts(input),
    rawRequested: rawNames.length,
    rawAvailable: raws.size,
    rawFailures: failures.length,
    rawPartial: [...raws.values()].filter(
      (raw: T.Raw): boolean => raw.issues.length !== 0,
    ).length,
    displayDiagnostics,
    sourceFailures: failedSources,
  };
  const outcome: T.IOutcome = {
    status:
      counts.pairRendered === 0
        ? "failed"
        : counts.pairUnavailable! +
              counts.pairInputFailures! +
              counts.pairDisplayDifferences! +
              counts.rawPartial! +
              failures.length +
              displayDiagnostics +
              failedSources !==
            0
          ? "partial"
          : "complete",
    counts,
    accounting:
      "Requested receipt rows, source diagnostics and raw producer calls are distinct overlapping domains. Only complete means every requested row rendered without a known source failure; it does not establish appearance parity.",
  };
  session.details.comparisonOutcome = outcome;
  await session.save();
  return outcome;
}
