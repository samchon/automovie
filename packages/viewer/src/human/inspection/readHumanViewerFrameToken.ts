/**
 * The generation token this frame was opened with (`token` in its URL), or
 * null for a frame opened without a host (it can draw, but the server
 * accepts no cache writes or admissions from unproven code).
 *
 * @evidence contracts/common.md#meaningful-documentation States the null meaning.
 * @evidence contracts/common.md#principled-implementation Uses URLSearchParams to read the opaque host-generation token, preserving null when that parameter is absent.
 * @evidence contracts/common.md#clear-and-simple-design The transport reader performs no admission or cache policy; those consumers decide what an absent token permits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns the actual URL parameter rather than minting a replacement token or inferring authority from frame age.
 */
export function readHumanViewerFrameToken(search: string): string | null {
  return new URLSearchParams(search).get("token");
}
