# src/service/IAutoMovieLowerWetZoneDrainage.ts#IAutoMovieLowerWetZoneDrainage.IProps

## @evidence contracts/development/design.md#principled-representation

World X/Z node positions select grid cells by floor division; inlet and outlet demands are copied into cubic-metres-per-second flow fields active from simulation time zero seconds with no end, without unit conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

lowerWetZoneDrainage reuses the fluid domain schema, copying source/drain arrays while sharing unchanged grid, bed and authored entry objects.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Selected plumbing inlet system and port units must both be cubic-meter-per-second or lowering throws, including medium other. No unit conversion occurs. Unknown zones/drains, off-grid nodes and derived ids colliding with authored entries throw; graph and fluid-domain validity remain premises.

## @evidence contracts/development/common.md#meaningful-documentation

A wet zone and existing fluid domain to which plumbing sources and waste drains are appended. World X/Z node positions select grid cells by floor division; inlet and outlet demands are copied into cubic-metres-per-second flow fields active from simulation time zero seconds with no end, without unit conversion.
