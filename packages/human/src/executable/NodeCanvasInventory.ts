import { HUMAN_INSPECTION_PARTS } from "../inspection/HUMAN_INSPECTION_PARTS";
import { HumanFullOriginalObservation } from "../inspection/HumanFullOriginalObservation";
import { HumanInspectionCurves } from "../inspection/HumanInspectionCurves";
import type { HumanInspectionParts } from "../inspection/HumanInspectionParts";
import { HumanInspectionSourceParts } from "../inspection/HumanInspectionSourceParts";
import type { HumanTorsoObservation } from "../inspection/HumanTorsoObservation";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanNodeInput } from "./HumanNodeInput";
import { NodeCanvasComparison } from "./NodeCanvasComparison";
import type { NodeCanvasInventoryTypes as T } from "./NodeCanvasInventoryTypes";
import { NodeCanvasOriginals } from "./NodeCanvasOriginals";
import { NodeCanvasPairInput as P } from "./NodeCanvasPairInput";
import { NodeCanvasPairs as Q } from "./NodeCanvasPairs";
import { NodeCanvasSourceDisplay as D } from "./NodeCanvasSourceDisplay";

/** Actual source and raw inventory; partial captures do not imply final skin or appearance acceptance. */
export namespace NodeCanvasInventory {
  /** Completion facts retained at the existing public executable consumer boundary. */
  export type IOutcome = T.IOutcome;
  /** The existing exact-receipt subset entry, using the same retained production context per request. */
  export const compare: typeof NodeCanvasComparison = NodeCanvasComparison;
  /** Observes actual originals serially; original-only excludes superseded trunk contributors and never requests raw producers. */
  export async function run(
    session: N.Session,
    pairsPath?: string,
    originalOnly: boolean = false,
    initial?: HumanTorsoObservation.IOutput,
  ): Promise<T.IOutcome> {
    if (originalOnly && pairsPath !== undefined)
      throw new Error(
        "Original-only inventory does not accept a raw-capable comparison packet",
      );
    const inputStarted: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> =
      await HumanNodeInput.of();
    session.details.inputLoadMilliseconds = performance.now() - inputStarted;
    const observations: HumanInspectionParts.IOutput[] = [];
    const failures: { scope: string; error: string }[] = [];
    const captureFailures: { scope: string; stage: string; error: string }[] =
      [];
    const acquisition: {
      scope: string;
      milliseconds: number;
      metadata: unknown;
    }[] = [];
    let torso: HumanFullOriginalObservation.IOutput | null = null;
    if (originalOnly) {
      try {
        const base: HumanTorsoObservation.IOutput =
          initial ?? await D.first(session, person, true);
        torso = HumanFullOriginalObservation.create(person.parameters, base);
      } catch (error: unknown) {
        failures.push({ scope: "S00", error: R.message(error) });
      }
    }
    const torsoCurves: N.Curve[] =
      torso === null
        ? []
        : [
            ...new Map(
              torso.selections.flatMap(
                (
                  selection: HumanTorsoObservation.ISelection,
                ): [string, N.Curve][] =>
                  selection.curves.map((curve: N.Curve): [string, N.Curve] => [
                    curve.id,
                    curve,
                  ]),
              ),
            ).values(),
          ];
    if (torso !== null)
      session.details.composedOriginal = {
        name: "S00",
        provenance: torso.provenance,
        diagnostics: torso.diagnostics,
        curveIds: torsoCurves.map((curve: N.Curve): string => curve.id),
        plannedComposedUnavailable: ["S01", "S04", "S05", "S08", "S09"],
        meaning:
          "One actual composed original; remaining legacy source pieces are contributors, not five completed new composed sources.",
      };
    for (const patterns of [
      [
        ...(originalOnly ? [] : ["trunk", "breast.*", "gluteal.*"]),
        "leg.*",
        "arm.*",
        "foot.*",
        "thumb.*",
        "finger.*",
        "toe.*",
      ],
      ["head.mass"],
      ["head.*"],
    ]) {
      const started: number = performance.now();
      try {
        const observed: HumanInspectionParts.IOutput =
          HUMAN_INSPECTION_PARTS.get("f1", person.parameters, patterns);
        observations.push(observed);
        acquisition.push({
          scope: patterns.join(","),
          milliseconds: performance.now() - started,
          metadata: observed.sourceAcquisition,
        });
      } catch (error: unknown) {
        failures.push({ scope: patterns.join(","), error: R.message(error) });
      }
    }
    if (observations.length === 0)
      throw new Error(
        "Every actual source provider refused: " + JSON.stringify(failures),
      );
    const built: HumanInspectionParts.IOutput = D.combine(observations);
    const displayStarted: number = performance.now();
    const drawn: ReturnType<typeof HumanInspectionCurves.of> =
      HumanInspectionCurves.of(built);
    const names: string[] = [
      ...new Set([
        ...built.sourceRecords.map(
          (
            record: HumanInspectionParts.IOutput["sourceRecords"][number],
          ): string => record.name,
        ),
        ...built.parts.map(
          (part: HumanInspectionParts.IPart): string => part.name,
        ),
        ...built.observation.unavailableParts,
      ]),
    ].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
    const targets: {
      name: string;
      original: string;
      raw: string;
      curves: string[];
      errors: string[];
      provenance?: Record<string, unknown>;
    }[] = names.map((name: string): (typeof targets)[number] => ({
      name,
      original: built.parts.some(
        (part: HumanInspectionParts.IPart): boolean => part.name === name,
      )
        ? "available"
        : "producer-refused-or-unavailable",
      raw: "not-requested",
      curves: drawn.curves
        .filter((curve: N.Curve): boolean => D.owns(curve, [name]))
        .map((curve: N.Curve): string => curve.id),
      errors: [],
    }));
    const allCurves: N.Curve[] = [...drawn.curves, ...torsoCurves];
    session.details.inventory = {
      policy:
        "Actual body metadata plus regional head sources; studies remain distinct and no final tree is implied",
      finalRealization: "not-run",
      rawRequested: !originalOnly,
      originalOnly,
      displayLineCount: allCurves.length,
      originalConstructorCalls:
        "unmeasured; display lines and source records are not constructor calls",
      curveInventory: allCurves.map(
        (curve: N.Curve): { id: string; role: string } => ({
          id: curve.id,
          role: /\/top\.[0-9]+$/.test(curve.id)
            ? "evaluated-original-section"
            : /\/axis$/.test(curve.id)
              ? "source-axis"
              : /\/(front|side)\.(pos|neg)$/.test(curve.id)
                ? "scalar-outline"
                : curve.id.includes("/S00.outer.q")
                  ? "composed-original-section-piece"
                  : "producer-original-guide-locus-or-datum; see producer provenance",
        }),
      ),
      acquisition,
      displayMilliseconds: performance.now() - displayStarted,
      targets,
      providerFailures: failures,
      captureFailures,
      observations: observations.map(
        (value: HumanInspectionParts.IOutput): unknown => value.observation,
      ),
      sourceRecords: built.sourceRecords,
      authoredDefinitions: D.definitions(built),
      diagnostics: built.diagnostics,
      displayDiagnostics: drawn.diagnostics,
      sourceFailures: D.sourceFailures(drawn),
      topSources: drawn.topSources,
      input: {
        parameters: person.parameters,
        runtimeSha256: R.hash(JSON.stringify(person.parameters)),
      },
    };
    const wholePoints: N.Point[] = D.points(allCurves);
    if (wholePoints.length !== 0)
      for (const name of NodeCanvasCamera.names())
        await attempt(
          "all-observed-originals",
          "original-all",
          async (): Promise<void> =>
            session.capture(
              "all-observed-originals",
              "original-all",
              {
                ...NodeCanvasCamera.fit(name, wholePoints),
                ...(originalOnly ? { annotations: false } : {}),
              },
              session.referenceMeshes,
              allCurves,
              "xray",
            ),
        );
    const raws: Map<string, T.Raw> = new Map();
    if (torso !== null) {
      captureFailures.push(
        ...(await NodeCanvasOriginals(
          session,
          "S00-and-arm-port-candidates",
          torsoCurves,
          session.referenceMeshes,
          true,
        )),
      );
      for (const selection of torso.selections.filter(
        (selection: HumanTorsoObservation.ISelection): boolean =>
          selection.id !== "S00.all-originals" && selection.curves.length > 1,
      ))
        for (const camera of selection.cameras)
          await attempt(
            selection.id,
            "original-composed-neighbours",
            (): Promise<void> =>
              session.capture(
                selection.id,
                "original-composed-neighbours",
                camera,
                session.referenceMeshes,
                selection.curves,
                "xray",
              ),
          );
    }
    for (const target of targets) {
      const originals: N.Curve[] = drawn.curves.filter(
        (curve: N.Curve): boolean => D.owns(curve, [target.name]),
      );
      const framePoints: N.Point[] = D.points(originals);
      let reference: N.Mesh[] = [];
      if (framePoints.length === 0)
        target.original = "no-available-display-curves";
      else
        await attempt(target.name, "original-part", async (): Promise<void> => {
          reference = D.crop(session, [target.name], drawn.curves);
          captureFailures.push(
            ...(await NodeCanvasOriginals(
              session,
              target.name,
              originals,
              reference,
              originalOnly,
            )),
          );
        });
      if (originalOnly) {
        await session.save();
        continue;
      }
      try {
        const raw: T.Raw = D.adapt(
          HumanInspectionSourceParts.build(person, target.name),
        );
        raws.set(target.name, raw);
        target.raw =
          raw.issues.length === 0
            ? "available-prejoin-operand"
            : "available-partial-prejoin-operand";
        target.errors.push(...raw.issues);
        target.provenance = raw.provenance;
        const rawFrame: N.Point[] =
          framePoints.length === 0 ? D.points(raw.curves) : framePoints;
        await attempt(
          target.name,
          "raw-display",
          async (): Promise<void> =>
            D.passes(session, target.name, raw, rawFrame, reference, [
              "front",
              "left",
              "top",
            ]),
        );
      } catch (error: unknown) {
        target.raw = "producer-or-adapter-refused";
        target.errors.push(R.message(error));
      }
      await session.save();
    }
    for (const group of D.neighbours(originalOnly, names, observations))
      await attempt(group.name, "neighbours", async (): Promise<void> => {
        const originals: N.Curve[] = drawn.curves.filter(
          (curve: N.Curve): boolean => D.owns(curve, group.names),
        );
        if (group.names.includes("S00")) originals.push(...torsoCurves);
        if (originals.length === 0)
          throw new Error("No available original curves");
        const framePoints: N.Point[] = D.points(originals);
        const reference: N.Mesh[] = group.names.includes("S00")
          ? session.referenceMeshes
          : D.crop(session, group.names, drawn.curves);
        for (const name of NodeCanvasCamera.names())
          await session.capture(
            group.name,
            "original-neighbours",
            {
              ...NodeCanvasCamera.fit(name, framePoints),
              ...(originalOnly ? { annotations: false } : {}),
            },
            reference,
            originals,
            "xray",
          );
        const available: T.Raw[] = group.names.flatMap(
          (name: string): T.Raw[] => (raws.has(name) ? [raws.get(name)!] : []),
        );
        if (available.length !== 0)
          await D.passes(
            session,
            group.name +
              (available.length === group.names.length
                ? ""
                : ".available-subset"),
            D.merge(available),
            framePoints,
            reference,
            NodeCanvasCamera.names(),
          );
      });
    if (raws.size !== 0)
      await attempt(
        "all-available-raw-operands",
        "raw-display",
        async (): Promise<void> =>
          D.passes(
            session,
            "all-available-raw-operands",
            D.merge([...raws.values()]),
            wholePoints.length === 0
              ? D.points(D.merge([...raws.values()]).curves)
              : wholePoints,
            session.referenceMeshes,
            NodeCanvasCamera.names(),
          ),
      );
    const compared: T.PairSet | undefined =
      pairsPath === undefined ? undefined : await P.read(session, pairsPath);
    if (compared !== undefined)
      await Q.render(session, compared, drawn.curves, raws);
    const counts: Record<string, number> = {
      targets: targets.length,
      composedOriginals: torso === null ? 0 : 1,
      composedOriginalFailures: torso?.diagnostics.length ?? 0,
      unprovidedComposedSources: originalOnly ? (torso === null ? 6 : 5) : 0,
      originalAvailable: targets.filter(
        (target: (typeof targets)[number]): boolean =>
          target.original === "available" && target.curves.length !== 0,
      ).length,
      rawAvailable: raws.size,
      rawPartial: [...raws.values()].filter(
        (raw: T.Raw): boolean => raw.issues.length !== 0,
      ).length,
      rawRefused: targets.filter(
        (target: (typeof targets)[number]): boolean =>
          target.raw === "producer-or-adapter-refused",
      ).length,
      originalUnavailable: targets.filter(
        (target: (typeof targets)[number]): boolean =>
          target.original !== "available",
      ).length,
      providerFailures: failures.length,
      displayDiagnostics: drawn.diagnostics.length,
      sourceFailures: drawn.sourceFailures?.length ?? 0,
      captureFailures: captureFailures.length,
      ...Q.counts(compared),
    };
    const incomplete: boolean =
      counts.rawPartial! +
        counts.composedOriginalFailures! +
        counts.unprovidedComposedSources! +
        counts.rawRefused! +
        counts.originalUnavailable! +
        counts.providerFailures! +
        counts.displayDiagnostics! +
        counts.sourceFailures! +
        counts.captureFailures! +
        (counts.pairUnavailable ?? 0) +
        (counts.pairInputFailures ?? 0) +
        (counts.pairDisplayDifferences ?? 0) !==
      0;
    const outcome: T.IOutcome = {
      status:
        raws.size === 0 && drawn.curves.length === 0
          ? "failed"
          : incomplete
            ? "partial"
            : "complete",
      counts,
      accounting: originalOnly
        ? "Actual original IDs are observed individually, with neighbours and whole; S00 is composed and other old sources remain explicit contributors. Raw/final are not requested and missing new composed sources remain partial. Display curves are not independent constructors."
        : "Full inventory requests originals and one raw producer per target. Count domains overlap and are not a failure sum; reference PNGs do not make refused sources successful. Available raw subsets are labelled; final realization is not run.",
    };
    session.details.inventoryCounts = outcome;
    await session.save();
    return outcome;

    /** Preserve completed captures and the actual failing stage without rerunning a producer. */
    async function attempt(
      scope: string,
      stage: string,
      action: () => Promise<void>,
    ): Promise<void> {
      try {
        await action();
      } catch (error: unknown) {
        captureFailures.push({ scope, stage, error: R.message(error) });
      }
    }
  }
}
