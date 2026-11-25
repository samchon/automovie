# src/body/createHumanBody.ts#createHumanBody

## @evidence contracts/development/common.md#meaningful-documentation

States what is derived and the frame premise.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the engine's measurer, surface resolver, topology index, immutable FK producer with canonical axes/rest frames and segmental mass-model resolver, and sums rest translations for rest positions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preserves rest-position, measure, surface and topology derivation order. The engine's withSurfaces producer lends one call-scoped neutral-bounds owner across the two consecutive derivations and releases it in finally. Immutable FK follows; body getters prepare mass, the quiet-stance alignment (standUpright.align) and the relaxed hanging arms (standRelaxed.solve) on first read, and collider owners prepare only actual query needs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rig or profile lacking a needed bone throws inside the engine owners.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed segment/hull bounds compute at their original measurement observation and serve surface bounds. Unobserved mass performs no rest work; first mass access borrows the genuine rig's actual neutral rest computation instead of repeating raw FK, while mass transforms/admission still run once. Hull faces remain lazy and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

withSurfaces shares actual neutral bounds across the unchanged derivation. The privately captured genuine poseResolution supplies mass rest independently of public method/property replacement, through the same static neutral rows ordinary FK uses. Plans share one successful lazy mass model; failed reads are retried and source edits require a new body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

withSurfaces releases its temporary geometry owner in finally before returning independent measure/surfaces. The body owns O(B) static FK, its O(B) name index, first-read mass data, one alignment, one relaxed arm record and at most two hanging-arm angle triples; its getter retains only source inputs/one successful model. FK uses weak operation keys and collider geometry uses weak body/point keys; all release with those owners.
