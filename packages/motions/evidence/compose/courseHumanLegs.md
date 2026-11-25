# src/compose/courseHumanLegs.ts#courseHumanLegs

## @evidence contracts/development/common.md#meaningful-documentation

States what is coursed, from which entry, when the knots are fitted, what a read does and why every reader of the posture then places the same legs.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel is a limb's one free coordinate on its goal (Tolani, Goswami and Badler 2000, section 3.2.4), so the legs are coursed as `courseLimbSwivels` courses the arms: a knot on the frame grid and at the law's instants, the first placed at each leg's swivel and branch in the entry pose (`HumanLimbFit.seed`), each later one a fit continuing the one before. The stamp writes each second's seed onto the leg goals (`IAutoMovieHumanLimbGoal.seed`), which every resolve places in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One course over the legs alone, built from the law's own legs posture, and one stamp a law applies before anything reads its posture's bones.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant of its own: the knots are the arms' course's grid and the law's instants, the entry is the displayed pose, and a read never searches or refines; a posture with no leg goal is returned unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan-time cost class: one continued legs-only fit per knot, every knot fitted once in order when the course is made; a read interpolates two knots (`courseLimbSwivelKnots.between`) and copies the leg goals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The knots are the course's own, made once for the plan and read by every second's stamp; nothing is shared across plans.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned stamp holds the course's knots, one per frame of the span and instant, for as long as the plan holds the stamp.

# src/compose/courseHumanLegs.ts#ICourseHumanLegsProps

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its frame of seconds and what of the posture is read.

## @evidence contracts/development/design.md#principled-representation

The body, the law's posture as a function of its own seconds, the span and its instants in those seconds, and the entry pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the legs' course needs and nothing of the law beyond its posture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The posture is read, never copied ahead; the entry is the displayed pose, not an assumed rest.

# src/compose/courseHumanLegs.ts#CourseHumanLegsSeeded

## @evidence contracts/development/common.md#meaningful-documentation

States what a stamp returns and that a posture with no leg goal is unchanged.

## @evidence contracts/development/design.md#principled-representation

A pure function of a posture and its second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one operation a law applies to its posture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
