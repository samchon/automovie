/**
 * Select the caller-owned face basis from editor or worker parameters. The repository bundles no basis, so a missing or blank `faceSource` refuses before any fetch. A relative URL resolves against the supplying page before worker propagation; fetch and the face runtime retain byte, schema and identity checks.
 *
 * @evidence contracts/common.md#principled-implementation URLSearchParams selects the explicit faceSource value, URL resolves it against the supplying page, and protocol admission permits HTTP(S) or caller-owned blob transport before asset byte/schema checks.
 * @evidence contracts/common.md#clear-and-simple-design Source selection remains one browser IO helper while fetch/decode and numerical basis admission stay with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source refuses rather than restoring a bundled basis, and disallowed protocols receive no guessed URL or asset fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies caller-owned source, blank refusal, relative resolution before worker propagation and later byte/schema authority.
 * @evidence contracts/performance.md#efficient-algorithms Parsing q search characters and resolving u URL characters costs O(q+u) time and temporary string storage, with a fixed three-protocol membership check.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This source query retains no byte or decode cache and preserves the explicit source passed for each page or worker.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a resolved URL string escapes; blob URL ownership remains with its caller and no fetch or object URL is acquired here.
 *
 * @author Samchon
 */
export function readConnectedFaceSourceUrl(search: string, base: string): string {
  const value: string | null = new URLSearchParams(search).get("faceSource");
  if (value === null || value.trim() === "")
    throw new Error(
      "No face basis is bundled: select one with the faceSource URL parameter.",
    );
  const url: URL = new URL(value, base);
  if (!["http:", "https:", "blob:"].includes(url.protocol))
    throw new Error(
      "A face basis source requires an HTTP(S) or caller-owned blob URL.",
    );
  return url.href;
}
