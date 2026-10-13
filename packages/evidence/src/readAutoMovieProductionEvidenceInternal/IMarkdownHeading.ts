


/**
 * One original heading and its native evidence target identity.
 *
 * @evidence contracts/common.md#principled-implementation Original one-based line, ATX depth, visible title and optional target anchor identify one heading.
 * @evidence contracts/common.md#clear-and-simple-design An internal heading record supports exact span and ancestry formation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent anchors remain optional before the native target grammar supplies an implicit identity.
 * @evidence contracts/common.md#meaningful-documentation Members document anchor absence, depth and original line basis.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased heading interface stores no source itself; markdownHeadings creates line/depth/title/anchor rows that document and target readers keep only while forming their output identities.
 *
 *
 * @author Samchon
 */
export interface IMarkdownHeading {
  /** Explicit or native implicit anchor; absent when neither yields an identity. */
  anchor: string | undefined;

  /** Original ATX heading depth from one through six. */
  depth: number;

  /** One-based line in the original normalized source. */
  line: number;

  /** Visible title without closing hashes or an explicit anchor marker. */
  title: string;
}
