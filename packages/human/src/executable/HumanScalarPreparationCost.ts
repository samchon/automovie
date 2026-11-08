import fs from "node:fs";
import path from "node:path";
import type { AutoMovieViewOutline } from "@automovie/engine";
import type { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { IHumanInspectionPerson } from "../inspection/IHumanInspectionPerson";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanNodePaths } from "./HumanNodePaths";
import { HumanScalarProbe } from "./HumanScalarProbe";
import { HumanScalarCostSession } from "./HumanScalarCostSession";
import { HumanScalarBodyAcquisition } from "./HumanScalarBodyAcquisition";

/** Entry time before any runtime production import; the external caller records command admission. */
const PROGRAM_STARTED: string = new Date().toISOString();

/**
 * Prepares actual f1 scalar control records with the public production interpolator.
 * This diagnostic measures a new interpolation preparation and its explicit reads, not
 * the earlier authoring of the representative formula or its control record. One actual
 * production context supplies all records. Guides are read before full head closure;
 * acquisition, constraints, placement and deferred axis reads retain distinct costs.
 * No renderer, reference/model file, display polyline, top ring or explicit raw loft runs.
 */
export async function HumanScalarPreparationCost(argv: readonly string[]): Promise<void> {
  if (!(argv.length === 0 || argv.length === 2 && argv[0] === "--out" && argv[1] !== undefined))
    throw new Error("Usage: pnpm --dir packages/human node:scalar-cost [--out <owned-output-directory>]");
  const task: string = fs.realpathSync(HumanNodePaths.resolve("packages/human/.shots/node_canvas_xhigh"));
  const output: string = path.resolve(argv[1] ?? path.join(task, "scalar-" + PROGRAM_STARTED.replaceAll(/[:.]/g, "-")));
  if (!output.startsWith(task + path.sep)) throw new Error("Output must remain under the existing owned ignored directory");
  if (fs.existsSync(output)) throw new Error("A scalar diagnostic never overwrites an existing output directory");
  fs.mkdirSync(output, { recursive: true });
  const started: number = performance.now();
  const phases: R.IPhase[] = [];
  const acquisitions: Record<string, unknown>[] = [];
  const scalars: Record<string, unknown>[] = [];
  const axes: Record<string, unknown>[] = [];
  const errors: Record<string, unknown>[] = [];
  const failures: unknown[] = [];
  const probeState: HumanScalarProbe.IState = { rejectedOrUnavailable: 0 };
  const actualNames: Set<string> = new Set();
  const bodyNames: Set<string> = new Set();
  const studyNames: Set<string> = new Set();
  const expectedHead: string[] = ["head.mass", "nose", "lip.upper", "lip.lower", "nose.lobule", "philtrum", "sulcus.mentolabial", ...["orbit", "auricle", "ear.helix", "ear.antihelix", "ear.crus.superior", "ear.crus.inferior", "ear.concha", "nose.ala", "nose.nostril", "globe", "fissure"].flatMap((kind: string): string[] => [kind + ".left", kind + ".right"])];
  const before: Record<string, string> = R.sources();
  const report: Record<string, unknown> = { status: "running", programStartedUtc: PROGRAM_STARTED, output, node: process.version, sourceBefore: before, phases, acquisitions, scalars, axes, errors, renderer: "none", readReferenceModel: false, explicitRawLoft: "not-run", finalRealization: "not-run", originalRepresentativeFormulaCount: null, originalRepresentativeConstructorMilliseconds: null, method: "Actual production scalar records are borrowed, then newly prepared by ViewOutline.create. These probe preparations and record identities are not independent original formulas or their constructor costs." };
  report.acquisitionOrder = "Canonical -> guides -> body metadata -> shared trunk -> named body sources -> head C -> regional sources. Trunk can prepay coupled leg work; later leg/foot requests are incremental, not independent cold costs or proof that a narrow foot requires full trunk.";
  const { timed, emit, save }: HumanScalarCostSession.IOutput = HumanScalarCostSession.create({ output, report, phases, acquisitions, scalars, axes, errors, failures });
  let importStarted: number | null = null;
  let importUtc: string | null = null;
  emit({ event: "program-start", utc: PROGRAM_STARTED, output });
  try {
    importStarted = performance.now();
    importUtc = new Date().toISOString();
    emit({ event: "production-import-start", utc: importUtc });
    const engine: typeof import("@automovie/engine") = await import("@automovie/engine");
    const { part, scalar, axis, unavailable }: HumanScalarProbe.IOutput = HumanScalarProbe.create(engine, { timed, scalars, axes, actualNames, state: probeState });
    const inputs: typeof import("./HumanNodeInput.js") = await import("./HumanNodeInput.js");
    const body: typeof import("../generation/AutoMovieHumanBodyLaw.js") = await import("../generation/AutoMovieHumanBodyLaw.js");
    phases.push({ id: "production-module-import", owner: "Dynamic engine/input-boundary/BodyLaw imports, including loader/evaluation; not per-control construction", startedUtc: importUtc, performanceStartMilliseconds: importStarted, milliseconds: performance.now() - importStarted, status: "returned", error: null });
    importStarted = null;
    emit({ event: "production-import-end", ...phases.at(-1) });
    const person: IHumanInspectionPerson = await inputs.HumanNodeInput.of();
    report.input = { person: person.alias, typedPath: "packages/playground/src/human-parameters/f1.ts", typedSha256: R.hash(fs.readFileSync(HumanNodePaths.resolve("packages/playground/src/human-parameters/f1.ts"))), runtimeSha256: R.hash(JSON.stringify(person.parameters)), parameters: person.parameters };
    const prepared: R.Result<AutoMovieHumanBodyLaw.IPrepared> = timed("acquire:canonical", "Actual BodyLaw.prepare; canonical constraints, lower adapter and placement", (): AutoMovieHumanBodyLaw.IPrepared => body.AutoMovieHumanBodyLaw.prepare(person.parameters), true);
    if (!prepared.ok) {
      errors.push({ stage: "canonical-acquisition", error: R.message(prepared.error), remaining: "The actual shared context is unavailable; no original constructor or missing scalar is declared successful" });
      report.status = "canonical-acquisition-failed";
      throw prepared.error;
    }
    const context: AutoMovieHumanBodyLaw.IPrepared = prepared.value;
    const guides: typeof context.head.source.guides = context.head.source.guides;
    report.headCalibratedBeforeGuides = context.head.source.calibrated;
    const guideEnds: AutoMovieViewOutline.IEnds = HumanScalarProbe.ends(guides);
    for (const view of ["front", "side"] as const)
      for (const sign of ["positive", "negative"] as const)
        scalar("head.mass.guides", view + "." + sign, guides[view][sign], guideEnds, "mm", ["acquire:canonical"], "pre-C-guide", HumanScalarProbe.domain(guides.stations));
    axis("head.mass.guides", guides.axis, [...guides.stations], ["acquire:canonical"], "pre-C-guide");
    report.headCalibratedAfterGuides = context.head.source.calibrated;
    if (report.headCalibratedAfterGuides !== report.headCalibratedBeforeGuides)
      errors.push({ stage: "guide-isolation", error: "Guide preparation/reads unexpectedly activated full head C" });
    save();

    const metadata: R.Result<ReturnType<typeof body.AutoMovieHumanBodyLaw.bodyInput>> = HumanScalarBodyAcquisition.run({ body, context, timed, bodyNames, part, actualNames, acquisitions, errors, unavailable, save });

    const alreadyClosed: boolean = context.head.source.calibrated;
    const closure: R.Result<ReturnType<typeof context.head.source.closed>> = timed("acquire:head-C", "Explicit full head C needed by the current full-part/regional producer; not guide construction", (): ReturnType<typeof context.head.source.closed> => context.head.source.closed(), true);
    report.headClosure = { retainedBefore: alreadyClosed, producerStages: closure.ok ? { caliperMilliseconds: closure.value.caliperMilliseconds, attachmentMilliseconds: closure.value.attachmentMilliseconds, tapeMilliseconds: closure.value.tapeMilliseconds } : null, accounting: "Nested producer observations overlap canonical and C phases; never add them to the containing acquisition times." };
    if (closure.ok) {
      const regional: R.Result<ReturnType<typeof context.head.originals>> = timed("acquire:head-regional-family", "Actual Composer original family, including existing independent studies", (): ReturnType<typeof context.head.originals> => context.head.originals(), true);
      if (regional.ok) {
        for (const study of regional.value.studies) studyNames.add(study.name);
        report.headAttachments = regional.value.attachments.map((attempt: ReturnType<typeof context.head.originals>["attachments"][number]): unknown => ({ name: attempt.name, error: attempt.error }));
        for (const source of [...regional.value.sources.values(), ...regional.value.studies]) {
          const refs: string[] = ["acquire:canonical", "acquire:head-C", "acquire:head-regional-family"];
          const membership: string = studyNames.has(source.name) ? "independent-study" : "production-head";
          acquisitions.push({ part: source.name, membership, status: "shared-family-produced", acquisitionMillisecondsExclusive: null, originalConstructorMilliseconds: null, sharedRefs: refs });
          part(source, refs, membership);
          save();
        }
      } else errors.push({ stage: "head-regional-acquisition", error: R.message(regional.error) });
    } else errors.push({ stage: "head-C-acquisition", error: R.message(closure.error) });
    for (const name of expectedHead) if (!actualNames.has(name)) {
      const membership: string = /^(globe|fissure)\./.test(name) ? "independent-study" : "production-head";
      const refs: string[] = ["acquire:canonical", "acquire:head-C", "acquire:head-regional-family"];
      acquisitions.push({ part: name, membership, status: "no-actual-regional-source", sharedRefs: refs, originalConstructorMilliseconds: null });
      unavailable(name, membership, refs, "The current regional producer supplied no actual scalar control record");
    }
    report.coverage = { bodyMetadataStatus: metadata.ok ? "acquired" : "unavailable", bodyMetadataNames: [...bodyNames], expectedHeadNames: expectedHead, actualSourceNames: [...actualNames], missingBodySources: [...bodyNames].filter((name: string): boolean => !actualNames.has(name)), missingHeadSources: expectedHead.filter((name: string): boolean => !actualNames.has(name)), studies: [...studyNames] };
    report.status = "complete-probe";
    report.counts = { actualSourceInstances: actualNames.size, scalarFieldRows: scalars.length, newPreparationAttempts: scalars.filter((row: Record<string, unknown>): boolean => row.preparationMilliseconds !== null && row.preparationMilliseconds !== undefined).length, successfulPreparedRecordContexts: scalars.filter((row: Record<string, unknown>): boolean => row.status === "prepared").length, aliasedRecordUses: scalars.filter((row: Record<string, unknown>): boolean => row.aliasOf !== null).length, axisProbeOwners: axes.length, independentOriginalCurves: null };

  } catch (error: unknown) {
    if (!failures.includes(error)) failures.push(error);
    if (importStarted !== null && importUtc !== null)
      phases.push({ id: "production-module-import", owner: "Dynamic production import failed", startedUtc: importUtc, performanceStartMilliseconds: importStarted, milliseconds: performance.now() - importStarted, status: "failed", error: R.message(error) });
    if (report.status === "running") report.status = "diagnostic-failed";
    errors.push({ stage: "program", error: R.message(error) });
  }

  // No resource-owning operation remains open. Final observation and error handling stay
  // outside finally, so a file failure cannot override an earlier producer exception.
  report.completedUtc = new Date().toISOString();
  report.programBeforeFinalObservationMilliseconds = performance.now() - started;
  try {
    const after: Record<string, string> = R.sources();
    report.sourceAfter = after;
    report.sourceChanged = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((name: string): boolean => before[name] !== after[name]);
  } catch (error: unknown) {
    failures.push(error);
    errors.push({ stage: "final-source-observation", error: R.message(error) });
  }
  report.accounting = { operationMilliseconds: phases.reduce((sum: number, phase: R.IPhase): number => sum + phase.milliseconds, 0), rule: "Disjoint direct calls are summed once. Acquisition/shared references are not assigned per scalar or divided by output count. Import includes loader/eval. Native/axis reads may contain deferred work; a cheap constructor return alone is not an improvement.", limitations: "One observed preparation and listed reads per record context, without a display grid or raw loft. Later unprobed stations/raw consumers remain unmeasured. Clock/observer/scheduling/GC overhead and serialization outside the measured calls remain in total program time." };
  report.failureSummary = { thrownOrObservationFailures: failures.length, nativeRejectedOrUnavailableOutcomes: probeState.rejectedOrUnavailable };
  if (report.status === "complete-probe" && (failures.length !== 0 || probeState.rejectedOrUnavailable !== 0 || errors.length !== 0))
    report.status = "complete-probe-with-source-or-observation-failures";
  let saved: boolean = false;
  report.programBeforeFinalWriteMilliseconds = performance.now() - started;
  try { save(); saved = true; }
  catch (error: unknown) {
    failures.push(error);
    report.reportingStatus = "final-write-failed";
    errors.push({ stage: "final-report-write", error: R.message(error) });
  }
  const succeeded: boolean = saved && failures.length === 0 && probeState.rejectedOrUnavailable === 0 && errors.length === 0;
  if (!succeeded) process.exitCode = 1;
  emit({ event: "diagnostic-end", utc: new Date().toISOString(), output, status: report.status, reportingStatus: report.reportingStatus ?? "written", reportSaved: saved, success: succeeded, programIncludingFinalWriteMilliseconds: performance.now() - started, counts: report.counts });
  if (failures.length !== 0)
    throw new AggregateError(failures, "Scalar diagnostic source and observation failures; original causes retained", { cause: failures[0] });


}

if (require.main === module) HumanScalarPreparationCost(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write(R.message(error) + "\n");
  process.exitCode = 1;
});
