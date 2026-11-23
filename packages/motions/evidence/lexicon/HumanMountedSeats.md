# src/lexicon/HumanMountedSeats.ts#HumanMountedSeats.parts

## @evidence contracts/development/common.md#meaningful-documentation

States what each kind reads.

## @evidence contracts/development/implementation.md#principled-implementation

The side saddle's two leg supports with optional reins, the bench's knees and handles, the basic seat's free arms, the out-of-saddle and bank seats' two stirrups with optional hands, and the entered seat's optional hands and the stirrups its entry stands in.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One choice per kind.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedSeats.ts#HumanMountedSeats.sits

## @evidence contracts/development/common.md#meaningful-documentation

States which kinds sit.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A membership test.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedSeats.ts#HumanMountedSeats.Part

## @evidence contracts/development/common.md#meaningful-documentation

Names the part keys of a figure's supports.

## @evidence contracts/development/design.md#principled-representation

The keys of the interface's support record, so the two cannot drift.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `parts` and the mounted law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanMountedSeats.ts#HumanMountedSeats.IContext

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The body, the entry in the carrier frame and readers of the carrier's contacts and colliders in that frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the three seats read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The colliders are read through `clear`, never copied.

# src/lexicon/HumanMountedSeats.ts#HumanMountedSeats.basic

## @evidence contracts/development/common.md#meaningful-documentation

States the posture and its source.

## @evidence contracts/development/implementation.md#principled-implementation

The shoulder's abduction rises above horizontal by the asin of the eye's height over the shoulder's against the arm's length, so a straight arm puts the fingertips level with the eyes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The entry with two joints per arm replaced and its arm goals dropped.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The legs and trunk are the entry's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedSeats.ts#HumanMountedSeats.aside

## @evidence contracts/development/common.md#meaningful-documentation

States the posture, its source and the three refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The seat socket keeps its place and the pelvis turns to the carrier's heading; the thigh runs from the hip joint over the head's top, raised by the head's and the thigh's radii, for its own length; the shank turns out about the carrier's fore-and-aft axis by the least angle that clears the colliders, found by a scan and bisection; the left foot's ball is placed on the tread.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The pelvis, the right leg, the left leg.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A head or stirrup out of reach is refused, never clamped to.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen scan steps and twenty bisections, each one collider distance query.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Solved once per figure.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedSeats.ts#HumanMountedSeats.bench

## @evidence contracts/development/common.md#meaningful-documentation

States the posture and its refusals.

## @evidence contracts/development/implementation.md#principled-implementation `kneelKeys`' kneeling height (the knee joint a shank radius over the floor, the hip a thigh above it) and tucked foot on the pad's plane; the hips stand back from the handles by the thigh's length; the reach is checked from the shoulder the inclined trunk carries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The root, the knees and their surfaces, the feet, the reach.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A knee off its surface or a handle out of reach is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two tucked-foot solves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `kneelKeys.tucked`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
