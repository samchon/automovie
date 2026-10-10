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
import { createHumanViewerNumericalEndpoint } from "./createHumanViewerNumericalEndpoint";
import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority";
import type { IHumanViewerNumericalEndpoint } from "./IHumanViewerNumericalEndpoint";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest";
import { assertHumanViewerSingleCompile } from "./assertHumanViewerSingleCompile";
import { readHumanViewerCompiles } from "./readHumanViewerCompiles";

type Result = ConnectedFaceResult | ConnectedBodyResult;

/**
 * The page's numerical transport: one owned Node process that evaluates documents with
 * the unchanged product runtimes, behind the server's digest cache. A product
 * viewport asks through `port`; the transport reads `/cache/<key>` first and,
 * on a miss, builds in the worker and delivers the model immediately. After
 * drawing, the page flushes bounded optional persistence in that same worker,
 * so the next page or server can find it. Only numerical results reach disk;
 * photographs stay in the page's display layer. A worker failure rejects
 * every request it still owed. Each stage is reported to the page's work
 * telemetry and timed in its spans. After a previously ready transport fails,
 * only a new admission or build request opens a replacement. Concurrent new
 * requests share its readiness; failed work is never replayed. Its fresh
 * checked source must still match this page's initial browser revision.
 * Initial startup failure, source incompatibility and frame disposal cannot
 * recover inside this page. Optional persistence never revives a lost realm.
 *
 * @evidence contracts/common.md#principled-implementation Catalogue digests bind cached models; a replacement realm supplies fresh checked startup authority and must match the page's original browser revision before dispatch.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the endpoint, shared readiness, pending requests and permanent source refusal; viewports see only the product port protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Builds through the product runtimes and persists their actual results.
 * @evidence contracts/common.md#meaningful-documentation States cache order, persistence boundary and failure effect.
 */
