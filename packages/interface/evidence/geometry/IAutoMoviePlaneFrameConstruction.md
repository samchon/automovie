# src/geometry/IAutoMoviePlaneFrameConstruction.ts#IAutoMoviePlaneFrameConstruction.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.

## @evidence contracts/development/design.md#principled-representation

Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.

## @evidence contracts/development/design.md#minimal-and-owned-surface

bindRecoveryOrderedFits, extractRecoveryMeshSections, planeFrame share IAutoMoviePlaneFrameConstruction's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
