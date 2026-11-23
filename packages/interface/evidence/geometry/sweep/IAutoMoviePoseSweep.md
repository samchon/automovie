# src/geometry/sweep/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep

## @evidence contracts/development/common.md#meaningful-documentation

Bone identities align with spine points and stations; rest/posed transforms share model metres and joint rotations are dimensionless. One/two-bone station choices are explicit tuples in the binding owner; missing bones and invalid geometry fail at runtime, and unchanged source data stays shared.

## @evidence contracts/development/design.md#principled-representation

Bone identities align with spine points and stations; rest/posed transforms share model metres and joint rotations are dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

poseAutoMovieSweep consumes the canonical sweep and binding contracts and optionally settles joint scale against rest volume.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One/two-bone station choices are explicit tuples in the binding owner; missing bones and invalid geometry fail at runtime, and unchanged source data stays shared.

# src/geometry/sweep/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep.IProps

## @evidence contracts/development/design.md#principled-representation

Bone identities align with spine points and one/two-bone station tuples; positions use the shared model-metre frame. The poser checks outer cardinalities and missing bone identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

poseAutoMovieSurfaceNetwork delegates bound sweep deformation to this contract, reusing canonical sweep and resolved-bone types.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Joint stations are represented by the binding's one/two-member tuples; optional volume preservation affects those joints only and introduces no anatomy-specific branch.

## @evidence contracts/development/common.md#meaningful-documentation

States shared versus rebuilt data, transform frames, binding failures and optional volume-settlement behavior.
