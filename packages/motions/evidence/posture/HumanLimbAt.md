# src/posture/HumanLimbAt.ts#HumanLimbAt.at

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the frame and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Mirrors a left limb, carries an attached goal into the world and evaluates fitHingedChainAt on the fit's own request.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reduce to the records read (`HumanLimbView.of`), mirror, carry, one engine call, merge the posed records back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No search; the given swivel is kept. The whole pose is still admitted in order.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation and one pose on the reduced records, plus the whole pose's admission and two walks of its joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call evaluates its own request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanLimbAt.ts#HumanLimbAt.seed

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the null cases.

## @evidence contracts/development/implementation.md#principled-implementation

Mirrors a left limb and reads readHingedChainSeed on the fit's request, its target the end joint's place in the pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the pose, reduce to the chain's records and their ancestors', mirror, one end-joint FK, one engine reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unlisted joint reads as clinical zero, the rest pose's own value.

## @evidence contracts/development/implementation.md#efficient-algorithms

One requested FK and one engine reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own pose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanLimbAt.ts#HumanLimbAt.free

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, that nothing is placed, the mirror-image frame of a left limb and the ranges it is read against, each parameter and the null answer.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's angles at a swivel (`fitHingedChainAt.free`, Tolani, Goswami and Badler 2000, sections 3.2.3-3.3) on the same request `at` builds: the chain's records, a left limb's mirrored, the goal carried into the world.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The readers `at` and `free` share one builder of the mirrored request (`mirrored`), so the two read the limb identically.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant or tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

One view of the chain's records and one engine reading per call, with no placement or merge.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning.