import { TestValidator } from "@nestia/e2e";
import { EventEmitter } from "node:events";

import { HumanDebugCaptureMonitor } from "../../../../../packages/human/debug/server/HumanDebugCaptureMonitor";
import { HumanDebugCaptureProbe } from "../../../../../packages/human/debug/server/HumanDebugCaptureProbe";

/** CDP type from the maintained helper's actual dependency owner, without a test dependency. */
type CDPSession = Awaited<
  ReturnType<ConstructorParameters<typeof HumanDebugCaptureProbe>[0]>
>;
/** Page boundary from the maintained monitor's public signature. */
type Page = Parameters<typeof HumanDebugCaptureMonitor.watched>[0];

/** An operation whose settlement the test owns. */
interface Deferred<T> {
  /** Pending operation. */ promise: Promise<T>;
  /** Complete with the authored value. */ resolve(value: T): void;
  /** Fail with the authored cause. */ reject(value: unknown): void;
}

/**
 * Actual capture resource helpers own setup, cancellation, late arrivals and
 * debugger cleanup without replacing any browser or global implementation.
 *
 * Scenarios:
 * 1. Performance.enable failure detaches its arrived session and keeps the cause.
 * 2. Work success/failure during acquire or setup wins unchanged; late sessions
 *    detach without starting new commands, and late rejection stays observed.
 * 3. Success while a sampling delay is pending closes the observer; a directly
 *    cancelled long delay rejects instead of leaving its timer alive.
 * 4. Trace success, enable/pause failure and grace expiry request resume,
 *    disable and detach; cleanup throw/hang never replaces the primary outcome.
 * 5. A frame's deadline starts a trace, then work resolves while pause's reply
 *    is pending: guard cancellation resumes the owned debugger and removes all
 *    page listeners without discarding that successful page.
 * 6. A real guard timeout fails with its stage even if disposal throws; its trace
 *    grace expires on a never-arriving CDP, which detaches when it arrives later.
 * 7. Nested guarded-to-watched setup failure and cancellation retire the inner
 *    probe before returning; an expired deadline never starts another grace.
 * 8. Evaluation completed before cleanup is cancelled cannot publish a discarded epoch.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the maintained Probe and Monitor guarded/watched/trace functions using owned narrow context/CDP protocol doubles. Observes exact returned/thrown identity, command order, detached state, listeners and cancelled delay completion; it catches leaked setup/late sessions and debugger pause left after the work wins.
 * @evidence contracts/development/testing.md#independent-expectations The authored work values/errors and explicit protocol event sequence determine expectations. An ended debugger owner must request resume/disable before detach, setup failure must detach, and work already finished admits no late setup. Small explicit test budgets exercise normal deadline branches without asserting host-dependent wall or heap limits. Doubles establish requests and ownership, not a real renderer's response or hardware image.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes success, arbitrary primary throw, acquisition/setup/command/cleanup failures, paused-response race, cancelled late publication, stalled acquisition, late success/rejection, repeated close, cancelled delay and timeout disposal failure. Existing stall unit owns the idle-rule series and boot unit owns DOM markers; real Chrome transport, module fetch and hardware frames remain unproved here.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable async portable CPU unit test_human_debug_capture_resources. Every EventEmitter, deferred operation and protocol double belongs to this test; no process, server, real browser, GPU, person generation or foreign runtime patch is used.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 8 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Performance.enable failure detaches its arrived session and keeps the cause.).
 */
