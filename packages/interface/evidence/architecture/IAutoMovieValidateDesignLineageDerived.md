# src/architecture/IAutoMovieValidateDesignLineageDerived.ts#IAutoMovieValidateDesignLineageDerived.IProps

## @evidence contracts/development/design.md#principled-representation

Lineage identities and sha256-prefixed digest strings are checked against the supplied subject, phase and variant indexes; validation appends diagnostics without rewriting stamps.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validateDesignLineage builds these indexes once and shares its collector with validateDesignLineageDerived for artifact and decision checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Digest syntax and recorded citations do not verify external bytes; typed record structure is assumed and collector exceptions propagate.

## @evidence contracts/development/common.md#meaningful-documentation

Derived-artifact validation context for identity, freshness, provenance and comparison consistency. Lineage identities and sha256-prefixed digest strings are checked against the supplied subject, phase and variant indexes; validation appends diagnostics without rewriting stamps.
