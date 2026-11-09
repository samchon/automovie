/**
 * One decoded glTF/GLB container with parsed JSON and optional borrowed BIN view.
 *
 * @evidence contracts/development/design.md#principled-representation JSON owns parsed values while the optional BIN aliases the validated resident GLB chunk.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One framing result separates logical document facts from binary bytes before structural admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A suffix-provided VRM label does not certify VRM metadata; the humanoid profile checks it separately.
 * @evidence contracts/development/common.md#meaningful-documentation Members describe parsed JSON, container family and read-only optional BIN aliasing.
 */
export interface IParsedContainer {
  /** Strictly parsed JSON document awaiting structural/profile admission. */
  json: unknown;

  /** Container family selected from the supported path suffix; metadata is checked separately. */
  format: "gltf" | "glb" | "vrm";

  /** Read-only view of the optional validated GLB BIN chunk, or null for absent binary payload. */
  bin: Uint8Array | null;
}
