# src/film/staging/lightTypeOf.ts#lightTypeOf

## @evidence contracts/development/implementation.md#principled-implementation

Narrows the authored field through `isAutoMovieLightType`, the membership test over the engine's supported light kinds, instead of trusting the static union, and maps only omission to the documented default.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one reading of a placement's kind shared by the shape validator, the environment check in `stageScene` and the lowering, so the default and the refusal cannot differ between them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unsupported type answers `null` for the validator to refuse rather than being coerced to a supported kind; the directional default is the staging contract's meaning of omission.

## @evidence contracts/development/common.md#meaningful-documentation

States the three answers, why the value is doubted at runtime, and which caller refuses `null` and which may assume it is absent.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One property read and one set membership test, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads one placement per call and coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains nothing; it returns a string or `null`.
