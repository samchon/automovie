import type {
  IAutoMovieCaptureCellRecord,
  IAutoMovieCapturePlan,
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureRecord,
  IAutoMovieCaptureSubject,
} from "@automovie/interface";
import { AutoMovieCaptureHost, readAutoMovieRevision } from "automovie";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/** One native capture request and its unique output folder name. */
interface Job {
  /** Plain folder name, unique within this round. */
  id: string;
  /** Native request text; the render owner admits keys and values. */
  request: Readonly<Record<string, string>>;
}

/** A reviewed source revision and finite list of instrument requests. */
interface Round {
  /** Clean source commit required throughout the round. */
  revision: string;
  /** Task-owned evidence directory, absolute or relative to the package. */
  out: string;
  /** Every requested purpose/selection/pass group, written before drawing. */
  jobs: readonly Job[];
}

/** One admitted request and its fully materialized native cell plan. */
interface Prepared {
  /** Original named request. */
  job: Job;
  /** Native parsed request used again by the same capture owner. */
  request: IAutoMovieCapturePlanRequest;
  /** Full subject/times/views/passes cell list, resolved before any draw. */
  plan: IAutoMovieCapturePlan;
}

/** Result of one requested group, including planning failures and failed cells. */
interface Result {
  /** Manifest identity. */
  id: string;
  /** Native evidence folder, even when planning prevented a capture. */
  out: string;
  /** Failed native cells or one preparation/host failure. */
  failures: readonly string[];
  /** Completed native cell count; zero when planning failed. */
  cells: number;
}

/**
 * Execute an archetype inspection round through one shared native capture host.
 *
 * Run from packages/archetypes with `pnpm exec ttsx --no-plugins --noCheck
 * src/executable/captureArchetypeRound.ts <manifest.json>`. The JSON contains
 * revision, out and jobs of {id, request}; request holds native string options.
 * This is host review tooling, not a unit test or another compiler/watch.
 *
 * @param manifest Path to the complete reviewed round's plain-data manifest.
 * @returns After all admissible requests finish and owned host resources close.
 * @throws {Error} For invalid input, source drift or any failed plan/capture cell, after recording every collected group result.
 * @evidence contracts/development/common.md#meaningful-documentation States the package cwd/command, JSON shape, clean pinned revision, full preplanning, instrument consumer, sequential draw ownership, evidence output and all failure propagation.
 * @evidence contracts/development/implementation.md#principled-implementation Native AutoMovieCaptureHost supplies the real subjects page, renderer, browser and capture records. Every request is parsed and its complete native cell plan materialized before drawing; the same pinned source and original native request then drive capture. No surrogate render, fixture result or pixel verdict is introduced.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the finite data manifest, pin source, open one host, prepare every request, write the complete plan ledger, draw valid groups in order, record their results and close in finally.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Planning/cell failures remain recorded failures and never trigger fallback, backend substitution, source mutation or retry. Native failed-cell records remain authoritative; completion of this tool establishes capture availability, not visual correctness.
 * @evidence contracts/development/implementation.md#efficient-algorithms One page build/browser launch serves J requests and C cells. Successful preparation opens U pages for U distinct subjects, rather than J pages; drawing still opens J fresh pages. A failed open/close is not cached, so preparation can attempt up to J pages. Planning and ledger serialization are linear in C plus the subject descriptions serialized with each plan. Requests run sequentially and the native capture core bounds live image storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every request shares the exact built page, browser, pinned clean revision and null props. This fixed archetype module describes each named subject deterministically, so its plain RPC metadata is reused by exact subject identity within this invocation; the planner does not mutate it. Every request still gets its full native plan, and capture independently describes and draws a fresh session. No metadata survives into another invocation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The function owns one host until its finally attempts close. Every preparation session has a finally close attempt and its metadata is cached only after close succeeds; native capture also owns its page's close attempt. A failed close is recorded and may leave that page until the final host close attempt. At most U distinct plain subject descriptions, O(C+J) plans/results and the temporary serialized ledger live for this invocation; evidence files remain caller-owned. Cached descriptions retain no page, renderer or process. No background worker or compiler is created.
 */
