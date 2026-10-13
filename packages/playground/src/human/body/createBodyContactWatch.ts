import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { IBodyContactWatch } from "./IBodyContactWatch";
import type { IBodyContactWatchProps } from "./IBodyContactWatchProps";

/**
 * Read geometric skin crossings after a 600 ms editing pause. One latest delayed request waits behind at most one active inspection; replacing or cancelling the delay settles its promise. A newer body intent or close withdraws reporting, while every prepared inspection frame still retires through its viewport. Close cancels the timer and awaits active cleanup. Numerical or retirement refusals are reported only while the intent and watch remain current.
 *
 * @evidence contracts/common.md#principled-implementation A cancellable latest-request delay and serialized active inspection bind observation to the panel ticket while preventing transient edits from accumulating timers or concurrent contact builds.
 * @evidence contracts/common.md#clear-and-simple-design The watch owns scheduling and contact-status formatting, while supplied viewport operations own numerical inspection and frame retirement and the panel owns intent validity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 600 ms pause is a UI debounce rather than a numerical timeout; inspection reports actual crossing data without test scheduler injection or tissue-contact claims.
 * @evidence contracts/common.md#meaningful-documentation The comment states the pause, one-active/one-delayed bound, replacement settlement, intent gating, frame cleanup and close behavior.
 * @evidence contracts/performance.md#efficient-algorithms Scheduling and replacement use constant state; formatting c crossing records takes O(c) output work, and measured body construction is delegated once per surviving request to the actual viewport.
 * @evidence contracts/performance.md#reuse-equivalent-work New commits replace only unstarted obsolete observations; active inspection remains distinct until cleanup because document equality alone does not authorize sharing its status effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One watch retains at most one timer, one delayed document and one active reading. Replacement and cancellation clear and settle the delay; active frames retire before completion, and idempotent close withdraws reporting and awaits the active task.
 */
export function createBodyContactWatch<
  Model extends { crossings?: IAutoMovieModelCrossing[] | null },
>(props: IBodyContactWatchProps<Model>): IBodyContactWatch {
  let closed: boolean = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active: Promise<void> | undefined;
  let pending: {
    document: IAutoMovieHumanBodyBasisDocument;
    ticket: number;
    ready: boolean;
    resolve: () => void;
    reject: (cause: unknown) => void;
  } | undefined;
  const describe: IBodyContactWatch["describe"] = (
    reading: IAutoMovieModelCrossing[] | null | undefined,
  ): string | null =>
    reading === null || reading === undefined
      ? null
      : reading.length === 0
        ? "No skin segment crosses itself or another in this pose."
        : "Crossing segments: " +
          reading.map((entry: IAutoMovieModelCrossing): string =>
            `${entry.part} x ${entry.other} ${entry.triangles}/${entry.otherTriangles}`,
          ).join(", ");
  const cancel: () => void = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    const previous: typeof pending = pending;
    pending = undefined;
    previous?.resolve();
  };
  const current: (ticket: number) => boolean = (ticket: number): boolean =>
    !closed && props.isCurrent(ticket);
  const read: (document: IAutoMovieHumanBodyBasisDocument, ticket: number) => Promise<void> = async (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket: number,
  ): Promise<void> => {
    if (!current(ticket)) return;
    let model: Model;
    try {
      model = await props.build(document, true);
    } catch (error) {
      if (current(ticket))
        props.report(
          "Contact reading failed: " +
          (error instanceof Error ? error.message : String(error)),
        );
      return;
    }
    await createAutoMovieResourceRetirement([
      (): void => props.dispose(model),
      (): Promise<void> => props.settleRetirements(),
    ])();
    const text: string | null = describe(model.crossings);
    if (current(ticket) && text !== null) props.report(text);
  };
  const advance: () => void = (): void => {
    if (closed || active !== undefined || pending?.ready !== true) return;
    const request: NonNullable<typeof pending> = pending;
    pending = undefined;
    const result: Promise<void> = read(request.document, request.ticket);
    active = result;
    void result.then(
      (): void => {
        active = undefined;
        request.resolve();
        advance();
      },
    ).catch((cause: unknown): void => {
        active = undefined;
        request.reject(cause);
        advance();
    });
  };
  const after: IBodyContactWatch["after"] = (
    document: IAutoMovieHumanBodyBasisDocument,
    ticket: number,
  ): Promise<void> => {
    if (closed) return Promise.reject(new Error("The body contact watch is closed."));
    cancel();
    return new Promise<undefined>((
      resolve: (value: undefined | PromiseLike<undefined>) => void,
      reject: (reason?: unknown) => void,
    ): void => {
      pending = { document, ticket, ready: false, resolve: (): void => resolve(undefined), reject };
      timer = setTimeout((): void => {
        timer = undefined;
        if (pending === undefined) return;
        pending.ready = true;
        advance();
      }, 600);
    });
  };
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => { closed = true; },
    cancel,
    async (): Promise<void> => { await active; },
  ]);
  return { describe, after, cancel, close };
}
