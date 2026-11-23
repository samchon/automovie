# src/posture/prepareHumanFootSole.ts#prepareHumanFootSole

## @evidence contracts/development/common.md#meaningful-documentation

States the unchanged-body premise, flat-toe convention, varying placement and ordered fresh world points.

## @evidence contracts/development/implementation.md#principled-implementation

HumanFoot.offset resolves each original sole socket at zero toe flexion; outline frames retain the same rest-joint-to-ankle offset arithmetic. Each queried placement still rotates and translates every point exactly as HumanFoot.sole did.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One body-local point list precedes a placement reader; HumanFoot.sole and prepared stance consumers share this same owner, while articulated displayed-bone base reading remains separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No socket or outline corner is removed, and no posed/world point or target is cached. Flat toes remain the existing sole contract, without replacing displayed toe articulation in base/socket readers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear preparation in a foot's sole points once per unchanged body/side; each placement retains the original linear quaternion/translation work while omitting repeated socket/rest-frame conversions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The immutable body's rest joints and surface/outline frames fix ankle-local points, matching HumanFootOutline's existing per-body lifetime; another body is required to adopt geometry edits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A weak body map owns at most two side readers and their local-point lists per live body; action-owned borrowed readers release with their actions, and no angle, pose or queried-placement history grows the cache.
