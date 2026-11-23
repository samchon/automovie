# src/geometry/extract/IAutoMovieMeshSectionChain.ts#IAutoMovieMeshSectionChain

## @evidence contracts/development/design.md#principled-representation

Crossings are chained through the mesh edges they lie on, which two adjacent triangles share on a manifold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

In-plane coordinates ready for reduceLoop, with a closed flag.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Raw section loops retain open chains. The section's separate outer publication may bridge within the admitted distance and records every bridged gap in its flags.

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinates' axes and origin.
