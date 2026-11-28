import { type ChildProcess, spawn } from "node:child_process";

export interface IBakeWorkerJob {
  key: string;
  id: string;
}

export type BakeWorkerMessage =
  | { type: "stage"; key: string; stage: "computing" | "encoding" }
  | { type: "complete"; key: string }
  | { type: "failed"; key: string; message: string };

export interface IBakeWorkerFailure {
  job: IBakeWorkerJob;
  type: "worker-failure" | "timeout";
  stage: "queued" | "starting" | "computing" | "encoding";
  elapsed: number;
  message: string;
}

interface IBakeWorkerOptions<Job extends IBakeWorkerJob> {
  args: readonly string[];
  jobs: readonly Job[];
  parallel: number;
  startupTimeout: number;
  takeTimeout: number;
  totalTimeout: number;
  accept: (job: Job) => "baked" | "refused";
  report: (line: string) => void;
}

interface IWorker {
  child: ChildProcess;
  closed: Promise<void>;
}

/**
 * Run a bounded queue over resident Node processes. The parent owns deadlines,
 * the observed state of each take, and promotion of completed results.
 *
 * Startup, take and queue budgets are milliseconds. A take starts when its
 * worker reports computation. Startup and active work both count toward the
 * queue budget.
 *
 * @returns Per-take timeouts and process failures, including queued work when
 *   the queue's budget expires.
 * @throws If a worker cannot be retired.
 */
export async function runBakeWorkers<Job extends IBakeWorkerJob>(
  options: IBakeWorkerOptions<Job>,
): Promise<IBakeWorkerFailure[]> {
  const started: number = performance.now();
  const deadline: number = started + options.totalTimeout;
  const failures: IBakeWorkerFailure[] = [];
  let next: number = 0;

  async function drain(): Promise<void> {
    let worker: IWorker | null = null;
    try {
      while (next < options.jobs.length && performance.now() < deadline) {
        const job: Job = options.jobs[next++]!;
        worker ??= start(options.args);
        const failure: IBakeWorkerFailure | null = await dispatch(
          worker.child,
          job,
          deadline,
          options,
        );
        if (failure !== null) {
          failures.push(failure);
          options.report(formatFailure(failure));
          const failed: IWorker = worker;
          worker = null;
          await stop(failed);
        }
      }
    } finally {
      if (worker !== null) await stop(worker);
    }
  }

  const lanes: PromiseSettledResult<void>[] = await Promise.allSettled(
    Array.from(
      { length: Math.min(options.parallel, options.jobs.length) },
      drain,
    ),
  );
  for (const lane of lanes) if (lane.status === "rejected") throw lane.reason;
  for (const job of options.jobs.slice(next)) {
    const failure: IBakeWorkerFailure = {
      job,
      type: "timeout",
      stage: "queued",
      elapsed: Math.round(performance.now() - started),
      message: "bake budget expired before dispatch",
    };
    failures.push(failure);
    options.report(formatFailure(failure));
  }
  return failures;
}

function start(args: readonly string[]): IWorker {
  const child: ChildProcess = spawn(process.execPath, args, {
    stdio: ["ignore", "inherit", "inherit", "ipc"],
  });
  // An idle worker can fail before its next take installs the error listener.
  child.on("error", () => {});
  const closed: Promise<void> = new Promise((resolve) =>
    child.once("close", () => resolve()),
  );
  return { child, closed };
}

async function stop(worker: IWorker): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    if (worker.child.exitCode === null && worker.child.signalCode === null)
      worker.child.kill("SIGKILL");
    await Promise.race([
      worker.closed,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `Gallery worker ${worker.child.pid ?? "unknown"} did not close`,
              ),
            ),
          5_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    // A failed termination is an infrastructure error. Release the parent's
    // handles so its report can reach the build runner.
    if (worker.child.connected) worker.child.disconnect();
    worker.child.unref();
  }
}

function dispatch<Job extends IBakeWorkerJob>(
  child: ChildProcess,
  job: Job,
  queueDeadline: number,
  options: IBakeWorkerOptions<Job>,
): Promise<IBakeWorkerFailure | null> {
  return new Promise((resolve) => {
    const started: number = performance.now();
    let stage: IBakeWorkerFailure["stage"] = "starting";
    let finished: boolean = false;
    let deadline: number = Math.min(
      queueDeadline,
      started + options.startupTimeout,
    );
    const elapsed = (): number => Math.round(performance.now() - started);
    const settle = (failure: IBakeWorkerFailure | null): void => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      child.off("message", onMessage);
      child.off("error", onError);
      child.off("close", onClose);
      resolve(failure);
    };
    const fail = (type: IBakeWorkerFailure["type"], message: string): void =>
      settle({ job, type, message, stage, elapsed: elapsed() });
    const expired = (): void =>
      fail(
        "timeout",
        deadline === queueDeadline
          ? "bake budget expired"
          : stage === "starting"
            ? "worker startup budget expired"
            : "take budget expired",
      );
    const onError = (error: unknown): void =>
      fail(
        "worker-failure",
        error instanceof Error ? error.message : String(error),
      );
    const onClose = (
      code: number | null,
      signal: NodeJS.Signals | null,
    ): void => fail("worker-failure", `process exited with ${signal ?? code}`);
    const onMessage = (message: BakeWorkerMessage): void => {
      const received: number = performance.now();
      if (received >= deadline) return expired();
      if (message?.key !== job.key)
        return fail("worker-failure", "unexpected result identity");
      if (
        message.type === "stage" &&
        ((stage === "starting" && message.stage === "computing") ||
          (stage === "computing" && message.stage === "encoding"))
      ) {
        stage = message.stage;
        if (stage === "computing") {
          // Loading the compiler and motion modules has its own bound. The
          // take clock starts when the child can actually enter the solve.
          clearTimeout(timer);
          deadline = Math.min(queueDeadline, received + options.takeTimeout);
          timer = setTimeout(expired, deadline - received);
        }
        options.report(`  ${stage} ${job.id} (${elapsed()} ms)`);
      } else if (message.type === "failed") {
        fail("worker-failure", message.message);
      } else if (message.type === "complete" && stage === "encoding") {
        try {
          options.report(
            `  ${options.accept(job)} ${job.id} (${elapsed()} ms)`,
          );
          settle(null);
        } catch (error) {
          onError(error);
        }
      } else {
        fail("worker-failure", "unexpected worker message");
      }
    };
    let timer: NodeJS.Timeout = setTimeout(expired, deadline - started);
    options.report(`  assigned ${job.id} to worker ${child.pid ?? "starting"}`);
    child.on("message", onMessage);
    child.once("error", onError);
    child.once("close", onClose);
    if (deadline <= started) return expired();
    try {
      child.send(job, (error) => {
        if (error !== null) onError(error);
      });
    } catch (error) {
      onError(error);
    }
  });
}

function formatFailure(failure: IBakeWorkerFailure): string {
  return `  ${failure.type} ${failure.job.id} at ${failure.stage} (${failure.elapsed} ms): ${failure.message}`;
}
