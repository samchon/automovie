import type { ServerResponse } from "node:http";

import { reportAutoMovieResourceRetirement } from "../../reportAutoMovieResourceRetirement.js";

/**
 * Notify displayed tabs of source revisions without owning their page lifetime. Each connection receives the current revision, then published changes. A tab decides when to prepare a replacement; disconnecting never removes its model. Closing the server ends only its own event connections. An optional disk-read failure accompanies the retained revision, so an unchanged last-good digest cannot hide an unreadable replacement from the application's candidate owner.
 *
 * @evidence contracts/common.md#principled-implementation Each event connection receives current revision/error facts and subsequent published changes; disconnect or server close removes only this owner's streams.
 * @evidence contracts/common.md#clear-and-simple-design One client set and one message projection connect source publication to browser-controlled candidate replacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source read failures accompany the retained digest and ending streams does not claim model retirement; close attempts all responses even if one end throws.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns tab/model lifetime to the browser and describes retained-revision error disclosure.
 * @evidence contracts/performance.md#efficient-algorithms One serialized current message is shared across a linear traversal of connected responses; close similarly visits each current connection once.
 * @evidence contracts/performance.md#reuse-equivalent-work Clients share identical revision/error publication bytes from the same source owner, while subscribing reads current state rather than an earlier message cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Close and disconnect release client references; connection count and Node response backpressure buffers have no independent cap in this adapter, and it does not retain source history.
 */
export function createHumanViewerSourceEvents(
  revision: () => string,
  error?: () => string | undefined,
): {
  subscribe: (response: ServerResponse) => void;
  publish: () => void;
  close: () => void;
} {
  const clients: Set<ServerResponse> = new Set();
  const message: () => string = (): string =>
    `data: ${JSON.stringify({ revision: revision(), error: error?.() })}\n\n`;
  return {
    /** Attach a same-origin event stream and release it when that tab closes. */
    subscribe: (response: ServerResponse): void => {
      response.setHeader("Content-Type", "text/event-stream");
      response.setHeader("Cache-Control", "no-store");
      response.flushHeaders();
      clients.add(response);
      response.once("close", (): void => {
        clients.delete(response);
      });
      response.write(message());
    },
    /** The source publication owner calls this after its catalogue is updated. */
    publish: (): void => {
      const current: string = message();
      for (const response of clients) response.write(current);
    },
    /** End only the event streams owned by this server lifetime. */
    close: (): void => {
      const owned: ServerResponse[] = [...clients];
      clients.clear();
      reportAutoMovieResourceRetirement(
        owned.map((response: ServerResponse): (() => void) => (): void => {
          response.end();
        }),
      );
    },
  };
}
