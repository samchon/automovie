/**
 * Caller-supplied persistence for one captured PNG.
 *
 * The adapter calls it once per frame and pass, awaiting each call before the
 * next screenshot, with `path` built as `<dir>/<guidePassFrameName(index,
 * pass)>` after stripping trailing separators from `dir`. `metadata` repeats
 * the frame's seek time in seconds and its zero-based index. The adapter does
 * not create directories or touch the filesystem itself, and a rejection
 * propagates from `captureFrame` unwrapped.
 *
 * @evidence contracts/common.md#principled-implementation Injecting the write keeps the adapter usable in a browser-free test and in any host storage, while the adapter still decides the deterministic path so every host writes the same names.
 * @evidence contracts/common.md#clear-and-simple-design A single function type is the whole storage boundary; path construction stays with the adapter and directory policy stays with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The adapter passes the screenshot bytes and computed path unchanged and does not retry or hide a failed write.
 * @evidence contracts/common.md#meaningful-documentation The doc says how often it is called and in what order, how `path` is formed, the unit of `timeSeconds`, that `index` is zero-based, that no directory is created for it, and that its rejection is not wrapped.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type declares a callback shape; the cost of writing belongs to the caller's implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call persists a distinct frame and pass file, so there is no equivalent write to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Calls are awaited one at a time, so at most one frame's bytes are in flight; whether the implementation keeps them, as a test's in-memory map does, is the caller's retention.
 */
export type IAutoMovieHeadlessFrameWriter = (
  path: string,
  bytes: Uint8Array,
  metadata: { timeSeconds: number; index: number },
) => Promise<void>;
