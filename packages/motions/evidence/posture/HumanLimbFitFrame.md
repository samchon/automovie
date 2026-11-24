# src/posture/HumanLimbFitFrame.ts#HumanLimbFitFrame

## @evidence contracts/development/common.md#meaningful-documentation

Defines all-axis root translation, heading extraction and unchanged world-context exclusions.

## @evidence contracts/development/implementation.md#principled-implementation

The root's rotated forward vector determines its world-up heading. Subtracting full translation preserves relative chain/own-body/contact geometry; attached or external-shape goals remain in world coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One unchanged exclusion gate and one heading construction supply the common normalization frame for root, target, bend and rival.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps root-null/on/clear/rests exclusions and adds no tolerance, target replacement or acceptance rule; a fixed world goal changes relative Y when only the root rises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant quaternion-vector/trigonometric work and one frame allocation, independent of rig/goal population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The frame applies only to the current source/goal normalization; no fit is reused across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one caller-owned frame or null and retains no source, target, result or resource.

# src/posture/HumanLimbFitFrame.ts#HumanLimbFitFrame.point

## @evidence contracts/development/common.md#meaningful-documentation

States world-metre input/output and zero default for an explicitly omitted frame Y.

## @evidence contracts/development/implementation.md#principled-implementation

Applies inverse translation followed by the same unit inverse-heading quaternion; subtracting Y commutes with a world-up turn and changes no local contact or rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One component subtraction record feeds the existing quaternion-vector owner for every root/goal/rival point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual point/frame scalars without rounding, normalization, threshold or point-specific exception.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and fresh vector storage; no body, shape or joint scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller shares this one current frame among all mutually translated inputs, while each point is transformed independently.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains no frame or point.

# src/posture/HumanLimbFitFrame.ts#HumanLimbFitFrame.pose

## @evidence contracts/development/common.md#meaningful-documentation

States translated/heading-normalized root and borrowed unchanged joint/scale members.

## @evidence contracts/development/implementation.md#principled-implementation

Moves the actual root by point and left-multiplies its original rotation by inverse heading; clinical joints and root scale remain unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A root-null identity branch or one shallow pose/root update reuses the common point transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clinical articulation, root scale or rotation normalization changes, and null roots preserve the original object.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant root transform/copy work without traversing J borrowed joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows unchanged joints/scale only during normalization; the fit's output ownership remains with its solver.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input and returns the original root-null pose or fresh outer/root/translation/rotation records with unchanged members borrowed.

# src/posture/HumanLimbFitFrame.ts#HumanLimbFitFrame.goal

## @evidence contracts/development/common.md#meaningful-documentation

Defines translated world point/bend, heading-composed world rotation and unchanged local contacts/other goal data.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid reference change transforms world demands and rotations together, while contact/limit points in the effector rest frame remain local.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two common point calls and an optional original quaternion product preserve one goal conversion owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Receives only the original eligible no-on/no-external goal; every other field, reference, price and physical constraint is borrowed unchanged, with no achieved endpoint substitution.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant two-point/optional-rotation work, without traversing borrowed limits or geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the exact same source frame as the pose and rival so all relative demands remain equivalent; another frame transforms independently.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new goal with new changed vectors/rotation and borrowed unchanged metadata, retaining no input or query history.
