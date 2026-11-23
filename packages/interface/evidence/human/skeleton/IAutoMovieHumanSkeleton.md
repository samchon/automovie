# src/human/skeleton/IAutoMovieHumanSkeleton.ts#IAutoMovieHumanSkeleton.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Stickman skeleton at its bind and under the requested pose.

## @evidence contracts/development/design.md#principled-representation `bones`: Bones at the bind, the achieved posture, in metres, parent before child. `posed`: Registered-body placement of every bone under `params.pose`, in the order of `bones`; no scene transform is applied. `clamped`: Pose fields whose requested value lay outside the range and was clamped.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanCanonicalBody.display, AutoMovieHumanSkeleton.generate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `neckSurface`: Owned exterior neck snapshot at rest when requested, metres; independent of rig radii and pivots. `footSurface`: Deeply frozen canonical foot courses shared by this fixed body's evaluations.

# src/human/skeleton/IAutoMovieHumanSkeleton.ts#IAutoMovieHumanSkeleton.IPrepareOptions

## @evidence contracts/development/common.md#meaningful-documentation

Prepare one fixed body's joints, clinical axes and mm-to-metre scales once.

## @evidence contracts/development/design.md#principled-representation `neckSurface`: Include the independent exterior-display descriptor; omitted or false skips its admission and materialization. `footSurface`: Include frozen canonical foot courses and actual source landmark addresses; omitted or false skips their materialization. `calibration`: The body already calibrated from these same `params`; omission recalibrates, while a supplied value must describe the same body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSkeleton.IPrepareOptions is the canonical exchange used by AutoMovieHumanSkeleton.prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `neckSurface`: Include the independent exterior-display descriptor; omitted or false skips its admission and materialization. `footSurface`: Include frozen canonical foot courses and actual source landmark addresses; omitted or false skips their materialization. `calibration`: The body already calibrated from these same `params`; omission recalibrates, while a supplied value must describe the same body.
