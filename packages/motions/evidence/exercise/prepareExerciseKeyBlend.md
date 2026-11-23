# src/exercise/prepareExerciseKeyBlend.ts#prepareExerciseKeyBlend

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed endpoints, the share and how each member blends.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation of clinical angles and the trunk's scalars; the turn is blended as written, so a full turn keyed as 360 is not shortened to 0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One joint-map blend and four scalars.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No key, angle or share is clamped or approximated; every output joint tuple is fresh.

## @evidence contracts/development/implementation.md#efficient-algorithms

The joint union and its differences are prepared once; each share is linear in the joints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The joints are the shared owner's; nothing is cached by identity here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds the two keys' scalars and the joint blend until its owning plan releases it; no share or result is stored.
