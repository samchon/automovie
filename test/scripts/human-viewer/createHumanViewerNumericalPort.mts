import type { ConnectedBodyResult } from "@automovie/playground/src/human/body/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/playground/src/human/common/ConnectedFaceResult";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/HumanResidentPort";

import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { ICreateHumanViewerNumericalPortProps } from "./ICreateHumanViewerNumericalPortProps";
import type { IHumanViewerPendingAdmission } from "./IHumanViewerPendingAdmission";
import type { IHumanViewerPendingBuild } from "./IHumanViewerPendingBuild";
import { decodeHumanViewerPreview } from "./decodeHumanViewerPreview";
import { humanViewerProtocol } from "./humanViewerProtocol";
import { readHumanViewerFrameToken } from "./readHumanViewerFrameToken";

type Result = ConnectedFaceResult | ConnectedBodyResult;

/**
 * The page's numerical transport: one worker that evaluates documents with
 * the unchanged product runtimes, behind the server's digest cache. A product
 * viewport asks through `port`; the transport reads `/cache/<key>` first and,
 * on a miss, builds in the worker and delivers the model immediately. After
 * drawing, the page flushes bounded optional persistence in that same worker,
 * so the next page or server can find it. Only numerical results reach disk;
 * photographs stay in the page's display layer. A worker failure rejects
 * every request it still owed. Each stage is reported to the page's work
 * telemetry and timed in its spans.
 *
 * @evidence contracts/common.md#principled-implementation The cache key is the catalogue's content digest, so a cached model always belongs to the document, basis and source it is read for.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the worker, its pending requests and build counters; viewports see only the product port protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Builds through the product runtimes and persists their actual results.
 * @evidence contracts/common.md#meaningful-documentation States cache order, persistence boundary and failure effect.
 */
