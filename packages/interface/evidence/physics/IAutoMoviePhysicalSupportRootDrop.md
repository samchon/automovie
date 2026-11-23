# src/physics/IAutoMoviePhysicalSupportRootDrop.ts#IAutoMoviePhysicalSupportRootDrop.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States the coherent support geometry and a bounded lowering request separate from actual body correction.

## @evidence contracts/development/design.md#principled-representation

World-metre goals and target transforms combine with provider-local joint/landmark geometry; maximumRootDrop is nonnegative metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalSupportRootDrop reuses the profile and footfall pattern to derive reach-sphere motor intent without running discarded endpoint IK.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The cap constrains only requested root lowering; it cannot move a native root or certify endpoint feasibility.
