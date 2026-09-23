import { createBodySimpleWorkerTransport } from "@automovie/playground/src/human/bodySimpleWorkerTransport";
import { TestValidator } from "@nestia/e2e";

type Envelope = { id: number; kind: string };

class FakeWorker {
  onmessage: Worker["onmessage"] = null;
  onerror: Worker["onerror"] = null;
  onmessageerror: Worker["onmessageerror"] = null;
  sent: Envelope[] = [];
  stopped = 0;
  sendFailure: Error | null = null;
  postMessage(message: Envelope): void {
    if (this.sendFailure !== null) throw this.sendFailure;
    this.sent.push(message);
  }
  terminate(): void {
    this.stopped++;
  }
  reply(data: { id: number; result?: unknown; error?: string }): void {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
  fail(message: string): void {
    this.onerror?.call(this as unknown as Worker, { message } as ErrorEvent);
  }
  unreadable(): void {
    this.onmessageerror?.call(this as unknown as Worker, {} as MessageEvent);
  }
}

/**
 * Body simple-tier replies settle by connection and request, and a lost
 * connection never leaves the panel awaiting a numerical result forever.
 *
 * Scenarios:
 * 1. Concurrent replies, an unknown ID, and a duplicate reply preserve correlation.
 * 2. A numerical refusal affects one request and leaves the worker resident.
 * 3. Error and unreadable-message events reject all pending requests once.
 * 4. A silent loss reaches its deadline; stale callbacks cannot affect recovery.
 * 5. Idle failure, allocation failure, send failure and timer failure permit restart.
 */
export const test_human_body_simple_worker_transport =
  async (): Promise<void> => {
    const workers: FakeWorker[] = [];
    const timers = new Map<number, () => void>();
    let nextTimer = 0;
    let factoryFailure: Error | null = null;
    let timerFailure = false;
    const transport = createBodySimpleWorkerTransport(
      () => {
        if (factoryFailure !== null) throw factoryFailure;
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
      },
      {
        schedule: (callback, delayMs) => {
          TestValidator.equals("loss deadline", delayMs, 30_000);
          if (timerFailure) throw new Error("timer unavailable");
          const handle = ++nextTimer;
          timers.set(handle, callback);
          return handle;
        },
        cancel: (handle) => {
          timers.delete(handle as number);
        },
      },
    );
    const outcome = <T>(request: Promise<T>): Promise<T | string> =>
      request.catch((error: unknown) => (error as Error).message);
    const ask = (kind: string): Promise<number> =>
      transport.ask<number>({ kind });

    const a = outcome(ask("expand"));
    const b = outcome(ask("project"));
    const first = workers[0];
    const completedDeadline = [...timers.values()][0];
    TestValidator.equals("one shared worker", workers.length, 1);
    first.reply({ id: 99, result: -1 });
    first.reply({ id: first.sent[1].id, result: 20 });
    first.reply({ id: first.sent[0].id, result: 10 });
    first.reply({ id: first.sent[0].id, result: -1 });
    completedDeadline();
    TestValidator.equals(
      "out-of-order correlation",
      await Promise.all([a, b]),
      [10, 20],
    );
    TestValidator.equals("completed deadlines cleared", timers.size, 0);

    const refused = outcome(ask("project"));
    first.reply({ id: first.sent[2].id, error: "invalid body values" });
    TestValidator.equals(
      "numerical error",
      await refused,
      "invalid body values",
    );
    const stillReady = outcome(ask("expand"));
    first.reply({ id: first.sent[3].id, result: 40 });
    TestValidator.equals(
      "worker survives numerical error",
      await stillReady,
      40,
    );
    const emptyReason = outcome(ask("project"));
    first.reply({ id: first.sent[4].id, error: "  " });
    TestValidator.equals(
      "blank numerical refusal has a reason",
      await emptyReason,
      "The body simple worker refused the request.",
    );
    TestValidator.equals("numerical error keeps connection", first.stopped, 0);

    const c = outcome(ask("expand"));
    const d = outcome(ask("project"));
    first.fail("  ");
    first.fail("late error");
    TestValidator.equals("blank error rejects all", await Promise.all([c, d]), [
      "The body simple worker failed.",
      "The body simple worker failed.",
    ]);
    TestValidator.equals("failed worker stopped once", first.stopped, 1);
    TestValidator.equals("failure cleared deadlines", timers.size, 0);

    const e = outcome(ask("expand"));
    const second = workers[1];
    first.reply({ id: second.sent[0].id, result: -1 });
    second.reply({ id: second.sent[0].id, result: 50 });
    TestValidator.equals("old worker cannot answer new request", await e, 50);
    const f = outcome(ask("project"));
    second.unreadable();
    second.unreadable();
    TestValidator.equals(
      "message decode error",
      await f,
      "The body simple worker reply could not be read.",
    );
    TestValidator.equals("unreadable worker stopped once", second.stopped, 1);

    const g = outcome(ask("expand"));
    const h = outcome(ask("project"));
    const third = workers[2];
    const lostDeadline = [...timers.values()][0];
    lostDeadline();
    lostDeadline();
    TestValidator.equals(
      "silent loss rejects every request",
      await Promise.all([g, h]),
      [
        "The body simple worker did not respond within 30 seconds.",
        "The body simple worker did not respond within 30 seconds.",
      ],
    );
    TestValidator.equals("silent loss stops once", third.stopped, 1);
    TestValidator.equals("silent loss clears deadlines", timers.size, 0);
    const i = outcome(ask("project"));
    const fourth = workers[3];
    third.reply({ id: fourth.sent[0].id, result: -1 });
    lostDeadline();
    fourth.reply({ id: fourth.sent[0].id, result: 90 });
    TestValidator.equals("restart after silent loss", await i, 90);
    fourth.fail("crashed while idle");
    TestValidator.equals("idle error retires connection", fourth.stopped, 1);

    factoryFailure = new Error("allocation failed");
    TestValidator.equals(
      "factory error",
      await outcome(ask("expand")),
      "Error: allocation failed",
    );
    factoryFailure = null;
    const j = outcome(ask("project"));
    const fifth = workers[4];
    fifth.reply({ id: fifth.sent[0].id, result: 100 });
    TestValidator.equals("recovery after factory error", await j, 100);
    const detail = outcome(ask("expand"));
    fifth.fail("worker crashed");
    TestValidator.equals("error detail", await detail, "worker crashed");
    const k = outcome(ask("expand"));
    const sixth = workers[5];
    sixth.sendFailure = new Error("send failed");
    const l = outcome(ask("project"));
    TestValidator.equals(
      "synchronous send rejects all",
      await Promise.all([k, l]),
      ["Error: send failed", "Error: send failed"],
    );
    TestValidator.equals("send failure stops worker", sixth.stopped, 1);
    timerFailure = true;
    TestValidator.equals(
      "clock failure",
      await outcome(ask("expand")),
      "Error: timer unavailable",
    );
    TestValidator.equals("clock failure stops worker", workers[6].stopped, 1);
    timerFailure = false;
    const m = outcome(ask("project"));
    const eighth = workers[7];
    eighth.reply({ id: eighth.sent[0].id, result: 130 });
    TestValidator.equals("recovery after clock failure", await m, 130);
    TestValidator.equals("no pending deadlines", timers.size, 0);

    const nativeWorker = new FakeWorker();
    const nativeClock = createBodySimpleWorkerTransport(() => nativeWorker);
    const nativeResult = nativeClock.ask<number>({ kind: "expand" });
    nativeWorker.reply({ id: nativeWorker.sent[0].id, result: 140 });
    TestValidator.equals("default browser clock", await nativeResult, 140);
  };
