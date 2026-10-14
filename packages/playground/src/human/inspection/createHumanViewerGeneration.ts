import type { HumanViewerHandle } from "@automovie/viewer/human/inspection/HumanViewerHandle";

/**
 * Own display and static encoding requests against one committed iframe and its worker generation. Retiring the iframe rejects every request awaiting that generation before its worker is removed. The host may then publish another handle without leaving the resident server's capture queue waiting on a detached promise. The wrapped observation methods retain this generation's original handle. Retirement rejects wrapped show, eviction and construction-export waits; it does not interrupt their underlying operations or close the iframe itself. The owning host removes that generation's iframe/worker separately.
 *
 * @evidence contracts/common.md#principled-implementation Each wrapped asynchronous request records a generation-owned rejection callback so retirement rejects its wait before the host removes the iframe, while direct observation methods keep the original generation handle.
 * @evidence contracts/common.md#clear-and-simple-design The wrapper owns wait authority only; numerical operations, synchronous observation and physical iframe/worker retirement remain their actual product and host owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retiring waits does not claim cancelled underlying computation or completed native cleanup, and no request is silently rebound to a newer generation's handle.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies wrapped asynchronous operations, original-handle observation, rejected waits and separate physical retirement.
 * @evidence contracts/performance.md#efficient-algorithms Registration and settlement use constant expected Set operations per request; retiring p pending waits scans O(p) callbacks and clears their set, while underlying display/encoding/eviction costs remain unchanged.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Requests retain their effect and generation identity rather than sharing a numerical result or merging equal-looking display changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pending callbacks have no independent count cap and leave on settlement or retirement; underlying promises can retain their own closures until their owner settles or removes the iframe, which this wrapper does not physically close.
 */
export function createHumanViewerGeneration(viewer: HumanViewerHandle): {
  /** Observation and wrapped asynchronous operations bound to this generation's handle. */
  handle: HumanViewerHandle;

  /** Reject waiting wrapped requests permanently; the host separately removes the iframe. */
  retire: () => void;
} {
  let retired: boolean = false;
  const pending: Set<() => void> = new Set();
  const failure: () => Error = (): Error =>
    new Error("The source generation was replaced during display");
  const run: <Result>(operation: () => Promise<Result>) => Promise<Result> = <
    Result,
  >(
    operation: () => Promise<Result>,
  ): Promise<Result> => {
    if (retired) return Promise.reject(failure());
    return new Promise<Result>(
      (
        resolve: (value: Result | PromiseLike<Result>) => void,
        reject: (reason?: unknown) => void,
      ): void => {
        const cancel: () => void = (): void => reject(failure());
        pending.add(cancel);
        try {
          void operation()
            .then((result: Result): void => {
              pending.delete(cancel);
              resolve(result);
            })
            .catch((error: unknown): void => {
              pending.delete(cancel);
              reject(error);
            });
        } catch (error) {
          pending.delete(cancel);
          reject(error);
        }
      },
    );
  };
  const handle: HumanViewerHandle = {
    parts: (): ReturnType<HumanViewerHandle["parts"]> => viewer.parts(),
    renderer: (): ReturnType<HumanViewerHandle["renderer"]> =>
      viewer.renderer(),
    revision: (): ReturnType<HumanViewerHandle["revision"]> =>
      viewer.revision(),
    builds: (): ReturnType<HumanViewerHandle["builds"]> => viewer.builds(),
    buildMs: (): ReturnType<HumanViewerHandle["buildMs"]> => viewer.buildMs(),
    spans: (): ReturnType<HumanViewerHandle["spans"]> => viewer.spans(),
    address: (): ReturnType<HumanViewerHandle["address"]> => viewer.address(),
    admission: (): ReturnType<HumanViewerHandle["admission"]> =>
      viewer.admission(),
    rigReading: (): ReturnType<NonNullable<HumanViewerHandle["rigReading"]>> =>
      viewer.rigReading?.(),
    exportConstruction: (): ReturnType<
      HumanViewerHandle["exportConstruction"]
    > =>
      run(
        (): ReturnType<HumanViewerHandle["exportConstruction"]> =>
          viewer.exportConstruction(),
      ),
    periocularMappings: (): ReturnType<
      NonNullable<HumanViewerHandle["periocularMappings"]>
    > => viewer.periocularMappings?.(),
    png: (): ReturnType<HumanViewerHandle["png"]> => viewer.png(),
    evict: (): ReturnType<HumanViewerHandle["evict"]> =>
      run((): ReturnType<HumanViewerHandle["evict"]> => viewer.evict()),
    show: (
      address: Parameters<HumanViewerHandle["show"]>[0],
    ): ReturnType<HumanViewerHandle["show"]> =>
      run((): ReturnType<HumanViewerHandle["show"]> => viewer.show(address)),
  };
  return {
    handle,
    retire: (): void => {
      retired = true;
      for (const cancel of pending) cancel();
      pending.clear();
    },
  };
}
