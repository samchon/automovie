import type { Browser } from "playwright";

import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerTargetDetached } from "./IHumanViewerTargetDetached";
import type { IHumanViewerTargetEvent } from "./IHumanViewerTargetEvent";
import type { IHumanViewerTargetMessage } from "./IHumanViewerTargetMessage";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap";

/**
 * Read the heap of every dedicated worker in the browser, each from its own
 * isolate: attach to the worker target through a browser session, ask it for
 * `Runtime.getHeapUsage` (after a full collection when `collect` is set) and
 * detach. Playwright's sessions do not route flattened child sessions, so the
 * worker is addressed with `Target.sendMessageToTarget`. A worker that
 * vanishes while being read (its session detaches or its target is
 * destroyed) ends that read and is left out; no read waits on a worker that
 * can no longer answer.
 *
 * @evidence contracts/common.md#principled-implementation Each worker isolate reports its own heap through the protocol, the same accounting the page reading uses.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns attaching, asking and detaching for every worker.
 * @evidence contracts/common.md#meaningful-documentation States the transport, the collection option and the vanished case.
 */
export async function readHumanViewerWorkerHeaps(browser: Browser, collect: boolean): Promise<IHumanViewerWorkerHeap[]> {
  const root = await browser.newBrowserCDPSession();
  try {
    // Destruction events arrive only for discovered targets.
    await root.send("Target.setDiscoverTargets", { discover: true });
    const { targetInfos } = await root.send("Target.getTargets");
    const heaps: IHumanViewerWorkerHeap[] = [];
    for (const target of targetInfos.filter((info) => info.type === "worker")) {
      // The whole read of one worker, attach included, ends when the worker
      // is destroyed: a worker torn down at a generation swap was seen to
      // leave even its attach unanswered (source's 5191, 11:56:05).
      let cancel: () => void = () => {};
      const lost = new Promise<never>((_resolve, reject) => {
        const gone = (event: IHumanViewerTargetEvent): void => {
          if (event.targetId !== target.targetId) return;
          root.off("Target.targetDestroyed", gone);
          reject(new Error("The worker ended while it was read"));
        };
        root.on("Target.targetDestroyed", gone);
        cancel = () => root.off("Target.targetDestroyed", gone);
      });
      lost.catch(() => undefined);
      try {
        const { sessionId } = await Promise.race([
          root.send("Target.attachToTarget", { targetId: target.targetId, flatten: false }), lost]);
        let next = 0;
        const ask = <T>(method: string): Promise<T> => {
          const id = ++next;
          return new Promise<T>((resolve, reject) => {
            const done = (): void => {
              root.off("Target.receivedMessageFromTarget", listen);
              root.off("Target.detachedFromTarget", detached);
              root.off("Target.targetDestroyed", destroyed);
            };
            const listen = (event: IHumanViewerTargetMessage): void => {
              if (event.sessionId !== sessionId) return;
              const reply = JSON.parse(event.message) as { id?: number; result?: T; error?: { message: string } };
              if (reply.id !== id) return;
              done();
              if (reply.error !== undefined) reject(new Error(reply.error.message));
              else resolve(reply.result as T);
            };
            // A worker that ends while it is read (a generation swap removes
            // the old frame and its worker) never answers: its detach or
            // destruction ends the read instead of leaving it waiting forever.
            const detached = (event: IHumanViewerTargetDetached): void => {
              if (event.sessionId !== sessionId) return;
              done();
              reject(new Error("The worker detached while it was read"));
            };
            const destroyed = (event: IHumanViewerTargetEvent): void => {
              if (event.targetId !== target.targetId) return;
              done();
              reject(new Error("The worker ended while it was read"));
            };
            root.on("Target.receivedMessageFromTarget", listen);
            root.on("Target.detachedFromTarget", detached);
            root.on("Target.targetDestroyed", destroyed);
            void root.send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id, method }) })
              .catch((error: unknown) => {
                done();
                reject(error instanceof Error ? error : new Error(String(error)));
              });
          });
        };
        if (collect) await ask<object>("HeapProfiler.collectGarbage");
        heaps.push({ url: target.url, usage: await ask<IHumanViewerHeapUsage>("Runtime.getHeapUsage") });
        void root.send("Target.detachFromTarget", { sessionId }).catch(() => undefined);
      } catch {
        // The worker ended while it was read.
      } finally {
        cancel();
      }
    }
    return heaps;
  } finally {
    await root.detach().catch(() => undefined);
  }
}
