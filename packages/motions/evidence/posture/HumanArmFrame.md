# src/posture/HumanArmFrame.ts#HumanArmFrame

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, single/paired-arm selection and the existing per-base frame identity.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the source pose and places its physical colliders once for a newly requested frame; the existing obstacle owner selects from that same placement while audit probes retain their exact segment transforms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Existing base/arm lookup delegates a missing frame to one construction pass, requesting an optional lazy reader only on that miss.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all FK admission, external part indices, related exclusions, probe order and strict shoulder-reach comparison; base, body and external placements remain unchanged for the frame's existing lifetime.

## @evidence contracts/development/implementation.md#efficient-algorithms

One full ordered pose walk and collider placement per newly built frame plus linear part/probe scans; a body segment whose extent sphere lies beyond the arm's reach of the shoulder places none of its corners, which the reach filter would drop; an optional same-base reader avoids identical completed joint/bone math for the second arm while all outputs remain fresh. Cache hits never invoke a lazy factory or allocate its FK maps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Same-base arm construction shares only the supplied synchronous FK reader's exact dependencies. Obstacle/probe passes share placements, each owner reuses its inverse frame (the hand's already computed for the fingertip), bounds reuse local points, and the completed shoulder origin feeds unchanged-frame chain queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only the existing weakly keyed per-base frames; temporary placement and owner-group arrays are released after construction and no new cross-pose cache is introduced.