export async function test_human_debug_capture_resources(): Promise<void> {
  const setupError: Error = new Error("owned setup");
  const broken: Channel = new Channel(
    (method: string): Promise<unknown> =>
      method === "Performance.enable"
        ? Promise.reject(setupError)
        : Promise.resolve({}),
  );
  const setup: unknown = await outcome(
    HumanDebugCaptureMonitor.watched(
      page((): Promise<CDPSession> => Promise.resolve(broken.port())),
      new Set(),
      never<string>(),
      5,
    ),
  );
  TestValidator.predicate(
    "setup cause preserved",
    setup === setupError && broken.detaches === 1,
  );

  TestValidator.predicate(
    "synchronous acquisition cause",
    (await outcome(
      HumanDebugCaptureMonitor.watched(
        page((): Promise<CDPSession> => {
          throw setupError;
        }),
        new Set(),
        never<string>(),
        5,
      ),
    )) === setupError,
  );

  for (const failure of [false, true]) {
    const open: Deferred<CDPSession> = deferred<CDPSession>();
    const value: { owned: boolean } = { owned: true };
    const work: Promise<unknown> = failure
      ? Promise.reject(value)
      : Promise.resolve(value);
    const late: Channel = new Channel();
    const read: unknown = await outcome(
      HumanDebugCaptureMonitor.watched(
        page((): Promise<CDPSession> => open.promise),
        new Set(),
        work,
        5,
      ),
    );
    TestValidator.predicate("early work identity " + failure, read === value);
    open.resolve(late.port());
    await late.detached.promise;
    TestValidator.predicate(
      "late acquisition only detaches " + failure,
      late.commands.length === 0 && late.detaches === 1,
    );
  }
  const failedOpen: Deferred<CDPSession> = deferred<CDPSession>();
  TestValidator.predicate(
    "success before late acquire error",
    (await HumanDebugCaptureMonitor.watched(
      page((): Promise<CDPSession> => failedOpen.promise),
      new Set(),
      Promise.resolve(7),
      5,
    )) === 7,
  );
  failedOpen.reject(new Error("late acquisition"));

  const enable: Deferred<unknown> = deferred<unknown>();
  const during: Deferred<string> = deferred<string>();
  const enabling: Channel = new Channel((method: string): Promise<unknown> => {
    if (method === "Performance.enable") {
      during.reject(setupError);
      return enable.promise;
    }
    return Promise.resolve({});
  });
  enabling.detachWork = (): Promise<unknown> =>
    Promise.reject(new Error("owned detach"));
  TestValidator.predicate(
    "work rejection while enable awaits",
    (await outcome(
      HumanDebugCaptureMonitor.watched(
        page((): Promise<CDPSession> => Promise.resolve(enabling.port())),
        new Set(),
        during.promise,
        5,
      ),
    )) === setupError && enabling.detaches === 1,
  );
  enable.reject(new Error("late enable"));

  const sampling: Deferred<string> = deferred<string>();
  const active: Channel = new Channel((method: string): Promise<unknown> => {
    if (method === "Performance.enable")
      queueMicrotask((): void => sampling.resolve("drawn"));
    return Promise.resolve({});
  });
  TestValidator.predicate(
    "work success during observation",
    (await HumanDebugCaptureMonitor.watched(
      page((): Promise<CDPSession> => Promise.resolve(active.port())),
      new Set(),
      sampling.promise,
      5,
    )) === "drawn" && active.detaches === 1,
  );
  const delayPort: Channel = new Channel();
  const probe: HumanDebugCaptureProbe = new HumanDebugCaptureProbe(
    (): Promise<CDPSession> => Promise.resolve(delayPort.port()),
    5,
  );
  const waiting: Promise<unknown> = outcome(probe.delay(60_000));
  await probe.close();
  TestValidator.predicate(
    "owned long delay cancelled",
    (await waiting) instanceof Error,
  );
  await probe.close();
  TestValidator.predicate("close is idempotent", delayPort.detaches === 1);

  for (const mode of [
    "success",
    "enable",
    "pause",
    "cleanup-throw",
    "cleanup-hang",
    "detach-throw",
    "detach-hang",
  ] as const) {
    const channel: Channel = new Channel();
    if (mode === "detach-throw")
      channel.detachWork = (): Promise<unknown> => Promise.reject(setupError);
    if (mode === "detach-hang")
      channel.detachWork = (): Promise<unknown> => never<unknown>();
    channel.handler = (method: string): Promise<unknown> => {
      if (method === "Debugger.enable" && mode === "enable")
        return Promise.reject(setupError);
      if (method === "Debugger.pause") {
        if (mode === "pause") return Promise.reject(setupError);
        channel.emit("Debugger.paused", {
          callFrames: [
            {
              functionName: "owned",
              url: "owned.ts",
              location: { lineNumber: 2, columnNumber: 3 },
            },
          ],
        });
      }
      if (method === "Debugger.resume" && mode === "cleanup-throw")
        throw setupError;
      if (method === "Debugger.disable" && mode === "cleanup-hang")
        return never<unknown>();
      return Promise.resolve({});
    };
    const stack: string | null = await HumanDebugCaptureMonitor.trace(
      page((): Promise<CDPSession> => Promise.resolve(channel.port())),
      undefined,
      20,
    );
    TestValidator.predicate(
      "trace outcome " + mode,
      stack ===
        (mode === "enable" || mode === "pause" ? null : "owned (owned.ts:3:4)"),
    );
    TestValidator.predicate(
      "trace cleanup order " + mode,
      channel.commands.slice(-2).join(",") ===
        "Debugger.resume,Debugger.disable" &&
        channel.detaches === 1 &&
        channel.listenerCount("Debugger.paused") === 0,
    );
  }

  // The pause request has applied; its delayed reply is not a second pause command.
  const drawn: Deferred<string> = deferred<string>();
  const pauseReply: Deferred<unknown> = deferred<unknown>();
  const racing: Channel = new Channel();
  let paused: boolean = false;
  racing.handler = (method: string): Promise<unknown> => {
    if (method === "Debugger.pause") {
      paused = true;
      drawn.resolve("valid frame");
      return pauseReply.promise;
    }
    if (method === "Debugger.resume") paused = false;
    return Promise.resolve({});
  };
  let discarded: number = 0;
  const framePage: Page = page(
    (): Promise<CDPSession> => Promise.resolve(racing.port()),
  );
  const frame: string = await HumanDebugCaptureMonitor.guarded(
    framePage,
    undefined,
    work(),
    (): Promise<string> => drawn.promise,
    async (): Promise<void> => {
      discarded++;
    },
    { frame: 1, grace: 20 },
  );
  pauseReply.resolve({});
  TestValidator.predicate(
    "work wins deadline trace",
    frame === "valid frame" &&
      !paused &&
      discarded === 0 &&
      racing.detaches === 1,
  );
  TestValidator.predicate(
    "guard removes listeners",
    (framePage as unknown as EventEmitter).eventNames().length === 0 &&
      racing.listenerCount("Debugger.paused") === 0,
  );

  const missing: Deferred<CDPSession> = deferred<CDPSession>();
  const expired: unknown = await outcome(
    HumanDebugCaptureMonitor.guarded(
      page((): Promise<CDPSession> => missing.promise),
      undefined,
      work(),
      (): Promise<string> => never<string>(),
      async (): Promise<void> => {
        throw setupError;
      },
      { frame: 1, grace: 5 },
    ),
  );
  TestValidator.predicate(
    "deadline cause survives disposal failure",
    expired instanceof Error &&
      expired.message.includes("exceeded its budget") &&
      expired.message.includes("owned stage"),
  );
  const arrived: Channel = new Channel();
  missing.resolve(arrived.port());
  await arrived.detached.promise;
  TestValidator.predicate(
    "trace late acquisition cleaned without debugger setup",
    arrived.commands.join(",") === "Debugger.resume,Debugger.disable" &&
      arrived.detaches === 1,
  );
  // An expired trace deadline cannot acquire a new grace while close is awaiting late retirement.
  const opening: Deferred<CDPSession> = deferred<CDPSession>();
  const retirement: Deferred<unknown> = deferred<unknown>();
  const lateProbe: HumanDebugCaptureProbe = new HumanDebugCaptureProbe(
    (): Promise<CDPSession> => opening.promise,
    10_000,
    true,
    Date.now() - 1,
  );
  const lateChannel: Channel = new Channel();
  lateChannel.detachWork = (): Promise<unknown> => retirement.promise;
  lateProbe.cancel();
  opening.resolve(lateChannel.port());
  await turn();
  let closed: boolean = false;
  const closing: Promise<void> = lateProbe.close().then((): void => {
    closed = true;
  });
  try {
    await turn();
    TestValidator.predicate(
      "expired deadline does not restart grace",
      closed && lateChannel.detaches === 1,
    );
  } finally {
    retirement.resolve(undefined);
    await closing;
  }

  for (const setupFailure of [false, true]) {
    const events: string[] = [];
    const observed: Channel = new Channel(
      (method: string): Promise<unknown> =>
        method === "Performance.enable"
          ? setupFailure
            ? Promise.reject(setupError)
            : never<unknown>()
          : Promise.resolve({}),
    );
    const tracing: Channel = new Channel();
    tracing.handler = (method: string): Promise<unknown> => {
      if (method === "Debugger.pause")
        tracing.emit("Debugger.paused", { callFrames: [] });
      return Promise.resolve({});
    };
    let opens: number = 0;
    const nestedPage: Page = page(
      (): Promise<CDPSession> =>
        Promise.resolve((opens++ === 0 ? observed : tracing).port()),
    );
    let nestedCause: unknown;
    try {
      await HumanDebugCaptureMonitor.guarded(
        nestedPage,
        undefined,
        work(),
        (signal: AbortSignal): Promise<string> =>
          HumanDebugCaptureMonitor.watched(
            nestedPage,
            new Set(),
            never<string>(),
            20,
            signal,
          ),
        async (): Promise<void> => {
          events.push("discard");
        },
        { frame: 1, grace: 20 },
      );
    } catch (error) {
      nestedCause = error;
    } finally {
      events.push("caller-release");
    }
    TestValidator.predicate(
      "nested observer outcome " + setupFailure,
      setupFailure
        ? nestedCause === setupError
        : nestedCause instanceof Error &&
            nestedCause.message.includes("exceeded its budget"),
    );
    TestValidator.predicate(
      "nested observer closed before caller returns " + setupFailure,
      observed.detaches === 1 && events.join(",") === "discard,caller-release",
    );
    TestValidator.predicate(
      "nested guard listeners released " + setupFailure,
      (nestedPage as unknown as EventEmitter).eventNames().length === 0,
    );
  }

  const cancelled: AbortController = new AbortController();
  const completed: Channel = new Channel();
  completed.detachWork = (): Promise<unknown> => {
    cancelled.abort();
    return Promise.resolve();
  };
  const lateValue: unknown = await outcome(
    HumanDebugCaptureMonitor.watched(
      page((): Promise<CDPSession> => Promise.resolve(completed.port())),
      new Set(),
      Promise.resolve("completed snapshot"),
      20,
      cancelled.signal,
    ),
  );
  TestValidator.predicate(
    "no success publication after cleanup cancellation",
    lateValue instanceof Error && completed.detaches === 1,
  );

  const publication: { source: string | undefined } = { source: "pending" };
  const late: Channel = new Channel();
  const latePage: Page = page(
    (): Promise<CDPSession> => Promise.resolve(late.port()),
  );
  late.detachWork = (): Promise<unknown> => {
    (latePage as unknown as EventEmitter).emit("crash");
    return Promise.resolve();
  };
  const lateCause: unknown = await outcome(
    HumanDebugCaptureMonitor.guarded(
      latePage,
      undefined,
      work(),
      (signal: AbortSignal): Promise<string> =>
        HumanDebugCaptureMonitor.watched(
          latePage,
          new Set(),
          Promise.resolve("discarded epoch"),
          20,
          signal,
        ).then((value: string): string => {
          publication.source = value;
          return value;
        }),
      async (): Promise<void> => {
        publication.source = undefined;
      },
      { frame: 10_000, grace: 20 },
    ),
  );
  TestValidator.predicate(
    "discarded epoch cannot be published late",
    lateCause instanceof Error &&
      lateCause.message.includes("page crashed") &&
      publication.source === undefined &&
      late.detaches === 1,
  );
}

