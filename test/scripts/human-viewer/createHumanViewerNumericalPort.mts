import type { ConnectedBodyResult } from "@automovie/playground/src/human/body/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/playground/src/human/common/connectedRuntime";
import type { HumanResidentPort } from "@automovie/playground/src/human/common/residentWorker";

import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { ICreateHumanViewerNumericalPortProps } from "./ICreateHumanViewerNumericalPortProps";
import type { IHumanViewerPendingBuild } from "./IHumanViewerPendingBuild";
import { decodeHumanViewerPreview } from "./decodeHumanViewerPreview";
import { encodeHumanViewerPreviewChunks } from "./encodeHumanViewerPreviewChunks";
import { readHumanViewerFrameToken } from "./readHumanViewerFrameToken";

type Result = ConnectedFaceResult | ConnectedBodyResult;

/**
 * The page's numerical transport: one worker that evaluates documents with
 * the unchanged product runtimes, behind the server's digest cache. A product
 * viewport asks through `port`; the transport reads `/cache/<key>` first and,
 * on a miss, builds in the worker and writes the numerical projection back,
 * so the next page or server finds it. Only numerical results reach the disk;
 * photographs stay in the page's display layer. A worker failure rejects
 * every request it still owed. Each stage is reported to the page's work
 * telemetry and timed in its spans.
 *
 * @evidence contracts/common.md#principled-implementation The cache key is the catalogue's content digest, so a cached model always belongs to the document, basis and source it is read for.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the worker, its pending requests and build counters; viewports see only the product port protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Builds through the product runtimes and persists their actual results.
 * @evidence contracts/common.md#meaningful-documentation States cache order, persistence boundary and failure effect.
 */
export function createHumanViewerNumericalPort(props: ICreateHumanViewerNumericalPortProps) {
  const { work, spans } = props;
  const worker = new Worker(new URL("./numerical-worker.mts", import.meta.url), { type: "module" });
  const pending = new Map<number, IHumanViewerPendingBuild>();
  let sequence = 0;
  let builds = 0;
  let buildMs = 0;
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
    if (data.type === "compiles") {
      announceCompiles(data.compiles);
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
    workerFailure = new Error("The numerical worker failed: " + (error.message || "it could not load its modules"));
    rejectCompiles(workerFailure);
    for (const request of pending.values()) request.reject(new Error(error.message));
    pending.clear();
    work("failed");
  };
  return {
    /** A product worker port for one catalogue document. */
    port: <Input, Output>(
      selected: HumanViewerCatalogue["documents"][number],
      ao: boolean,
    ): HumanResidentPort<Input, Output> => {
      const transport: HumanResidentPort<Input, Output> = {
        onmessage: null,
        onerror: null,
        terminate: () => {},
        postMessage: ({ id, input }) => {
          const key = selected.key + (ao ? "-ao" : "-direct");
          void (async () => {
            work("cache-read");
            const cached = await spans.measure("cacheReadMs", () => fetch(`/cache/${key}`));
            let value: Result;
            if (cached.ok)
              value = await spans.measure("cacheDecodeMs", async () =>
                decodeHumanViewerPreview(await cached.text()) as Result);
            else {
              work("build");
              value = await spans.measure("workerMs", () => new Promise<Result>((resolve, reject) => {
                // A failed worker answers nothing: refuse at once instead of waiting forever.
                if (workerFailure !== null) {
                  reject(workerFailure);
                  return;
                }
                const workerId = ++sequence;
                pending.set(workerId, { resolve, reject });
                worker.postMessage({ id: workerId, domain: selected.domain, basis: selected.basis,
                  input: { ...input, occlusion: ao } });
              }));
              work("cache-write");
              await spans.measure("cacheWriteMs", () => fetch(`/cache/${key}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json",
                  "X-Human-Generation": readHumanViewerFrameToken(location.search) ?? "" },
                body: new Blob([...encodeHumanViewerPreviewChunks(value)], { type: "application/json" }),
              }));
            }
            work("prepare");
            transport.onmessage?.({ data: { id, success: true, value: value as Output } });
          })().catch((error: unknown) => {
            work("failed");
            transport.onmessage?.({ data: { id, success: false,
              error: error instanceof Error ? error.message : String(error) } });
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
  };
}
