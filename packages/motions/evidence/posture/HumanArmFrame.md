# src/posture/HumanArmFrame.ts#HumanArmFrame

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, single/paired-arm selection and the borrowed reader.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the source pose and places its physical colliders once per frame; the existing obstacle owner selects from that same placement while audit probes retain their exact segment transforms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One construction pass per call; a segment read by several goals is counted once by its bone, its shapes' values and its pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all FK admission, external part indices, related exclusions, probe order and strict shoulder-reach comparison; base, body and external placements remain unchanged while the frame is read.

## @evidence contracts/development/implementation.md#efficient-algorithms

One full ordered pose walk and collider placement per frame plus linear part/probe scans; a body segment whose extent sphere lies beyond the arm's reach of the shoulder places none of its corners, which the reach filter would drop; an optional same-base reader avoids identical completed joint/bone math for the second arm while all outputs remain fresh.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same-base arm construction shares only the supplied synchronous FK reader's exact dependencies. Obstacle/probe passes share placements, each owner reuses its inverse frame (the hand's already computed for the fingertip), bounds reuse local points, and the completed shoulder origin feeds unchanged-frame chain queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; temporary placement and owner-group arrays are released after construction and the frame is the caller's.
