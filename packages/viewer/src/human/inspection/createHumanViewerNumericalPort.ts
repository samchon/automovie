import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import type { HumanViewerCatalogue } from "./HumanViewerCatalogue.js";
import { HumanViewerNodeSourceChangedError } from "./HumanViewerNodeSourceChangedError.js";
import type { ICreateHumanViewerNumericalPortProps } from "./ICreateHumanViewerNumericalPortProps.js";
import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";
import type { IHumanViewerNumericalEndpoint } from "./IHumanViewerNumericalEndpoint.js";
import type { IHumanViewerNumericalRequest } from "./IHumanViewerNumericalRequest.js";
import type { IHumanViewerPendingAdmission } from "./IHumanViewerPendingAdmission.js";
import type { IHumanViewerPendingBuild } from "./IHumanViewerPendingBuild.js";
import { assertHumanViewerSingleCompile } from "./assertHumanViewerSingleCompile.js";
import { createHumanViewerNumericalEndpoint } from "./createHumanViewerNumericalEndpoint.js";
import { decodeHumanViewerPreview } from "./decodeHumanViewerPreview.js";
import { humanViewerProtocol } from "./humanViewerProtocol.js";
import { readHumanViewerCompiles } from "./readHumanViewerCompiles.js";
import { readHumanViewerFrameToken } from "./readHumanViewerFrameToken.js";

type Result = ConnectedFaceResult | ConnectedBodyResult;

/**
 * The page's numerical transport: one owned Node process that evaluates documents with the unchanged product runtimes, behind the server's digest cache. A product viewport asks through `port`; the transport reads `/cache/<key>` first and, on a miss, builds in the worker and delivers the model immediately. After drawing, the page flushes bounded optional persistence in that same worker, so the next page or server can find it. Only numerical results reach disk; photographs stay in the page's display layer. A worker failure rejects every request it still owed. Each stage is reported to the page's work telemetry and timed in its spans. After a previously ready transport fails, only a new admission or build request opens a replacement. Concurrent new requests share its readiness; failed work is never replayed. Its fresh checked source must still match this page's initial browser revision. Initial startup failure, source incompatibility and frame disposal cannot recover inside this page. Optional persistence never revives a lost realm.
 *
 * Current-key cache access and a non-successful GET fallback preserve numerical source authority. This transport does not provide output-digest validation, corruption quarantine or a complete production cache outcome taxonomy.
 *
 * @evidence contracts/common.md#principled-implementation Product ports retain exact selected document/basis/source authority, use cached preview envelopes only for equivalent document text and dispatch actual builds through the checked Node endpoint.
 * @evidence contracts/common.md#clear-and-simple-design Endpoint readiness, correlated build/admission maps and per-connection cancellation separate realm replacement from request and optional-persistence ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Initial or source-incompatible failure cannot recover in this page, construction/export bypass preview cache, and later requests may acquire a replacement without replaying failed work.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes checked source, current-key preview caching, explicit transport recovery, source refusal and optional persistence from production cache guarantees.
 * @evidence contracts/performance.md#efficient-algorithms Correlation maps provide expected constant-time reply lookup; cache equivalence parses/stringifies document text, and codec/build costs remain with their existing numerical owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Cache access requires the selected catalogue key, AO mode and equivalent JSON document; concurrent acquisitions share checked startup and replacement receipts must match the initial browser revision.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reply, failure and port/frame retirement remove correlated request entries; one current endpoint remains with the frame, maps have no independent request-count cap and endpoint session DELETE does not itself prove physical child exit.
 */
