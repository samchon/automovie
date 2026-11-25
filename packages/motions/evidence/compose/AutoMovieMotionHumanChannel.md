# src/compose/AutoMovieMotionHumanChannel.ts#AutoMovieMotionHumanChannel

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the type's document gives the partition.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the side and the part from the bone's name, the rig vocabulary's own structure, and maps the part to its channel by the partition the type states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side test, then one branch per part group.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Eyes and shoulder girdles carry a side in their names but belong to the head and the trunk, and are routed there before the limb rules.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanChannel.ts#AutoMovieMotionHumanChannel.digit

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the side and the digit from the bone's name, the rig vocabulary's own structure, as `of` does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side test and one pattern.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanChannel.ts#AutoMovieMotionHumanChannel.claims

## @evidence contracts/development/common.md#meaningful-documentation

States the two ways a claim is covered.

## @evidence contracts/development/implementation.md#principled-implementation

A hand's channel is the union of its digits, so it covers each of them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One membership test and one hand test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A digit claim never covers its hand: the hand's other digits stay free.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the claims.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanChannel.ts#AutoMovieMotionHumanChannel.covers

## @evidence contracts/development/common.md#meaningful-documentation

States what covers a joint.

## @evidence contracts/development/implementation.md#principled-implementation

The joint's channel by `of`, or its digit by `digit`; with claims that name no digit it is `claims.includes(of(bone))` exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two membership tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the claims.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `of` and `digit`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanChannel.ts#AutoMovieMotionHumanChannel.merge

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied, what stays and what happens to a field the written posture no longer sets.

## @evidence contracts/development/implementation.md#principled-implementation

Each field goes to the posture of its owner: the channels' fields from the written posture, the rest from the base, so a primitive cannot change a part it did not claim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two passes over the joints, one over the four limbs, and four scalar choices.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An owned joint or limb goal absent from the written posture is cleared. Every digit reads only its selected source; optional-field presence never probes an unselected source. Root/trunk membership and selected getter reads retain their original order and frequency.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the joints the two postures hold: each record's own keys are listed once and each value read by its key, with no pair record per joint.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `of` for every joint.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanChannel.ts#AutoMovieMotionHumanChannel.prepareMerge

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed copied claims, actual per-call posture data and fresh result/borrowed payload ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Channel partition and digit coverage depend only on fixed claims and a bone's closed name, so their exact boolean decisions may be shared while all numeric and optional source values remain freshly read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared merge body serves cold and prepared callers; preparation owns only the fixed channel/digit sets and lazy bone-classification map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent owned joints, goals and rotations are still cleared; bone insertion order, aliases and borrowed payloads remain unchanged. No posture result, input identity or fit is cached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation scans C claims and ten digit names once. Each merge retains its O(Jb+Jw) joint traversal and fixed limb/digit reads; each encountered bone's channel/digit parsing runs once per prepared reader instead of on both sides of every merge. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same fixed claims share only name-membership decisions, across distinct postures and exact seconds. The copied claim list isolates caller edits, and changed claims require a new preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning plan or synchronous overlay query retains C copied claims, channel/digit sets and at most one boolean per encountered closed bone name until released. No pose, numeric record, time history or external handle is retained.
