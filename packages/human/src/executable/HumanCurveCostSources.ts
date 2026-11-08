import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieViewCurves,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import fs from "node:fs";
import path from "node:path";

import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanLimbSources } from "../generation/AutoMovieHumanLimbSources";
import { AutoMovieHumanTorsoSource } from "../generation/trunk/AutoMovieHumanTorsoSource";
import type { IHumanInspectionPerson } from "../inspection/IHumanInspectionPerson";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import { HumanCurveCpuProfile } from "./HumanCurveCpuProfile";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";

/** Program time after imports, distinct from the minimal entry's loader interval. */
const PROGRAM_STARTED: string = new Date().toISOString();

/** One actual original source, without implying a plan constructor or an anatomical pass. */
interface IOriginal {
  /** Real producer name, retaining its lineage. */
  name: string;

  /** Actual original declaration whose scalar/first-query work is requested. */
  part: IAutoMovieViewPart;
}

/**
 * Original-only mode of the existing f1 Cost entry, scoped to original construction and first consumers.
 * First/same-values/edit each use a fresh production context in this already
 * loaded process. Required common constraints remain inside the measured
 * calls. Engine first-edge/native reads are separate from declaration work.
 * No renderer, reference read, raw loft, tree assembly or final skin runs.
 * Missing/failed/partial sources cannot establish the 100 ms target.
 */
