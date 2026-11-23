# src/kinematics/hingedArmSpan.ts#hingedArmSpan.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The four rest records of `hingedArmSwivel.IChain` that the span reads, in the same frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by `of`; `hingedArmSwivel.IChain` has them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No root frame or target, which the span does not depend on.

# src/kinematics/hingedArmSpan.ts#hingedArmSpan.IGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Names the interface record this owner's name stands for.

## @evidence contracts/development/design.md#principled-representation

The record is the interface's; the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.

# src/kinematics/hingedArmSpan.ts#hingedArmSpan.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

Names the interface record this owner's name stands for.

## @evidence contracts/development/design.md#principled-representation

The record is the interface's; the alias adds nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept so this owner's readers name the record by its owner, as master keeps such aliases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No copy of the record: one declaration, in `@automovie/interface`.

# src/kinematics/hingedArmSpan.ts#hingedArmSpan.empty

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

An empty record whose members the first branch query fills at its original admission sites.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Computes nothing ahead of the query that would have computed it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Shares nothing itself; `hingedArmSwivel.prepare` states what a holder shares.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned record.

# src/kinematics/hingedArmSpan.ts#hingedArmSpan.of

## @evidence contracts/development/common.md#meaningful-documentation

States the input and both null cases; the namespace states the sinusoid.

## @evidence contracts/development/implementation.md#principled-implementation

Rotation about the hinge leaves the far segment's part along the hinge fixed and turns the rest in a circle, so the squared span is an exact first harmonic of the hinge angle; the coefficients are its projections on the mid offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The split of the far segment, the constant term, the two coefficients, then amplitude and phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The thresholds are the engine's shared length scale and the span's own epsilon; a degenerate hinge returns null rather than a guess.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading; its callers hold the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
