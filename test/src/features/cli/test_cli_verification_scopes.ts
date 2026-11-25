import {
  type IAutoMovieVerification,
  runAutoMovieVerification,
} from "automovie";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

/**
 * The director can isolate, edit and rerun checks without hiding required work
 * or giving a previous result to a different criterion or input.
 *
 * Scenarios:
 *
 * 1. Two targets use the same local check ID. A scoped run evaluates only its
 *    chosen check and a status read runs none.
 * 2. Below-bound and valid measurements derive their verdicts from file contents.
 *    An input or bound change invalidates an earlier result. An explicit run
 *    repairs damaged latest JSON and preserves the first observed failure.
 * 3. An optional disabled and removed check has no gate effect. A removed or
 *    disabled required check blocks the stage even with another check
 *    selected.
 * 4. Changing a persisted display outcome cannot replace the measured value.
 * 5. An empty stage refuses. A mistyped scope refuses before running any selected
 *    check.
 * 6. Two runs of one check overlap. The passing run finishes last and leaves the
 *    first failure separate from its current result.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the scope, criterion, evidence and required-stage distinctions exercised.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the shared installed command evaluator, observes selected execution and reads its scoped output and receipts.
 * @evidence contracts/development/testing.md#independent-expectations The fixture writes literal lengths and bounds, with expected outcomes derived from those values and declared required IDs.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers missing, failing, passing, stale, disabled and removed criteria, a damaged receipt and its recreated replacement, successful and blocked stages, and isolated and multi-target selection.
 * @evidence contracts/development/testing.md#execution-ownership This portable CLI unit owns an isolated temporary directory and spawns no process or browser.
 */
