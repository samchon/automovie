import type { Browser, CDPSession } from "playwright";
import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";

import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerTargetDetached } from "./IHumanViewerTargetDetached.js";
import type { IHumanViewerTargetEvent } from "./IHumanViewerTargetEvent.js";
import type { IHumanViewerTargetMessage } from "./IHumanViewerTargetMessage.js";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap.js";

/**
 * Read each dedicated browser worker's isolate through an attached CDP session and optionally collect its garbage before heap sampling. Nonflattened Target messages correlate responses by session and request id. Omit a worker only after its correlated detach/destruction event; a live target's protocol or parse failure rejects. Await known live target detachment and root-session retirement, preserving the primary reading failure. No independent timeout proves an unresponsive but still-live target ended.
 *
 * @evidence contracts/common.md#principled-implementation Enumerates actual dedicated-worker CDP targets, samples each isolate after optional collection and omits a target only when a correlated destruction or detach event marks it ended.
 * @evidence contracts/common.md#clear-and-simple-design One browser-root session routes per-worker protocol requests with session/request identity; nested cleanup follows the session that acquired each attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts JSON/object/error-envelope failures from live targets reject rather than masquerade as disappearance. Result payloads rely on the fixed CDP producer and are not exhaustively heap-schema validated; readings exclude Node numerical heaps and do not measure OS/GPU storage.
 * @evidence contracts/common.md#meaningful-documentation The comment defines target/isolate scope, optional collection, disappearance handling, protocol failure and awaited session cleanup.
 * @evidence contracts/performance.md#efficient-algorithms Targets are enumerated once and worker requests are sequential, with O(W) result records and one active target's listeners; collection and CDP round trips dominate.
 * @evidence contracts/performance.md#reuse-equivalent-work Heap usage changes independently of script URL or source revision, so every measurement is fresh and completed values are not memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Request listeners leave on response, send refusal or target loss; known live attachments and the root session are awaited on success/failure. A lost attach has no known child id and root-session retirement is the remaining owner boundary; no independent protocol timeout is added.
 */
export async function readHumanViewerWorkerHeaps(
  browser: Browser,
  collect: boolean,
): Promise<IHumanViewerWorkerHeap[]> {
  const root: CDPSession = await browser.newBrowserCDPSession();
  let primary: { error: unknown } | undefined;
  try {
    // Destruction events arrive only for discovered targets.
    await root.send("Target.setDiscoverTargets", { discover: true });
    const { targetInfos }: { targetInfos: { type: string; targetId: string; url: string }[] } = await root.send("Target.getTargets");
    const heaps: IHumanViewerWorkerHeap[] = [];
    for (const target of targetInfos.filter((info: { type: string }): boolean => info.type === "worker")) {
      // The whole read of one worker, attach included, ends when the worker
      // is destroyed: a worker torn down at a generation swap was seen to
      // leave even its attach unanswered (source's 5191, 11:56:05).
      let ended: boolean = false;
      let sessionId: string | undefined;
      let readingFailure: { error: unknown } | undefined;
      let cancel: () => void = (): void => {};
      const lost: Promise<never> = new Promise<never>((_resolve: (value: never) => void, reject: (error: unknown) => void): void => {
        const gone: (event: IHumanViewerTargetEvent) => void = (event: IHumanViewerTargetEvent): void => {
          if (event.targetId !== target.targetId) return;
          ended = true;
          root.off("Target.targetDestroyed", gone);
          reject(new Error("The worker ended while it was read"));
        };
        root.on("Target.targetDestroyed", gone);
        cancel = (): void => { root.off("Target.targetDestroyed", gone); };
      });
      void lost.catch((): undefined => undefined);
      try {
        const attached: { sessionId: string } = await Promise.race([
          root.send("Target.attachToTarget", {
            targetId: target.targetId,
            flatten: false,
          }),
          lost,
        ]);
        sessionId = attached.sessionId;
        let next: number = 0;
        const ask: <T>(method: string) => Promise<T> = <T>(method: string): Promise<T> => {
          const id: number = ++next;
          return new Promise<T>((resolve: (value: T) => void, reject: (error: unknown) => void): void => {
            const done: () => void = (): void => {
              root.off("Target.receivedMessageFromTarget", listen);
              root.off("Target.detachedFromTarget", detached);
              root.off("Target.targetDestroyed", destroyed);
            };
            const listen: (event: IHumanViewerTargetMessage) => void = (event: IHumanViewerTargetMessage): void => {
              if (event.sessionId !== sessionId) return;
              let reply: IHumanViewerWorkerReply<T>;
              try {
                const value: unknown = JSON.parse(event.message);
                if (value === null || typeof value !== "object" || Array.isArray(value))
                  throw new Error("The worker protocol reply is not an object.");
                if ("error" in value && value.error !== undefined &&
                    (value.error === null || typeof value.error !== "object" ||
                     !("message" in value.error) || typeof value.error.message !== "string"))
                  throw new Error("The worker protocol failure has no message.");
                reply = value as IHumanViewerWorkerReply<T>;
              } catch (error) {
                done();
                reject(error);
                return;
              }
              if (reply.id !== id) return;
              done();
              if (reply.error !== undefined)
                reject(new Error(reply.error.message));
              else resolve(reply.result as T);
            };
            // A worker that ends while it is read (a generation swap removes
            // the old frame and its worker) never answers: its detach or
            // destruction ends the read instead of leaving it waiting forever.
            const detached: (event: IHumanViewerTargetDetached) => void = (event: IHumanViewerTargetDetached): void => {
              if (event.sessionId !== sessionId) return;
              ended = true;
              done();
              reject(new Error("The worker detached while it was read"));
            };
            const destroyed: (event: IHumanViewerTargetEvent) => void = (event: IHumanViewerTargetEvent): void => {
              if (event.targetId !== target.targetId) return;
              ended = true;
              done();
              reject(new Error("The worker ended while it was read"));
            };
            root.on("Target.receivedMessageFromTarget", listen);
            root.on("Target.detachedFromTarget", detached);
            root.on("Target.targetDestroyed", destroyed);
            void root
              .send("Target.sendMessageToTarget", {
                sessionId,
                message: JSON.stringify({ id, method }),
              })
              .catch((error: unknown): void => {
                done();
                reject(
                  error instanceof Error ? error : new Error(String(error)),
                );
              });
          });
        };
        if (collect) await ask<object>("HeapProfiler.collectGarbage");
        heaps.push({
          url: target.url,
          usage: await ask<IHumanViewerHeapUsage>("Runtime.getHeapUsage"),
        });
      } catch (error) {
        if (!ended) {
          readingFailure = { error };
          throw error;
        }
      } finally {
        cancel();
        if (sessionId !== undefined && !ended) {
          const detach: () => Promise<void> = async (): Promise<void> => {
            await root.send("Target.detachFromTarget", { sessionId });
          };
          if (readingFailure === undefined) await createAutoMovieResourceRetirement([detach])();
          else await createAutoMovieResourceRetirement([detach], readingFailure)();
        }
      }
    }
    return heaps;
  } catch (error) {
    primary = { error };
    throw error;
  } finally {
    const detach: () => Promise<void> = async (): Promise<void> => { await root.detach(); };
    if (primary === undefined) await createAutoMovieResourceRetirement([detach])();
    else await createAutoMovieResourceRetirement([detach], primary)();
  }
}

/**
 * Named local transport for readHumanViewerWorkerHeaps; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerWorkerReply<T> {
  id?: number;
  result?: T;
  error?: IHumanViewerWorkerError;
}

/**
 * Named local transport for readHumanViewerWorkerHeaps; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerWorkerError {
  message: string;
}