export async function HumanCurveCostSources(
  argv: readonly string[],
  entry: {
    /** UTC before the minimal entry imports production. */
    startedUtc: string;

    /** Loader/deferred preparation plus import/evaluation, elapsed ms. */
    importMilliseconds: number;
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
      "Usage: pnpm --dir packages/human node:curve-cost --source-cases [--cpu-profile] [--out <owned-output-directory>]",
    );
  const task: string = fs.realpathSync(
    HumanNodePaths.resolve("packages/human/.shots/node_canvas_xhigh"),
  );
  const output: string = path.resolve(
    args[1] ??
      path.join(task, "curves-" + PROGRAM_STARTED.replaceAll(/[:.]/g, "-")),
  );
  if (!output.startsWith(task + path.sep) || fs.existsSync(output))
    throw new Error(
      "A Cost capture needs a new directory under the existing owned output root",
    );
  fs.mkdirSync(output, { recursive: true });
  const started: number = performance.now();
  const missingBefore: string[] = [];
  const before: Record<string, string> = R.sources(missingBefore);
  const phases: R.IPhase[] = [];
  const parts: Record<string, unknown>[] = [];
  const curves: Record<string, unknown>[] = [];
  const cases: Record<string, unknown>[] = [];
  const errors: Record<string, unknown>[] = [];
  const report: Record<string, unknown> = {
    status: "running",
    programStartedUtc: PROGRAM_STARTED,
    entry,
    output,
    renderer: "none",
    readReferenceModel: false,
    raw: "unrequested",
    tree: "unrequested",
    finalRealization: "not-run",
    binding: "not-run",
    phases,
    parts,
    curves,
    cases,
    errors,
    sourceBefore: sidecar("sources-before.json", before),
    sourceMissingBefore: missingBefore,
    configsBefore: R.configs(),
    targetMilliseconds: 100,
    targetVerdict: "not-assessed",
    limitation:
      "Fresh contexts share loaded immutable modules/priors, not previous source families. Declaration and sparse first-query observations are diagnostic coverage, not anatomical acceptance or all planned composed inputs.",
  };
  let profiler: HumanCurveCpuProfile.IHandle | null = null;
  let sourceChanged: string[] = [];
  try {
    if (profileRequested)
      profiler = await HumanCurveCpuProfile.start(
        path.join(output, "cpu.cpuprofile"),
      );
    const inputStarted: number = performance.now();
    const person: IHumanInspectionPerson = await HumanNodeInput.of();
    report.input = {
      person: person.alias,
      typedPath: "packages/playground/src/human-parameters/f1.ts",
      inputLoadMilliseconds: performance.now() - inputStarted,
      typedSha256: R.hash(
        fs.readFileSync(
          HumanNodePaths.resolve(
            "packages/playground/src/human-parameters/f1.ts",
          ),
        ),
      ),
      runtimeSha256: R.hash(JSON.stringify(person.parameters)),
    };
    run("first", person.parameters);
    run("same-values-fresh-context", structuredClone(person.parameters));
    const edited: IAutoMovieHumanParameters = structuredClone(
      person.parameters,
    );
    if (edited.body?.anatomy?.neckCircumference === undefined)
      throw new Error(
        "The actual f1 must supply its neck circumference for the dimension-edit case",
      );
    edited.body.anatomy.neckCircumference += 1;
    run("neck-girth-plus-1mm", edited);
    report.status = "completed-unreviewed";
  } catch (error: unknown) {
    errors.push({ stage: "program", error: R.message(error) });
    report.status = "failed";
  } finally {
    if (profiler !== null) {
      try {
        report.cpuProfile = await profiler.stop();
      } catch (error: unknown) {
        errors.push({ stage: "profile-stop", error: R.message(error) });
      }
    }
    const missingAfter: string[] = [];
    const after: Record<string, string> = R.sources(missingAfter);
    report.sourceAfter = sidecar("sources-after.json", after);
    report.sourceMissingAfter = missingAfter;
    sourceChanged = [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].filter((name: string): boolean => before[name] !== after[name]);
    report.sourceChanged = sourceChanged;
    report.configsAfter = R.configs();
    report.completedUtc = new Date().toISOString();
    report.programMilliseconds = performance.now() - started;
    R.save(output, report, phases, parts, curves);
  }
  process.stdout.write(
    JSON.stringify({
      event: "complete",
      output,
      status: report.status,
      cases,
      errors: errors.length,
    }) + "\n",
  );
  if (errors.length !== 0 || sourceChanged.length !== 0) process.exitCode = 1;

  /** Each case owns new actual source factories; nested producer intervals are observed, never summed. */
  function run(label: string, parameters: IAutoMovieHumanParameters): void {
    const began: number = performance.now();
    const firstPhase: number = phases.length;
    const originals: Map<string, IOriginal> = new Map();
    const failures: Record<string, unknown>[] = [];
    const row: Record<string, unknown> = {
      label,
      inputSha256: R.hash(JSON.stringify(parameters)),
      status: "running",
      context: "fresh",
      raw: "unrequested",
      tree: "unrequested",
      finalRealization: "not-run",
      failures,
      unprovidedComposedInputs: ["S01", "S02", "S03", "S04", "S05"],
      independentConstructorCount: null,
    };
    cases.push(row);
    const prepared: R.Result<AutoMovieHumanBodyLaw.IOriginal> = call(
      "context",
      "Actual BodyLaw.prepareSources; supplied input conversion",
      (): AutoMovieHumanBodyLaw.IOriginal =>
        AutoMovieHumanBodyLaw.prepareSources(parameters),
    );
    let shared: Parameters<typeof AutoMovieHumanTorsoSource.create>[2] =
      undefined;
    if (prepared.ok) {
      const context: AutoMovieHumanBodyLaw.IOriginal = prepared.value;
      const common: R.Result<ReturnType<typeof context.common>> = call(
        "common",
        "Explicit required neck scalar/section/frame family",
        (): ReturnType<typeof context.common> => context.common(),
      );
      if (common.ok) {
        row.neckWork = common.value.pose.neck.milliseconds;
        shared = common.value;
      }
      const body: R.Result<ReturnType<typeof context.limbSources>> = call(
        "body-factories",
        "Independent factory owner; actual rest/shared constraint work is charged at the requested original",
        (): ReturnType<typeof context.limbSources> => context.limbSources(),
      );
      if (body.ok) {
        const names: Set<string> = new Set(["trunk"]);
        for (const side of ["left", "right"] as const) {
          for (const kind of ["breast", "gluteal", "leg", "arm", "foot"])
            names.add(kind + "." + side);
          for (const name of AutoMovieHumanLimbSources.names()) names.add(name);
        }
        row.bodyInventory = [...names];
        for (const name of names) {
          const result: R.Result<
            ReturnType<typeof AutoMovieHumanBodyLaw.original>
          > = call(
            "native-original:" + name,
            "Actual original factory and its required common controls",
            (): ReturnType<typeof AutoMovieHumanBodyLaw.original> =>
              AutoMovieHumanBodyLaw.original(context, name),
          );
          parts.push({
            case: label,
            name,
            lineage: "existing-native-bank",
            phase: result.phase.id,
            status: !result.ok
              ? "failed"
              : result.value?.part === null || result.value === null
                ? "unavailable"
                : "provided",
            diagnostics: result.ok ? (result.value?.diagnostics ?? []) : null,
          });
          if (
            result.ok &&
            result.value?.part !== null &&
            result.value?.part !== undefined
          )
            originals.set(name, { name, part: result.value.part });
        }
      } else
        row.bodyInventory = "unavailable; no zero-sized successful inventory";
      const head: R.Result<ReturnType<typeof context.headSource>> = call(
        "head-original-owner",
        "Actual head calipers/guides; no regional tree or raw",
        (): ReturnType<typeof context.headSource> => context.headSource(),
      );
      if (head.ok) {
        const regional: R.Result<ReturnType<typeof head.value.originals>> =
          call(
            "head-regionals",
            "Actual current regional provider; remaining all-region dependency is included",
            (): ReturnType<typeof head.value.originals> =>
              head.value.originals(),
          );
        if (regional.ok) {
          for (const part of [
            ...regional.value.sources.values(),
            ...regional.value.studies,
          ])
            originals.set(part.name, { name: part.name, part });
          row.headAttempts = regional.value.attachments.map(
            (
              attempt: (typeof regional.value.attachments)[number],
            ): unknown => ({ name: attempt.name, error: attempt.error }),
          );
        } else {
          row.headRegionals = "unavailable after actual provider failure";
          const guides: typeof head.value.source.guides =
            head.value.source.guides;
          row.availableHeadGuides = call(
            "head-guide-first-read",
            "Already prepared independent head edges in their actual axis",
            (): unknown =>
              head.value.source.guideCurves.curves.map(
                (curve: AutoMovieViewCurves.ICurve): unknown =>
                  AutoMovieViewCurves.at(
                    curve,
                    guides.axis,
                    (guides.stations[0]! + guides.stations.at(-1)!) / 2,
                  ),
              ),
          ).ok;
        }
      }
      row.inclusiveProducerMilliseconds = { ...context.milliseconds };
      row.producerAccounting =
        "First factory intervals can include common/other factories; do not add them. Actual disjoint calls and the outer case are recorded separately.";
      if (
        context.milliseconds.neckRaw !== null ||
        (context.rawSources?.size ?? 0) !== 0
      )
        failures.push({
          stage: "raw-isolation",
          error: "An original request unexpectedly demanded raw geometry",
        });
    }

    // S00 and the native bank are distinct current source lineages; duplicate
    // common preparation remains a referenced actual owner, not a repeated neck solve.
    const torso: R.Result<AutoMovieHumanTorsoSource.IOutput> = call(
      "S00-candidate",
      "Actual composed S00 controls/common neck, without lofting",
      (): AutoMovieHumanTorsoSource.IOutput =>
        AutoMovieHumanTorsoSource.create(parameters, undefined, shared),
    );
    if (torso.ok) {
      const work: ReturnType<typeof AutoMovieHumanTorsoSource.work> =
        AutoMovieHumanTorsoSource.work();
      const closed: R.Result<AutoMovieHumanTorsoSource.IOutput> = call(
        "S00-explicit-constraints",
        "Actual chest/course solve; other constraints keep their true state",
        (): AutoMovieHumanTorsoSource.IOutput =>
          AutoMovieHumanTorsoSource.close(torso.value, work),
      );
      const selected: AutoMovieHumanTorsoSource.IOutput = closed.ok
        ? closed.value
        : torso.value;
      row.composedS00 = {
        constraints: selected.capability.coupledConstraints,
        milliseconds: selected.milliseconds,
        attemptWork: work,
        selected: closed.ok
          ? "explicit-two-constraint-result"
          : "candidate-after-explicit-refusal",
      };
      call(
        "S00-first-point",
        "Actual original Point0, four original phases at the named waist plane",
        (): unknown => {
          const station: number | undefined = selected.plan.wall.sites.find(
            (site: (typeof selected.plan.wall.sites)[number]): boolean =>
              site.site === "waist",
          )?.y;
          if (station === undefined)
            throw new Error("S00 supplies no actual waist plane");
          return [0, 1, 2, 3].map((quarter: number): unknown => ({
            station,
            phase: (quarter * Math.PI) / 2 + 0.13,
            point: selected.point(station, (quarter * Math.PI) / 2 + 0.13),
          }));
        },
      );
    }
    for (const original of originals.values()) probe(original);
    row.outerMilliseconds = performance.now() - began;
    row.disjointCallMilliseconds = phases
      .slice(firstPhase)
      .reduce(
        (sum: number, phase: R.IPhase): number => sum + phase.milliseconds,
        0,
      );
    row.outerAccounting =
      "Includes observer bookkeeping/stdout between actual calls; disjoint calls include their real internal geometry. JSON/report IO follows the case. Sparse first reads are not full-domain validation.";
    row.originalNames = [...originals.keys()];
    row.status =
      failures.length === 0
        ? "partial-unreviewed-planned-inputs-unprovided"
        : "partial-or-failed";
    row.targetVerdict = "not-assessed";
    if (failures.length !== 0) errors.push({ case: label, failures });
    R.save(output, report, phases, parts, curves);

    /** Only real producer/engine calls are timed; their original thrown values remain available to the caller. */
    function call<T>(id: string, owner: string, action: () => T): R.Result<T> {
      const result: R.Result<T> = R.measure(
        phases,
        label + "/" + id,
        owner,
        action,
      );
      if (!result.ok)
        failures.push({ stage: id, error: R.message(result.error) });
      return result;
    }

    /** First actual scalar curves, world frames and native value/physical2, without emitted layers or a display grid. */
    function probe(original: IOriginal): void {
      const part: IAutoMovieViewPart = original.part;
      const result: R.Result<unknown> = call(
        "engine-first:" + original.name,
        "Actual ViewCurves preparation/first reads and original native section/jet",
        (): unknown => {
          const edges: AutoMovieViewCurves.IResult =
            AutoMovieViewCurves.create(part);
          const first: number = part.stations[0]!;
          const last: number = part.stations.at(-1)!;
          const station: number = (first + last) / 2;
          const points: unknown[] = edges.curves.map(
            (curve: AutoMovieViewCurves.ICurve): unknown =>
              AutoMovieViewCurves.at(curve, part.axis, station),
          );
          const native: AutoMovieLoftViewSource.IResult | null =
            AutoMovieLoftViewSource.create(part);
          if (native?.source === null)
            throw new Error(JSON.stringify(native.diagnostics));
          let section: unknown = "unprovided generic-girth native field";
          if (native !== null && native.source !== null) {
            const values: ReturnType<typeof AutoMovieLoftViewRead.values> =
              AutoMovieLoftViewRead.values(native.source, station);
            if (typeof values === "string") throw new Error(values);
            const jets: ReturnType<typeof AutoMovieLoftViewRead.jets> =
              AutoMovieLoftViewRead.jets(native.source, station);
            section = {
              point: AutoMovieLoftSectionNative.phase(values)(0.37),
              physical2:
                typeof jets === "string"
                  ? { unavailable: jets }
                  : AutoMovieLoftSectionNative.jet(jets)(0.37),
            };
          }
          return {
            domain: [first, last],
            station,
            edgeDiagnostics: edges.diagnostics,
            points,
            section,
          };
        },
      );
      curves.push({
        case: label,
        name: original.name,
        phase: result.phase.id,
        status: result.ok ? "sparse-first-query-unreviewed" : "failed",
        result: result.ok ? result.value : null,
      });
    }
  }

  /** Preserve each immutable source map once; report rewrites retain only this file identity. */
  function sidecar(
    file: string,
    value: unknown,
  ): { file: string; sha256: string } {
    const bytes: string = JSON.stringify(value, null, 2);
    fs.writeFileSync(path.join(output, file), bytes);
    return { file, sha256: R.hash(bytes) };
  }
}