/** A narrow owned CDP protocol endpoint, never a live browser replacement. */
class Channel extends EventEmitter {
  /** Requested protocol methods, in issue order. */ public readonly commands: string[] =
    [];
  /** Number of detach requests. */ public detaches: number = 0;
  /** Test-owned retirement outcome, including a failed or unanswered transport. */
  public detachWork: () => Promise<unknown> = (): Promise<unknown> =>
    Promise.resolve();
  /** Allows a late-acquire case to observe retirement without polling. */ public readonly detached: Deferred<unknown> =
    deferred<unknown>();
  /** Test-owned protocol behavior. */
  public constructor(
    public handler: (
      method: string,
    ) => Promise<unknown> = (): Promise<unknown> => Promise.resolve({}),
  ) {
    super();
  }
  /** Observe only the protocol surface used by the maintained helper. */
  public port(): CDPSession {
    return this as unknown as CDPSession;
  }
  /** Issue the authored protocol outcome. */
  public send(method: string): Promise<unknown> {
    this.commands.push(method);
    return this.handler(method);
  }
  /** Retire this owned endpoint. */
  public async detach(): Promise<void> {
    this.detaches++;
    await this.detachWork();
    this.detached.resolve(undefined);
  }
}

/** Supply only the context and event boundary the maintained monitor reads. */
function page(open: () => Promise<CDPSession>): Page {
  const owned: EventEmitter & {
    context(): { newCDPSession(page: Page): Promise<CDPSession> };
  } = Object.assign(new EventEmitter(), {
    context: (): { newCDPSession(page: Page): Promise<CDPSession> } => ({
      newCDPSession: (_page: Page): Promise<CDPSession> => open(),
    }),
  });
  return owned as unknown as Page;
}

/** A queue stage with authored identity, no host state. */
function work(): HumanDebugCaptureMonitor.IWork {
  return { query: "owned", stage: "owned stage", admitted: 0, started: 0 };
}

/** Observe resolution and arbitrary rejection without changing their identity. */
async function outcome(pending: Promise<unknown>): Promise<unknown> {
  try {
    return await pending;
  } catch (error) {
    return error;
  }
}

/** A pending owned operation, with no timer or transport behind it. */
function never<T>(): Promise<T> {
  return new Promise<T>((): void => {});
}

/** Create one explicitly settled owned operation. */
function deferred<T>(): Deferred<T> {
  let complete: (value: T) => void = (): void => {};
  let fail: (error: unknown) => void = (): void => {};
  const promise: Promise<T> = new Promise<T>(
    (resolve: (value: T) => void, reject: (error: unknown) => void): void => {
      complete = resolve;
      fail = reject;
    },
  );
  return { promise, resolve: complete, reject: fail };
}

/** Complete one authored event-loop turn without imposing a host-speed threshold. */
function turn(): Promise<undefined> {
  return new Promise<undefined>((resolve: (value: undefined) => void): void => {
    setImmediate(resolve, undefined);
  });
}