export function createHumanViewerNumericalPort(
  props: ICreateHumanViewerNumericalPortProps,
) {
  const { work, spans } = props;
  let worker = createHumanViewerNumericalEndpoint();
  const pending = new Map<number, IHumanViewerPendingBuild>();
  const admissions = new Map<number, IHumanViewerPendingAdmission>();
  let sequence = 0;
  let builds = 0;
  let buildMs = 0;
  let persistence: unknown = null;
  const token = readHumanViewerFrameToken(location.search);
  /** Actual Node authority, announced only after its checked modules loaded. */
  let announceCompiles: (authority: IHumanViewerNodeAuthority) => void = () => {};
  let rejectCompiles: (error: Error) => void = () => {};
  let workerCompiles = new Promise<IHumanViewerNodeAuthority>((resolve, reject) => {
    announceCompiles = resolve;
    rejectCompiles = reject;
  });
  // Observed so an early worker failure is not an unhandled rejection.
  workerCompiles.catch(() => undefined);
  /** The browser source the first actual checked realm was bound to. */
  let initialRevision: string | undefined;
  /** Permanent source refusal belongs to this page until its generation is replaced. */
  let sourceRefusal: Error | null = null;
  /** Explicit frame retirement is permanent, unlike a lost admitted transport. */
  let disposed = false;
  /** Why the current endpoint can no longer answer, or null while it can. */
  let workerFailure: Error | null = null;
  const fail = (error: Error): void => {
    workerFailure = error;
    rejectCompiles(error);
    for (const request of pending.values()) request.reject(error);
    for (const request of admissions.values()) request.reject(error);
    pending.clear();
    admissions.clear();
    work("failed");
  };
  const observe = (): void => {
    const endpoint = worker;
    worker.onmessage = ({ data }) => {
      if (endpoint !== worker || disposed) return;
      if ("type" in data && data.type === "progress") {
        if (pending.has(data.id)) work("build", data);
        return;
      }
      if ("type" in data && data.type === "persistence") {
        persistence = data;
        console.info("HUMAN_CACHE " + JSON.stringify(data));
        return;
      }
      if ("type" in data && data.type === "ready") {
        try {
          if (data.protocol !== humanViewerProtocol)
            throw new Error(
              "The numerical worker runs an incompatible viewer protocol",
            );
          if (initialRevision !== undefined)
            assertHumanViewerSingleCompile(
              readHumanViewerCompiles(), data.authority, initialRevision,
            );
          initialRevision ??= data.authority.revision;
          announceCompiles(data.authority);
        } catch (cause) {
          sourceRefusal = cause instanceof Error ? cause : new Error(String(cause));
          fail(sourceRefusal);
          endpoint.terminate();
        }
        return;
      }
      if ("type" in data) return;
      const admission = admissions.get(data.id);
      if (admission !== undefined) {
        admissions.delete(data.id);
        if (data.admission === true && data.reason !== undefined) admission.resolve(data.reason);
        else admission.reject(new Error(data.error));
        return;
      }
      const request = pending.get(data.id);
      pending.delete(data.id);
      if (request === undefined) return;
      work("numeric-reply");
      if (data.success && data.value !== undefined) {
        ++builds;
        buildMs = data.buildMs ?? 0;
        request.resolve(data.value);
      } else request.reject(new Error(data.error ?? "The Node numerical reply has no result."));
    };
    worker.onerror = (error) => {
      if (endpoint !== worker || disposed) return;
      fail(
        new Error(
          "The numerical worker failed: " +
            (error.message || "it could not load its modules"),
          { cause: error.error },
        ),
      );
    };
  };
  observe();
  /** Install synchronously so concurrent new requests share one checked startup. */
  const acquire = (): Promise<IHumanViewerNumericalEndpoint> => {
    if (sourceRefusal !== null) return Promise.reject(sourceRefusal);
    if (workerFailure !== null && (disposed || initialRevision === undefined))
      return Promise.reject(workerFailure);
    if (workerFailure !== null) {
      worker.terminate();
      workerFailure = null;
      workerCompiles = new Promise<IHumanViewerNodeAuthority>((resolve, reject) => {
        announceCompiles = resolve;
        rejectCompiles = reject;
      });
      workerCompiles.catch(() => undefined);
      worker = createHumanViewerNumericalEndpoint();
      observe();
    }
    const endpoint = worker;
    return workerCompiles.then(() => endpoint);
  };
  /** A settled old readiness promise cannot dispatch through a replacement. */
  const dispatch = (
    endpoint: IHumanViewerNumericalEndpoint,
    message: IHumanViewerNumericalRequest,
  ): void => {
    if (endpoint !== worker)
      throw new Error("The numerical connection was replaced before dispatch");
    if (workerFailure !== null) throw workerFailure;
    endpoint.postMessage(message);
  };
  return {
    /** Ask the original domain owner with the exact loaded source; no model or disk cache participates. */
    admit: (
      domain: string,
      document: string,
      basis: string,
    ): Promise<string | null> => {
      if (domain !== "face" && domain !== "body" && domain !== "person")
        return Promise.reject(new Error("Document admission needs an existing numerical domain."));
      return acquire().then(
        (endpoint) => new Promise<string | null>((resolve, reject) => {
          const id = ++sequence;
          admissions.set(id, { resolve, reject });
          try {
            dispatch(endpoint, {
              id,
              domain,
              basis,
              input: { document, operation: "admit" },
            });
          } catch (cause) {
            admissions.delete(id);
            reject(cause instanceof Error ? cause : new Error(String(cause)));
          }
        }),
      );
    },
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
          if (persistedId !== undefined && workerFailure === null && !disposed)
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
          if (typeof input !== "object" || input === null ||
              !("document" in input) || typeof input.document !== "string") {
            transport.onmessage?.({ data: { id, success: false, error: "A numerical request needs its original document text." } });
            return;
          }
          const inputDocument = input.document;
          const operation = "operation" in input ? input.operation : undefined;
          if (operation !== undefined && operation !== "preview" &&
              operation !== "construct" && operation !== "exportConstruction" && operation !== "admit") {
            transport.onmessage?.({ data: { id, success: false, error: "The numerical viewport received an unsupported operation." } });
            return;
          }
          const inputOperation = operation;
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
              async () => {
                const endpoint = await acquire();
                return new Promise<Result>((resolve, reject) => {
                  if (stopped) {
                    reject(new Error("The numerical connection was released"));
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
                  try {
                    dispatch(endpoint, {
                      id: workerId,
                      domain: selected.domain,
                      basis: selected.basis,
                      input: {
                        document: inputDocument,
                        operation: inputOperation,
                        occlusion: ao,
                      },
                      cache:
                        cacheable && token !== null ? { key, token } : undefined,
                    });
                  } catch (cause) {
                    pending.get(workerId)!.reject(
                      cause instanceof Error ? cause : new Error(String(cause)),
                    );
                    pending.delete(workerId);
                  }
                });
              },
            );
          void (async () => {
            // The persisted codec owns admitted previews only. Construction
            // and its explicit static export carry their complete admission
            // report directly from the worker, outside the preview codec.
            if (
              typeof input === "object" &&
              input !== null &&
              "operation" in input &&
              (input.operation === "construct" || input.operation === "exportConstruction")
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

    /** Actual Node receipt while its owned realm remains live; failures propagate unchanged. */
    authority: (): Promise<IHumanViewerNodeAuthority> =>
      workerFailure === null ? workerCompiles : Promise.reject(workerFailure),

    /** Flush optional persistence only after the completed display or PNG read. */
    persist: (): void => {
      if (workerFailure === null && !disposed)
        worker.postMessage({ persistence: "flush" });
    },

    /** Last independently completed cache write, failure or cancellation. */
    persistence: (): unknown => persistence,

    /** Frame retirement releases the worker and every promise it still owns. */
    dispose: (): void => {
      disposed = true;
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
