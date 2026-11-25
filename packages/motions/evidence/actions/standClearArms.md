# src/actions/standClearArms.ts#standClearArms

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the stance it is read in, the quiet arms it starts from and the arms it leaves unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

The relaxed arm's own clearance rule (HumanDigitFit's signed digit depth, strict zero) evaluated on the stance the stand holds, by bisection on each shoulder's abduction from the quiet angle to its range, ended at the engine's joint resolution as standRelaxed ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve of the stance, one depth check per arm, then one bisection per arm that sinks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the stated relaxed digit shape, the shoulder's range and the resolved stance; no margin and no body-specific angle is chosen.

## @evidence contracts/development/implementation.md#efficient-algorithms

The stance resolves once: the legs' fits read no arm and the stance asks no arm goal, so a candidate re-clamps the upper arm's direct record only. A clear arm costs one depth check.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Starts from standRelaxed's cached quiet arms and the body's own projector.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The FK reader and candidate poses end with the call; only the returned angle table escapes.
