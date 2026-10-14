import { isHumanViewerPreviewProjection } from "./isHumanViewerPreviewProjection.js";

/**
 * Restore the numerical disk protocol's typed geometry. Ordinary JSON values remain ordinary values. Unknown array tags, malformed array elements and non-preview payloads refuse rather than reaching GPU preparation as stale or corrupted cached data. No filesystem or reference configuration is read. The envelope requires an object model but does not validate every nested domain field; actual construction owners retain that authority.
 *
 * @evidence contracts/common.md#principled-implementation JSON reviving admits only known Float32 and Uint32 tags with valid numeric elements, then checks the shared preview envelope before returning to the consumer.
 * @evidence contracts/common.md#clear-and-simple-design One reviver owns typed-array restoration and a shared guard owns the outer preview projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Float32 overflow, invalid integer ranges, unknown tags and malformed envelopes throw instead of reaching GPU preparation as trusted geometry; nested model validity is not certified here.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes ordinary JSON preservation, typed geometry refusal and the boundary between envelope checks and domain-owner validation.
 * @evidence contracts/performance.md#efficient-algorithms JSON parsing is linear in serialized data; each tagged array receives numeric validation and one typed-array construction, with an additional Float32 range pass for that kind.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Decoding observes each supplied cache payload independently; digest identity and cache reuse are established by callers rather than this codec.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsing temporarily retains JSON arrays and their typed replacements; returned model arrays remain with the resident owner and this stateless codec retains no separate payload cache.
 */
export function decodeHumanViewerPreview(text: string): unknown {
  const value: unknown = JSON.parse(text, (_key: string, entry: unknown): unknown => {
    if (entry === null || typeof entry !== "object" || !("$array" in entry))
      return entry;
    if (
      !("values" in entry) || !Array.isArray(entry.values) ||
      !entry.values.every(
        (element: unknown): element is number =>
          typeof element === "number" && Number.isFinite(element),
      )
    )
      throw new Error("Invalid cached geometry array");
    if (entry.$array === "Float32") {
      if (!entry.values.every((element: number): boolean => Number.isFinite(Math.fround(element))))
        throw new Error("Cached geometry exceeds Float32 range");
      return new Float32Array(entry.values);
    }
    if (entry.$array === "Uint32") {
      if (
        !entry.values.every(
          (element: number): boolean =>
            Number.isInteger(element) && element >= 0 && element <= 0xffffffff,
        )
      )
        throw new Error("Invalid cached geometry index");
      return new Uint32Array(entry.values);
    }
    throw new Error("Unknown cached array kind");
  });
  if (!isHumanViewerPreviewProjection(value))
    throw new Error("Invalid numerical preview cache");
  return value;
}
