/**
 * One decoded XML start tag with inherited namespace scope and the exact cursor after its closing delimiter.
 *
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
