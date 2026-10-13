import type { ServerResponse } from "node:http";

/**
 * Notify displayed tabs of source revisions without owning their page lifetime.
 * Each connection receives the current revision, then published changes. A tab
 * decides when to prepare a replacement; disconnecting never removes its model.
 * Closing the server ends only its own event connections. An optional disk-read
 * failure accompanies the retained revision, so an unchanged last-good digest
 * cannot hide an unreadable replacement from the application's candidate owner.
 */
export function createHumanViewerSourceEvents(
  revision: () => string,
  error?: () => string | undefined,
) {
  const clients = new Set<ServerResponse>();
  const message = (): string =>
    `data: ${JSON.stringify({ revision: revision(), error: error?.() })}\n\n`;
  return {
    /** Attach a same-origin event stream and release it when that tab closes. */
    subscribe: (response: ServerResponse): void => {
      response.setHeader("Content-Type", "text/event-stream");
      response.setHeader("Cache-Control", "no-store");
      response.flushHeaders();
      clients.add(response);
      response.once("close", () => clients.delete(response));
      response.write(message());
    },
    /** The source publication owner calls this after its catalogue is updated. */
    publish: (): void => {
      const current = message();
      for (const response of clients) response.write(current);
    },
    /** End only the event streams owned by this server lifetime. */
    close: (): void => {
      for (const response of clients) response.end();
      clients.clear();
    },
  };
}
