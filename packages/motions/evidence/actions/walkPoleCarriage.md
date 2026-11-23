# src/actions/walkPoleCarriage.ts#walkPoleCarriage.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the long-prop rule, the carry, the plant read and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The end's distance from the carrying grip against the hand's height above the floor; the carrying hand's place and the shoulders by one forward-kinematics pass at the entry; the lower hand at its grip's distance along the line at `CARRY`, leaning across so it stands ahead of the trunk's middle; the plant's elevation as the vault's overhead grip asks it; the cut's second from the walk's own event or share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the held props.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop without the end is left to the walk's swing; a plant of another prop lowers nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

One held reading and one forward-kinematics pass per carried prop, once per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The holds' reader (`walkPoleFrame.of`) and the trunk's forward kinematics.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/actions/walkPoleCarriage.ts#walkPoleCarriage.grips

## @evidence contracts/development/common.md#meaningful-documentation

States why the walk declares the grips, their order and their span.

## @evidence contracts/development/implementation.md#principled-implementation

The performance's own rule for a driven held hand: a carrying grip on the held prop; of two grips closing together the first carries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One window per holding hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hand without a long prop gains a window.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per hand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The contact window form the other carrying laws declare.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/actions/walkPoleCarriage.ts#walkPoleCarriage.kept

## @evidence contracts/development/common.md#meaningful-documentation

States what is left held and with which fingers.

## @evidence contracts/development/implementation.md#principled-implementation

A grip window takes the prop over and releases it at its end unless a hold persists it, so the walk declares the hold from its start, which a cut at any second keeps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One hold per holding hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fingers are the entry's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

One finger read per hand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The grip's finger reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/actions/walkPoleCarriage.ts#walkPoleCarriage.write

## @evidence contracts/development/common.md#meaningful-documentation

States the line over the walk and the goal.

## @evidence contracts/development/implementation.md#principled-implementation

The elevation and the lean across by one minimum-jerk share from the start to the cut, the floor's bound on the elevation asin((c − y) / (l − f)) in closed form, the line through the fulcrum and the hands by `walkPoleFrame.place`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One line and one placement per prop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A posture without carried props is returned unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per holding hand per sample; no kinematics.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The heading frame the posture is read in, the shoulders prepared once and the arm's hanging hint.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
