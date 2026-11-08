/** Close a browser which finishes opening after cancellation, before handing it to the recording owner. */
export async function acquireViewerBrowser<
  T extends { close: () => Promise<void> },
>(launch: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  signal?.throwIfAborted();
  const browser: T = await launch();
  try {
    signal?.throwIfAborted();
    return browser;
  } catch (error: unknown) {
    await browser.close();
    throw error;
  }
}
