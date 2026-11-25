# src/handling/HumanHeldUse.ts#HumanHeldUse.kept

## @evidence contracts/development/common.md#meaningful-documentation

States the result, the absence and both refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The use's place is a region of the performer's own body, and a second hand is laid where the kept grasp presents the tool, so a statement missing either is refused before the key is read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two checks, then one delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tool is named; each refusal names what to give.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `key`; read by `touch` and `handToFace`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The cost is the key's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/handling/HumanHeldUse.ts#HumanHeldUse.key

## @evidence contracts/development/common.md#meaningful-documentation

States the key, its inputs and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The grasp was chosen so that this key holds (`pickUp`'s use), so an act that keeps its rotation asks only a pose the grip was taken for, the roll the same chooser takes; the closed hand is the entry's own digits, each phalanx and tip less its radius from the body's colliders, whose depth in the face adds to a roll's miss.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The entry's hand, digits and body colliders, one clearance reader, then the use owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tool is named; the region is the act's own.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The clearance reader places the entry's digit points and the body's colliders once for every roll the use search tries.

## @evidence contracts/development/implementation.md#efficient-algorithms

One entry FK supplies the D digit points and the body's collider placement; each roll's clearance costs D distance queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The digit points and collider reader end with the key search; the returned key's judge holds its tool or contact geometry only.

# src/handling/HumanHeldUse.ts#HumanHeldUse.second

## @evidence contracts/development/common.md#meaningful-documentation

States how the hand meets the tool, the choice of turn and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

A held tool is rigid in the holding hand's grip frame (`AutoMovieMotionHumanHeld.of`), so the other handle's frame follows from the holding hand's goal; the grasp of it is the pick up's (`HumanGrasp.at`, `HumanGrasp.hand`), and the reachable turn ranks the symmetric grasps of a handle as grasp planners do.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tool in the hand, the turn at the use, then one arm carry and one hand form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The handle is the prop's own; the elbow's hint is solved once at the use and carried with the body.

## @evidence contracts/development/implementation.md#efficient-algorithms

One reachable search at plan time, one goal of the holding hand and one grasp per written second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the held owner, the grasp's target, hand and reachable search, the bend solver and the arm carry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitives close over the tool read at plan time and one hint.
