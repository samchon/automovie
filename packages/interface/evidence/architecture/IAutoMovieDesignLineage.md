# src/architecture/IAutoMovieDesignLineage.ts#IAutoMovieDesignLineage

## @evidence contracts/development/design.md#principled-representation

Explicit validateDesignLineage checks identity/reference coherence, acyclic graphs, resolving head, total lifecycles and recorded freshness; validateDesignLineageBinding checks subjects and derived-id collisions against a caller-supplied known-id list. Production orchestration is retired. Neither validator applies variants, inspects output bytes or certifies dependency completeness.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record holds the seven lists a lineage answers from, each owned by its own member type, and points at foreign graphs only through subject ids, so no building type gains a phase or variant field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit coherence validation refuses stale recorded derivations and invents no lifecycle. Cross-shot canonical merging and conflicting-id refusal no longer have a production host, so callers must preserve consistent shared identities.

## @evidence contracts/development/common.md#meaningful-documentation

States foreign identity annotation, absence semantics, coherence and binding gates, artifact head stamps, minimum revisions and canonical-equality sharing with conflicting-id refusal.