export async function captureArchetypeRound(manifest: string): Promise<void> {
  const root: string = process.cwd();
  const round: Round = admit(JSON.parse(await fs.readFile(manifest, "utf8")));
  const output: string = path.resolve(root, round.out);
  const results: Result[] = [];
  const prepared: Prepared[] = [];
  const subjects: Map<string | null, IAutoMovieCaptureSubject> = new Map();
  pin();
  await fs.mkdir(output, { recursive: true });
  const host: AutoMovieCaptureHost = await AutoMovieCaptureHost.open({
    root,
    module: "src/executable/subjects.ts",
    backend: "software",
    env: process.env,
  }).catch(async (error: unknown): Promise<never> => {
    for (const job of round.jobs)
      results.push({
        id: job.id,
        out: path.join(output, job.id),
        cells: 0,
        failures: [describe(error)],
      });
    await fs.writeFile(
      path.join(output, "round-results.json"),
      JSON.stringify(
        {
          revision: round.revision,
          requested: round.jobs.length,
          results,
        },
        null,
        2,
      ),
    );
    throw error;
  });
  try {
    // Resolve the whole round before its first picture, including every failed group.
    for (const job of round.jobs) {
      pin();
      try {
        const request: IAutoMovieCapturePlanRequest =
          host.render.parseAutoMovieCapturePlanRequest(
            new URLSearchParams(Object.entries(job.request)),
          );
        let subject: IAutoMovieCaptureSubject | undefined = subjects.get(
          request.subject,
        );
        if (subject === undefined) {
          const session: Awaited<ReturnType<AutoMovieCaptureHost["session"]>> =
            await host.session({ subject: request.subject, props: null });
          try {
            subject = session.subject;
          } finally {
            await session.close();
          }
          subjects.set(request.subject, subject);
        }
        prepared.push({
          job,
          request,
          plan: host.render.planAutoMovieCapture({
            request,
            subject,
            cuts: [],
          }),
        });
      } catch (error) {
        results.push({
          id: job.id,
          out: path.join(output, job.id),
          cells: 0,
          failures: [describe(error)],
        });
      }
    }
    await fs.writeFile(
      path.join(output, "planned-cells.json"),
      JSON.stringify(
        {
          revision: round.revision,
          manifest: path.resolve(manifest),
          prepared,
          preparationFailures: results,
        },
        null,
        2,
      ),
    );

    for (const item of prepared) {
      pin();
      const out: string = path.join(output, item.job.id);
      try {
        const record: Extract<IAutoMovieCaptureRecord, { state: "complete" }> =
          await host.capture({ request: item.request, props: null, out });
        results.push({
          id: item.job.id,
          out,
          cells: record.rows.length,
          failures: record.rows
            .filter(
              (
                row: IAutoMovieCaptureCellRecord,
              ): row is Extract<
                IAutoMovieCaptureCellRecord,
                { state: "failed" }
              > => row.state === "failed",
            )
            .map(
              (
                row: Extract<IAutoMovieCaptureCellRecord, { state: "failed" }>,
              ): string => row.cause,
            ),
        });
      } catch (error) {
        results.push({
          id: item.job.id,
          out,
          cells: 0,
          failures: [describe(error)],
        });
      }
      console.log(JSON.stringify(results[results.length - 1]));
    }
  } finally {
    try {
      await host.close();
    } finally {
      const finished: ReadonlySet<string> = new Set(
        results.map((result: Result): string => result.id),
      );
      await fs.writeFile(
        path.join(output, "round-results.json"),
        JSON.stringify(
          {
            revision: round.revision,
            requested: round.jobs.length,
            results,
            unexecuted: round.jobs
              .filter((job: Job): boolean => !finished.has(job.id))
              .map((job: Job): string => job.id),
          },
          null,
          2,
        ),
      );
    }
  }
  if (results.some((result: Result): boolean => result.failures.length !== 0))
    throw new Error(
      "Archetype capture round has failures; read round-results.json and all native records",
    );

  /** A changing source cannot silently mix revisions inside one inspection round. */
  function pin(): void {
    const actual: string = readAutoMovieRevision(root);
    if (actual !== round.revision)
      throw new Error(
        `Archetype source changed: expected ${round.revision}, received ${actual}`,
      );
  }
}

/** Admit every manifest field before acquiring a host; native request semantics stay with render. */
function admit(value: unknown): Round {
  if (
    !object(value) ||
    typeof value.revision !== "string" ||
    !/^[a-f0-9]{40}$/u.test(value.revision) ||
    typeof value.out !== "string" ||
    value.out.trim() === "" ||
    !Array.isArray(value.jobs) ||
    value.jobs.length === 0
  )
    throw new Error(
      "Capture manifest needs a clean40-character commit, output folder and nonempty jobs",
    );
  const jobs: Job[] = [];
  const ids: Set<string> = new Set();
  for (const input of value.jobs) {
    if (
      !object(input) ||
      typeof input.id !== "string" ||
      !/^[a-z0-9][a-z0-9._-]*$/iu.test(input.id) ||
      ids.has(input.id) ||
      !object(input.request)
    )
      throw new Error(
        "Every capture job needs a unique plain folder id and a native request map",
      );
    const entries: [string, string][] = [];
    for (const [key, item] of Object.entries(input.request)) {
      if (typeof item !== "string")
        throw new Error(`Capture request ${input.id}/${key} must be text`);
      entries.push([key, item]);
    }
    ids.add(input.id);
    jobs.push({ id: input.id, request: Object.fromEntries(entries) });
  }
  return { revision: value.revision, out: value.out, jobs };
}

/** Unknown parsed JSON is only indexed after admitting a plain non-array object. */
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Preserve the original cause of a host/planner failure in the round ledger. */
function describe(error: unknown): string {
  return error instanceof Error
    ? (error.stack ?? error.message)
    : String(error);
}

// Importing the host helper must not start a browser; only its explicit command does.
if (
  /^captureArchetypeRound\.(?:ts|js)$/iu.test(
    path.basename(process.argv[1] ?? ""),
  )
)
  captureArchetypeRound(process.argv[2] ?? "").catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
