# src/motion/IAutoMovieSolveAirborneTakeoff.ts#IAutoMovieSolveAirborneTakeoff.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieSolveAirborneTakeoff.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieSolveAirborneTakeoff.IProps contract belongs to interface; packages/engine/src/motion/solveAirborneTakeoff.ts and packages/engine/src/motion/AirborneTakeoffLinear.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieSolveAirborneTakeoff.ts#IAutoMovieSolveAirborneTakeoff.ISolution

## @evidence contracts/development/common.md#meaningful-documentation

The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieSolveAirborneTakeoff.ISolution keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieSolveAirborneTakeoff.ISolution contract belongs to interface; packages/engine/src/motion/solveAirborneTakeoff.ts and packages/engine/src/motion/AirborneTakeoffLinear.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieSolveAirborneTakeoff.ts#IAutoMovieSolveAirborneTakeoff.IAngles

## @evidence contracts/development/common.md#meaningful-documentation

The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieSolveAirborneTakeoff.IAngles keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The solve uses flight-clock seconds, unit take-off/frame quaternions, signed somersault/twist turns and world angular momentum in kg m²/s. Angular tolerance is radians whereas solution residual components are revolutions; met reports both the residual and momentum bounds, and flight is the trajectory actually judged. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieSolveAirborneTakeoff.IAngles contract belongs to interface; packages/engine/src/motion/solveAirborneTakeoff.ts and packages/engine/src/motion/AirborneTakeoffLinear.ts use this boundary. Runtime computation remains with those consumers.
