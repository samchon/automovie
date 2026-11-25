# src/film/staging/lightTypeOf.ts#lightTypeOf

## @evidence contracts/development/implementation.md#principled-implementation

Reads the declared `type` of the placement union and maps only omission to the documented directional default; the compiler owns the union's members, so no runtime check re-reads the kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one reading of a placement's kind shared by the shape validator, the environment check in `stageScene` and the lowering, so the default cannot differ between them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No membership test or coercion; the directional default is the staging contract's meaning of omission.

## @evidence contracts/development/common.md#meaningful-documentation

States the two answers: the declared kind and the default for omission.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One property read, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads one placement per call and coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains nothing; it returns a string.