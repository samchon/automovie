/**
 * The generation token this frame was opened with (`token` in its URL), or
 * null for a frame opened without a host (it can draw, but the server
 * accepts no cache writes or admissions from unproven code).
 *
 * @evidence contracts/common.md#meaningful-documentation States the null meaning.
 */
export function readHumanViewerFrameToken(search: string): string | null {
  return new URLSearchParams(search).get("token");
}
