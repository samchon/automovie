# src/motion/IAutoMovieSolvePreparedChainPlantProps.ts#IAutoMovieSolvePreparedChainPlantProps

## @evidence contracts/development/design.md#principled-representation

Pairs pose-invariant chain frames with one target and optional model-frame bend normal, while the same clinical axes/rest frames lower solved quaternions and reconstruct the clamped residual.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Candidate-varying target and bend normal stay separate from prepared chain geometry, exposing which work can be shared during the bounded bend-plane search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omitted bend normal selects the analytic two-bone default, not a fixture-specific pole; supplied mappings remain the caller's rig semantics rather than a solver compensation.

## @evidence contracts/development/common.md#meaningful-documentation

States resolved model-metre frame, optional bend-plane meaning and the requirement that clinical tables agree with final FK/ROM evaluation.
