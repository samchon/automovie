# src/motion/IAutoMoviePinStanceTargets.ts#IAutoMoviePinStanceTargets.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMoviePinStanceTargets.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMoviePinStanceTargets.IProps contract belongs to interface; packages/engine/src/motion/pinStanceTargets.ts and packages/engine/src/motion/plantStanceFeet.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMoviePinStanceTargets.ts#IAutoMoviePinStanceTargets.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMoviePinStanceTargets.IResult keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Parallel FK frames and local-second times produce inclusive stance runs and per-frame targets in model metres. Opening targets are authoritative for runs beginning at frame zero; each run shares one fixed target object and callers admit the parallel arrays. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMoviePinStanceTargets.IResult contract belongs to interface; packages/engine/src/motion/pinStanceTargets.ts and packages/engine/src/motion/plantStanceFeet.ts use this boundary. Runtime computation remains with those consumers.
