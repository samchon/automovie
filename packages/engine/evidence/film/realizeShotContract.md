# src/film/realizeShotContract.ts#realizeShotContract

## @evidence contracts/development/implementation.md#principled-implementation

Reads compiled artifacts through one subject reader and applies declared scalar predicates. Camera grading uses intersectsPerspectiveFrustumBox's geometric overlap test and projects eight box corners to derive depth range; it proves neither full enclosure, occlusion nor rendered pixels. Formation chunks use running starts, hero vector components compare within 1e-9, and rotations use |abs(dot)-1| within 1e-9 so q and -q agree. Unresolvable references become failing outcomes at their grading location.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function owns the grading decisions and the diagnostic wording; where subjects stand is delegated to `createShotContractSubjectReader` and each predicate's measurement to `evaluateShotPredicate`, which the state and event grades share; the camera and formation grades stay private because nothing else grades them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The failure message tells the author to correct the scene, motion, camera or sample because echoed ids and contract prose are never accepted as evidence; no shot, subject or fixture is special-cased, and the source-stage exemption from hero materialization is the documented `production: null` contract, because heroes are added by the builder after this pass.

## @evidence contracts/development/common.md#meaningful-documentation

States the instants each part is graded at, every condition a state, event, camera sample, formation and actor must meet, how unresolvable references grade, and the order and meaning of the returned diagnostics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverses predicates, events, camera samples times required subjects, chunks and heroes with delegated sampling and extent costs; sorting T deduplicated camera times adds O(T log T). The subject reader indexes identities and chunk starts use one running sum, while camera lookup still scans scene cameras per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Builds one subject reader per call and shares it across every predicate, event, camera sample and participant check, so object-motion sampling and subject extents computed for one grade are reused by the others; nothing is shared across calls, because each call grades different artifacts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader and its caches are owned by this call and released on return; the returned record holds fresh outcome objects plus references to the contract's predicates and copies of resolved camera placements, sized by the contract.
