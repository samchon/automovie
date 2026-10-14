/**
 * What the viewer reads from a person candidate packet `<name>.person.json.gz`: its own identity and the identities of the face and body bases it carries. The rest of the packet belongs to the Person owner's generation type and is admitted where it is built.
 *
 * @evidence contracts/common.md#principled-implementation Projects a candidate packet's opening id and required face/body opening basis ids from the shared structural scanner.
 * @evidence contracts/common.md#clear-and-simple-design Keeps small catalogue naming facts apart from the complete Person generation consumed by its numerical owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Required identities refuse when absent/empty, while structural scanning does not certify complete JSON grammar or full Person semantics.
 * @evidence contracts/common.md#meaningful-documentation Documents packet versus nested basis ids and candidate sidecar path meaning without embedding source geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape scans no bytes; its reader traverses inflated packet bytes and performs two required-member lookups.
 * @evidence contracts/performance.md#reuse-equivalent-work Path/stamp/digest facts control sidecar reuse; identical opening ids alone cannot authorize changed packet bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned three strings retain no full packet object tree; the caller owns its inflated buffer and file stream lifetime.
 *
 * @author Samchon
 */
export interface IHumanViewerPersonSidecar {
  /** The packet `id`. */
  id: string;

  /** `id` of the face basis inside the packet. */
  face: string;

  /** `id` of the body basis inside the packet. */
  body: string;
}
