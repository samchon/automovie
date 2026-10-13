/**
 * The identities read from a large JSON packet without parsing it.
 *
 * @evidence contracts/common.md#principled-implementation Projects a packet's opening id and top-level object members' opening ids through the structural byte scanner.
 * @evidence contracts/common.md#clear-and-simple-design Keeps catalogue naming facts separate from full inflated numerical packet parsing and Person admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The scanner detects selected malformed structures but does not certify complete JSON grammar or physiological packet semantics.
 * @evidence contracts/common.md#meaningful-documentation Documents top-level versus member ids and the opening-id convention without treating arbitrary member presence as an admitted basis.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record scans no bytes; the scanner traverses decoded packet bytes without allocating its complete object tree.
 * @evidence contracts/performance.md#reuse-equivalent-work Sidecar facts own path/stamp/digest reuse; this identity record alone cannot authorize changed packet bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned strings/member map scale with top-level identities, while the caller owns the inflated buffer and no file/worker handle transfers.
 *
 * @author Samchon
 */
export interface IHumanViewerPacketIdentities {
  /** The packet's top-level `id`. */
  id: string;

  /**
   * For each top-level member whose value is an object opening with an `id` string, that id.
   */
  members: Record<string, string>;
}
