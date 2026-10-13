import type { ServerResponse } from "node:http";

/**
 * Notify displayed tabs of source revisions without owning their page lifetime.
 * Each connection receives the current revision, then published changes. A tab
 * decides when to prepare a replacement; disconnecting never removes its model.
 * Closing the server ends only its own event connections. An optional disk-read
 * failure accompanies the retained revision, so an unchanged last-good digest
 * cannot hide an unreadable replacement from the application's candidate owner.
 *
 * @evidence contracts/common.md#principled-implementation Current source publication travels over a separate event stream and has no authority to reload or remove a completed viewport.
 * @evidence contracts/common.md#clear-and-simple-design One client set publishes the owner's revision and releases connections on their actual response lifetime.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sends the supplied revision without patching browser reload methods, manufacturing a successful candidate or restarting the page by age.
 * @evidence contracts/common.md#meaningful-documentation States initial publication, later source notifications and the separation between connection closure and model lifetime.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps a completed display usable while changed source prepares a replacement.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Carries source notifications separately from browser reload and geometry evaluation.
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
