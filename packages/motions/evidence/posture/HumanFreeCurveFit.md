# src/posture/HumanFreeCurveFit.ts#HumanFreeCurveFit

## @evidence contracts/development/common.md#meaningful-documentation

States the fits, what they read and who reads them.

## @evidence contracts/development/implementation.md#principled-implementation

The cold fit is the ordinary current admission and solve. An observation reads the native output independently: the ankle within the leg's ROM-tolerance arc of its point, the foot within the ROM tolerance of its orientation, the knee on the asked pole side and every joint within ROM. A correction continues the prior anchor's branch and swivel inside one hinge step and keeps every chain rotation within one hinge step of the prior's, or asks for refinement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The curve's fits and gates, moved verbatim from `prepareHumanFreeCurve`, read the scope the curve hands them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No seed or fitted endpoint stands in for a target; every gate is the original one and nothing is relaxed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The observed bones are bound once per sequence of leg goals, and ROM admission reuses only exactly equal coordinates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the curve's ROM scorers, the posture preparation's native source and seeds, and the bound bone demand.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fits retain the curve's scope, released with the curve; at most four observed-bone sets and one coordinate tuple per bone.

# src/posture/HumanFreeCurveFit.ts#HumanFreeCurveFit.IScope

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what the curve holds.

## @evidence contracts/development/design.md#principled-representation

The curve's own values, named, so the fits read them explicitly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven members, each read by a fit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The scope holds the curve's values and maps as they are; nothing is copied or derived.

# src/posture/HumanFreeCurveFit.ts#HumanFreeCurveFit.IFits

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its inputs and result.

## @evidence contracts/development/design.md#principled-representation

The curve's own fit signatures.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fits, each read by the curve or its intervals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No fit serves one law or a test.

# src/posture/HumanFreeCurveFit.ts#HumanFreeCurveFit.IObserved

## @evidence contracts/development/common.md#meaningful-documentation

States the bones observed and their bound demand.

## @evidence contracts/development/design.md#principled-representation

The legs' hip, knee and ankle bones and their prepared reader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pose or result is kept.

# src/posture/HumanFreeCurveFit.ts#HumanFreeCurveFit.IAnchor

## @evidence contracts/development/common.md#meaningful-documentation

States that only primitive seeds and native quaternions survive a query.

## @evidence contracts/development/design.md#principled-representation

The validated predecessor's branch and swivel seeds and its postclamp chain rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pose, preparation or FK loan is kept.

# src/posture/HumanFreeCurveFit.ts#HumanFreeCurveFit.ICorrection

## @evidence contracts/development/common.md#meaningful-documentation

States that only a validated correction carries a preparation and an anchor.

## @evidence contracts/development/design.md#principled-representation

A union of an accepted correction and a refusal kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three kinds: accepted, refine and unusable.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A refused correction carries nothing.
