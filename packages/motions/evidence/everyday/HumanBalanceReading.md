# src/everyday/HumanBalanceReading.ts#HumanBalanceReading.IReading

## @evidence contracts/development/common.md#meaningful-documentation

Documents each member: the offset along the heading and the static margin in metres, the heel bearing and the optional proposed translation.

## @evidence contracts/development/design.md#principled-representation

One posture's static balance in world metres along its heading; the proposal is present only when it was asked for and the centre lies outside the base.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here and read by `HumanBalance.shift`'s searches, which compare readings of the same body at different shifts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No widened member; the optional proposal is the one state the search asks for.

# src/everyday/HumanBalanceReading.ts#HumanBalanceReading.read

## @evidence contracts/development/common.md#meaningful-documentation

States each input's role, the optional readers' defaults and the reading's units.

## @evidence contracts/development/implementation.md#principled-implementation

Places the whole-body centre of mass and the bearing base on one solve (`placement`), reads the static margin of stability (`resolveAutoMovieCenterOfMass.margin`), the offset along the heading (`projected`) and the heel bearing within `HumanFoot.BEARING` of the lowest sole socket.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `HumanBalance` with its placement so the balance searches keep their own file; `HumanBalance.shift` is its consumer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bearing height and the margin are the engine's and the foot owner's; nothing is tuned here.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve and FK, then linear passes over the base's points.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's FK reader, projection, prepared frames and mass model are reused within its search; the solve itself is the posture's own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the borrowed readers stay the caller's.

# src/everyday/HumanBalanceReading.ts#HumanBalanceReading.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

Documents the borrowed sole reading, the world mass centre and the bearing points.

## @evidence contracts/development/design.md#principled-representation

The solved geometry of one posture in world metres: the feet bound to that solve's FK, the mass centre and the base in the foot owner's order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; `HumanBalance.margin`, `HumanBalance.support` and `HumanBalance.offset` read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member; every reading needs all three.

# src/everyday/HumanBalanceReading.ts#HumanBalanceReading.placement

## @evidence contracts/development/common.md#meaningful-documentation

States each input's default and the returned geometry's frame.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the posture once (`resolveHumanPosture.seeded`), reads its bones, places the mass centre by the body's or the given mass model and takes the feet's bearing base (`HumanFoot.reading`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solve shared by every static balance measurement; moved from `HumanBalance` unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The base and the centre are the foot and mass owners'; nothing is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

One solve and one FK pass, the demanded bones only when frames are given.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The lent FK reader, projection, frames and mass model are reused as given.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned feet reading borrows the solve's bones for the caller's reading; nothing else is retained.

# src/everyday/HumanBalanceReading.ts#HumanBalanceReading.projected

## @evidence contracts/development/common.md#meaningful-documentation

States the projection and the sign of the result.

## @evidence contracts/development/implementation.md#principled-implementation

Projects the base's points on the heading, takes the middle of their extent and reads the mass centre's distance ahead of it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection, no hull or heel query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The middle is the base's own extent along the heading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the base's points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
