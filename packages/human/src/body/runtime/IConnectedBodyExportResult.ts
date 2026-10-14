/**
 * The worker's reply to an explicit export request: the static GLB bytes.
 * The sender's transport transfers the ArrayBuffer; this record alone neither sends nor detaches it. Static encoding retains the exporter-owned provenance and precision limitations.
 *
 * @evidence contracts/common.md#principled-implementation The export discriminator pairs an explicit request with completed binary glTF rather than a preview geometry payload.
 * @evidence contracts/common.md#clear-and-simple-design A single byte buffer is the transport surface; admission, provenance and glTF construction remain in exportHumanBody.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Encoded bytes do not certify clinical anatomy, and the type does not claim that constructing a reply performs ownership transfer.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies static output and separates buffer creation from transport detachment.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This binary reply schema contains no encoding algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reply type neither caches bytes nor merges export requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Buffer transfer and release are transport operations outside this erased declaration.
 *
 * @author Samchon
 */
export interface IConnectedBodyExportResult {
  /** Reply kind. */
  operation: "export";

  /** Completed binary glTF bytes; the worker transport transfers their owned ArrayBuffer. */
  glb: Uint8Array<ArrayBuffer>;
}
