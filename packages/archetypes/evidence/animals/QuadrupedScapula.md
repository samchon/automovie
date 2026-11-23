# src/animals/QuadrupedScapula.ts#QuadrupedScapula.Fore

## @evidence contracts/development/common.md#meaningful-documentation

Names the two limbs that have a blade.

## @evidence contracts/development/design.md#principled-representation

The body's fore limbs, extracted from its limb union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by `AutoMovieArchetypeQuadrupedBody`; named here for the blade.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No restated literals.

# src/animals/QuadrupedScapula.ts#QuadrupedScapula.Bone

## @evidence contracts/development/common.md#meaningful-documentation

Names the blade bones by their limb.

## @evidence contracts/development/design.md#principled-representation

The part id of each fore limb's blade, `leftForeScapula` or `rightForeScapula`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the body, the pose and the ride read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No restated literals.

# src/animals/QuadrupedScapula.ts#QuadrupedScapula.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

Both points in metres, model frame, root at zero.

## @evidence contracts/development/design.md#principled-representation

The arc's centre and the shoulder joint fix its radius and rest direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read from the neutral FK frames.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedScapula.ts#QuadrupedScapula.bar

## @evidence contracts/development/common.md#meaningful-documentation

States the ends and why the bar stops short of the joint.

## @evidence contracts/development/implementation.md#principled-implementation

The centre lies two thirds of the blade's length up and back from the shoulder joint along the rest slope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shoulder joint itself never moves at rest.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns two points.

# src/animals/QuadrupedScapula.ts#QuadrupedScapula.IBar

## @evidence contracts/development/common.md#meaningful-documentation

Metres, model frame.

## @evidence contracts/development/design.md#principled-representation

Two points.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the body's layout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedScapula.ts#QuadrupedScapula.glenoid

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and sign.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid rotation of the rest offset about the centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one point.

# src/animals/QuadrupedScapula.ts#QuadrupedScapula.high

## @evidence contracts/development/common.md#meaningful-documentation

States the bound and the unreachable case.

## @evidence contracts/development/implementation.md#principled-implementation

Unturned, the bound is the goal height less the joint height plus the vertical leg of the planar reach. Over turns it is unimodal and peaks where the joint lies on the line from the lifted centre to the goal, the centre then at reach plus radius from the goal; the peak's turn is clamped to the range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Peak turn, clamp, one evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling of turns; nothing is padded.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.

# src/animals/QuadrupedScapula.ts#QuadrupedScapula.least

## @evidence contracts/development/common.md#meaningful-documentation

States the only-as-needed law.

## @evidence contracts/development/implementation.md#principled-implementation

The joint lies on a circle about the lifted centre; it reaches where its angle to the goal's direction is within the law-of-cosines half-angle, so the least turn is the nearer end of that window, clamped to the range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rest check, window, nearer end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The root and the goal never move; the turn is exact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.
