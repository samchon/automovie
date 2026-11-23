# src/striking/DefenceOutcome.ts#DefenceOutcome.classify

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and units.

## @evidence contracts/development/implementation.md#principled-implementation

The campaign's margin bands: non-negative in time, above minus half the movement time late, otherwise fail.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two comparisons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/DefenceOutcome.ts#DefenceOutcome.band

## @evidence contracts/development/common.md#meaningful-documentation

States the result's form and its open ends.

## @evidence contracts/development/implementation.md#principled-implementation

The same bands as the classification, as intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per outcome.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/DefenceOutcome.ts#DefenceOutcome.decide

## @evidence contracts/development/common.md#meaningful-documentation

States the two modes and both kinds of refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Unforced: the skill's ex-Gaussian reaction and a uniform lead give the margin. Forced: the plausible margin band, linear in the attack's stretch, is met in closed form, a margin drawn strictly inside the intersection and split into an in-band reaction and lead.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation, the unforced draw, then the stretch, the margin and the split for a forced outcome.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid timing throws; an unmeetable forced outcome is refused with the reachable outcomes, never realised in another band or with an implausible reaction time; the 2 % inset keeps a draw off a band's exclusive edge.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs and the given stream.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
