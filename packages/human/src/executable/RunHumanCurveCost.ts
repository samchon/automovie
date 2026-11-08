import type { IAutoMovieViewPart } from "@automovie/engine";
import fs from "node:fs";
import path from "node:path";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { HumanInspectionClock } from "../inspection/HumanInspectionClock";
import { HumanInspectionParts } from "../inspection/HumanInspectionParts";
import type { IHumanInspectionPerson } from "../inspection/IHumanInspectionPerson";
import { HumanCurveCostBodies } from "./HumanCurveCostBodies";
import { HumanCurveCostRaw } from "./HumanCurveCostRaw";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanCurveCostSamples } from "./HumanCurveCostSamples";
import { HumanCurveCpuProfile } from "./HumanCurveCpuProfile";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";

/** Entry clock after static imports, separate from the external shell/ttsx sidecar. */
const PROGRAM_STARTED: string = new Date().toISOString();

/**
 * Measures every actual f1 original and its original-only selected sampler before named raw lofts.
 * One production context is shared. Joint factories stay joint costs; no curve receives an invented
 * share and no selected curve starts another whole person. There is no renderer, reference/model
 * file, whole calibration, scene, browser or Canvas here. Raw means the native coefficient chain,
 * separately requested after all original sampling; surface tessellation and final joins are not run.
 */
