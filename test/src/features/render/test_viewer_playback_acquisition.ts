import assert from "node:assert/strict";

import { acquireViewerBrowser } from "../../../../packages/template/scaffold/production/src/executable/render/node/acquireViewerBrowser";

/** Pending acquisition observes cancellation without replacing browser methods.
 *
 * Scenarios:
 * 1. Pre-abort allocates no resource.
 * 2. A resource acquired after abort closes exactly once and is never returned.
 * 3. A successful acquisition stays open for its caller to own.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `acquireViewerBrowser` on in-memory inputs and asserts the returned observations through no assertion call; 3 numbered scenarios (first: Pre-abort allocates no resource.; last: A successful acquisition stays open for its caller to own.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Pre-abort allocates no resource.; last: A successful acquisition stays open for its caller to own.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership References process, browser or GPU host terms in its source, which this answer does not clear entered through the discoverable function `test_viewer_playback_acquisition`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host as far as the scan can tell, apart from the terms noted.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Pre-abort allocates no resource.).
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
