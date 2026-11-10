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
 * @evidence contracts/development/design.md#principled-representation Injecting the write keeps the adapter usable in a browser-free test and in any host storage, while the adapter still decides the deterministic path so every host writes the same names.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A single function type is the whole storage boundary; path construction stays with the adapter and directory policy stays with the caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The adapter passes the screenshot bytes and computed path unchanged and does not retry or hide a failed write.
 * @evidence contracts/development/common.md#meaningful-documentation The doc says how often it is called and in what order, how `path` is formed, the unit of `timeSeconds`, that `index` is zero-based, that no directory is created for it, and that its rejection is not wrapped.
 */
export type IAutoMovieHeadlessFrameWriter = (
  path: string,
  bytes: Uint8Array,
  metadata: { timeSeconds: number; index: number },
) => Promise<void>;