export function createHumanViewerNumericalPort(
  props: ICreateHumanViewerNumericalPortProps,
) {
  const { work, spans } = props;
  const worker = new Worker(
    new URL("./numerical-worker.mts", import.meta.url),
    { type: "module" },
  );
  const pending = new Map<number, IHumanViewerPendingBuild>();
  const admissions = new Map<number, IHumanViewerPendingAdmission>();
  let sequence = 0;
  let builds = 0;
  let buildMs = 0;
  let persistence: unknown = null;
  const token = readHumanViewerFrameToken(location.search);
  /** The compiles the worker ran, announced once its modules have loaded. */
  let announceCompiles: (compiles: string[]) => void = () => {};
  let rejectCompiles: (error: Error) => void = () => {};
  const workerCompiles = new Promise<string[]>((resolve, reject) => {
    announceCompiles = resolve;
    rejectCompiles = reject;
  });
  // Observed so an early worker failure is not an unhandled rejection.
  workerCompiles.catch(() => undefined);
  worker.onmessage = ({ data }) => {
    if (data.type === "progress") {
      if (pending.has(data.id)) work("build", data);
      return;
    }
    if (data.type === "persistence") {
      persistence = data;
      console.info("HUMAN_CACHE " + JSON.stringify(data));
      return;
    }
    if (data.type === "compiles") {
      if (data.protocol !== humanViewerProtocol) {
        workerFailure = new Error(
          "The numerical worker runs an incompatible viewer protocol",
        );
        rejectCompiles(workerFailure);
        for (const request of pending.values()) request.reject(workerFailure);
        for (const admission of admissions.values())
          admission.reject(workerFailure);
        pending.clear();
        admissions.clear();
        worker.terminate();
        return;
      }
      announceCompiles(data.compiles);
      return;
    }
    const admission = admissions.get(data.id);
    if (admission !== undefined) {
      admissions.delete(data.id);
      if (data.admission === true) admission.resolve(data.reason);
      else admission.reject(new Error(data.error));
      return;
    }
    const request = pending.get(data.id);
    pending.delete(data.id);
    if (request === undefined) return;
    work("numeric-reply");
    if (data.success) {
      ++builds;
      buildMs = data.buildMs ?? 0;
      request.resolve(data.value);
    } else request.reject(new Error(data.error));
  };
  /** Why the worker can no longer answer, or null while it can. */
  let workerFailure: Error | null = null;
  worker.onerror = (error) => {
    workerFailure = new Error(
      "The numerical worker failed: " +
        (error.message || "it could not load its modules"),
    );
    rejectCompiles(workerFailure);
    for (const request of pending.values())
      request.reject(new Error(error.message));
    pending.clear();
    for (const request of admissions.values()) request.reject(workerFailure);
    admissions.clear();
    work("failed");
  };
  return {
    /** Ask the original domain owner with the exact loaded source; no model or disk cache participates. */
    admit: (
      domain: string,
      document: string,
      basis: string,
    ): Promise<string | null> =>
      new Promise((resolve, reject) => {
        if (workerFailure !== null) {
          reject(workerFailure);
          return;
        }
        const id = ++sequence;
        admissions.set(id, { resolve, reject });
        worker.postMessage({
          id,
          domain,
          basis,
          input: { document, operation: "admit" },
        });
      }),
    /** A product worker port for one catalogue document. */
    port: <Input, Output>(
      selected: HumanViewerCatalogue["documents"][number],
      ao: boolean,
    ): HumanResidentPort<Input, Output> => {
      let stopped = false;
      let persistedId: number | undefined;
      const requests = new Set<number>();
      const abort = new AbortController();
      const transport: HumanResidentPort<Input, Output> = {
        onmessage: null,
        onerror: null,
        terminate: () => {
          stopped = true;
          abort.abort();
          if (persistedId !== undefined)
            worker.postMessage({ persistence: "discard", id: persistedId });
          for (const workerId of requests) {
            pending
              .get(workerId)
              ?.reject(new Error("The numerical connection was released"));
            pending.delete(workerId);
          }
          requests.clear();
        },
        postMessage: ({ id, input }) => {
          if (stopped) return;
          const key = selected.key + (ao ? "-ao" : "-direct");
          // A catalogue digest authorizes only its actual immutable document.
          // Changed requests still build normally but cannot read or write
          // another document's cache. Formatting alone has no significance.
          let cacheable = false;
          if (
            typeof input === "object" &&
            input !== null &&
            "document" in input &&
            typeof input.document === "string"
          ) {
            try {
              cacheable =
                JSON.stringify(JSON.parse(input.document)) ===
                JSON.stringify(selected.document);
            } catch {
              /* The domain runtime reports malformed document text. */
            }
          }
          const build = (): Promise<Result> =>
            spans.measure(
              "workerMs",
              () =>
                new Promise<Result>((resolve, reject) => {
                  if (workerFailure !== null) {
                    reject(workerFailure);
                    return;
                  }
                  work("build");
                  const workerId = ++sequence;
                  requests.add(workerId);
                  persistedId = workerId;
                  pending.set(workerId, {
                    resolve: (value) => {
                      requests.delete(workerId);
                      resolve(value);
                    },
                    reject: (error) => {
                      requests.delete(workerId);
                      reject(error);
                    },
                  });
                  worker.postMessage({
                    id: workerId,
                    domain: selected.domain,
                    basis: selected.basis,
                    input: { ...input, occlusion: ao },
                    cache:
                      cacheable && token !== null ? { key, token } : undefined,
                  });
                }),
            );
          void (async () => {
            // The persisted codec owns admitted previews only. Construction
            // carries its complete admission report directly from the worker.
            if (
              typeof input === "object" &&
              input !== null &&
              "operation" in input &&
              input.operation === "construct"
            ) {
              const value = await build();
              if (stopped) return;
              work("prepare");
              transport.onmessage?.({
                data: { id, success: true, value: value as Output },
              });
              return;
            }
            work("cache-read");
            const cached = cacheable
              ? await spans.measure("cacheReadMs", () =>
                  fetch(`/cache/${key}`, { signal: abort.signal }),
                )
              : undefined;
            let value: Result;
            if (cached?.ok)
              value = await spans.measure(
                "cacheDecodeMs",
                async () =>
                  decodeHumanViewerPreview(await cached.text()) as Result,
              );
            else {
              work("build");
              value = await build();
            }
            if (stopped) return;
            work("prepare");
            transport.onmessage?.({
              data: { id, success: true, value: value as Output },
            });
          })().catch((error: unknown) => {
            if (stopped) return;
            work("failed");
            transport.onmessage?.({
              data: {
                id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
              },
            });
          });
        },
      };
      return transport;
    },

    /** Numerical replies still awaited from the worker. */
    pending: (): number => pending.size,

    /** Worker builds completed since the page loaded. */
    builds: (): number => builds,

    /** Duration of the most recent worker build, in milliseconds. */
    buildMs: (): number => buildMs,

    /** The compile generations whose human modules the worker ran, once it announced them. */
    compiles: (): Promise<string[]> => workerCompiles,

    /** Flush optional persistence only after the completed display or PNG read. */
    persist: (): void => worker.postMessage({ persistence: "flush" }),

    /** Last independently completed cache write, failure or cancellation. */
    persistence: (): unknown => persistence,

    /** Frame retirement releases the worker and every promise it still owns. */
    dispose: (): void => {
      const error = new Error("The numerical frame was retired");
      workerFailure = error;
      rejectCompiles(error);
      for (const request of pending.values()) request.reject(error);
      for (const admission of admissions.values()) admission.reject(error);
      pending.clear();
      admissions.clear();
      worker.terminate();
    },
  };
}
