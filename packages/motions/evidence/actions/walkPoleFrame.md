# src/actions/walkPoleFrame.ts#walkPoleFrame

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and when nothing is.

## @evidence contracts/development/implementation.md#principled-implementation

Each hand's held frame and grip socket from the displayed entry; its forearm's way at the wrist's neutral by one forward-kinematics pass of the arm at clinical zero on the entry's trunk.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the two hands, then the carrying order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop without the end, or held by no hand, gives none.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two held-frame reads and two forward-kinematics passes at most, once per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held-prop reader, the grip frame and the trunk's forward kinematics.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/actions/walkPoleFrame.ts#walkPoleFrame.place

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the roll and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The least turn of the prop's axis onto the line, the roll about the line in closed form (atan2(B, A) of the arms' alignment), then each hand by its rigid hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The turn, the roll, the hands.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each hand is the prop's frame through its own hold; no hand is placed apart from the prop.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per hand; no kinematics.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/actions/walkPoleFrame.ts#walkPoleFrame.write

## @evidence contracts/development/common.md#meaningful-documentation

States what is written and what the elbow is left to.

## @evidence contracts/development/implementation.md#principled-implementation

The fit's own least-error, least-strain elbow (`IAutoMovieHumanLimbGoal.elbow`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal per hand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Other limbs are kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per hand.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkPoleFrame.ts#walkPoleFrame.neutral

## @evidence contracts/development/common.md#meaningful-documentation

States the angle, its frame and where it is read.

## @evidence contracts/development/implementation.md#principled-implementation

The forearm's way in the hand at the wrist's neutral (the reverse of `proximal`) against the pole's axis carried into the hand by the hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two directions and one angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angle is the hold's own, never a constant.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkPoleFrame.ts#walkPoleFrame.power

## @evidence contracts/development/common.md#meaningful-documentation

States the angle, its source and the side taken.

## @evidence contracts/development/implementation.md#principled-implementation

The grip frame's forward, across its normal, against the forearm's way in the hand from one forward-kinematics pass of the arm at clinical zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One grip frame, one pass, one angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The angle is the body's own grasp geometry, never a constant.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkPoleFrame.ts#walkPoleFrame.plant

## @evidence contracts/development/common.md#meaningful-documentation

States the condition, its monotone form, the bound and the refusal case.

## @evidence contracts/development/implementation.md#principled-implementation

The forearm at the grip's neutral angle to the pole holds the pole with the wrist and the forearm twist neutral; the angle is monotone in the elevation, so its root is bracketed and bisected.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The bracket, the bisection, the plant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An angle the bracket never reaches takes the bracket's nearer end; a pole too short at the lowest grip gives none.

## @evidence contracts/development/implementation.md#efficient-algorithms `SPLITS` halvings of a half turn, once per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
