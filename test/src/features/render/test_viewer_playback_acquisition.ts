import assert from "node:assert/strict";

import { acquireViewerBrowser } from "../../../../packages/render/src/node/acquireViewerBrowser";

/** Pending acquisition observes cancellation without replacing browser methods.
 *
 * Scenarios:
 * 1. Pre-abort allocates no resource.
 * 2. A resource acquired after abort closes exactly once and is never returned.
 * 3. A successful acquisition stays open for its caller to own.
 */
export async function test_viewer_playback_acquisition(): Promise<void> {
  const reason: Error = new Error("Playback canceled while browser opens");
  const signal: AbortController = new AbortController();
  signal.abort(reason);
  let launches: number = 0;
  let closes: number = 0;
  const resource: { close: () => Promise<void> } = {
    close: (): Promise<void> => {
      closes++;
      return Promise.resolve();
    },
  };
  await assert.rejects(
    (): Promise<typeof resource> =>
      acquireViewerBrowser((): Promise<typeof resource> => {
        launches++;
        return Promise.resolve(resource);
      }, signal.signal),
    (error: unknown): boolean => error === reason,
  );
  assert.equal(launches, 0);
  const during: AbortController = new AbortController();
  let release: (value: typeof resource) => void = (): void => {
    throw new Error("Acquisition gate not initialized");
  };
  const acquired: Promise<typeof resource> = new Promise(
    (resolve: (value: typeof resource) => void): void => {
      release = resolve;
    },
  );
  const pending: Promise<typeof resource> = acquireViewerBrowser(
    (): Promise<typeof resource> => acquired,
    during.signal,
  );
  during.abort(reason);
  release(resource);
  await assert.rejects(
    (): Promise<typeof resource> => pending,
    (error: unknown): boolean => error === reason,
  );
  assert.equal(closes, 1);
  const ready: typeof resource = await acquireViewerBrowser(
    (): Promise<typeof resource> => Promise.resolve(resource),
  );
  assert.equal(ready, resource);
  assert.equal(closes, 1);
  await ready.close();
  assert.equal(closes, 2);
}
