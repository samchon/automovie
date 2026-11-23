# src/motion/IAutoMovieFitChainToTargetProps.ts#IAutoMovieFitChainToTargetProps

## @evidence contracts/development/design.md#principled-representation

The optional placed field distinguishes a previously selected legal pole from an uncommitted direction hint. Supplies a reachable descendant two-bone chain, current pose and target in the same resolved model-metre frame; fitChainToTarget scores clamped FK residual under the rig's effective ROM and uses a prior pose only to rank equivalent residual buckets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One input groups the rig, its pre-indexed topology and the shared clinical mappings so IK inversion, ROM and residual FK use the same semantics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No replacement constraint or target offset is embedded in this input; missing or degenerate chain preparation leaves the current pose unchanged rather than synthesizing a rig.

## @evidence contracts/development/common.md#meaningful-documentation

States target frame, unchanged non-chain joints, no-improvement identity and continuity-only prior-pose meaning; the topology must belong to the unchanged supplied skeleton.
