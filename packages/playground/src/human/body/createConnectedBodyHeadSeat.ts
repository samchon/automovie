import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";
import { createConnectedBodyBrowserCompanion } from "@automovie/viewer/human/body/createConnectedBodyBrowserCompanion";

import { createHumanWorker } from "../common/createHumanWorker";
import { createHumanResidentPort } from "../common/createHumanResidentPort";
import { createHumanResidentWorker } from "@automovie/viewer/human/common/createHumanResidentWorker";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { IConnectedBodyHeadSeatProps } from "./IConnectedBodyHeadSeatProps";
import type { IConnectedBodyHeadSeat } from "./IConnectedBodyHeadSeat";

/**
 * Seat the person generation's head on the edited body. The head is the head view with the default face, evaluated with the current body document in its own resident worker; only its `face:` parts come back and they sit in the body's frame. A later body supersedes an earlier answer. Hiding the head says that the top of the neck still follows the default head's carried position, because one-sided neck channels meet that carry at the cut. A head that cannot be built is appended to the status line and body editing continues without it. The mounting page must close the returned seat. Close withdraws publication, rejects the resident numerical requests, waits for pending frame preparation and retires the Viewer-owned companion.
 *
 * @evidence contracts/common.md#principled-implementation Correlated head requests use the actual body document and generation checks before and after asynchronous GPU preparation, while source serialization authority stays with the loaded body source.
 * @evidence contracts/common.md#clear-and-simple-design Playground owns numerical request ordering and status; Viewer owns texture loading, GPU preparation and body-frame companion placement through its browser companion factory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Head output is evaluated through the resident product worker without raw bundled geometry, guessed attachment transforms or a fallback for a refused request.
 * @evidence contracts/common.md#meaningful-documentation The comment explains display-only head context, supersession, hidden-head carry, refusal reporting and the page's final close obligation.
 * @evidence contracts/performance.md#efficient-algorithms Each seating call serializes the body document and requests numerical preview; transferred mesh and GPU preparation cost scale with head topology, while generation checks and companion placement use constant metadata work.
 * @evidence contracts/performance.md#reuse-equivalent-work One resident worker and one Viewer companion renderer serve the mounted page, reusing admitted sources and topology; older requests lose publication authority rather than sharing an effect based only on document equality.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The seat owns one numerical connection and a set of outstanding frame tasks with no fixed count cap while preparation is unresolved. Supersession cancels the current numerical request; tasks leave on settlement, and close permanently withdraws authority, disposes the worker, waits for tasks and retires the companion.
 *
 * @author Samchon
 */
export function createConnectedBodyHeadSeat(
  props: IConnectedBodyHeadSeatProps,
): IConnectedBodyHeadSeat {
  const worker: ReturnType<typeof createHumanResidentWorker<ConnectedBodyRequest, ConnectedBodyResult>> = createHumanResidentWorker<
    ConnectedBodyRequest,
    ConnectedBodyResult
  >((): ReturnType<typeof createHumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>> => createHumanResidentPort(createHumanWorker("worker=body-head")));
  const renderer: ReturnType<typeof createConnectedBodyBrowserCompanion> = createConnectedBodyBrowserCompanion({ viewport: props.viewport });
  const pending: Set<Promise<void>> = new Set();
  let sequence: number = 0;
  let closed: boolean = false;
  let cancel: (() => void) | undefined;
  // the head view loads in its worker before the first head can be shown
  let shown: boolean = false;
  const seat: (model: unknown, body: IAutoMovieHumanBodyBasisDocument) => void = (model: unknown, body: IAutoMovieHumanBodyBasisDocument): void => {
    if (closed) throw new Error("The connected body head seat is closed.");
    const mine: number = ++sequence;
    cancel?.();
    cancel = undefined;
    let published: boolean = false;
    if (model === null) {
      renderer.hide();
      props.preparing?.(false);
      props.status(
        "Head hidden: the top of the neck still follows the default head's carried position.",
      );
      return;
    }
    if (!shown) props.preparing?.(true);
    // This runs after the panel has written this body's status, so a head
    // failure is appended to that line rather than overwritten by it.
    const request: ReturnType<typeof worker.request> = worker.request({
        operation: "preview",
        document: serializeHumanBodyBasisDocument(body, props.source),
        measure: false,
      });
    cancel = request.cancel;
    const work: Promise<void> = request.result.then(async (result: ConnectedBodyResult): Promise<void> => {
        if (mine !== sequence) return;
        if (result.operation !== "preview")
          throw new Error("Expected a head preview.");
        const frame: Awaited<ReturnType<typeof renderer.prepare>> = await renderer.prepare(result.model);
        if (mine !== sequence) {
          renderer.dispose(frame);
          await renderer.settleRetirements();
          return;
        }
        renderer.publish(frame);
        published = true;
        shown = true;
        props.preparing?.(false);
        await renderer.settleRetirements();
      })
      .catch((error: unknown): void => {
        if (mine !== sequence) return;
        props.preparing?.(false);
        props.status(
          (published ? "The displayed head is retained; resource cleanup failed: " : "Head unavailable: ") +
            (error instanceof Error ? error.message : String(error)),
        );
      });
    pending.add(work);
    const forget: () => void = (): void => { pending.delete(work); };
    void work.then(forget).catch(forget);
  };
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => { closed = true; ++sequence; cancel?.(); cancel = undefined; },
    (): void => worker.dispose(),
    async (): Promise<void> => {
      let primary: { error: unknown } | undefined;
      try { await Promise.all(pending); }
      catch (error) { primary = { error }; }
      if (primary === undefined)
        await createAutoMovieResourceRetirement([(): Promise<void> => renderer.close()])();
      else
        await createAutoMovieResourceRetirement([(): Promise<void> => renderer.close()], primary)();
    },
  ]);
  return Object.assign(seat, { close });
}
