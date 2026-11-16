/** One native request and its owned timeout; entries disappear on every settlement path. */
interface IPending {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/** Responses from the owned loopback Inspector; notifications need no target handler. */
interface IResponse {
  id?: number;
  result?: Record<string, unknown>;
  error?: { message: string };
}

/**
 * Own one native Inspector WebSocket and its bounded request population.
 * Construction starts connecting but never evaluates target code. The host
 * owns child termination and calls close before closed during its finally.
 *
 * @param endpoint The loopback URL emitted by the owned child's Inspector.
 * @param report Report native transport failures to the host's existing failure boundary.
 * @returns A session whose timers and socket the current measurement must release.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the loopback endpoint, explicit ready/close lifetime, four-command request boundary and failure ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Uses Node's native WebSocket and Inspector JSON request ids; only the documented native profiler commands and runIfWaitingForDebugger are available to the host.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns transport and pending requests in one closure; profileSceneTakes keeps the child, input attribution, sampling duration and evidence ownership.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sends no Runtime.evaluate, function replacement or SDK-specific command. Named request and caller startup/shutdown bounds govern host resources rather than changing measured computation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Matches each response with a Map lookup and retains only pending requests plus the current response/profile message; parsing scales with received protocol bytes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares one connection across this measurement's real requests, using monotone request ids; no response, SDK result or connection crosses measurement calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The current host owns one socket. Every pending timer is cleared on response, abort or close; ready and closed use finite caller bounds, and transport failures reject pending work.
 */
export function SceneTakeProfileInspector(
  endpoint: string,
  report: (error: Error) => void,
): SceneTakeProfileInspector.IConnection {
  const socket: WebSocket = new WebSocket(endpoint);
  const pending: Map<number, IPending> = new Map();
  let failure: Error | undefined;
  let next: number = 0;
  let closing: boolean = false;

  /** Reject outstanding work without recursively reporting the host's own cancellation. */
  const abort: (error: Error) => void = (error: Error): void => {
    failure ??= error;
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(failure);
    }
    pending.clear();
  };

  /** Native failures settle the session before notifying its owner. */
  const fail: (error: unknown) => void = (error: unknown): void => {
    const reason: Error =
      error instanceof Error ? error : new Error(String(error));
    abort(reason);
    report(reason);
  };

  /** Register before sending, so even an immediate response owns and clears its timeout. */
  const request: SceneTakeProfileInspector.IConnection["request"] = (
    method: SceneTakeProfileInspector.Method,
  ): Promise<Record<string, unknown>> =>
    new Promise(
      (
        resolve: (value: Record<string, unknown>) => void,
        reject: (reason: Error) => void,
      ): void => {
        if (failure !== undefined) {
          reject(failure);
          return;
        }
        if (socket.readyState !== WebSocket.OPEN) {
          reject(new Error("Inspector socket is not open"));
          return;
        }
        const id: number = ++next;
        const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
          pending.delete(id);
          reject(new Error("Inspector request timed out: " + method));
        }, SceneTakeProfileInspector.REQUEST_LIMIT);
        pending.set(id, { resolve, reject, timer });
        try {
          socket.send(JSON.stringify({ id, method }));
        } catch (error) {
          clearTimeout(timer);
          pending.delete(id);
          reject(
            new Error(error instanceof Error ? error.message : String(error)),
          );
        }
      },
    );

  socket.addEventListener("error", (): void =>
    fail(new Error("Inspector WebSocket error")),
  );
  socket.addEventListener("close", (): void => {
    if (!closing)
      fail(new Error("Inspector WebSocket closed during measurement"));
  });
  socket.addEventListener("message", (event: MessageEvent): void => {
    try {
      const response: IResponse = JSON.parse(String(event.data)) as IResponse;
      if (response.id === undefined) return;
      const waiting: IPending | undefined = pending.get(response.id);
      if (waiting === undefined) return;
      clearTimeout(waiting.timer);
      pending.delete(response.id);
      if (response.error !== undefined)
        waiting.reject(new Error(response.error.message));
      else waiting.resolve(response.result ?? {});
    } catch (error) {
      fail(error);
    }
  });

  return {
    ready: (limit: number): Promise<void> =>
      SceneTakeProfileInspector.waitFor(
        (): boolean => socket.readyState === WebSocket.OPEN,
        limit,
        "Inspector connection",
        (): Error | undefined => failure,
      ),
    request,
    abort,
    close: (): void => {
      closing = true;
      abort(new Error("Profile host is closing"));
      socket.close();
    },
    closed: (limit: number): Promise<void> =>
      SceneTakeProfileInspector.waitFor(
        (): boolean => socket.readyState === WebSocket.CLOSED,
        limit,
        "Inspector close",
      ),
  };
}

/**
 * The transport surface consumed by one native profile host.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents allowed native methods, request milliseconds, explicit connection/close waits and host-owned cancellation.
 * @evidence contracts/development/design.md#principled-representation Represents one Inspector session with four permitted command names, explicit lifecycle methods and millisecond wait limits; it contains no SDK or input-shape model.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes exactly the current host's ready/request/abort/close/closed operations and its shared bounded wait; pending ids and socket internals remain private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses a closed command union rather than arbitrary evaluation strings. Unknown JSON remains only at the native protocol response boundary, never as replacement SDK data.
 */
export namespace SceneTakeProfileInspector {
  /** The only native commands the measurement host sends. */
  export type Method =
    | "Profiler.enable"
    | "Profiler.start"
    | "Profiler.stop"
    | "Runtime.runIfWaitingForDebugger";

  /** Ten seconds to receive one native response, independent of target completion. */
  export const REQUEST_LIMIT: number = 10000;

  /** Current measurement ownership; close starts shutdown, closed observes it. */
  export interface IConnection {
    /** Wait at most limit milliseconds for the native connection to open. */
    ready: (limit: number) => Promise<void>;

    /** Send one allowed command; its response has an independent finite timeout. */
    request: (method: Method) => Promise<Record<string, unknown>>;

    /** Reject pending work on the owning host's cancellation without recursive reporting. */
    abort: (error: Error) => void;

    /** Begin closing the socket and clear all pending request timers. */
    close: () => void;

    /** Observe native closure within limit milliseconds, independently of earlier faults. */
    closed: (limit: number) => Promise<void>;
  }

  /** Poll an externally advanced condition; every short timer finishes before another is acquired. */
  export async function waitFor(
    ready: () => boolean,
    limit: number,
    label: string,
    fault?: () => Error | undefined,
  ): Promise<void> {
    const deadline: number = performance.now() + limit;
    for (;;) {
      const failure: Error | undefined = fault?.();
      if (failure !== undefined) throw failure;
      if (ready()) return;
      if (performance.now() >= deadline)
        throw new Error("Timed out waiting for " + label);
      await new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 25);
      });
    }
  }
}
