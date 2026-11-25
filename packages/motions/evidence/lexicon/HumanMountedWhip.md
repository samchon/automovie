# src/lexicon/HumanMountedWhip.ts#HumanMountedWhip.IStroke

## @evidence contracts/development/common.md#meaningful-documentation

side: The striking hand. at: The contact, local seconds.

## @evidence contracts/development/design.md#principled-representation

A hand and a second on the action's clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `weight` and the mounted law's windows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanMountedWhip.ts#HumanMountedWhip.strokes

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The cue track's instants, made local, that fall in the figure's hold; each stroke needs `REACH` on both sides inside the hold and clear of the last.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop per figure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stroke that does not fit is refused, never moved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the cue instants after one sort.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list.

# src/lexicon/HumanMountedWhip.ts#HumanMountedWhip.weight

## @evidence contracts/development/common.md#meaningful-documentation

States the weight's ends and easing.

## @evidence contracts/development/implementation.md#principled-implementation

The minimum-jerk share over the `REACH` before and after each contact (Flash and Hogan 1985).

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One scan.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the strokes, a handful.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedWhip.ts#HumanMountedWhip.split

## @evidence contracts/development/common.md#meaningful-documentation

States the cut.

## @evidence contracts/development/implementation.md#principled-implementation

Each grip window of the striking hand that holds the stroke's contact is replaced by the parts before and after its reach.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One pass per stroke.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the windows per stroke.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Run once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list.

# src/lexicon/HumanMountedWhip.ts#HumanMountedWhip.strike

## @evidence contracts/development/common.md#meaningful-documentation

States what is moved and when.

## @evidence contracts/development/implementation.md#principled-implementation

The arm goal's wrist point blended to `target` by `weight`, unplanted while it strikes.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop over two hands.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant per stroke.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure amendment.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedWhip.ts#HumanMountedWhip.target

## @evidence contracts/development/common.md#meaningful-documentation

States the point and its frame.

## @evidence contracts/development/implementation.md#principled-implementation

The hip joint the posture places (`hipJoints`) plus the target offset, mirrored for the right side and turned by the posture's attitude.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The offset is provisional and named.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
