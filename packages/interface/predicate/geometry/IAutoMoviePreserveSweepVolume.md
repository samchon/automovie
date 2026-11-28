# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Rest surface, pose orientation and shared scale buffers for joint-scale volume settlement.

## @evidence contracts/development/design.md#principled-representation

The helper measures the rest target from section moments and settles joint scales against the posed plane flux. It applies girth multipliers after settling and stages all outputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inputs retain the rig's live pose state and output slots. The helper owns the compiled volume target and numerical workspace.

# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps.surface

## @evidence contracts/development/common.md#meaningful-documentation

Compiled authored rest surface in model metres. Section moments and rest frames supply the volume target before girth factors.

# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps.orientation

## @evidence contracts/development/common.md#meaningful-documentation

Live section orientation queried for pose frames. Update it before invoking the returned writer.

# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps.joints

## @evidence contracts/development/common.md#meaningful-documentation

One boolean per authored station. True selects stations for the common settlement factor.

# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps.scaleU

## @evidence contracts/development/common.md#meaningful-documentation

Sealed normalized spine coordinates ordered by output scale slot. Keep length and slot identities stable after compiling.

# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps.girth

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed positive dimensionless post-settlement multiplier per scale slot. These factors can adjust the volume after settlement.

# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps.scales

## @evidence contracts/development/common.md#meaningful-documentation

Caller-owned output array with one dimensionless scale per registered slot. It is updated only after all products pass positive finite admission.

# src/geometry/IAutoMoviePreserveSweepVolume.ts#IAutoMoviePreserveSweepVolume.IProps.writeFrame

## @evidence contracts/development/common.md#meaningful-documentation

Synchronous serializer for the rest frames used to compile the target. It writes metre origin XYZ then three unit XYZ axes at the supplied scalar offset.
