import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import {
  readBakeResult,
  writeBakeResult,
} from "../../../../website/build/bakeResults";
import { runBakeWorkers } from "../../../../website/build/bakeWorkerPool";

const FIXTURE = `
process.on("message", ({ key }) => {
  const stage = (value) => process.send({ type: "stage", key, stage: value });
  const compute = () => {
    stage("computing");
    if (key === "stalled" || key === "budget")
      return Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);
    if (key === "crash") return process.exit(7);
    const done = () => {
      stage("encoding");
      process.send({ type: "complete", key });
    };
    if (key === "slow") setTimeout(done, 50);
    else done();
  };
  if (key === "startup") setTimeout(compute, 1800);
  else compute();
});
`;

/**
 * A bounded gallery queue retires stalled or crashed processes, retains
 * finished results and reports work undispatched when the total budget
 * expires.
 *
 * Scenarios:
 *
 * 1. A stalled take and crashed take share one lane with successful slow and fast
 *    takes and an authored refusal.
 * 2. A total budget expires with one active take and one queued take.
 * 3. Three independent takes finish in parallel. One starts after its take budget
 *    would already have passed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The summary identifies process retirement, retained results and total-budget dispatch as the behavior under test.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the website's worker owner with real child processes. Observes its accepted results, reported phases and closed processes.
 * @evidence contracts/development/testing.md#independent-expectations The fixed queue order and fixture program identify which take stalls, exits, refuses or completes. Expected failures and accepted siblings are specified independently of timing measurements.
 */
export async function test_website_bake_workers(): Promise<void> {
  const output: string[] = [];
  const accepted: string[] = [];
  const failures = await runBakeWorkers({
    args: ["-e", FIXTURE],
    jobs: ["stalled", "slow", "crash", "refused", "valid"].map((key) => ({
      key,
      id: key,
    })),
    parallel: 1,
    startupTimeout: 6_000,
    takeTimeout: 2_000,
    totalTimeout: 18_000,
    accept: ({ key }) => {
      accepted.push(key);
      return key === "refused" ? "refused" : "baked";
    },
    report: (line) => {
      output.push(line);
    },
  });
  assert.deepEqual(
    accepted,
    ["slow", "refused", "valid"],
    JSON.stringify({ output, failures }),
  );
  assert.deepEqual(
    failures.map(({ job, type, stage }) => [job.id, type, stage]),
    [
      ["stalled", "timeout", "computing"],
      ["crash", "worker-failure", "computing"],
    ],
  );
  assert.ok(output.some((line) => line.includes("refused refused")));
  const pids: number[] = output.flatMap((line) => {
    const match: RegExpMatchArray | null = line.match(/to worker (\d+)/);
    return match === null ? [] : [Number(match[1])];
  });
  assert.equal(new Set(pids).size, 3);
  for (const pid of new Set(pids))
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });

  const budget = await runBakeWorkers({
    args: ["-e", FIXTURE],
    jobs: ["budget", "queued"].map((key) => ({ key, id: key })),
    parallel: 1,
    startupTimeout: 7_000,
    takeTimeout: 7_000,
    totalTimeout: 4_000,
    accept: () => {
      assert.fail("a take cannot complete after the budget");
    },
    report: () => {},
  });
  assert.deepEqual(
    budget.map(({ job, type, stage }) => [job.id, type, stage]),
    [
      ["budget", "timeout", "computing"],
      ["queued", "timeout", "queued"],
    ],
  );
  const parallelAccepted: string[] = [];
  const parallel = await runBakeWorkers({
    args: ["-e", FIXTURE],
    jobs: ["startup", "refused", "valid"].map((key) => ({ key, id: key })),
    parallel: 3,
    startupTimeout: 6_000,
    takeTimeout: 1_500,
    totalTimeout: 8_000,
    accept: ({ key }) => {
      parallelAccepted.push(key);
      return key === "refused" ? "refused" : "baked";
    },
    report: () => {},
  });
  assert.deepEqual(parallel, []);
  assert.deepEqual(parallelAccepted.sort(), ["refused", "startup", "valid"]);
}

/**
 * A retained gallery result is usable only with its original input identity and
 * intact output bytes.
 *
 * Scenarios:
 *
 * 1. A real compressed payload is recovered for the matching key.
 * 2. A different key and a truncated file are unavailable.
 * 3. An authored refusal is reusable and a worker error is unavailable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The summary identifies the two checks that admit a retained result and the listed cases separate them from refusal admission.
 * @evidence contracts/development/testing.md#behavioral-verification Writes actual result files with the same envelope used by the baker and reads them through the verified recovery function.
 * @evidence contracts/development/testing.md#independent-expectations The known compressed bytes, distinct key, one-byte truncation and two refusal kinds are constructed before the read. The results must distinguish each case.
 */
export function test_website_bake_result_identity(): void {
  const dir: string = fs.mkdtempSync(path.join(os.tmpdir(), "gallery-result-"));
  try {
    const file: string = path.join(dir, "take.result");
    const bytes: Buffer = zlib.gzipSync(Buffer.from("track"));
    writeBakeResult(file, "this-input", "take", bytes);
    assert.deepEqual(readBakeResult(file, "this-input"), {
      type: "take",
      bytes,
    });
    assert.equal(readBakeResult(file, "other-input"), null);
    fs.truncateSync(file, fs.statSync(file).size - 1);
    assert.equal(readBakeResult(file, "this-input"), null);

    const refusal: string = path.join(dir, "refusal.result");
    writeBakeResult(
      refusal,
      "this-input",
      "refusal",
      Buffer.from(JSON.stringify({ kind: "range", message: "outside range" })),
    );
    assert.deepEqual(readBakeResult(refusal, "this-input"), {
      type: "refusal",
      message: "outside range",
    });

    const failed: string = path.join(dir, "failure.result");
    writeBakeResult(
      failed,
      "this-input",
      "refusal",
      Buffer.from(JSON.stringify({ kind: "error", message: "engine fault" })),
    );
    assert.equal(readBakeResult(failed, "this-input"), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
