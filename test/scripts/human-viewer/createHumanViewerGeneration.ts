import type { HumanViewerHandle } from "./HumanViewerHandle";

/**
 * Own display and static encoding requests against one committed iframe and its worker generation.
 * Retiring the iframe rejects every request awaiting that generation before
 * its worker is removed. The host may then publish another handle without
 * leaving the resident server's capture queue waiting on a detached promise.
 * The wrapped observation methods retain this generation's original handle.
 *
 * @evidence contracts/common.md#principled-implementation Explicit retirement withdraws outstanding promises before their producing iframe is destroyed, preserving generation ownership.
 * @evidence contracts/common.md#clear-and-simple-design One pending-request set owns cancellation; the host still owns iframe publication and disposal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Wraps the supported observation protocol without replacing worker globals or imposing a time limit on valid builds.
 * @evidence contracts/common.md#meaningful-documentation States promise, worker and publication ordering and the stable identity of observation methods.
 */
export function createHumanViewerGeneration(viewer: HumanViewerHandle) {
  let retired = false;
  const pending = new Set<() => void>();
  const failure = (): Error =>
    new Error("The source generation was replaced during display");
  const run = <Result>(operation: () => Promise<Result>): Promise<Result> => {
    if (retired) return Promise.reject(failure());
    return new Promise<Result>((resolve, reject) => {
      const cancel = (): void => reject(failure());
      pending.add(cancel);
      try {
        void operation()
          .then((result) => {
            pending.delete(cancel);
            resolve(result);
          })
          .catch((error: unknown) => {
            pending.delete(cancel);
            reject(error);
          });
      } catch (error) {
        pending.delete(cancel);
        reject(error);
      }
    });
  };
  const handle: HumanViewerHandle = {
    parts: () => viewer.parts(),
    renderer: () => viewer.renderer(),
    revision: () => viewer.revision(),
    builds: () => viewer.builds(),
    buildMs: () => viewer.buildMs(),
    spans: () => viewer.spans(),
    address: () => viewer.address(),
    admission: () => viewer.admission(),
    rigReading: () => viewer.rigReading?.(),
    exportConstruction: () => run(() => viewer.exportConstruction()),
    periocularMappings: () => viewer.periocularMappings?.(),
    png: () => viewer.png(),
    evict: () => viewer.evict(),
    show: (address) => run(() => viewer.show(address)),
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
