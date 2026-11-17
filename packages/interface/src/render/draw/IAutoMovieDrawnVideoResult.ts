import type { IAutoMovieRenderedFrameReceipt } from "./IAutoMovieRenderedFrameReceipt.js";

/**
 * Successful sequential beauty capture and encoding receipts. renderAutoMovieDrawnVideo returns after the host encoder resolves, with one receipt per written frame and the actual encoder arguments. Failed drawing/writing/encoding rejects without returning partial success; prior files remain host-owned.
 *
 * @evidence contracts/development/design.md#principled-representation Failed drawing/writing/encoding rejects without returning partial success; prior files remain host-owned.
 * @evidence contracts/development/design.md#minimal-and-owned-surface renderAutoMovieDrawnVideo exchanges frames, args; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Failed drawing/writing/encoding rejects without returning partial success; prior files remain host-owned.
 * @evidence contracts/development/common.md#meaningful-documentation Successful sequential beauty capture and encoding receipts. renderAutoMovieDrawnVideo returns after the host encoder resolves, with one receipt per written frame and the actual encoder arguments. The prose and members document how renderAutoMovieDrawnVideo interprets and admits these values.
 */
export interface IAutoMovieDrawnVideoResult {
  /** The subject's frames, in order, each with its second, file and pixel hash. */
  frames: IAutoMovieRenderedFrameReceipt[];

  /** The arguments the encoder ran with. */
  args: string[];
}
