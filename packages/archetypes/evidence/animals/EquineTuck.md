# src/animals/EquineTuck.ts#EquineTuck.Tuck

## @evidence contracts/development/common.md#meaningful-documentation

States what the reader returns.

## @evidence contracts/development/design.md#principled-representation

A pure function of the swing goal and the tuck's weight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built once per limb by `prepare`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineTuck.ts#EquineTuck.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

The fold grows with the weight to `FOLD`, the hoof is drawn back by the same weight to under the limb's second joint (elbow or stifle), where a folded limb carries it, and raised to where the folded limb hangs from its neutral attachment, its distance the chain's greatest reach at that fold, so the solve stays inside the limb's reach while the body is at or below its neutral height. The swing's own lift and fold are kept where they are larger. That hang is in the body's frame: a swing borne on a support plane (terrain, or the level ground seen from a pitched body) blends the plane toward the body's floor by the same weight, and the hang's lift is measured from that plane's height under the hoof.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reach read and one height per call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hoof beyond the folded reach horizontally keeps its swing goal rather than being moved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the limb owner's reach.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one prepared chain.

# src/animals/EquineTuck.ts#EquineTuck.weight

## @evidence contracts/development/common.md#meaningful-documentation

States each second and the range.

## @evidence contracts/development/implementation.md#principled-implementation

The fores fold after leaving the ground before takeoff and reach their maxima early in the flight (24.8 to 28.2 % of the jump stride), then extend to land; minimum-jerk ramps keep the fold and its rate continuous.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Product of two ramps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's `minimumJerk`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineTuck.ts#EquineTuck.fores

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

One `prepare` per fore and one `hind` per hind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four calls.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `prepare`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains four prepared chains.

# src/animals/EquineTuck.ts#EquineTuck.hind

## @evidence contracts/development/common.md#meaningful-documentation

States the measured quantity the fold is found from.

## @evidence contracts/development/implementation.md#principled-implementation

The limb's greatest reach falls as the hock folds, so halving the fold between none and a straight angle finds the fold whose reach is the shortened length; the hoof then hangs at that reach as a fore's does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search at preparation, then the shared tuck.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shortening is the measured one; no hock angle is invented.

## @evidence contracts/development/implementation.md#efficient-algorithms

48 halvings once per ride.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses prepare and the limb owner's reach.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one prepared chain.

# src/animals/EquineTuck.ts#EquineTuck.IFores

## @evidence contracts/development/common.md#meaningful-documentation

Names each limb.

## @evidence contracts/development/design.md#principled-representation

One reader per limb.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `fores`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
