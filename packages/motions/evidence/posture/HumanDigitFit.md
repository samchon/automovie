# src/posture/HumanDigitFit.ts#HumanDigitFit.fitted

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the order and the unchanged case.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's digit fit on the canonical forward kinematics (the same axes and rest frames as the display), after the limbs, as procedural animation runs finger IK on the placed hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the digits with goals, one fit each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Full resolution retains every goal and residual. Explicit observational demand omits only independent world goals that cannot change a requested ancestor frame; malformed/attached/unsupported context keeps full fitting and all authored records still enter ordered FK admission before omission.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each retained digit requests only effector ancestry per candidate. Explicit demand can omit independent unobserved digits after one ordered authored admission with empty output demand; selector parent metadata is O(B) and no requested digit solver is weakened. Full default remains unchanged, with unmeasured speedup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One lazy operation reader is borrowed by carried targets and every digit fit together with the body's canonical immutable rig snapshot; actual poses and exact scalar dependencies are reread, with no cached goal or result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader is created only at the first actual goal and releases with this synchronous call; a parent's supplier and reader never enter the returned pose.

# src/posture/HumanDigitFit.ts#HumanDigitFit.depth

## @evidence contracts/development/common.md#meaningful-documentation

States the measure, its unit, its sign, who reads it and what a supplied placement must be.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's exact segment-to-shape distance (`physicalShapeSegmentDistance`) from each phalanx's axis, less the phalanx's radius, against the body's own profile colliders.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One collider placement, then each requested hand's near colliders and three segments per digit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every digit and every near collider is read; none is skipped but those beyond a hand's length of the hand.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both hands share the same posed collider records; bounds cull distant shapes, and direct segment loops allocate no per-collider slices or callbacks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The optional paired query reuses only one placement of the same supplied bones within this call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanDigitFit.ts#HumanDigitFit.penetrates

## @evidence contracts/development/common.md#meaningful-documentation

Describes the posed space, strict penetration boundary, eligible shape ownership and placement input.

## @evidence contracts/development/implementation.md#principled-implementation

A maximum of finite signed depths exceeds zero exactly when at least one depth exceeds zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads each hand through the same signed-depth routine and skips the second hand after a positive witness.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the same posed shape eligibility and narrow-phase distance as the signed-depth measurement. Zero depth remains tangency.

## @evidence contracts/development/implementation.md#efficient-algorithms

Stops on the first positive signed distance difference. A clear pose checks every eligible pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the complete signed-distance and collider eligibility implementation with depth.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps the bones and collider placement local to the call.

# src/posture/HumanDigitFit.ts#HumanDigitFit.hanging

## @evidence contracts/development/common.md#meaningful-documentation

Uses the two actual shoulder frames, original world-metre phalanges and collider placements, and returns the strict signed-depth verdict or undefined at a rounding boundary.

## @evidence contracts/development/implementation.md#principled-implementation

Rigid transformation preserves segment-to-shape distance. Both original hand reach filtering and positive-depth decisions use their original geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare links and shape spheres once and transform only each eligible collider into the hand's original world frame at a candidate angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original segment distance and digit radii. Refuses unsupported arm membership and rounding-sensitive separations.

## @evidence contracts/development/implementation.md#efficient-algorithms

No per-angle phalanx FK, capsule endpoint generation, or shape sphere reconstruction. Every nearby eligible shape still receives the original exact narrow phase.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stance's actual phalanges, spheres and carried-shape membership are immutable during its shoulder-angle search.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous bisection owns the two small hand lists and collider metadata until its standing pose is determined. No query or pose history is kept.

# src/posture/HumanDigitFit.ts#HumanDigitFit.bones

## @evidence contracts/development/common.md#meaningful-documentation

States the order and the spelling.

## @evidence contracts/development/implementation.md#principled-implementation

The rig's bone names: a finger's three phalanges, the thumb's metacarpal and two phalanges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table choice and one map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
