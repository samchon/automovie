import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import type { IPlaygroundRefusal } from "../playground/structures/IPlaygroundRefusal";
import type { IPlaygroundVerdicts } from "../playground/structures/IPlaygroundVerdicts";
import type { ITake } from "./structures/ITake";
import type { ITakeRequest } from "./structures/ITakeRequest";
import type { ITakeResponse } from "./structures/ITakeResponse";

/**
 * The page's side of the take workers: the one path by which a scene view
 * and the playground compute a composition.
 *
 * Requests wait in one queue and run on a pool of workers made on demand,
 * each importing the packages once. A computed take, and a refusal, is kept
 * for the life of the page, so a view that scrolls back or a second view of
 * the same take asks for nothing; a failure is forgotten, so a later view
 * asks again. A take request still waiting in the queue when every view
 * asking for it has gone is dropped, so a fast scroll past a gallery does not
 * hold the views the visitor stops at.
 */
export namespace TakeClient {
  /** What computing a composition gives. */
  export type Result =
    | {
        /** The composition plans. */
        kind: "take";

        /** Its take. */
        take: ITake;
      }
    | {
        /** The packages refused it. */
        kind: "refusal";

        /** Why, in their words. */
        refusal: IPlaygroundRefusal;
      };

  /** One request in the queue or on a worker. */
  interface IJob {
    /** What is asked. */
    request: ITakeRequest;

    /** The worker that must answer it, as one that built the performance a verdict reads; any when null. */
    owner: IWorker | null;

    /** Views still waiting for it; a queued take nobody waits for is dropped. */
    waiting: number;

    /** Settle it with the worker's answer. */
    answer(response: ITakeResponse): void;

    /** Settle it with a failure of the worker itself. */
    fail(error: Error): void;
  }

  /** One worker of the pool. */
  interface IWorker {
    /** The worker. */
    worker: Worker;

    /** The request it is answering; null while idle. */
    job: IJob | null;
  }

  /** One cached take. */
  interface IEntry {
    /** The job while it is queued or running; null once settled. */
    job: IJob | null;

    /** Its outcome. */
    result: Promise<Result>;
  }

  const queue: IJob[] = [];
  const pool: IWorker[] = [];
  const takes: Map<string, IEntry> = new Map();

  /** The worker that last built each composition, by its JSON, so its verdicts are read where its performance is kept. */
  const builders: Map<string, IWorker> = new Map();
  let next: number = 0;

  /**
   * Compute a composition's take, or read it from this page's cache.
   *
   * @param composition The composition.
   * @param fps Frames a second of its track.
   * @param signal Aborted when the caller stops waiting; the take is still kept if a worker already started it.
   * @returns The take or the packages' refusal.
   * @throws {DOMException} An `AbortError` when `signal` aborts first.
   * @throws {Error} When the worker fails outside the packages' refusals.
   */
  export function take(
    composition: IPlaygroundComposition,
    fps: number,
    signal?: AbortSignal,
  ): Promise<Result> {
    const key: string = JSON.stringify([fps, composition]);
    let entry: IEntry | undefined = takes.get(key);
    if (entry === undefined) {
      const { job, response }: { job: IJob; response: Promise<ITakeResponse> } =
        enqueue({ kind: "take", id: next++, composition, fps }, null);
      const made: IEntry = {
        job,
        result: response.then((answer: ITakeResponse): Result => {
          made.job = null;
          if (answer.kind === "take")
            return { kind: "take", take: answer.take };
          if (answer.kind === "refusal")
            return { kind: "refusal", refusal: answer.refusal };
          throw new Error(
            answer.kind === "error"
              ? answer.message
              : `The take worker answered a take with ${answer.kind}`,
          );
        }),
      };
      made.result.catch((): void => {
        takes.delete(key);
      });
      takes.set(key, made);
      entry = made;
    }
    return follow(key, entry, signal);
  }

