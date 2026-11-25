# src/createViewerCameraState.ts#createViewerCameraState

## @evidence contracts/development/implementation.md#principled-implementation

Captures native detached auto-updating lens/TRS/view state and restores a typed IViewerCameraStateSnapshot on a temporary camera clone, reading its declared fields without a runtime type check and requiring finite values and dimensions, nondegenerate transforms and exact native projection parity before copy; custom/manual/parented cameras refuse, while non-unit quaternions are not normalized and only resulting finite invertibility is tested.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps capture and restore with the same native camera/lens owner, preserving view offsets/film settings instead of applying an unexplained raw matrix snapshot; a named transfer record describes existing fields without another projection solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual native projection recomputation and exact parity rather than fixture lens defaults, patched matrix methods or tolerance-based acceptance of an unsupported custom projection.

## @evidence contracts/development/common.md#meaningful-documentation

States detached/auto-updating supported classes, refused custom state and admission-before-mutation; the transfer record's field docs give vector/matrix conventions, layer mask and lens/view units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each capture/restore reads fixed-size lens/vector/matrix state and one temporary camera clone, constant adapter work/storage; camera.clone is recursive by native default, so a camera with children may additionally clone its child subtree despite parentless admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Capture/restore share native lens semantics and one borrowed camera identity; mutable lens/pose/view input requires new snapshots/candidate validation, with no cached custom projection or alternate math.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned closures retain the borrowed camera and each capture transfers copied scalar/array/view state; temporary clones acquire no GPU handle themselves but may retain cloned child references until unreachable. The original camera/children remain host-owned and no task starts.
