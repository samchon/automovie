import type { Browser } from "playwright";

import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerTargetMessage } from "./IHumanViewerTargetMessage";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap";

/**
 * Read the heap of every dedicated worker in the browser, each from its own
 * isolate: attach to the worker target through a browser session, ask it for
 * `Runtime.getHeapUsage` (after a full collection when `collect` is set) and
 * detach. Playwright's sessions do not route flattened child sessions, so the
 * worker is addressed with `Target.sendMessageToTarget`. A worker that
 * vanishes while being read is left out.
 *
 * @evidence contracts/common.md#principled-implementation Each worker isolate reports its own heap through the protocol, the same accounting the page reading uses.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns attaching, asking and detaching for every worker.
 * @evidence contracts/common.md#meaningful-documentation States the transport, the collection option and the vanished case.
 */
export async function readHumanViewerWorkerHeaps(browser: Browser, collect: boolean): Promise<IHumanViewerWorkerHeap[]> {
  const root = await browser.newBrowserCDPSession();
  try {
    const { targetInfos } = await root.send("Target.getTargets");
    const heaps: IHumanViewerWorkerHeap[] = [];
    for (const target of targetInfos.filter((info) => info.type === "worker")) {
      try {
        const { sessionId } = await root.send("Target.attachToTarget", { targetId: target.targetId, flatten: false });
        let next = 0;
        const ask = <T>(method: string): Promise<T> => {
          const id = ++next;
          return new Promise<T>((resolve, reject) => {
            const listen = (event: IHumanViewerTargetMessage): void => {
              if (event.sessionId !== sessionId) return;
              const reply = JSON.parse(event.message) as { id?: number; result?: T; error?: { message: string } };
              if (reply.id !== id) return;
              root.off("Target.receivedMessageFromTarget", listen);
              if (reply.error !== undefined) reject(new Error(reply.error.message));
              else resolve(reply.result as T);
            };
            root.on("Target.receivedMessageFromTarget", listen);
            void root.send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id, method }) })
              .catch((error: unknown) => {
                root.off("Target.receivedMessageFromTarget", listen);
                reject(error instanceof Error ? error : new Error(String(error)));
              });
          });
        };
        if (collect) await ask<object>("HeapProfiler.collectGarbage");
        heaps.push({ url: target.url, usage: await ask<IHumanViewerHeapUsage>("Runtime.getHeapUsage") });
        await root.send("Target.detachFromTarget", { sessionId }).catch(() => undefined);
      } catch {
        // The worker ended while it was read.
      }
    }
    return heaps;
  } finally {
    await root.detach().catch(() => undefined);
  }
}