  /**
   * Read every physical bound on a composition's performance, on the worker
   * that built it when that worker is still there.
   *
   * @param composition The composition.
   * @returns The report.
   * @throws {Error} When the packages refuse the composition or the worker fails.
   */
  export async function verdicts(
    composition: IPlaygroundComposition,
  ): Promise<IPlaygroundVerdicts> {
    const builder: IWorker | undefined = builders.get(
      JSON.stringify(composition),
    );
    const answer: ITakeResponse = await enqueue(
      { kind: "verdicts", id: next++, composition },
      builder !== undefined && pool.includes(builder) ? builder : null,
    ).response;
    if (answer.kind === "verdicts") return answer.verdicts;
    throw new Error(
      answer.kind === "error"
        ? answer.message
        : answer.kind === "refusal"
          ? answer.refusal.message
          : `The take worker answered verdicts with ${answer.kind}`,
    );
  }

  /** One caller's wait on a cached take, which it may abandon. */
  function follow(
    key: string,
    entry: IEntry,
    signal: AbortSignal | undefined,
  ): Promise<Result> {
    // A caller without a signal waits to the end, so it keeps the take queued.
    const job: IJob | null = entry.job;
    if (job !== null) job.waiting++;
    if (signal === undefined) return entry.result;
    return new Promise(
      (resolve: (result: Result) => void, reject: (error: unknown) => void) => {
        const abandon: () => void = (): void => {
          reject(new DOMException("The view stopped waiting", "AbortError"));
          if (job === null) return;
          job.waiting--;

          // A take no view waits for leaves the queue; one a worker started
          // runs on and is kept.
          const at: number = queue.indexOf(job);
          if (job.waiting === 0 && at !== -1) {
            queue.splice(at, 1);
            takes.delete(key);
          }
        };
        if (signal.aborted) return abandon();
        signal.addEventListener("abort", abandon, { once: true });
        entry.result.then(
          (result: Result): void => {
            signal.removeEventListener("abort", abandon);
            if (job !== null) job.waiting--;
            resolve(result);
          },
          (error: unknown): void => {
            signal.removeEventListener("abort", abandon);
            reject(error);
          },
        );
      },
    );
  }

  /** Queue a request and start whatever the pool can take. */
  function enqueue(
    request: ITakeRequest,
    owner: IWorker | null,
  ): { job: IJob; response: Promise<ITakeResponse> } {
    let job!: IJob;
    const response: Promise<ITakeResponse> = new Promise(
      (
        resolve: (response: ITakeResponse) => void,
        reject: (error: Error) => void,
      ): void => {
        job = { request, owner, waiting: 0, answer: resolve, fail: reject };
      },
    );
    queue.push(job);
    dispatch();
    return { job, response };
  }

  /** Hand every queued request a worker can take to one, in the queue's order. */
  function dispatch(): void {
    for (const job of [...queue]) {
      let worker: IWorker | undefined;
      if (job.owner !== null && pool.includes(job.owner)) {
        // A verdict waits for the worker that keeps its performance.
        if (job.owner.job !== null) continue;
        worker = job.owner;
      } else
        worker =
          pool.find((w: IWorker): boolean => w.job === null) ??
          (pool.length < limit() ? spawn() : undefined);
      if (worker === undefined) return;
      queue.splice(queue.indexOf(job), 1);
      worker.job = job;
      worker.worker.postMessage(job.request);
    }
  }

  /**
   * The most workers at once: one per logical core but one, which the
   * page's main thread keeps for drawing and input.
   */
  function limit(): number {
    return Math.max(1, (navigator.hardwareConcurrency || 1) - 1);
  }

  /** Start one worker; it imports the packages before its first answer. */
  function spawn(): IWorker {
    const made: IWorker = {
      worker: new Worker(new URL("./package/TakeWorker.ts", import.meta.url)),
      job: null,
    };
    made.worker.onmessage = (event: MessageEvent<ITakeResponse>): void => {
      const job: IJob | null = made.job;
      made.job = null;
      if (job !== null) {
        if (job.request.kind === "take" && event.data.kind === "take")
          builders.set(JSON.stringify(job.request.composition), made);
        job.answer(event.data);
      }
      dispatch();
    };

    // A worker that throws outside an answer, as when its code fails to
    // load, is replaced: its request fails and the queue goes on.
    made.worker.onerror = (event: ErrorEvent): void => {
      event.preventDefault();
      pool.splice(pool.indexOf(made), 1);
      made.worker.terminate();
      made.job?.fail(
        new Error(event.message || "The take worker stopped with an error"),
      );
      made.job = null;
      dispatch();
    };
    pool.push(made);
    return made;
  }
}
