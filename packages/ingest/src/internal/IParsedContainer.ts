/**
 * One decoded glTF/GLB container with parsed JSON and optional borrowed BIN view.
 *
 * @evidence contracts/common.md#principled-implementation JSON owns parsed values while the optional BIN aliases the validated resident GLB chunk.
 * @evidence contracts/common.md#clear-and-simple-design One framing result separates logical document facts from binary bytes before structural admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A suffix-provided VRM label does not certify VRM metadata; the humanoid profile checks it separately.
 * @evidence contracts/common.md#meaningful-documentation Members describe parsed JSON, container family and read-only optional BIN aliasing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Container-result typing performs no JSON parsing or binary-chunk traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no cached decoding and carries the current call's parsed container only.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It declares borrowed BIN ownership rather than retaining a file handle or independent byte copy.
 * @author Samchon
 */
export interface IParsedContainer {
  /** Strictly parsed JSON document awaiting structural/profile admission. */
  json: unknown;

  /** Container family selected from the supported path suffix; metadata is checked separately. */
  format: "gltf" | "glb" | "vrm";

  /** Read-only view of the optional validated GLB BIN chunk, or null for absent binary payload. */
  bin: Uint8Array | null;
}
