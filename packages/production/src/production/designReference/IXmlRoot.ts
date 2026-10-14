/**
 * Namespace-resolved root identity and decoded attributes of a complete XML
 * document. The container selector consumes these facts without rereading text.
 *
 * @evidence contracts/common.md#principled-implementation Namespace-resolved root identity and decoded attributes distinguish a valid SVG root from a different namespace using the same local spelling, after the complete XML document is admitted.
 * @evidence contracts/common.md#clear-and-simple-design inspectXmlRoot owns document grammar and the container selector reads only root identity and attributes needed for SVG family/extent selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A root token alone is not this result; malformed trailing or nested XML is refused before complete-document facts are returned.
 * @evidence contracts/common.md#meaningful-documentation States complete-document provenance, resolved identity and authored attribute spelling.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type executes no grammar scan; inspectXmlRoot owns full-text parsing cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The selector reuses one completed parse result without defining cross-input cache equivalence here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The inspecting call owns the attribute map and returned metadata; the type opens no handle or asynchronous task.
 * @author Samchon
 */
export interface IXmlRoot {
  /** Root name after its namespace prefix was resolved. */
  localName: string;

  /** Resolved namespace URI; undefined means the root has no namespace. */
  namespace: string | undefined;

  /** Decoded root attributes in their authored qualified-name spelling. */
  attributes: ReadonlyMap<string, string>;
}