export async function test_cli_verification_scopes(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(os.tmpdir(), "automovie-verify-"),
  );
  try {
    await fs.writeFile(path.join(root, "chair.json"), "1");
    await fs.writeFile(path.join(root, "motion.json"), "3");
    const seen: string[] = [];
    const measurement = (
      name: string,
      minimum: number,
    ): IAutoMovieVerification.IMeasurement => ({
      id: "gap",
      kind: "measure",
      title: "The part clears its support",
      scope: name,
      inputs: [`${name}.json`],
      unit: "m",
      minimum,
      measure: async (directory: string): Promise<number> => {
        seen.push(name);
        return Number(
          await fs.readFile(path.join(directory, `${name}.json`), "utf8"),
        );
      },
    });
    const chair: IAutoMovieVerification.IMeasurement = measurement("chair", 2);
    const motion: IAutoMovieVerification.IMeasurement = measurement(
      "motion",
      2,
    );
    const run = async (
      checks: readonly IAutoMovieVerification.Check[],
      run: boolean,
      subjects: readonly string[] = ["chair"],
      only: readonly string[] = [],
      require: string | null = null,
    ): Promise<IAutoMovieVerification.IReport> =>
      runAutoMovieVerification({
        root,
        env: {},
        targets: [
          { id: "chair", checks, required: { handoff: ["gap"] } },
          { id: "motion", checks: [motion], required: { handoff: ["gap"] } },
        ],
        options: { subjects: [...subjects], only: [...only], run, require },
      });

    assert.equal((await run([chair], false)).items[0]?.state, "not-run");
    assert.deepEqual(seen, []);
    const failed: IAutoMovieVerification.IReport = await run(
      [chair],
      true,
      ["chair"],
      ["gap"],
    );
    assert.equal(failed.items[0]?.state, "failed");
    assert.equal(failed.blocked, false);
    assert.deepEqual(seen, ["chair"]);
    assert.equal(
      (await run([chair], false, ["motion"])).items[0]?.state,
      "not-run",
    );

    await fs.writeFile(path.join(root, "chair.json"), "3");
    assert.equal((await run([chair], false)).items[0]?.state, "stale");
    const receipt: string = path.resolve(root, failed.items[0]!.evidence!);
    const witness: string = receipt.replace(/\.json$/u, ".first-failure.json");
    const firstFailure: string = await fs.readFile(witness, "utf8");
    assert.match(
      firstFailure,
      /"outcome":\{"state":"failed".+"measurement":1/u,
    );
    await fs.writeFile(receipt, "{broken receipt");
    const damagedReceipt: IAutoMovieVerification.IResult = (
      await run([chair], false)
    ).items[0]!;
    assert.equal(damagedReceipt.state, "unobserved");
    assert.equal(damagedReceipt.evidence, path.relative(root, receipt));
    assert.match(damagedReceipt.message, /verify --run/u);
    await fs.writeFile(path.join(root, "capture.json"), "{broken capture");
    const damagedCapture: IAutoMovieVerification.IResult = (
      await run(
        [
          {
            id: "capture",
            kind: "capture",
            title: "Chair stays on its support",
            scope: "front view",
            record: "capture.json",
            subject: "chair",
            occurrence: "chair/0",
            view: "front",
            pass: "beauty",
            diagnostic: { check: "contact", key: "chair" },
            at: { second: 0 },
          },
        ],
        false,
      )
    ).items[0]!;
    assert.equal(damagedCapture.state, "unobserved");
    assert.equal(damagedCapture.evidence, "capture.json");
    assert.match(damagedCapture.message, /Restore its record or refresh/u);
    const passed: IAutoMovieVerification.IReport = await run(
      [chair],
      true,
      ["chair", "motion"],
      [],
      "handoff",
    );
    assert.equal(passed.blocked, false);
    assert.deepEqual(
      passed.items.map((item) => [item.target, item.id, item.state]),
      [
        ["chair", "gap", "passed"],
        ["motion", "gap", "passed"],
      ],
    );
    const saved: string = await fs.readFile(receipt, "utf8");
    assert.equal(await fs.readFile(witness, "utf8"), firstFailure);
    await fs.writeFile(
      receipt,
      saved.replace('"measurement":3', '"measurement":1'),
    );
    assert.equal((await run([chair], false)).items[0]?.state, "failed");
    await fs.writeFile(receipt, saved);
    assert.equal(
      (await run([{ ...chair, minimum: 4 }], false)).items[0]?.state,
      "stale",
    );
    const optional: IAutoMovieVerification.IMeasurement = {
      ...chair,
      id: "scratch",
      enabled: false,
    };
    const disabled: IAutoMovieVerification.IReport = await run(
      [chair, optional],
      true,
      ["chair"],
      ["scratch"],
      "handoff",
    );
    assert.deepEqual(
      disabled.items.map((item) => item.state),
      ["passed", "disabled"],
    );
    assert.equal(disabled.blocked, false);
    assert.deepEqual(
      (await run([chair], false)).items.map((item) => item.id),
      ["gap"],
    );
    const omitted: IAutoMovieVerification.IReport = await run(
      [optional],
      false,
      ["chair"],
      ["scratch"],
      "handoff",
    );
    assert.equal(omitted.blocked, true);
    assert.deepEqual(
      omitted.items.map((item) => [item.id, item.state]),
      [
        ["scratch", "disabled"],
        ["gap", "not-run"],
      ],
    );
    assert.equal(
      (
        await run(
          [{ ...chair, enabled: false }],
          false,
          ["chair"],
          [],
          "handoff",
        )
      ).blocked,
      true,
    );
    const count: number = seen.length;
    await assert.rejects(
      run([chair], true, ["chair"], ["gap", "misspelled"]),
      /No selected verification check named misspelled/u,
    );
    assert.equal(seen.length, count);
    await assert.rejects(
      runAutoMovieVerification({
        root,
        env: {},
        targets: [{ id: "chair", checks: [chair], required: { handoff: [] } }],
        options: {
          subjects: ["chair"],
          only: [],
          run: false,
          require: "handoff",
        },
      }),
      /needs named requirements/u,
    );

    let markProbeStarted!: () => void;
    const probeStarted: Promise<void> = new Promise((resolve) => {
      markProbeStarted = resolve;
    });
    let releaseProbe!: () => void;
    const probeReleased: Promise<void> = new Promise((resolve) => {
      releaseProbe = resolve;
    });
    let probing: boolean = false;
    const concurrent: IAutoMovieVerification.IMeasurement = {
      ...chair,
      id: "clearance-probe",
      measure: async (directory: string): Promise<number> => {
        if (probing) throw new Error("The clearance probe failed");
        probing = true;
        markProbeStarted();
        await probeReleased;
        return Number(
          await fs.readFile(path.join(directory, "chair.json"), "utf8"),
        );
      },
    };
    const pending: Promise<IAutoMovieVerification.IReport> = run(
      [concurrent],
      true,
    );
    await probeStarted;
    const concurrentFailure: IAutoMovieVerification.IReport = await run(
      [concurrent],
      true,
    ).finally(releaseProbe);
    const concurrentPass: IAutoMovieVerification.IReport = await pending;
    assert.equal(concurrentFailure.items[0]?.state, "failed");
    assert.equal(concurrentPass.items[0]?.state, "passed");
    const concurrentReceipt: string = path.resolve(
      root,
      concurrentPass.items[0]!.evidence!,
    );
    assert.match(
      await fs.readFile(
        concurrentReceipt.replace(/\.json$/u, ".first-failure.json"),
        "utf8",
      ),
      /"message":"The clearance probe failed"/u,
    );
    assert.equal((await run([concurrent], false)).items[0]?.state, "passed");

    const beforeDuplicate: number = seen.length;
    const duplicate: IAutoMovieVerification.IReport = await run([chair], true, [
      "chair",
      "chair",
    ]);
    assert.deepEqual(duplicate.targets, ["chair"]);
    assert.equal(duplicate.items.length, 1);
    assert.equal(seen.length, beforeDuplicate + 1);

    const movie: string = path.join(root, "film.mp4");
    await fs.writeFile(movie, "first movie");
    await fs.writeFile(
      path.join(root, "render-report.json"),
      JSON.stringify({
        subject: "chair",
        status: "published",
        video: "film.mp4",
        source: {
          file: ".render-fixture/film.mp4",
          sha256: createHash("sha256").update("first movie").digest("hex"),
        },
      }),
    );
    const published: IAutoMovieVerification.IDelivery = {
      id: "published-before",
      kind: "delivery",
      title: "The first movie matches the report",
      scope: "published movie",
      report: "render-report.json",
      subject: "chair",
    };
    const replace: IAutoMovieVerification.IMeasurement = {
      ...chair,
      id: "simulate-republish",
      measure: async (): Promise<number> => {
        await fs.writeFile(movie, "other movie");
        return 3;
      },
    };
    const replaced: IAutoMovieVerification.IReport = await run(
      [
        published,
        { ...published, id: "published-also" },
        replace,
        { ...published, id: "published-after" },
      ],
      true,
    );
    assert.deepEqual(
      replaced.items.map((item) => item.state),
      ["passed", "passed", "passed", "stale"],
    );
  } finally {
    await fs.rm(root, { recursive: true, force: false });
  }
}
