# src/architecture/IAutoMovieValidateDesignLineage.ts#IAutoMovieValidateDesignLineage.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Validate one lineage record as a self-consistent phase, alternative, and derivation graph. Member documentation states the supplied records, units and absence meanings used by validateDesignLineage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The lineage record remains separate from building identities and external bytes; host binding and byte verification cannot be inferred from self-consistency.

## @evidence contracts/development/design.md#principled-representation

lineage owns revision, phase, alternative, lifecycle and derived-artifact identities; validateDesignLineage checks graph consistency, freshness and digest syntax.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateDesignLineage.IProps, used by validateDesignLineage. Its lineage members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
