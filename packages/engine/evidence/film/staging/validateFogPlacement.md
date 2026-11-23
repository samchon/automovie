# src/film/staging/validateFogPlacement.ts#validateFogPlacement

## @evidence contracts/development/implementation.md#principled-implementation

Checks the extinction density and color the fog law in sceneFogTransmittance and the renderer read, narrowing unknown density before comparison and delegating color shape and channel admission to validateColor. This is the engine staging gate; Production validateSceneArtifact independently checks admitted scene fog again at its artifact boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the fog extinction-density rule and delegates the full color record to validateColor, the same unknown-input gate materials, lights and backgrounds use for channel ranges and derived-label consistency.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No density ceiling is imposed and nothing is clamped or defaulted; a refused value is reported as authored.

## @evidence contracts/development/common.md#meaningful-documentation

States units, bounds, the absent ceiling, unknown ingress, reported paths and conversion-failure handling, with hostile-accessor and nonterminating-hook limits.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The density and five-field color gates do fixed scalar work without searching scene objects; refused-value conversion and output text add their own cost, with no bound on user-defined conversion hooks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Checks one staged fog per call and coordinates no work across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing itself; the caller's collector owns at most one density finding and five color-field findings, or the corresponding object-shape refusals.
