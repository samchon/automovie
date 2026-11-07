import {
  AutoMoviePhysicalPlayback as Playback,
  AutoMoviePhysicalSimulation as Simulation,
} from "@automovie/engine";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { BoutPhysicalSettings as Settings } from "../physics/BoutPhysicalSettings";
import { BoutReceipts } from "../physics/BoutReceipts";
import { BoutTargetSource } from "../physics/BoutTargetSource";
import { absoluteBoutContacts } from "../physics/absoluteBoutContacts";
import { auditBoutMotion } from "../physics/auditBoutMotion";
import { boutGeometricImpulses } from "../physics/boutGeometricImpulses";
import { boutPhysicalSourceIdentity } from "../physics/boutPhysicalSourceIdentity";
import { createBoutPhysicalInput } from "../physics/createBoutPhysicalInput";
import { measureBoutGeometricFloor } from "../physics/measureBoutGeometricFloor";
import { prepareBoutFormulaResponses } from "../physics/prepareBoutFormulaResponses";

/** Precompute or independently re-admit identical numerical input; browser playback never integrates a second world. */
async function main(): Promise<void> {
  console.log(
    JSON.stringify({
      stage: "main-entered",
      pid: process.pid,
      parentPid: process.ppid,
      epochMs: Date.now(),
    }),
  );
  const duration: number = Number(process.argv[2] ?? 180);
  const destination: string = path.resolve(
    process.argv[3] ?? ".cache/physical/bout.amphys",
  );
  const kind: string = process.argv[4] ?? "simulated";
  const startSeconds: number = Number(process.argv[5] ?? 0);
  if (kind !== "simulated" && kind !== "kinematic")
    throw new Error("Expected simulated or kinematic mode");
  if (!destination.endsWith(".amphys"))
    throw new Error("Physics output must use .amphys");
  const start: number = performance.now();
  const costs: Record<string, number> = {};
  const authoredFitFindings: {
    seconds: number;
    body: string;
    approach: BoutTargetSource.ISample["approach"];
    residuals: Record<string, number>;
  }[] = [];

  /** Mark actual consumer seams; compiler/static-import preparation precedes main-entry and public compute still owns its internal fitting/native/cache work. */
  function record(
    stage: string,
    fields: Readonly<Record<string, unknown>> = {},
  ): void {
    console.log(
      JSON.stringify({
        stage,
        pid: process.pid,
        epochMs: Date.now(),
        elapsedMs: performance.now() - start,
        rssBytes: process.memoryUsage().rss,
        ...fields,
      }),
    );
  }

  let phaseStart: number = performance.now();
  record("source-identity-start");
  const sourceIdentity: string = await boutPhysicalSourceIdentity();
  costs.sourceIdentityMs = performance.now() - phaseStart;
  record("source-identity-end", {
    milliseconds: costs.sourceIdentityMs,
    sourceIdentity,
  });
  phaseStart = performance.now();
  record("source-construction-start");
  const source: BoutTargetSource = new BoutTargetSource();
  costs.sourceConstructionMs = performance.now() - phaseStart;
  record("source-construction-end", {
    milliseconds: costs.sourceConstructionMs,
  });
  phaseStart = performance.now();
  record("geometry-preparation-start");
  await source.prepare();
  costs.geometryPreparationMs = performance.now() - phaseStart;
  record("geometry-preparation-end", {
    milliseconds: costs.geometryPreparationMs,
  });
  phaseStart = performance.now();
  record("formula-response-preparation-start");
  await prepareBoutFormulaResponses(
    source,
    kind,
    startSeconds,
    startSeconds + duration,
  );
  costs.formulaResponsePreparationMs = performance.now() - phaseStart;
  record("formula-response-preparation-end", {
    milliseconds: costs.formulaResponsePreparationMs,
    contacts: source.formulaResponses.length,
  });
  phaseStart = performance.now();
  record("input-sampling-start", { duration, startSeconds, mode: kind });
  const input: Simulation.IInput = createBoutPhysicalInput(
    source,
    duration,
    kind,
    startSeconds,
    (
      seconds: number,
      samples: Parameters<
        NonNullable<Parameters<typeof createBoutPhysicalInput>[4]>
      >[1],
    ): void => {
      for (const [body, sample] of Object.entries(samples)) {
        const residuals: Record<string, number> = Object.fromEntries(
          Object.entries(sample.residuals ?? {}).filter(
            ([, value]: [string, number]): boolean =>
              value > Settings.targetTolerance,
          ),
        );
        if (sample.approach.converged && !Object.keys(residuals).length)
          continue;
        const finding: (typeof authoredFitFindings)[number] = {
          seconds,
          body,
          approach: sample.approach,
          residuals,
        };
        authoredFitFindings.push(finding);
        record("authored-fit-finding", finding);
      }
    },
  );
  costs.inputSamplingMs = performance.now() - phaseStart;
  record("input-sampling-end", {
    milliseconds: costs.inputSamplingMs,
    bodies: input.bodies.map((body: Simulation.IBody): object => ({
      id: body.id,
      targets: body.targets.length,
      initialDynamicSegments: body.targets[0]?.dynamicSegments,
      initialBindings: body.targets[0]?.bindings?.length ?? 0,
    })),
  });
  phaseStart = performance.now();
  record("input-admission-start");
  const identity: string = Simulation.identity(input);
  costs.inputAdmissionMs = performance.now() - phaseStart;
  record("input-admission-end", {
    milliseconds: costs.inputAdmissionMs,
    identity,
  });
  console.log(
    `Prepared ${duration}s ${kind} input in ${(performance.now() - start) / 1000}s; ${identity}`,
  );
  phaseStart = performance.now();
  record("target-audit-start");
  const targets: Awaited<ReturnType<typeof auditBoutMotion>> =
    await auditBoutMotion(
      source,
      (seconds: number): ReturnType<Playback["at"]> => {
        const step: number = Math.max(
          0,
          Math.min(
            Math.round(duration * input.rate),
            Math.round((seconds - startSeconds) * input.rate),
          ),
        );
        return {
          seconds,
          bodies: Object.fromEntries(
            input.bodies.map(
              (
                body: Simulation.IBody,
              ): [string, ReturnType<Playback["at"]>["bodies"][string]] => [
                body.id,
                Object.fromEntries(
                  Object.entries(body.targets[step]!.segments).map(
                    ([bone, pose]: [
                      string,
                      Simulation.IBody["profile"]["segments"][number]["neutral"],
                    ]): [
                      string,
                      ReturnType<Playback["at"]>["bodies"][string][string],
                    ] => [
                      bone,
                      {
                        ...pose,
                        velocity: { x: 0, y: 0, z: 0 },
                        angularVelocity: { x: 0, y: 0, z: 0 },
                      },
                    ],
                  ),
                ),
              ],
            ),
          ),
        };
      },
      startSeconds,
      startSeconds + duration,
      30,
    );
  costs.targetAuditMs = performance.now() - phaseStart;
  record("target-audit-end", {
    milliseconds: costs.targetAuditMs,
    findings: targets.findings.length,
  });
  phaseStart = performance.now();
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(
    `${destination}.targets.review.json`,
    JSON.stringify(
      {
        identity,
        sourceIdentity,
        startSeconds,
        duration,
        motion: targets,
        authoredFitFindings,
      },
      null,
      2,
    ),
    "utf8",
  );
  costs.targetAuditWriteMs = performance.now() - phaseStart;
  console.log(
    `Authored target inspection: ${targets.findings.length} findings before native integration`,
  );
  let reader:
    | Pick<Playback, "identity" | "contacts" | "recovery" | "at">
    | undefined;
  let bytes: Uint8Array | undefined;
  let tracking: Simulation.IDiagnostic[] | null = null;
  phaseStart = performance.now();
  record("archive-read-start");
  for (const file of [
    destination,
    destination.replace(/\.amphys$/, "-stale.amphys"),
  ]) {
    let manifest: { identity: string };
    try {
      manifest = JSON.parse(await readFile(`${file}.json`, "utf8"));
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    if (manifest.identity !== identity) continue;
    bytes = await readFile(file);
    reader = await Playback.decode(bytes, identity, {
      maximumBytes: 536870912,
      maximumFrames: 21601,
      maximumSegments: 78,
    });
    const prior: {
      identity: string;
      tracking: Simulation.IDiagnostic[] | null;
    } = JSON.parse(await readFile(`${file}.review.json`, "utf8"));
    if (prior.identity !== identity)
      throw new Error(
        "Cached tracking report does not match independently admitted input",
      );
    tracking = prior.tracking;
    console.log(`Reused verified identical sampled input: ${file}`);
    break;
  }
  costs.archiveReadMs = performance.now() - phaseStart;
  record("archive-read-end", {
    milliseconds: costs.archiveReadMs,
    reused: reader !== undefined,
  });
  let run: Simulation | undefined;
  if (!reader) {
    phaseStart = performance.now();
    record("compute-start", {
      identity,
      mode: kind,
      duration,
      rate: input.rate,
      substeps: input.substeps,
    });
    run = await Simulation.compute(
      input,
      undefined,
      undefined,
      (completed: number, total: number): void => {
        console.log(
          `Physical intervals: ${completed}/${total}; wall ${(performance.now() - start) / 1000}s; RSS ${process.memoryUsage().rss}`,
        );
      },
    );
    costs.computeMs = performance.now() - phaseStart;
    record("compute-end", {
      milliseconds: costs.computeMs,
      frames: run.cache.frames.length,
      contacts: run.cache.contacts.length,
    });
    reader = run.cache;
    tracking = run.tracking;
  }
  const complete: NonNullable<typeof reader> = reader;
  const at: (seconds: number) => ReturnType<Playback["at"]> = (
    seconds: number,
  ): ReturnType<Playback["at"]> => ({
    ...complete.at(seconds - startSeconds),
    seconds,
  });
  const profiles: Record<string, Simulation.IBody["profile"]> =
    Object.fromEntries(
      input.bodies.map(
        (body: Simulation.IBody): [string, Simulation.IBody["profile"]] => [
          body.id,
          body.profile,
        ],
      ),
    );
  const contacts: ReturnType<typeof absoluteBoutContacts> =
    absoluteBoutContacts(complete.contacts, startSeconds);
  phaseStart = performance.now();
  record("receipt-audit-start");
  if (kind === "kinematic")
    contacts.push(
      ...(await measureBoutGeometricFloor({
        profiles,
        at,
        start: startSeconds,
        end: startSeconds + duration,
        rate: input.rate,
      })),
    );
  const outcome: BoutReceipts.IResult = await BoutReceipts.measure({
    profiles: {
      a: source.rigs.a.profile,
      b: source.rigs.b.profile,
      referee: source.rigs.referee.profile,
    },
    contacts,
    at,
    start: startSeconds,
    end: startSeconds + duration,
    source: kind === "kinematic" ? "geometric" : "solver",
    geometricImpulses: boutGeometricImpulses(contacts, profiles, at),
  });
  costs.receiptAuditMs = performance.now() - phaseStart;
  record("receipt-audit-end", {
    milliseconds: costs.receiptAuditMs,
    findings: outcome.findings.length,
  });
  phaseStart = performance.now();
  record("motion-audit-start");
  const motion: Awaited<ReturnType<typeof auditBoutMotion>> =
    await auditBoutMotion(
      source,
      at,
      startSeconds,
      startSeconds + duration,
      10,
      { states: complete.recovery, startSeconds },
    );
  costs.motionAuditMs = performance.now() - phaseStart;
  record("motion-audit-end", {
    milliseconds: costs.motionAuditMs,
    findings: motion.findings.length,
  });
  phaseStart = performance.now();
  record("source-closure-start");
  const currentIdentity: string = await boutPhysicalSourceIdentity();
  costs.sourceClosureMs = performance.now() - phaseStart;
  record("source-closure-end", {
    milliseconds: costs.sourceClosureMs,
    sourceIdentity,
    currentIdentity,
  });
  const stale: boolean = currentIdentity !== sourceIdentity;
  const output: string = stale
    ? destination.replace(/\.amphys$/, "-stale.amphys")
    : destination;
  await mkdir(path.dirname(destination), { recursive: true });
  phaseStart = performance.now();
  await writeFile(
    `${output}.review.json`,
    JSON.stringify(
      {
        identity,
        sourceIdentity,
        currentIdentity,
        stale,
        startSeconds,
        duration,
        outcome,
        motion,
        tracking,
        authoredFitFindings,
        recovery: complete.recovery,
        costs,
      },
      null,
      2,
    ),
    "utf8",
  );
  costs.reviewWriteMs = performance.now() - phaseStart;
  console.log(
    JSON.stringify({
      identity,
      stale,
      contacts: complete.contacts.length,
      outcomeFailures: outcome.findings.length,
      motionFailures: motion.findings.length,
      review: `${output}.review.json`,
      seconds: (performance.now() - start) / 1000,
    }),
  );
  if (!bytes) {
    phaseStart = performance.now();
    record("encode-start");
    bytes = await Playback.encode(run!.cache, 536870912);
    costs.encodeMs = performance.now() - phaseStart;
    record("encode-end", { milliseconds: costs.encodeMs, bytes: bytes.length });
  }
  phaseStart = performance.now();
  record("archive-write-start", { output });
  await writeFile(output, bytes);
  await writeFile(
    `${output}.json`,
    JSON.stringify(
      {
        identity,
        sourceIdentity,
        mode: kind,
        formulaResponses: source.formulaResponses,
        stale,
        startSeconds,
        duration,
        rate: input.rate,
        bytes: bytes.length,
        seconds: (performance.now() - start) / 1000,
        profiles,
        costs,
      },
      null,
      2,
    ),
    "utf8",
  );
  costs.archiveWriteMs = performance.now() - phaseStart;
  record("archive-write-end", { milliseconds: costs.archiveWriteMs, output });
  record("complete", {
    identity,
    sourceIdentity,
    currentIdentity,
    stale,
    costs,
  });
  if (stale)
    throw new Error(
      `Source changed during bake; preserved inspection only at ${output}`,
    );
}

void main().catch((error: unknown): void => {
  console.error(
    JSON.stringify({
      stage: "physics-error",
      pid: process.pid,
      epochMs: Date.now(),
      error:
        error instanceof Error ? (error.stack ?? error.message) : String(error),
    }),
  );
  process.exitCode = 1;
});
