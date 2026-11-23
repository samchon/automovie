# src/core/IAutoMovieCopyDriver.ts#IAutoMovieCopyDriver

## @evidence contracts/development/design.md#principled-representation `resolveDrivers` topologically sorts copy and driven drivers by the channel keys each reads and writes, then `applyCopy` lerps translation and scale and slerps rotation between the owner's and source's sampled-or-rest local values and writes the owner's channel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three booleans select components instead of a component list, and the copy works on local values in the same sampled map clips write, so no world compose is needed before it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nonboolean flags, invalid influence, enabled-component reads of missing nodes and wrong sampled widths throw. Dependency ordering excludes a driver's own one-step input/output and refuses reciprocal cycles; finite derived blends are not separately gated, and local copying does not promise world-space agreement across different parents.

## @evidence contracts/development/common.md#meaningful-documentation

States the pass and its order relative to limits, what value the owner starts from, the blend per component, when the result matches in world space, and every throw.
