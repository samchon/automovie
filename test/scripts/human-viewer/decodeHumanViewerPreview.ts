/**
 * Restore the numerical disk protocol's typed geometry. Ordinary JSON values
 * remain ordinary values. Unknown array tags, malformed array elements and
 * non-preview payloads refuse rather than reaching GPU preparation as stale or
 * corrupted cached data. No filesystem or reference configuration is read.
 *
 * @evidence contracts/common.md#principled-implementation Closed array tags reconstruct exact Float32 and Uint32 kinds and reject malformed protocol envelopes.
 * @evidence contracts/common.md#clear-and-simple-design Disk decoding has no model-building or display responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the persisted numerical data, without recognizing documents or fixtures.
 * @evidence contracts/common.md#meaningful-documentation Defines supported tags and corruption refusal.
 */
export function decodeHumanViewerPreview(text: string): unknown {
  const value = JSON.parse(text, (_key, entry) => {
    if (entry === null || typeof entry !== "object" || !("$array" in entry)) return entry;
    if (!Array.isArray(entry.values) || !entry.values.every((element: unknown) => typeof element === "number" && Number.isFinite(element)))
      throw new Error("Invalid cached geometry array");
    if (entry.$array === "Float32") return new Float32Array(entry.values);
    if (entry.$array === "Uint32") {
      if (!entry.values.every((element: number) => Number.isInteger(element) && element >= 0 && element <= 0xffffffff))
        throw new Error("Invalid cached geometry index");
      return new Uint32Array(entry.values);
    }
    throw new Error("Unknown cached array kind");
  });
  if (value === null || value.operation !== "preview" || value.model === undefined) throw new Error("Invalid numerical preview cache");
  return value;
}
