# src/film/resolvePerformShotTarget.ts#resolvePerformShotTarget

## @evidence contracts/development/implementation.md#principled-implementation

Structural checks on the untyped target precede resolution, so `resolveTargetPoint`, which trusts its input, only sees a well-formed target; the formation refusal runs before the id checks because it is the one fault the author can act on, and the live resolver is preferred because it reports where a moving target actually is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolution is the reference synthesizer's own `resolveTargetPoint` over the same placement table, so a target the gate accepts is a target the performer can aim at; the fault text is the shared `positionalTargetFault`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Cameras resolve as placements without becoming performers; every named group member must exist so no centroid silently drops an authored member, and formation groups are accepted only by camera framing. Malformed or unsupported targets cannot be made valid by a permissive live callback.

## @evidence contracts/development/common.md#meaningful-documentation

States which targets reach it, the order of the checks and why the formation refusal is first, what each kind requires, where the point comes from, and the `null` answer after every violation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost includes id trimming, group member/id/resolution walks and a bone target's rig scan; each absent formation also lists the supplied formation table, so repeated failures can repeat that population scan. Diagnostic representation size, user-defined conversion hooks and caller-supplied target/rig callbacks add their own unbounded work beyond those local traversals.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Gates one target per call; the placement and formation tables it reads are built once per shot in the context and shared by every call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Pushes violations into the shared collector and retains nothing; the returned point is a staged or resolved vector the caller only reads.
