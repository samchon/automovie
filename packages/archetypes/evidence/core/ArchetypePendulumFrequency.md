# src/core/ArchetypePendulumFrequency.ts#ArchetypePendulumFrequency

## @evidence contracts/development/common.md#meaningful-documentation

States units, physical premises, the frequency and explicit numerical failure.

## @evidence contracts/development/implementation.md#principled-implementation

The physical pendulum frequency is sqrt(m*g*arm/moment). The ordinary calculation is retained when every intermediate product and the radicand are finite and normal; the same positive law in logarithms rescues intermediate overflow or subnormal loss before exponentiating the frequency.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit physical figures, use ordinary or exceptional frequency, then admit the result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No moment, mass, gravity lever, neutral pose, numeric floor or guessed frequency is substituted; least-normal binary64 marks precision loss rather than a physical cutoff.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar operations, with logarithms only at exceptional numeric scale.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One frequency is prepared for each swing, never recomputed per sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No body, input history or resource is retained.
