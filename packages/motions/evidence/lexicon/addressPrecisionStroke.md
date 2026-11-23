# src/lexicon/addressPrecisionStroke.ts#addressPrecisionStroke

## @evidence contracts/development/common.md#meaningful-documentation

States the three address movements, the hinge rule, its monotone search, the limits and the refusal hand-off.

## @evidence contracts/development/implementation.md#principled-implementation

A golf address flexes the trunk at the hips with the pelvis behind the feet and slightly flexed knees, keeping the centre of mass over the base; the hinge is solved from reach, the pelvis shift from the shoulders' forward travel and the centre of mass's remaining travel (the segmental centre of mass, `resolveAutoMovieCenterOfMass.place`), and the drop from the leg's reach to each planted ankle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stroke law keeps its path and contact check; this function owns only the stance that makes the path reachable.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No per-sport stance: one reach rule serves every row. The provisional shares and cap are named with their basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

About two dozen forward-kinematic shoulder reads and two whole-body resolves for the centre of mass during preparation; the returned function is constant time per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Solves once per planned stroke and reuses the result at every sampled time.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the solved hinge and two vectors.
