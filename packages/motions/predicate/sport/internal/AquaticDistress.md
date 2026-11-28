# src/sport/internal/AquaticDistress.ts#AquaticDistress.plan

## @evidence contracts/development/common.md#meaningful-documentation

The contract names the entered horizontal position, water height, default and admitted press times, staged submersion span and cues.

## @evidence contracts/development/implementation.md#principled-implementation

The upright position, lateral arm goals, and vertical bob are defined from the entered body. The admitted press duration determines the `submerge` cue. Clamped elapsed time keeps the returned posture within the press and sink interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

The plan builds its two posture keys and reads its reference mouth offset once. Each requested second uses a periodic arm and vertical expression and a bounded sink blend.

# src/sport/internal/AquaticDistress.ts#AquaticDistress.BAND

## @evidence contracts/development/common.md#meaningful-documentation

The constant gives the vertical amplitude of the staged root bob in metres.
