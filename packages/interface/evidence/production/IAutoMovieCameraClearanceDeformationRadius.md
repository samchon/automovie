# src/production/IAutoMovieCameraClearanceDeformationRadius.ts#IAutoMovieCameraClearanceDeformationRadius.IExtent

## @evidence contracts/development/common.md#meaningful-documentation

Documents model-space corners, borrowing, rest-geometry scope, validation premises and overflow refusal.

## @evidence contracts/development/design.md#principled-representation

Two metre-valued corners bound rest geometry; ordered finite coordinates and agreement with the validated model are caller premises, not enforced by the structural type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

cameraClearanceDeformationRadius reads only these corners while the model separately supplies the rig; no camera-space or runtime renderer data enters the contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The box measures supplied geometry and is not itself a deformation proof; the engine adds twice the influenced rig-chain reach to its farthest origin distance.
