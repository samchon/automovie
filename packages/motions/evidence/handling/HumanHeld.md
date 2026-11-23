# src/handling/HumanHeld.ts#HumanHeld.effector

## @evidence contracts/development/common.md#meaningful-documentation

States when the prop is read, each input and the three refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The held prop's owner gives the contact's point from the grip socket and its direction in the hand bone's axes, the offset a grip keeps fixed; the socket's own offset from the wrist is added, and the tool's shares are that point's components along the hand's three orthonormal axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the held contact and the turn to HumanHeldEffector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Whether the hand holds the prop is the entry state's fact, read by the owner, which refuses otherwise; a direction too near the normal to be laid across it falls back to the hand axis least along it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

effector, sides and steadiest share HumanHeldEffector's geometry, with no second point or axis formula.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry FK and contact read and constant vector work per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/handling/HumanHeld.ts#HumanHeld.sides

## @evidence contracts/development/common.md#meaningful-documentation

States the sides, their order, who reads them and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A round rim meets a region on any side, so the side is a free turn of the vessel about its own axis in the hand, each one the shared effector owner's turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One held reading, one turn per side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No side is chosen here; the act's search admits one or refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry FK/contact reading and constant vector work per side, no arm solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed held prop and row share one `HumanHeldEffector` geometry across the sides, as `steadiest` does.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh effector weights and retains nothing.

# src/handling/HumanHeld.ts#HumanHeld.steadiest

## @evidence contracts/development/common.md#meaningful-documentation

States the freedom used, the choice, the tie and each input.

## @evidence contracts/development/implementation.md#principled-implementation

A pick-up takes the grip its reach allows, so which side of the rim then faces a region is not the act's to assume; each side is solved by the upright search and its reached tilt compared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop of effector, search and compare.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No side is preferred for any prop or hand beyond the tie; the tilt is the resolver's reached one, and a vessel no side holds level is refused, never brought tilted, unless the act leans it, whose own search then admits the lean or refuses it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One held-entry FK/contact/hand-geometry and hanging hint serve at most eight rim sides. Each side runs its upright solve and tilt fit; the search stops once a tilt is within the joints' tolerance of zero.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held geometry and the hanging hint are read once for every side; each side runs its own upright solve and tilt fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local geometry producer/hint are released on return or throw; only the best fresh effector weights escape, without body/prop readers, fits, time history or handles.

# src/handling/HumanHeld.ts#HumanHeld.kept

## @evidence contracts/development/common.md#meaningful-documentation

States the two declarations added and what they do in a performance.

## @evidence contracts/development/implementation.md#principled-implementation

A performance carries a prop by a grip window on its hand and lets a held hand be driven only by an action that declares one; the hold left keeps the entry's closed fingers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One window and one hold appended.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The window spans the whole act, so the prop never leaves the hand in it.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the held prop owner's grip window and hold.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plan it wraps and nothing else.
