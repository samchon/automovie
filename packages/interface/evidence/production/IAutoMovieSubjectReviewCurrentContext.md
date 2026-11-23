# src/production/IAutoMovieSubjectReviewCurrentContext.ts#IAutoMovieSubjectReviewCurrentContext

## @evidence contracts/development/design.md#principled-representation

Currency is decided by exact string equality over the revision, the two `sha256:` digests and the canonical runtime JSON, which is sound because production canonicalizes the runtime JSON before both sides are written, so equal runtimes give equal strings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six flat members, each a join key the fold compares directly; schema validation of the runtime stays with production, so the engine holds only the identities it compares.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the full canonical runtime JSON rather than a weaker local fingerprint, and the fold throws on a context that does not name the resolved unit instead of silently treating every observation as stale.

## @evidence contracts/development/common.md#meaningful-documentation

States the throw conditions the fold applies to the context, the four strings an observation must equal to be current, the `sha256:` form of both digests, and the non-blank requirement on each identity.
