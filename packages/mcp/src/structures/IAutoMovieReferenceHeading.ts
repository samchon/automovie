import type { IAutoMovieReferenceRange } from "./IAutoMovieReferenceRange";


/**
 * A compact navigable heading; ordinal parents also identify unanchored drafts.
 *
 * @evidence contracts/common.md#principled-implementation Ordinals and parent ordinals preserve top-level source heading ancestry while explicit anchors carry addressability.
 * @evidence contracts/common.md#clear-and-simple-design One public heading contains navigation identity without private subtree-selection offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unanchored, ambiguous and unsupported-depth headings remain explicit instead of acquiring guessed addresses.
 * @evidence contracts/common.md#meaningful-documentation Members state depth, original title, anchor, location, parent and addressability meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceHeading {

  /** Zero-based ordinal among all original top-level document headings. */
  ordinal: number;

  /** Original Markdown heading depth, without reader-edition rebasing. */
  depth: number;

  /** Original heading title after omitting comments and its explicit anchor marker. */
  title: string;

  /** Authored trailing anchor, or null when the draft provides no explicit address. */
  anchor: string | null;

  /** Exact project-relative file#anchor when authored, even if ambiguity prevents reading. */
  location: string | null;

  /** Whether that explicit address uniquely selects a supported H2/H3/H4 section. */
  addressability:
    | "addressable"
    | "unaddressable"
    | "ambiguous"
    | "unsupported_depth";

  /** Nearest preceding shallower heading ordinal, including H1, or null at the root. */
  parent: number | null;

  /** Original heading syntax span; its following newline and subtree body are separate. */
  range: IAutoMovieReferenceRange;
}
