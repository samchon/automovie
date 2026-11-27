/*
 * One decoded glTF/GLB container with parsed JSON and optional borrowed BIN
 * view.
 */
export interface IParsedContainer {
  /*
   * Strictly parsed JSON document awaiting structural/profile admission.
   */
  json: unknown;

  /*
   * Container family selected from the supported path suffix; metadata is
   * checked separately.
   */
  format: "gltf" | "glb" | "vrm";

  /*
   * Read-only view of the optional validated GLB BIN chunk, or null for absent
   * binary payload.
   */
  bin: Uint8Array | null;
}
