# src/handling/HumanHandoverUpright.ts#HumanHandoverUpright.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

The posture carries root, joints, digits and the other limbs; the goal carries the acting hand's world-metre target; the rotation is read at a degree yaw.

## @evidence contracts/development/design.md#principled-representation

The rotation is left out of the goal so the yaw-dependent attitude has one owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface `handOver` and `receive` build it per instant; `posed` turns it into the posture fitted and displayed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No solved pose or contact verdict is carried.

# src/handling/HumanHandoverUpright.ts#HumanHandoverUpright.IFrame.rotation

## @evidence contracts/development/common.md#meaningful-documentation

Input is degrees about world up; output is the world hand rotation at this instant.

## @evidence contracts/development/implementation.md#principled-implementation

The builder turns the upright hand about world up during the carry and keeps its rotation outside it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One callback holds the only yaw-dependent part of the request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant quaternion work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Evaluated once per yaw tried.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains its instant's data only.

# src/handling/HumanHandoverUpright.ts#HumanHandoverUpright.ordinary

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the course returned.

## @evidence contracts/development/implementation.md#principled-implementation

Each yaw's posture is fitted and its tip read (`HumanHandover.tipped`); each instant takes the least tip plus `HOLD` per degree of change from the instant before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One tip adapter feeds one chooser.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every yaw of every chosen instant is fitted; ties keep the earlier, nearer yaw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine fits per instant, one instant per STEP of the path; a read finds its interval by binary search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The giver's and the receiver's carries share this chooser.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned course holds K instants and K turns until its action is released.

# src/handling/HumanHandoverUpright.ts#HumanHandoverUpright.posed

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the posture returned.

## @evidence contracts/development/implementation.md#principled-implementation

Only the acting arm's goal is replaced.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One assembler serves the choice and the display, so both fit the same request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No other goal or channel changes.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant assembly, no solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same assembler for ranking and display.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh posture and retains nothing.

# src/handling/HumanHandoverUpright.ts#HumanHandoverUpright.angle

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the degree result and the absent case.

## @evidence contracts/development/implementation.md#principled-implementation

The error reached * asked^-1 of the normalized rotations applied to world up; its angle from up, clipped to acos's domain, is the tip and nothing else.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative rotation and one angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A goal with no rotation is not upright by anything, so it reads as infinitely tipped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one tip measure of the handover.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and retains nothing.
