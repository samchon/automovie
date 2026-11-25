# src/rom/toClinicalAngle.ts#toClinicalAngle

## @evidence contracts/development/implementation.md#principled-implementation

Preserve null rest, validate sign/neutral and compute sign*rig+neutral in degrees, with absent frame preserving the angle. Prepared use captures the actual final sign read, performs its original multiplication, then captures neutral and performs the original addition; unchanged scalars repeat exactly that arithmetic for each current rig value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private forward-conversion owner serves direct and prepared calls, with original diagnostics in assertAxisFrame. The scalar entry remains independent of skeletons; preparation adds only one bounded last-frame affine reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No hidden mirror, finite repair, reordered expression or normalization is added. Null returns before frame lookup/admission; first actual nonnull use keeps original checks and sign/multiplication/neutral/addition read order. Same-frame reuse requires unchanged values, replacements admit anew and failed admission installs no metadata.

## @evidence contracts/development/implementation.md#efficient-algorithms

Direct conversion keeps fixed validation and multiply/add without metadata allocation. A prepared frame performs that work once on actual nonnull use; later matching identity reads omit immutable-frame revalidation but keep current-angle multiply/add. Work/storage are constant and runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual repeated box-projector candidate conversion shares only one unchanged frame's captured sign/neutral. Frame replacement invalidates the single reading and admits again, while every new rig value still undergoes original arithmetic. No clinical result, candidate or target is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct calls retain nothing. A caller-owned prepared closure holds one state and at most one borrowed frame/two scalars, replacing its reading only after successful admission and releasing it with the query/operation. No joint population, result, global cache, handle or task is retained.

## @evidence contracts/development/common.md#meaningful-documentation

States equation/units, null/undefined meanings, used-frame refusals, first-use preparation, unchanged-object lifetime and replacement behavior.
