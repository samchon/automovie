# src/architecture/IAutoMovieValidateDesignLineageBinding.ts#IAutoMovieValidateDesignLineageBinding.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Check a lineage against the identities its host graphs actually publish. Member documentation states the supplied records, units and absence meanings used by validateDesignLineageBinding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The host identity inventory is required data rather than a dependency on one graph type; undeclared lineage coverage is permitted while dangling declared subjects are refused.

## @evidence contracts/development/design.md#principled-representation

lineage declares the subjects and derived artifacts while known supplies the host's exact published ids; duplicates in known do not change binding membership.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateDesignLineageBinding.IProps, used by validateDesignLineageBinding. Its lineage, known members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
