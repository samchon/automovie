/**
 * The generation token this frame was opened with (`token` in its URL), or null for a frame opened without a host (it can draw, but the server accepts no cache writes or admissions from unproven code).
 *
 * @evidence contracts/common.md#principled-implementation The actual frame URL token is read through URLSearchParams and absent host token remains null.
 * @evidence contracts/common.md#clear-and-simple-design One query lookup preserves the host-issued text without another generation-window owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reading a token is not validation of its source authority; the server still refuses unproven cache/admission requests.
 * @evidence contracts/common.md#meaningful-documentation The comment explains unhosted frames and why drawing alone cannot authorize persisted results.
 * @evidence contracts/performance.md#efficient-algorithms Query parsing is linear in search text and performs one token lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Each frame search is read independently without reusing another frame's generation identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned nullable string remains; no source hold, page listener or cache entry is acquired.
 */
export function readHumanViewerFrameToken(search: string): string | null {
  return new URLSearchParams(search).get("token");
}
