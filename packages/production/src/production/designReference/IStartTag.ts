/**
 * One decoded XML start tag with inherited namespace scope and the exact cursor after its closing delimiter.
 *
 * @evidence contracts/common.md#principled-implementation Qualified authored names support exact closing-tag matching while resolved local names and namespace URIs support semantic root admission; the UTF-16 cursor indexes the original JavaScript text.
 * @evidence contracts/common.md#clear-and-simple-design readStartTag returns the completed tag and namespace scope to inspectXmlRoot, keeping lexical decoding separate from complete-document nesting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Decoded attributes and namespace bindings are parser facts after duplicate/expanded-name checks, not token substring guesses.
 * @evidence contracts/common.md#meaningful-documentation States authored versus resolved identity, inherited scope, decoded attributes, cursor units and self-closing obligations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type executes no parser; readStartTag owns text scanning, namespace copying and attribute admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result type coordinates no cross-document reuse or cached parsing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parser owns returned maps and enclosing stack lifetime; this declaration opens no resource.
 * @author Samchon
 */
export interface IStartTag {
  /** Authored qualified name used to match its closing tag exactly. */
  name: string;

  /** Element local name after prefix resolution. */
  localName: string;

  /** Resolved URI, or undefined for an element without namespace. */
  namespace: string | undefined;

  /** Inherited bindings after this tag's declarations were applied. */
  namespaces: ReadonlyMap<string, string>;

  /** Decoded authored attributes; expanded identities were already checked. */
  attributes: Map<string, string>;

  /** UTF-16 cursor immediately after this tag's closing delimiter. */
  end: number;

  /** Whether this tag closes itself and owes no later closing tag. */
  selfClosing: boolean;
}
