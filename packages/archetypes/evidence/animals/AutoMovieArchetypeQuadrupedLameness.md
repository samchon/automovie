# src/animals/AutoMovieArchetypeQuadrupedLameness.ts#AutoMovieArchetypeQuadrupedLameness.Grade

## @evidence contracts/development/common.md#meaningful-documentation

Names the three grades of Rhodin et al.'s clinical scoring.

## @evidence contracts/development/design.md#principled-representation

A closed literal union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `head` and `pelvis`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedLameness.ts#AutoMovieArchetypeQuadrupedLameness.ILameness

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The lame limb, its grade and whether a hindlimb case shows a compensatory head nod.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carried on the quadruped course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedLameness.ts#AutoMovieArchetypeQuadrupedLameness.head

## @evidence contracts/development/common.md#meaningful-documentation

States each value's origin.

## @evidence contracts/development/implementation.md#principled-implementation

The cited threshold and its stated multiples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One switch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The authored multiples are labelled provisional.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedLameness.ts#AutoMovieArchetypeQuadrupedLameness.pelvis

## @evidence contracts/development/common.md#meaningful-documentation

States each value's origin.

## @evidence contracts/development/implementation.md#principled-implementation

The cited threshold and its stated multiples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One switch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The authored multiples are labelled provisional.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/AutoMovieArchetypeQuadrupedLameness.ts#AutoMovieArchetypeQuadrupedLameness.IOffset

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

## @evidence contracts/development/design.md#principled-representation

A nod change in degrees, positive nose-down, and a body tilt.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the ride's nod and placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedLameness.ts#AutoMovieArchetypeQuadrupedLameness.Offset

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader takes and returns.

## @evidence contracts/development/design.md#principled-representation

A pure function of the stride plan, the phase and each limb's duty.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Called by the ride per sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeQuadrupedLameness.ts#AutoMovieArchetypeQuadrupedLameness.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The nod angle δ raises the head's centre by its asymmetry: δ = asin((A + y)/R) − atan2(y, z) for the centre at (y, z) from the neck's root, R its distance. The hind tilt turns about the pivot z_c = (z_w + 0.55 z_p)/1.55 between the withers (the shoulder joints) and the pelvis (the hindquarters' centre), by the angle that lifts the pelvis by its asymmetry; it lowers the head's centre (y, z) by (z − z_c) sin θ − y (cos θ − 1), which a compensatory nod's asymmetry is reduced by. Both follow sin² of the stance share, peaking at mid-stance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, measure the neutral geometry once, then return the reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No speed or gait the source did not cover is admitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stride plan's landings and the pitch helper.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains a few neutral measurements.
