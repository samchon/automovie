# src/architecture/IAutoMovieDesignLineageViewDigest.ts#IAutoMovieDesignLineageViewDigest.IView

## @evidence contracts/development/design.md#principled-representation

variant and phase are explicit nullable identities, not optional defaults: null selects unchanged head and completed work respectively; the digest operation validates the lineage and resolves both names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

designLineageViewDigest consumes this selector beside the separately supplied lineage; revisions and content digests stay in the lineage contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

String selectors do not prove reference validity, and the resulting hash reads recorded digests rather than verifying asset bytes or guaranteeing collision freedom.

## @evidence contracts/development/common.md#meaningful-documentation

Nullable alternative and phase selectors for a recorded design-view digest. variant and phase are explicit nullable identities, not optional defaults: null selects unchanged head and completed work respectively; the digest operation validates the lineage and resolves both names.