export async function RunHumanCurveCost(
  argv: readonly string[],
  entry: {
    /** UTC at the minimal entry before production imports. */ startedUtc: string;
    /** Wall milliseconds for runtime loader and production import/evaluation, including any deferred transformation. */ importMilliseconds: number;
  },
): Promise<void> {
  const profileRequested: boolean = argv.includes("--cpu-profile");
  const args: string[] = argv.filter(
    (value: string): boolean => value !== "--cpu-profile",
  );
  if (
    !(
      args.length === 0 ||
      (args.length === 2 && args[0] === "--out" && args[1] !== undefined)
    ) ||
    argv.filter((value: string): boolean => value === "--cpu-profile").length >
      1
  )
    throw new Error(
      "Usage: pnpm --dir packages/human node:curve-cost [--cpu-profile] [--out <owned-output-directory>]",
    );
  const task: string = fs.realpathSync(
    HumanNodePaths.resolve("packages/human/.shots/node_canvas_xhigh"),
  );
  const output: string = path.resolve(
    args[1] ??
      path.join(task, "curves-" + PROGRAM_STARTED.replaceAll(/[:.]/g, "-")),
  );
  if (!output.startsWith(task + path.sep))
    throw new Error(
      "Output must remain under the existing owned ignored directory",
    );
  fs.mkdirSync(output, { recursive: true });
  const started: number = performance.now();
  const before: Record<string, string> = R.sources();
  const phases: R.IPhase[] = [];
  const parts: Record<string, unknown>[] = [];
  const curves: Record<string, unknown>[] = [];
  const errors: Record<string, unknown>[] = [];
  const events: HumanInspectionClock.IEvent[] = [];
  const actual: Map<string, IAutoMovieViewPart> = new Map();
  const bodyNames: Set<string> = new Set();
  const studyNames: Set<string> = new Set();
  const definitionRefs: Map<string, string[]> = new Map();
  const emittedCurveIds: Set<string> = new Set();
  const report: Record<string, unknown> = {
    status: "running",
    programStartedUtc: PROGRAM_STARTED,
    entry,
    importBoundary:
      "Entry importMilliseconds includes runtime loader/deferred preparation and production static imports/evaluation; it is outside source phases",
    output,
    node: process.version,
    method:
      "One actual production context; ordered first explicit reads and retained reads, not independent cold rebuilds. Original top sampling precedes raw requests and consumes original fullness, never cached raw sections.",
    readReferenceModel: false,
    renderer: "none",
    wholeCalibration: "not-run",
    finalRealization: "not-run",
    phases,
    parts,
    curves,
    errors,
    samplerEvents: events,
    sourceBefore: before,
  };
  report.compilerConfigsBefore = R.configs();
  const save: () => void = (): void =>
    R.save(output, report, phases, parts, curves);
  process.stdout.write(
    JSON.stringify({ event: "program-start", utc: PROGRAM_STARTED, output }) +
      "\n",
  );
  let profiler: HumanCurveCpuProfile.IHandle | null = null;
  if (profileRequested) {
    try {
      profiler = await HumanCurveCpuProfile.start(
        path.join(output, "cpu.cpuprofile"),
      );
    } catch (error: unknown) {
      errors.push({ stage: "cpu-profile-start", error: R.message(error) });
    }
  }
  try {
    const person: IHumanInspectionPerson = await HumanNodeInput.of();
    report.input = {
      person: person.alias,
      typedPath: "packages/playground/src/human-parameters/f1.ts",
      typedSha256: R.hash(
        fs.readFileSync(
          HumanNodePaths.resolve(
            "packages/playground/src/human-parameters/f1.ts",
          ),
        ),
      ),
      runtimeSha256: R.hash(JSON.stringify(person.parameters)),
      parameters: person.parameters,
    };
    const prepared: R.Result<AutoMovieHumanBodyLaw.IPrepared> = R.measure(
      phases,
      "canonical",
      "BodyLaw.prepare; actual canonical/lower/placement dependencies",
      (): AutoMovieHumanBodyLaw.IPrepared =>
        AutoMovieHumanBodyLaw.prepare(person.parameters),
    );
    if (!prepared.ok) {
      errors.push({
        stage: "canonical",
        error: R.message(prepared.error),
        remaining:
          "Actual providers could not be reached; no unavailable definition is reported as successful",
      });
      report.status = "canonical-provider-failed";
      save();
      process.exitCode = 1;
      return;
    }
    const context: AutoMovieHumanBodyLaw.IPrepared = prepared.value;
    report.canonicalAfterPrepare = {
      headCalibrated: context.head.source.calibrated,
      boundary:
        "Actual canonical, lower original-source and placement preparation belong to this measured phase. Full upper C and explicit raw loft requests remain separate later demands.",
    };
    const scale: number =
      AutoMovieHumanBodyAnatomy.resolve(person.parameters).stature /
      context.head.stature;
    const sampleInput: HumanCurveCostSamples.IInput = {
      context,
      scale,
      output,
      phases,
      parts,
      curves,
      errors,
      events,
      actual,
      studyNames,
      definitionRefs,
      emittedCurveIds,
      save,
    };
    const sample: (name: string) => void = (name: string): void =>
      HumanCurveCostSamples.sample(sampleInput, name);
    HumanCurveCostBodies.run({
      context,
      phases,
      errors,
      parts,
      actual,
      definitionRefs,
      save,
      bodyNames,
    });

    // Body originals survive even when the later regional head or its full C refuses.
    for (const name of bodyNames) sample(name);
    const wasCalibrated: boolean = context.head.source.calibrated;
    const closure: R.Result<ReturnType<typeof context.head.source.closed>> =
      R.measure(
        phases,
        "head-full-C",
        "Explicit canonical head public-input C closure",
        (): ReturnType<typeof context.head.source.closed> =>
          context.head.source.closed(),
      );
    report.headClosure = {
      retainedBefore: wasCalibrated,
      stageObservationOverlap:
        "Canonical caliper/neck-layout times can already be included in canonical. These producer fields are nested/inclusive and are never added to outer phases.",
      producerStages: closure.ok
        ? {
            caliperMilliseconds: closure.value.caliperMilliseconds,
            attachmentMilliseconds: closure.value.attachmentMilliseconds,
            tapeMilliseconds: closure.value.tapeMilliseconds,
          }
        : null,
    };
    let head: ReturnType<typeof context.head.originals> | null = null;
    const expectedHead: string[] = [
      "head.mass",
      "nose",
      "lip.upper",
      "lip.lower",
      "nose.lobule",
      "philtrum",
      "sulcus.mentolabial",
      ...[
        "orbit",
        "auricle",
        "ear.helix",
        "ear.antihelix",
        "ear.crus.superior",
        "ear.crus.inferior",
        "ear.concha",
        "nose.ala",
        "nose.nostril",
        "globe",
        "fissure",
      ].flatMap((kind: string): string[] => [kind + ".left", kind + ".right"]),
    ];
    if (closure.ok) {
      const regional: R.Result<ReturnType<typeof context.head.originals>> =
        R.measure(
          phases,
          "head-regional-family",
          "HeadLane.originals -> Composer.define; shared regional factories",
          (): ReturnType<typeof context.head.originals> =>
            context.head.originals(),
        );
      if (regional.ok) {
        head = regional.value;
        for (const study of head.studies) studyNames.add(study.name);
        for (const source of [...head.sources.values(), ...head.studies]) {
          actual.set(source.name, source);
          definitionRefs.set(source.name, [
            "canonical",
            "head-full-C",
            "head-regional-family",
          ]);
          parts.push({
            name: source.name,
            kind: studyNames.has(source.name) ? "independent-study" : "head",
            definitionStatus: "shared-family-produced",
            definitionPhase: "head-regional-family",
            individualFactoryMilliseconds: null,
            sharedDefinitionRefs: definitionRefs.get(source.name),
            boundary:
              "The actual regional factory authors these definitions jointly. No individual factory time is invented or divided by part/curve count.",
          });
        }
        report.headAttachments = head.attachments.map(
          (
            attempt: ReturnType<
              typeof context.head.originals
            >["attachments"][number],
          ): unknown => ({ name: attempt.name, error: attempt.error }),
        );
      } else
        errors.push({
          stage: "head-regional-family",
          error: R.message(regional.error),
        });
    } else
      errors.push({ stage: "head-full-C", error: R.message(closure.error) });
    for (const name of expectedHead)
      if (!actual.has(name))
        parts.push({
          name,
          kind: /^(globe|fissure)\./.test(name) ? "independent-study" : "head",
          definitionStatus: "unavailable-provider-or-attachment",
          definitionPhase: "head-regional-family",
          individualFactoryMilliseconds: null,
          sharedDefinitionRefs: [
            "canonical",
            "head-full-C",
            "head-regional-family",
          ],
        });
    for (const row of parts)
      if (!bodyNames.has(String(row.name))) sample(String(row.name));
    const auditPatterns: string[] = [
      ...bodyNames,
      ...(head === null ? [] : ["head.*"]),
    ];
    const audit: R.Result<HumanInspectionParts.IOutput> = R.measure(
      phases,
      "inventory-audit",
      "Actual available provider metadata; failed head C/region is not retried",
      (): HumanInspectionParts.IOutput =>
        HumanInspectionParts.scoped(context, auditPatterns),
    );
    if (audit.ok) {
      const names: string[] = [
        ...new Set([
          ...audit.value.sourceRecords.map(
            (
              record: HumanInspectionParts.IOutput["sourceRecords"][number],
            ): string => record.name,
          ),
          ...audit.value.parts.map(
            (part: HumanInspectionParts.IPart): string => part.name,
          ),
          ...audit.value.observation.unavailableParts,
        ]),
      ];
      report.inventory = {
        actualNames: names,
        namesWithoutRows: names.filter(
          (name: string): boolean =>
            !parts.some(
              (row: Record<string, unknown>): boolean => row.name === name,
            ),
        ),
        expectedHeadNames: expectedHead,
        expectedHeadUnavailable: expectedHead.filter(
          (name: string): boolean => !actual.has(name),
        ),
        unexpectedHeadNames: [...actual.keys()].filter(
          (name: string): boolean =>
            !bodyNames.has(name) && !expectedHead.includes(name),
        ),
        bodyMetadataNames: [...bodyNames],
        studies: [...studyNames],
        sourceRecords: audit.value.sourceRecords,
        observation: audit.value.observation,
        historicalContext:
          "Previous inventory had60 targets including4 studies and1001 available display curves; current source slots/failures are enumerated, not forced to that old count.",
      };
    } else
      errors.push({ stage: "inventory-audit", error: R.message(audit.error) });

    HumanCurveCostRaw.run({
      parts,
      actual,
      context,
      bodyNames,
      head,
      phases,
      output,
      save,
    });
    const after: Record<string, string> = R.sources();
    report.sourceAfter = after;
    report.compilerConfigsAfter = R.configs();
    report.sourceChanged = [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].filter((name: string): boolean => before[name] !== after[name]);
    report.status = "complete-observation-with-explicit-failures";
    report.completedUtc = new Date().toISOString();
    report.programMilliseconds = performance.now() - started;
    report.accounting = {
      outerDisjointMilliseconds: phases.reduce(
        (sum: number, phase: R.IPhase): number => sum + phase.milliseconds,
        0,
      ),
      rule: "Sum outer phases once. Sampler events are nested inside sampling phases; per-curve shared-definition references are non-additive. Observer/clock/serialization overhead and uninstrumented loop bookkeeping are not scalar or loft costs.",
    };
    report.counts = {
      targets: parts.length,
      actualSources: actual.size,
      curveRows: curves.length,
      materializedCurves: curves.filter(
        (row: Record<string, unknown>): boolean =>
          row.status === "materialized",
      ).length,
      studies: studyNames.size,
      observerErrors: errors.filter(
        (row: Record<string, unknown>): boolean => row.stage === "observer",
      ).length,
    };
    report.coverage = HumanCurveCostSamples.coverage(sampleInput);
    save();
    process.stdout.write(
      JSON.stringify({
        event: "complete",
        output,
        utc: report.completedUtc,
        milliseconds: report.programMilliseconds,
        counts: report.counts,
      }) + "\n",
    );
  } finally {
    if (profiler !== null) {
      try {
        report.cpuProfile = await profiler.stop();
      } catch (error: unknown) {
        errors.push({ stage: "cpu-profile-stop", error: R.message(error) });
      }
    }
    report.profileFinalizedUtc = new Date().toISOString();
    report.programIncludingProfileFinalizeMilliseconds =
      performance.now() - started;
    if (report.sourceAfter === undefined) {
      try {
        const after: Record<string, string> = R.sources();
        report.sourceAfter = after;
        report.compilerConfigsAfter = R.configs();
        report.sourceChanged = [
          ...new Set([...Object.keys(before), ...Object.keys(after)]),
        ].filter((name: string): boolean => before[name] !== after[name]);
      } catch (error: unknown) {
        errors.push({
          stage: "final-source-observation",
          error: R.message(error),
        });
      }
    }
    save();
  }
}
