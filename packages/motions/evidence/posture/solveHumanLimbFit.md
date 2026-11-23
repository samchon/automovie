# src/posture/solveHumanLimbFit.ts#solveHumanLimbFit

## @evidence contracts/development/common.md#meaningful-documentation

States the reduction, the mirror and frame conventions, the admission, the absence of memory, the two policies and the shared-record ownership of the result.

## @evidence contracts/development/implementation.md#principled-implementation

A bone's frame depends on its own and its ancestors' records, so the reduced pose places the fit's bones as the whole pose does; mirror reflection and a rigid root-frame move leave a limb fit equivariant; the mirror, the frame and the fit are the ones that ran on the whole pose, applied to fewer records.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reduce, mirror, move into the frame, one solve by `HumanLimbFit.direct`, merge the solved records back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No key, lookup or stored answer: every request is solved from its own inputs, and an attached or collider goal stays in the world frame as before. A malformed record outside the reduced pose is still refused, by the whole pose's admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fit's own work on the reduced pose's records, plus two walks of the whole pose's joints (the selection and the merge) and its one admission, shared by the fits that share an admission; no copy of the whole pose is mirrored, moved or scanned by the fit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Solves each request afresh; an admission is shared only by fits whose poses differ by records earlier fits solved.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the borrowed reader stays with its caller and only the result escapes.
