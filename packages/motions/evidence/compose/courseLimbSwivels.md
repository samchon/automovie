# src/compose/courseLimbSwivels.ts#courseLimbSwivels.IPrepare

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The body, the plan's goal posture by its seconds, the limbs, the span and its knotted instants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the course reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The goals come from the reader.

# src/compose/courseLimbSwivels.ts#courseLimbSwivels.IPrepare.posture

## @evidence contracts/development/common.md#meaningful-documentation

States what the member gives and at which second.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; the caller of `swivels`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; the caller of `swivels`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; the caller of `swivels`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; the caller of `swivels`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; the caller of `swivels`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; the caller of `swivels`, which implements it, carries this claim.

# src/compose/courseLimbSwivels.ts#courseLimbSwivels.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

States each instant's unit.

## @evidence contracts/development/design.md#principled-representation

A start and an end on the plan's clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Seconds, the plan's own clock.

# src/compose/courseLimbSwivels.ts#courseLimbSwivels.chain

## @evidence contracts/development/common.md#meaningful-documentation

States the order and what each kind of limb lists.

## @evidence contracts/development/implementation.md#principled-implementation

The chain a limb fit solves, with the toes a foot contact's re-aim turns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal per limb.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No input is judged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/courseLimbSwivels.ts#courseLimbSwivels.Swivels

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader gives at a second.

## @evidence contracts/development/design.md#principled-representation

The resolver's own seeds, keyed by limb.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The one reader `swivels` returns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No goal is returned; the goals stay the display's own.

# src/compose/courseLimbSwivels.ts#courseLimbSwivels.swivels

## @evidence contracts/development/common.md#meaningful-documentation

States what is coursed, where its knots lie, how each continues the one before, what a vanished arc does and why the goals stay.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel is the one free coordinate of a two-bone limb on its goal (Tolani, Goswami and Badler 2000, section 3.2.4), and its feasible arc moves with the goal, so it is continued along time knot after knot (interval continuation): each knot is reached from its neighbour by the continued fit's own bounded step, never from a farther knot, so neither swivel nor forearm twist can jump between two neighbouring knots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Knots on the frame grid and the instants, made in order; a read takes the bracketing pair's interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every knot is the resolve's own limb fit on the posture's assembly, cold only at the span's start without an entry, the other limbs it fits continued from the knot before's fits of them too; a continuation whose admitted arc vanished refuses at its fit instead of jumping.

## @evidence contracts/development/implementation.md#efficient-algorithms

One continued limb fit per frame of the span and per instant, made once, every other limb the knot's resolve fits continued as well, so no knot after the first sweeps a limb; a read is a bisection of the knots' seconds and one interpolation, with no solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The knots are kept and shared by every read of the plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the reader, the knots' seconds and the knots made so far.

# src/compose/courseLimbSwivels.ts#courseLimbSwivels.ISwivelKnot

## @evidence contracts/development/common.md#meaningful-documentation

Names the record and its owner file.

## @evidence contracts/development/design.md#principled-representation

An alias of the one record its owner defines.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the course's public name for the moved record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second definition: the alias is the owner's type.
