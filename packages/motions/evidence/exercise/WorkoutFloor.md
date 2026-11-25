# src/exercise/WorkoutFloor.ts#WorkoutFloor.plank

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and what 90 means.

## @evidence contracts/development/implementation.md#principled-implementation

The body from the ankles to the shoulders is a straight line of the standing length between them, raised at its shoulder end by the height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arcsine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The toes' own height is neglected against the body's length, so the palms are laid by the arm's solve and not by this angle.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/WorkoutFloor.ts#WorkoutFloor.pitched

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The height is read by forward kinematics of the key itself, feet and toes included, so the foot stood on its toes raises the ankles as it does on the body; the first pass measured 0.2 m of error from treating the body as a line from the ankles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bisection over the pitch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The pitch is sought between 10 degrees (nearly upright, the hands on something high) and 150 (the head lower than the feet, the feet on something high); a height outside what that range gives ends at the nearer end.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each of the unchanged twenty pitch trials resolves one requested shoulder/toe bone map instead of separate full maps for the two means.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both height means read one exact trial map. Fixed name demand and genuine same-search FK/ROM metadata share only checked prerequisites; every arbitrary key callback's current clinical angles still resolve normally, with no source-shape inference, height or FK answer reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fixed-name/exact FK readers and bounded ROM metadata end on return or throw; no trial pose/map escapes and only the final authored key returns.

# src/exercise/WorkoutFloor.ts#WorkoutFloor.rolled

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, the inputs, the sign and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A body on two supports rests on both, so the roll is the one that puts both on the floor, read by forward kinematics of the key on the body's own colliders, the reading the floor audit makes; a straight line from the feet to the shoulder, as `plank` models a prone support, leaves the forearm's thickness and the hand's place out.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bisection over the roll.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The roll is sought between upright and lying on the side; a support that cannot reach the floor in that range ends at the nearer end.

## @evidence contracts/development/implementation.md#efficient-algorithms

The two collider groups (the bearing bones the pattern names, and the feet) and their neutral entries are prepared once for the twenty trials; each trial resolves its key and reads both groups' exact minima in one pass (`HumanColliders.prepareMinima`).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The collider floor minimum is the colliders' owner's; only the unchanged body's group membership and same-search FK/ROM metadata share, and each key is observed in full.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed native collider-entry metadata, exact FK reader and bounded ROM metadata end with this synchronous search; only the final authored key returns, without a selector observation, trial map or workspace retained.
