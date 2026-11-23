# src/production/IAutoMovieMaterializeCompiledFormationInventory.ts#IAutoMovieMaterializeCompiledFormationInventory.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Compile every formation of a production into its compact runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledFormationInventory.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The inventory input holds designs rather than expanded members; deterministic id ordering belongs to materializeCompiledFormationInventory and radii retain host-estimate semantics.

## @evidence contracts/development/design.md#principled-representation

formations is keyed by authored id and shares models, metre-valued radius estimates and ordered world surfaces across materialization.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieMaterializeCompiledFormationInventory.IProps, used by materializeCompiledFormationInventory. Its formations, models, projectionRadii, surfaces members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
