# src/reaction/staggerArms.ts#staggerArms

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs, the arms' abduction, its timing and the let-out it reads.

## @evidence contracts/development/implementation.md#principled-implementation

Both arms abduct from the entry's angles by the measured balance reaction (Weerdesteyn, Laing and Robinovitch 2008) from its onset to the first landing and come down by a minimum-jerk share after the last landing; the let-out is the plan's own carriage samples, interpolated between knots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The arms' row of the stagger, apart from the legs' row and the plan that reads the carriage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The abduction, onset and knot rate are the named bounds of `staggerBounds`; nothing is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

A pose query writes both arms as joint angles: two minimum-jerk shares, one interpolation per side and one arm carry; no fit runs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The entry's arm angles are read once per plan; the carriage is the plan's, read through `carried`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive holds the entry angles, the recovery and the plan's carriage reader for the plan's life; each query's posture ends on return.