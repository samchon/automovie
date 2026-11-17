import type { IAutoMovieBeat } from "../harness/IAutoMovieBeat";
import type { IAutoMovieScriptNode } from "../harness/IAutoMovieScriptNode";

/**
 * Data and callback contracts shared by the ValidateScriptTree operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Validate the screenplay refinement tree against its script's flat beats, the structural gate a script with a `tree` must pass before commit. Member documentation states the supplied records, units and absence meanings used by validateScriptTree.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Canonical node kinds and parent ids carry authored structure; the validator enforces graph/refinement joins without pretending to evaluate later feedback propagation.
 * @evidence contracts/development/design.md#principled-representation tree and beats express the refinement graph and its flat beat inventory; logline and theme preserve the script header that the intent root must match.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateScriptTree, used by validateScriptTree. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateScriptTree {
  /**
   * Validate the screenplay refinement tree against its script's flat beats, the structural gate a script with a `tree` must pass before commit.
   *
   * Checks, all `error` severity:
   *
   * - Node ids are non-empty and unique.
   * - Exactly one root (`parent: null`) exists and it is the `intent`: the tree refines one film-level thought; a rootless forest or a second root is two films in one script.
   * - Every `parent` resolves, the refinement axis is acyclic, and each child's kind may refine its parent's kind ({@link ALLOWED_PARENTS}); a beat is always a leaf.
   * - `temporal` and every `interactsWith` entry resolve to an existing node and never to the node itself.
   * - Beat-kind nodes join the flat `beats` 1:1: every beat node names a real beat id, no two nodes claim one beat, and every beat is claimed: a tree that forgets a beat silently drops authored structure.
   * - Dialogue anchors are finite and `>= 0` when non-null.
   * - Intent logline and theme are nonblank and exactly match the flat script header, so screenplay rendering cannot silently replace authored metadata.
   * - Group rationales are nonblank prose, rather than empty bracketed headings.
   *
   * The cross-edge semantics (feedback propagation up the refinement chain) are consumed later; this validator only guarantees the graph is well-formed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Validate the screenplay refinement tree against its script's flat beats, the structural gate a script with a `tree` must pass before commit. Member documentation states the supplied records, units and absence meanings used by validateScriptTree.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Canonical node kinds and parent ids carry authored structure; the validator enforces graph/refinement joins without pretending to evaluate later feedback propagation.
   * @evidence contracts/development/design.md#principled-representation tree and beats express the refinement graph and its flat beat inventory; logline and theme preserve the script header that the intent root must match.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateScriptTree.IProps, used by validateScriptTree. Its tree, beats, logline, theme members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** The refinement tree to validate. */
    tree: IAutoMovieScriptNode[];

    /** The script's flat beats the beat-kind nodes must join. */
    beats: IAutoMovieBeat[];

    /** Flat script logline the intent root must preserve verbatim. */
    logline: string;

    /** Flat script theme the intent root must preserve verbatim. */
    theme: string;
  };
}
