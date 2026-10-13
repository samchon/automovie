/**
 * Hand bytes to the browser as a file download under a name and media type. A one-second timer revokes the object URL after the click attempt, including a thrown click. This delay is a browser handoff convention, not proof that file saving completed; concurrent downloads retain separate URLs until their own timers run.
 *
 * @evidence contracts/common.md#principled-implementation A Blob-backed object URL and download anchor invoke the browser's user-file seam, with finally scheduling URL retirement even if anchor construction or clicking fails.
 * @evidence contracts/common.md#clear-and-simple-design This browser sink owns only byte handoff and temporary URL lifetime; document and model encoders remain with their callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed delay is identified as a handoff convention rather than an observed save acknowledgement, and payload bytes are not rewritten to an expected file.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies filename and media delivery, one-second URL retirement, exceptional click cleanup and concurrent URL retention.
 * @evidence contracts/performance.md#efficient-algorithms Blob construction retains or copies b payload bytes according to the browser, with constant anchor and timer state per request; no second application-level byte traversal or serialization is performed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Downloads are explicit user effects and each receives its own URL rather than sharing a mutable file handoff based on matching payloads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each acquired object URL is revoked by its scheduled one-second timer after success or exception; the number of simultaneous URLs follows download rate and has no independent cap, and browser document teardown owns outstanding timers.
 */
export function downloadConnectedFile(
  filename: string,
  bytes: BlobPart,
  mime: string,
): void {
  const url: string = URL.createObjectURL(new Blob([bytes], { type: mime }));
  try {
    const anchor: HTMLAnchorElement = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  } finally {
    setTimeout((): void => URL.revokeObjectURL(url), 1000);
  }
}
