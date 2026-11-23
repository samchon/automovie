# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.solve

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and both fallbacks.

## @evidence contracts/development/implementation.md#principled-implementation

Mirtich 1996, chapter 6: K from unit test impulses through the articulated-body algorithm, then the cascade with a task or the complementarity solve without one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collect rows, then the task's cascade, else propagate tests, assemble K, solve, combine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular system leaves the floating response instead of dividing.

## @evidence contracts/development/implementation.md#efficient-algorithms

One propagation (two linear sweeps) per row, then one of the two solves over the rows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every test impulse reuses the tree's one factor.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays; retains nothing.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.IActuator

## @evidence contracts/development/common.md#meaningful-documentation

States the edge, the axis and the cap.

## @evidence contracts/development/design.md#principled-representation

Indices into the tree and a cap in newton metre seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built here and read by solveXpbdSupportCascade.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The cap is the motor's own over the substep.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.commit

## @evidence contracts/development/common.md#meaningful-documentation

States what each row adds to and why.

## @evidence contracts/development/implementation.md#principled-implementation

A support's impulse is momentum the contact gave, so it belongs to the contact's own accumulators that the receipts read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the final solve is recorded, after the caps settle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the records.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each record is written once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the step's contacts; retains nothing.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.IHeld

## @evidence contracts/development/common.md#meaningful-documentation

States both parts.

## @evidence contracts/development/design.md#principled-representation

A response and impulse records in newton seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by solve, applied by the caller and recorded by commit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The response stays separate from recording, so a solve the caps redo is never recorded.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.IRecord

## @evidence contracts/development/common.md#meaningful-documentation

States the contact, the kind and the amount.

## @evidence contracts/development/design.md#principled-representation

The contact record, whether it is a normal row, and the impulse in newton seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by solve and read by commit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A patch records its tangential magnitude on its first contact, where the contact passes keep the patch's friction.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.IRow

## @evidence contracts/development/common.md#meaningful-documentation

States the body, point, direction, bound, velocity and contact.

## @evidence contracts/development/design.md#principled-representation

Tree indices, metres from the tree origin, a unit direction and newton seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by AutoMovieXpbdSupportRows.collect and read by the solves here, by solveXpbdSupportCascade and by solveXpbdSupportComplementarity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are the contacts' own.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.IPatch

## @evidence contracts/development/common.md#meaningful-documentation

States the friction, the given normal, the prior friction and the rows.

## @evidence contracts/development/design.md#principled-representation

A coefficient, newton seconds and row indices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by AutoMovieXpbdSupportRows.collect and read by both solves.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are the contacts' own.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.ISet

## @evidence contracts/development/common.md#meaningful-documentation

States the rows and the patches.

## @evidence contracts/development/design.md#principled-representation

Two arrays; patches index the rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by AutoMovieXpbdSupportRows.collect and read by both solves.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are the contacts' own.

# src/physics/solveXpbdArticulationContacts.ts#solveXpbdArticulationContacts.ISlip

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

Two components on the rows' tangent directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by AutoMovieXpbdSupportRows.collect and solveXpbdSupportComplementarity; read by solveXpbdSupportCascade through IPatch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No unit is implied beyond the owner's.
