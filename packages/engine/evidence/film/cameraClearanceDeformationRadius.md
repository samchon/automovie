# src/film/cameraClearanceDeformationRadius.ts#cameraClearanceDeformationRadius

## @evidence contracts/development/implementation.md#principled-implementation

Bounds supplied portable part geometry by the triangle inequality over a rigid joint chain, `|p| + 2c`, and convexity of normalized non-negative skin weights; the clearance compiler validates acyclic links and finite translations first, and engine kinematics ignores bone scale. This loose bound covers those part vertices, while external appearance and renderer-only deformation remain outside its premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function the clearance compiler calls per obstacle model, with the farthest-corner and chain-reach steps as private helpers because nothing else reads them; it returns a scalar so the caller decides how to place and scale the sphere.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone, rig or model is named; every bone some part or skin uses contributes its own chain length, and overflow throws instead of being clamped to a finite guess.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and unit, the derivation of the bound, which bones contribute, why rest scale is ignored, the validation premise, and the overflow error.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in bones plus influenced joint references: each chain length is memoized so a bone's ancestry is summed once however many parts or skin joints reach it, and the eight rest corners cost a constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computed once per obstacle node per clearance compilation; nothing coordinates across calls, and the memo is local to one model's chain walk.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after return; the bone index and chain memo are locals bounded by the model's bone count and dropped with the call.
