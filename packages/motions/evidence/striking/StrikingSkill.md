# src/striking/StrikingSkill.ts#StrikingSkill.lone

## @evidence contracts/development/common.md#meaningful-documentation

States the derivation, its sources and units.

## @evidence contracts/development/implementation.md#principled-implementation

Time scaling of a fixed movement at one peak speed: duration proportional to path length (Hollerbach and Flash 1982).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ratio and one product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A degenerate cross path keeps the cross's own time.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.punchPeak

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the band and the axis.

## @evidence contracts/development/implementation.md#principled-implementation

The skill's reading between the measured elite speed and the provisional novice end, the lead straight's (Liu et al. 2022), taken for both hands for want of a measured rear straight in the same study, and for the hook and the uppercut provisionally: Liu measured the lead straight only, and a lead hook's peak was measured faster (Stanley et al. 2018, 11.95 m/s), so a bent punch's fist is the straight's speed until each technique's own is read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quantity read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The novice end is named provisional on the band.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.strike

## @evidence contracts/development/common.md#meaningful-documentation

States the factor's range, axis and source.

## @evidence contracts/development/implementation.md#principled-implementation

The skill's reading between the measured novice and elite ratios.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quantity read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.interval

## @evidence contracts/development/common.md#meaningful-documentation

States the two intervals, the factor, the values at both ends and that the scaling is derived and provisional.

## @evidence contracts/development/implementation.md#principled-implementation

The measured interval times the delivery's skill factor, the one skill scaling the punch's delivery has, since no study timed combinations by skill level.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One choice of interval and one factor, the value every reader of a combination interval takes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The scaling is named derived and provisional, with the missing skill-split study stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.recovery

## @evidence contracts/development/common.md#meaningful-documentation

States the factor's range, axis and source.

## @evidence contracts/development/implementation.md#principled-implementation

The skill's reading between the measured novice and elite ratios.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quantity read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.amplitude

## @evidence contracts/development/common.md#meaningful-documentation

States the share's range, axis, the inference behind it and that it is provisional.

## @evidence contracts/development/implementation.md#principled-implementation

The skill's reading between the provisional novice and elite shares.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quantity read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The novice share is a named provisional value with the missing measurement stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.lag

## @evidence contracts/development/common.md#meaningful-documentation

States the share's endpoints and their sources.

## @evidence contracts/development/implementation.md#principled-implementation

The skill's reading on the sequencing axis between the cited novice and elite lags.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quantity read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.reaction

## @evidence contracts/development/common.md#meaningful-documentation

States the distribution, its parameters with their source, the clamp and the indices read.

## @evidence contracts/development/implementation.md#principled-implementation

An ex-Gaussian draw: a normal plus an inverse-transform exponential, clamped to the 1 to 99 % band.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The law's parameters, one draw, one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The clamp is the stated plausibility band, not a tuning; 1e-12 keeps the logarithm finite.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs and the given stream.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.reactionLaw

## @evidence contracts/development/common.md#meaningful-documentation

States the source and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Each parameter read on the reaction axis between the cited novice and elite values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three quantity reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.reactionBand

## @evidence contracts/development/common.md#meaningful-documentation

States both bounds and that the upper one is conservative.

## @evidence contracts/development/implementation.md#principled-implementation

The normal's 1 % quantile below, and the normal's 99 % quantile plus the exponential's 99 % point above, which bounds the sum's 99 % point from above.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One law read and two bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.anticipation

## @evidence contracts/development/common.md#meaningful-documentation

States the band's meaning, its endpoints, their basis and that they are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

Each end read on the anticipation axis between the provisional novice and elite values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two quantity reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The values are named provisional, with the missing live-striking measurement stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.defence

## @evidence contracts/development/common.md#meaningful-documentation

States the endpoints, the axis, their derivation and that they are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

The skill's reading on the speed axis between the provisional novice and elite times.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quantity read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The times are named provisional, with the missing onset-to-completion study stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSkill.ts#StrikingSkill.guardDrop

## @evidence contracts/development/common.md#meaningful-documentation

States the probability, depth and duration ranges by skill, that they are provisional, and the indices read.

## @evidence contracts/development/implementation.md#principled-implementation

A Bernoulli draw for whether it drops, then uniform draws in the skill's depth and duration ranges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One draw for the occurrence and two for its size.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ranges are named provisional values with the missing measurement stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs and the given stream.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
