import type { IAutoMovieViewPart } from "@automovie/engine";
import fs from "node:fs";
import path from "node:path";

import type { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { HumanInspectionClock } from "../inspection/HumanInspectionClock";
import { HumanInspectionCurves } from "../inspection/HumanInspectionCurves";
import { HumanInspectionParts } from "../inspection/HumanInspectionParts";
import type { IHumanInspectionDocument } from "../inspection/IHumanInspectionDocument";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";

/** Original display sampling and stable-slot coverage of the existing Cost invocation. */
export namespace HumanCurveCostSamples {
  /** Borrowed invocation records; this owner creates no original or replacement geometry. */
  export interface IInput {
    /** Existing owned report directory. */
    output: string;

    /** Same actual production invocation used by acquisition and raw demand. */
    context: AutoMovieHumanBodyLaw.IPrepared;

    /** Person millimetres per source calibration millimetre. */
    scale: number;

    /** Actual outer operations; nested sampler events are separate. */
    phases: R.IPhase[];

    /** Shared actual source acquisition rows. */
    parts: Record<string, unknown>[];

    /** Stable display-slot rows, including unavailable results. */
    curves: Record<string, unknown>[];

    /** Original source and observer failures. */
    errors: Record<string, unknown>[];

    /** Actual nested sampler events, without invented cost shares. */
    events: HumanInspectionClock.IEvent[];

    /** Identical acquired original sources by actual name. */
    actual: Map<string, IAutoMovieViewPart>;

    /** Independent studies outside production topology. */
    studyNames: Set<string>;

    /** References to shared producer phases; never additive per curve. */
    definitionRefs: Map<string, string[]>;

    /** Actual materialized IDs used by the final coverage comparison. */
    emittedCurveIds: Set<string>;

    /** Existing report writer, called outside measured source operations. */
    save: () => void;
  }

  /** Samples actual selected originals once, retaining every stable top index and unavailable slot. */
  export function sample(input: IInput, name: string): void {
    const {
      actual,
      parts,
      curves,
      phases,
      context,
      scale,
      output,
      save,
      definitionRefs,
      studyNames,
      events,
      errors,
      emittedCurveIds,
    }: IInput = input;
    const source: IAutoMovieViewPart | undefined = actual.get(name);
    const row: Record<string, unknown> | undefined = parts.find(
      (part: Record<string, unknown>): boolean => part.name === name,
    );
    if (source === undefined) {
      if (row !== undefined)
        row.topInventory =
          "unknown: the current provider returned no actual part/front-positive knots";
      for (const suffix of [
        "front.pos",
        "front.neg",
        "side.pos",
        "side.neg",
        "axis",
      ])
        curves.push({
          part: name,
          id: HumanInspectionCurves.PREFIX + name + "/" + suffix,
          kind: suffix,
          study: /^(globe|fissure)\./.test(name),
          status: "blocked-no-current-source-definition",
          points: 0,
          coordinateSha256: null,
          inclusiveCurveIntervalMilliseconds: null,
          evaluationMilliseconds: null,
          materializationMilliseconds: null,
          topInventory: "unknown",
          sharedDefinitionRefs: definitionRefs.get(name) ?? [],
          sharedCostAccounting:
            "Unavailable provider costs remain on their shared phase; no zero-cost success is claimed.",
        });
      save();
      return;
    }
    const candidates: string[] = [
      "front.pos",
      "front.neg",
      "side.pos",
      "side.neg",
      "axis",
      ...source.front.positive.knots.map(
        (_knot: IAutoMovieViewPart.IKnot, index: number): string =>
          "top." + index,
      ),
    ];
    const local: HumanInspectionClock.IEvent[] = [];
    const sampled: R.Result<ReturnType<typeof HumanInspectionCurves.of>> =
      R.measure(
        phases,
        "sample:" + name,
        "Actual HumanInspectionCurves selected original-only sampler",
        (): ReturnType<typeof HumanInspectionCurves.of> => {
          const observed: HumanInspectionParts.IOutput =
            HumanInspectionParts.scoped(context, [name]);
          const originalOnly: HumanInspectionParts.IOutput = {
            ...observed,
            scale,
            parts: observed.parts.map(
              (
                part: HumanInspectionParts.IPart,
              ): HumanInspectionParts.IPart => ({ ...part, loft: null }),
            ),
          };
          return HumanInspectionCurves.of(
            originalOnly,
            [name],
            undefined,
            (event: Readonly<HumanInspectionClock.IEvent>): void => {
              local.push(event);
              events.push(event);
            },
          );
        },
      );
    if (local.length !== 0)
      fs.appendFileSync(
        path.join(output, "sampler.jsonl"),
        local
          .map((event: HumanInspectionClock.IEvent): string =>
            JSON.stringify(event),
          )
          .join("\n") + "\n",
      );
    if (row !== undefined) {
      row.samplerMilliseconds = sampled.phase.milliseconds;
      row.sharedSamplerMilliseconds = local
        .filter(
          (event: HumanInspectionClock.IEvent): boolean => event.curve === null,
        )
        .reduce(
          (sum: number, event: HumanInspectionClock.IEvent): number =>
            sum + (event.milliseconds ?? 0),
          0,
        );
    }
    if (sampled.ok && sampled.value.timingErrors?.length)
      errors.push({
        stage: "observer",
        part: name,
        errors: sampled.value.timingErrors,
      });
    if (sampled.ok)
      for (const failure of sampled.value.sourceFailures ?? [])
        errors.push({
          stage: "source-preparation",
          part: failure.part,
          phase: failure.phase,
          error: R.message(failure.error),
        });
    if (sampled.ok)
      for (const curve of sampled.value.curves) emittedCurveIds.add(curve.id);
    if (!sampled.ok)
      errors.push({
        stage: "sampler",
        part: name,
        error: R.message(sampled.error),
      });
    for (const suffix of candidates) {
      const id: string = HumanInspectionCurves.PREFIX + name + "/" + suffix;
      const measured: HumanInspectionClock.IEvent[] = local.filter(
        (event: HumanInspectionClock.IEvent): boolean => event.curve === id,
      );
      const curve: IHumanInspectionDocument.ICurve | undefined = sampled.ok
        ? sampled.value.curves.find(
            (value: IHumanInspectionDocument.ICurve): boolean =>
              value.id === id,
          )
        : undefined;
      const sum: (phase: string) => number | null = (
        phase: string,
      ): number | null => {
        const values: HumanInspectionClock.IEvent[] = measured.filter(
          (event: HumanInspectionClock.IEvent): boolean =>
            event.phase === phase && event.milliseconds !== null,
        );
        return values.length === 0
          ? null
          : values.reduce(
              (value: number, event: HumanInspectionClock.IEvent): number =>
                value + (event.milliseconds ?? 0),
              0,
            );
      };
      const materialized: HumanInspectionClock.IEvent | undefined =
        measured.find(
          (event: HumanInspectionClock.IEvent): boolean =>
            event.phase === "point-materialization",
        );
      curves.push({
        part: name,
        id,
        kind: suffix,
        study: studyNames.has(name),
        status:
          curve !== undefined
            ? "materialized"
            : measured.some(
                  (event: HumanInspectionClock.IEvent): boolean =>
                    event.phase === "blocked-by-top-source",
                )
              ? "blocked-by-top-source-preparation"
              : measured.some(
                    (event: HumanInspectionClock.IEvent): boolean =>
                      event.phase === "outside-physical-domain",
                  )
                ? "outside-physical-domain"
                : measured.some(
                      (event: HumanInspectionClock.IEvent): boolean =>
                        event.status === "pole",
                    )
                  ? "pole-no-ring"
                  : measured.some(
                        (event: HumanInspectionClock.IEvent): boolean =>
                          event.status === "failed",
                      )
                    ? "evaluation-failed"
                    : sampled.ok
                      ? "unavailable"
                      : "blocked-by-sampler-exception",
        points: curve?.points.length ?? 0,
        coordinateSha256:
          curve === undefined ? null : R.hash(JSON.stringify(curve.points)),
        closed: curve?.closed ?? null,
        coordinateHashBoundary:
          "Already materialized metre coordinates only; no additional source evaluation",
        inclusiveCurveIntervalMilliseconds: sum("curve-interval"),
        evaluationMilliseconds: sum("evaluation"),
        sectionEvaluationAndAxisMilliseconds: sum(
          "section-evaluation-and-axis",
        ),
        radiusEvaluationMilliseconds: sum("radius-evaluation"),
        materializationMilliseconds: sum("point-materialization"),
        displayStationMilliseconds: sum("display-stations"),
        successfulAxisReadsLowerBound:
          suffix === "axis" ||
          suffix.startsWith("front.") ||
          suffix.startsWith("side.")
            ? (materialized?.samples ?? 0)
            : 0,
        withheldPartialPoints:
          curve === undefined ? (materialized?.samples ?? 0) : 0,
        evaluationBoundary:
          "Edge evaluation includes the actual scalar jet and source axis callback; axis rows measure the actual axis alone. Top section evaluation includes original values, section admission/integration and its frame; radius and display point creation are separate.",
        sharedDefinitionRefs: definitionRefs.get(name) ?? [],
        sharedCostAccounting:
          "References only; never divide a joint factory cost or add it per curve",
        sharedSamplerRef: "sample:" + name,
        diagnostics: sampled.ok ? sampled.value.diagnostics : [],
        observerEventCount: measured.length,
      });
    }
    save();
  }

  /** Compare actual declared slots with this invocation's observations, preserving unknown inventories. */
  export function coverage(input: IInput): Record<string, unknown> {
    const { actual, curves, emittedCurveIds, parts }: IInput = input;
    const expectedSlots: string[] = [...actual].flatMap(
      ([name, source]: [string, IAutoMovieViewPart]): string[] =>
        [
          "front.pos",
          "front.neg",
          "side.pos",
          "side.neg",
          "axis",
          ...source.front.positive.knots.map(
            (_knot: IAutoMovieViewPart.IKnot, index: number): string =>
              "top." + index,
          ),
        ].map(
          (suffix: string): string =>
            HumanInspectionCurves.PREFIX + name + "/" + suffix,
        ),
    );
    const rowIds: Set<string> = new Set(
      curves.map((row: Record<string, unknown>): string => String(row.id)),
    );
    return {
      expectedSlotsForActualSources: expectedSlots.length,
      recordedSlots: curves.length,
      missingKnownSlots: expectedSlots.filter(
        (id: string): boolean => !rowIds.has(id),
      ),
      duplicateSlotRows: curves.length - rowIds.size,
      materializedIdsWithoutRow: [...emittedCurveIds].filter(
        (id: string): boolean => !rowIds.has(id),
      ),
      unavailablePartsWithUnknownSlots: parts
        .filter(
          (row: Record<string, unknown>): boolean =>
            !actual.has(String(row.name)),
        )
        .map((row: Record<string, unknown>): unknown => ({
          name: row.name,
          definitionStatus: row.definitionStatus,
        })),
      meaning:
        "Every actual original's four edge slots, axis and stable front-positive top indices is recorded, including poles/failures. An unavailable definition has unknown knot inventory, not zero successful curves.",
    };
  }
}
