

/** Nullable alternative and phase selectors for a recorded design-view digest. */
export namespace IAutoMovieDesignLineageViewDigest {
  /**
   * Nullable alternative and phase selectors for a recorded design-view digest.
   * 
   * This recorded view is a replay handle for derived artifacts. Equal serialized alternative/phase views hash equally; alternative identity and recorded subject digests enter the serialization. The function reads recorded digests rather than asset bytes and makes no collision-free identity guarantee.
   * 
   * A null `variant` digests the head revision with no changes applied; a
   * variant digests its own base revision and its changes, ordered by subject and
   * aspect in code-unit order. A null `phase` digests the completed work. Every
   * subject state the phase snapshot reports is included with the subject's own
   * content digest. Returns a `sha256:` digest; an invalid lineage, an
   * undeclared phase, or an unknown variant id throws an `Error`.
   *
   * @evidence contracts/development/design.md#principled-representation variant and phase are explicit nullable identities, not optional defaults: null selects unchanged head and completed work respectively; the digest operation validates the lineage and resolves both names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface designLineageViewDigest consumes this selector beside the separately supplied lineage; revisions and content digests stay in the lineage contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts String selectors do not prove reference validity, and the resulting hash reads recorded digests rather than verifying asset bytes or guaranteeing collision freedom.
   * @evidence contracts/development/common.md#meaningful-documentation Nullable alternative and phase selectors for a recorded design-view digest. variant and phase are explicit nullable identities, not optional defaults: null selects unchanged head and completed work respectively; the digest operation validates the lineage and resolves both names.
   */
  export type IView = {
    /** Declared alternative id, or null for the current head with no alternative changes. */
    variant: string | null;

    /** Declared phase id, or null for completed work; an unknown id is refused. */
    phase: string | null;
  };
}
