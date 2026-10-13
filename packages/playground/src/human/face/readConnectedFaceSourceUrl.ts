/**
 * Select the caller-owned face basis from editor or worker parameters. The
 * repository bundles no basis, so a missing or blank `faceSource` refuses
 * before any fetch. A relative URL resolves against the supplying page before
 * worker propagation; fetch and the face runtime retain byte, schema and
 * identity checks.
 *
 * @author Samchon
 */
export function readConnectedFaceSourceUrl(search: string, base: string): string {
  const value = new URLSearchParams(search).get("faceSource");
  if (value === null || value.trim() === "")
    throw new Error(
      "No face basis is bundled: select one with the faceSource URL parameter.",
    );
  const url = new URL(value, base);
  if (!["http:", "https:", "blob:"].includes(url.protocol))
    throw new Error(
      "A face basis source requires an HTTP(S) or caller-owned blob URL.",
    );
  return url.href;
}
