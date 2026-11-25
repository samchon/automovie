# src/perform/HumanPerformanceSoft.ts#HumanPerformanceSoft.held

## @evidence contracts/development/common.md#meaningful-documentation

States which anchors count and why.

## @evidence contracts/development/implementation.md#principled-implementation

An anchor bound to a hand bone is that hand's hold, by the binding the domain declares.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter over the anchors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the hand bones count; an anchor on another bone is worn, not held.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in anchors.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read with nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records.

# src/perform/HumanPerformanceSoft.ts#HumanPerformanceSoft.at

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the clamp and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation between the two fixed steps around the second, the solve's own states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cached solve and one interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The interpolation reads only solved states; nothing is re-solved per read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in particles per read after the one solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The solve is kept per performance state and prop subject, both fixed once the performance is placed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The cache is a weak map on the state, released with the performance; each prop keeps (steps + 1) x 3P doubles.

# src/perform/HumanPerformanceSoft.ts#HumanPerformanceSoft.load

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the frame, the step read and the zero cases.

## @evidence contracts/development/implementation.md#principled-implementation

XPBD's constraint force at the anchor, recorded by the engine's observer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cached solve and one lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A plain position-based solve has no forces and reports zero rather than an estimate.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work after the one solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares `at`'s solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the shared solve.

# src/perform/HumanPerformanceSoft.ts#HumanPerformanceSoft.sustained

## @evidence contracts/development/common.md#meaningful-documentation

States what each record holds, where it acts, its window and the one-way order.

## @evidence contracts/development/implementation.md#principled-implementation

The XPBD anchor force recorded per gripping hand, read back at a film second as a pure function.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record per grip window, its force delegated to `load`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grip worn on a bone is no hand's load and is left out; a plain solve's force reads zero rather than an estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the soft props' grip windows; each force read is constant work on the kept solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the solve `at` and `load` keep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records; the solves are kept by `of`.

# src/perform/HumanPerformanceSoft.ts#HumanPerformanceSoft

## @evidence contracts/development/common.md#meaningful-documentation

States the cache and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Boundaries from the displayed bones at every fixed step, the grips' particles chosen from the solve at their closing step, the engine's one replay with an observer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Boundaries, then grips in time order, then the final solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An over-budget span is refused with its budget named, never truncated.

## @evidence contracts/development/implementation.md#efficient-algorithms

(W + 1) replays of K steps for W grips, each linear in particles times sweeps; the displayed bones are read once per step and person.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Kept by the placed performance, per subject (`soft`).

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owned by the performance; (K + 1) x 3P doubles per prop.
