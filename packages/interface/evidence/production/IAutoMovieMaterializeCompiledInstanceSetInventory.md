# src/production/IAutoMovieMaterializeCompiledInstanceSetInventory.ts#IAutoMovieMaterializeCompiledInstanceSetInventory.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Compile every instance set a world declares into its compact runtime record. Member documentation states the supplied records, units and absence meanings used by materializeCompiledInstanceSetInventory.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The world retains ownership of authored sets; missing geometry estimates follow the same base/0.5m policy as single-set materialization without asserting enclosure.

## @evidence contracts/development/design.md#principled-representation

world supplies all instance-set designs and routes, with shared model and metre-radius context for their compact materialization.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieMaterializeCompiledInstanceSetInventory.IProps, used by materializeCompiledInstanceSetInventory. Its world, models, projectionRadii members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
