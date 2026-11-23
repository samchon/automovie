# src/motion/human/skill/IAutoMovieReactionTimeDistribution.ts#IAutoMovieReactionTimeDistribution

## @evidence contracts/development/common.md#meaningful-documentation

The three ex-Gaussian parameters of a reaction delay, all in seconds. Orienting and striking supply their own studied values to HumanSkill.reaction, which draws the Gaussian component plus an exponential tail.

## @evidence contracts/development/design.md#principled-representation

mu: Gaussian reaction-delay mean, seconds. sigma: Gaussian reaction-delay standard deviation, seconds. tau: Exponential tail mean, seconds; added to the Gaussian delay for the ex-Gaussian reaction law.

## @evidence contracts/development/design.md#minimal-and-owned-surface

look.reactionLaw and StrikingSkill.reactionLaw supply parameters to HumanSkill.reaction; HumanResponse.latency also reads that same distribution instead of declaring another record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shared shape adds no universal timing floor: each reaction family owns its studied parameters and floor, while HumanSkill.reaction owns the ex-Gaussian draw.
