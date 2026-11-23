# src/motion/human/posture/IAutoMovieHumanLimbGoal.ts#IAutoMovieHumanLimbGoal

## @evidence contracts/development/common.md#meaningful-documentation

An arm or leg effector goal with its bend direction, optional contact constraints and reference configuration. Coordinates are world metres unless on names the posed bone frame; resolveHumanPosture admits attachment order and fits the goal.

## @evidence contracts/development/design.md#principled-representation

point: Where the end joint (wrist or ankle) goes, world metres. elbow: Where an arm's elbow goes when the law leaves it to the body: `"strain"` takes, among the places that leave the hand's rotation error least, the one where the arm strains least, read from the fit's own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only where no place is legal. Absent, `bend` decides; a leg ignores it. contact: The contact the hand or foot turns about, in its rest frame relative to its joint (a heel, a ball, a palm): when `rotation` cannot be met exactly within the limb's range, the end joint is re-aimed so this point stays where the goal puts it, and the rotation gives way, as a foot pivots on its ball. seed: The swivel and bend branch the law's own plan places the limb at, at this second (`IAutoMovieSwivelSeed`), fitted at the plan's knots and interpolated between them, so every reader places the limb at one configuration in closed form with no search and no read-time refinement; absent, each reader fits the limb itself.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Action laws and arm/leg primitives produce goals consumed by resolveHumanPosture and limb fitting; point limits and reference configurations have their own shared identities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

resolveHumanPosture owns attachment ordering and fitting refusal; the goal preserves optional bone-relative coordinates, rigid contact constraints and clearance ownership without replacing them with untyped data.

# src/motion/human/posture/IAutoMovieHumanLimbGoal.ts#IAutoMovieHumanLimbGoal.OwnRests

## @evidence contracts/development/common.md#meaningful-documentation

States that the list names the performer's own bones a hand is laid on; `restsOwn` states their effect on the fit.

## @evidence contracts/development/design.md#principled-representation

A read-only list of humanoid bones, so only the rig's own bones can be named.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The goal's `restsOwn` member; the arm fit reads it to treat contact with those bones as placement rather than collision.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Duplicate bones are not ruled out by the type and have no extra effect.

# src/motion/human/posture/IAutoMovieHumanLimbGoal.ts#IAutoMovieHumanLimbGoal.IClearance

## @evidence contracts/development/common.md#meaningful-documentation

Clear segments obstruct the arm fit. Rests identify intentional hand contact in the same attachment frame.

## @evidence contracts/development/design.md#principled-representation

Separate arrays distinguish obstacles from permitted contact while preserving the same placed geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The limb goal supplies both sets to the fitter. The readonly arrays allow the fitter to borrow them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both lists use the collider owner's placed segments and share its geometry definition.

# src/motion/human/posture/IAutoMovieHumanLimbGoal.ts#IAutoMovieHumanLimbGoal.Elbow

## @evidence contracts/development/common.md#meaningful-documentation

Names the two decisions and where each comes from.

## @evidence contracts/development/design.md#principled-representation

A closed set of named decisions the fit reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two decisions a goal states today; absence leaves the bend hint to decide.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No decision is inferred from anything but this field.