export function createHumanViewerNumericalPort(
  props: ICreateHumanViewerNumericalPortProps,
): {
  admit: (
    domain: string,
    document: string,
    basis: string,
  ) => Promise<string | null>;
  port: <Input, Output>(
    selected: HumanViewerCatalogue["documents"][number],
    ao: boolean,
  ) => HumanResidentPort<Input, Output>;
  pending: () => number;
  builds: () => number;
  buildMs: () => number;
  authority: () => Promise<IHumanViewerNodeAuthority>;
  persist: () => void;
  persistence: () => unknown;
  dispose: () => void;
} {
  const { work, spans }: ICreateHumanViewerNumericalPortProps = props;
  let worker: IHumanViewerNumericalEndpoint =
    createHumanViewerNumericalEndpoint();
  const pending: Map<number, IHumanViewerPendingBuild> = new Map();
  const admissions: Map<number, IHumanViewerPendingAdmission> = new Map();
  let sequence: number = 0;
  let builds: number = 0;
  let buildMs: number = 0;
  let persistence: unknown = null;
  const token: string | null = readHumanViewerFrameToken(location.search);
  /** Actual Node authority, announced only after its checked modules loaded. */
  let announceCompiles: (
    authority: IHumanViewerNodeAuthority,
  ) => void = (): void => {};
  let rejectCompiles: (error: Error) => void = (): void => {};
  let workerCompiles: Promise<IHumanViewerNodeAuthority> =
    new Promise<IHumanViewerNodeAuthority>(
      (
        resolve: (authority: IHumanViewerNodeAuthority) => void,
        reject: (error: Error) => void,
      ): void => {
        announceCompiles = resolve;
        rejectCompiles = reject;
      },
    );
  // Observed so an early worker failure is not an unhandled rejection.
  workerCompiles.catch((): undefined => undefined);
  /** The browser source the first actual checked realm was bound to. */
  let initialRevision: string | undefined;
  /** Permanent source refusal belongs to this page until its generation is replaced. */
  let sourceRefusal: Error | null = null;
  /** Explicit frame retirement is permanent, unlike a lost admitted transport. */
  let disposed: boolean = false;
  /** Why the current endpoint can no longer answer, or null while it can. */
  let workerFailure: Error | null = null;
  const fail: (error: Error) => void = (error: Error): void => {
    workerFailure = error;
    rejectCompiles(error);
    for (const request of pending.values()) request.reject(error);
    for (const request of admissions.values()) request.reject(error);
    pending.clear();
    admissions.clear();
    work("failed");
  };
  const observe: () => void = (): void => {
    const endpoint: IHumanViewerNumericalEndpoint = worker;
    worker.onmessage = ({
      data,
    }: Parameters<
      NonNullable<IHumanViewerNumericalEndpoint["onmessage"]>
    >[0]): void => {
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
              readHumanViewerCompiles(),
              data.authority,
              initialRevision,
            );
          initialRevision ??= data.authority.revision;
          announceCompiles(data.authority);
        } catch (cause) {
          sourceRefusal =
            cause instanceof Error ? cause : new Error(String(cause));
          fail(sourceRefusal);
          endpoint.terminate();
        }
        return;
      }
      if ("type" in data) return;
      const admission: IHumanViewerPendingAdmission | undefined =
        admissions.get(data.id);
      if (admission !== undefined) {
        admissions.delete(data.id);
        if (data.admission === true && data.reason !== undefined)
          admission.resolve(data.reason);
        else admission.reject(new Error(data.error));
        return;
      }
      const request: IHumanViewerPendingBuild | undefined = pending.get(
        data.id,
      );
      pending.delete(data.id);
      if (request === undefined) return;
      work("numeric-reply");
      if (data.success && data.value !== undefined) {
        ++builds;
        buildMs = data.buildMs ?? 0;
        request.resolve(data.value);
      } else
        request.reject(
          new Error(data.error ?? "The Node numerical reply has no result."),
        );
    };
    worker.onerror = (error: ErrorEvent): void => {
      if (endpoint !== worker || disposed) return;
      const message: string =
        "The numerical worker failed: " +
        (error.message || "it could not load its modules");
      fail(
        error.error instanceof HumanViewerNodeSourceChangedError
          ? error.error
          : new Error(message, { cause: error.error }),
      );
    };
  };
  observe();
  /** Install synchronously so concurrent new requests share one checked startup. */
  const acquire: () => Promise<IHumanViewerNumericalEndpoint> =
    (): Promise<IHumanViewerNumericalEndpoint> => {
      if (sourceRefusal !== null) return Promise.reject(sourceRefusal);
      if (workerFailure !== null && (disposed || initialRevision === undefined))
        return Promise.reject(workerFailure);
      if (workerFailure !== null) {
        worker.terminate();
        workerFailure = null;
        workerCompiles = new Promise<IHumanViewerNodeAuthority>(
          (
            resolve: (authority: IHumanViewerNodeAuthority) => void,
            reject: (error: Error) => void,
          ): void => {
            announceCompiles = resolve;
            rejectCompiles = reject;
          },
        );
        workerCompiles.catch((): undefined => undefined);
        worker = createHumanViewerNumericalEndpoint();
        observe();
      }
      const endpoint: IHumanViewerNumericalEndpoint = worker;
      return workerCompiles.then((): IHumanViewerNumericalEndpoint => endpoint);
    };
  /** A settled old readiness promise cannot dispatch through a replacement. */
  const dispatch: (
    endpoint: IHumanViewerNumericalEndpoint,
    message: IHumanViewerNumericalRequest,
  ) => void = (
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
        return Promise.reject(
          new Error("Document admission needs an existing numerical domain."),
        );
      return acquire().then(
        (endpoint: IHumanViewerNumericalEndpoint): Promise<string | null> =>
          new Promise<string | null>(
            (
              resolve: (reason: string | null) => void,
              reject: (error: Error) => void,
            ): void => {
              const id: number = ++sequence;
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
                reject(
                  cause instanceof Error ? cause : new Error(String(cause)),
                );
              }
            },
          ),
      );
    },
    /** A product worker port for one catalogue document. */
    port: <Input, Output>(
      selected: HumanViewerCatalogue["documents"][number],
      ao: boolean,
    ): HumanResidentPort<Input, Output> => {
      let stopped: boolean = false;
      let persistedId: number | undefined;
      const requests: Set<number> = new Set();
      const abort: AbortController = new AbortController();
      const transport: HumanResidentPort<Input, Output> = {
        onmessage: null,
        onerror: null,
        terminate: (): void => {
          stopped = true;
          abort.abort();
          for (const workerId of requests) {
            pending
              .get(workerId)
              ?.reject(new Error("The numerical connection was released"));
            pending.delete(workerId);
          }
          requests.clear();
          // Withdraw native request promises before a discard send can fail;
          // the owning retirement completion retains that transport failure.
          if (persistedId !== undefined && workerFailure === null && !disposed)
            worker.postMessage({ persistence: "discard", id: persistedId });
        },
        postMessage: ({
          id,
          input,
        }: Parameters<
          HumanResidentPort<Input, Output>["postMessage"]
        >[0]): void => {
          if (stopped) return;
          if (
            typeof input !== "object" ||
            input === null ||
            !("document" in input) ||
            typeof input.document !== "string"
          ) {
            transport.onmessage?.({
              data: {
                id,
                success: false,
                error: "A numerical request needs its original document text.",
              },
            });
            return;
          }
          const inputDocument: string = input.document;
          const operation: unknown =
            "operation" in input ? input.operation : undefined;
          if (
            operation !== undefined &&
            operation !== "preview" &&
            operation !== "construct" &&
            operation !== "exportConstruction" &&
            operation !== "admit"
          ) {
            transport.onmessage?.({
              data: {
                id,
                success: false,
                error:
                  "The numerical viewport received an unsupported operation.",
              },
            });
            return;
          }
          const inputOperation:
            | "preview"
            | "construct"
            | "exportConstruction"
            | "admit"
            | undefined = operation;
          const key: string = selected.key + (ao ? "-ao" : "-direct");
          // A catalogue digest authorizes only its actual immutable document.
          // Changed requests still build normally but cannot read or write
          // another document's cache. Formatting alone has no significance.
          let cacheable: boolean = false;
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
          const build: () => Promise<Result> = (): Promise<Result> =>
            spans.measure("workerMs", async (): Promise<Result> => {
              const endpoint: IHumanViewerNumericalEndpoint = await acquire();
              return new Promise<Result>(
                (
                  resolve: (value: Result) => void,
                  reject: (error: Error) => void,
                ): void => {
                  if (stopped) {
                    reject(new Error("The numerical connection was released"));
                    return;
                  }
                  work("build");
                  const workerId: number = ++sequence;
                  requests.add(workerId);
                  persistedId = workerId;
                  pending.set(workerId, {
                    resolve: (value: Result): void => {
                      requests.delete(workerId);
                      resolve(value);
                    },
                    reject: (error: Error): void => {
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
                        cacheable && token !== null
                          ? { key, token }
                          : undefined,
                    });
                  } catch (cause) {
                    pending
                      .get(workerId)!
                      .reject(
                        cause instanceof Error
                          ? cause
                          : new Error(String(cause)),
                      );
                    pending.delete(workerId);
                  }
                },
              );
            });
          void (async (): Promise<void> => {
            // The persisted codec owns admitted previews only. Construction
            // and its explicit static export carry their complete admission
            // report directly from the worker, outside the preview codec.
            if (
              typeof input === "object" &&
              input !== null &&
              "operation" in input &&
              (input.operation === "construct" ||
                input.operation === "exportConstruction")
            ) {
              const value: Result = await build();
              if (stopped) return;
              work("prepare");
              transport.onmessage?.({
                data: { id, success: true, value: value as Output },
              });
              return;
            }
            work("cache-read");
            const cached: Response | undefined = cacheable
              ? await spans.measure(
                  "cacheReadMs",
                  (): Promise<Response> =>
                    fetch(`/cache/${key}`, { signal: abort.signal }),
                )
              : undefined;
            let value: Result;
            if (cached?.ok)
              value = await spans.measure(
                "cacheDecodeMs",
                async (): Promise<Result> =>
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
          })().catch((error: unknown): void => {
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
      const error: Error = new Error("The numerical frame was retired");
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
