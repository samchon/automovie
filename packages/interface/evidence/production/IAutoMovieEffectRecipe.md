# src/production/IAutoMovieEffectRecipe.ts#IAutoMovieEffectRecipe

## @evidence contracts/development/design.md#principled-representation

Seeded emission, lifetime and initial size ranges, an optional bounded final size, transport velocities and an integer live-particle cap define the intended stream domain. sampleCompiledEffect checks exact time membership and derives state using the fixed step and cue bounds. materializeCompiledEffects checks that a supplied final size is finite and between the maximum initial size and 20 metres. The other documented ranges and positive step remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Emission, appearance, motion and runtime budget form separate groups, with one closed effect-family discriminator and one supported alpha blend law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Effect names select no hidden subject preset. With an admitted integer cap, sampling stops after maxParticles live outputs and far-distance thinning retains indices divisible by four; candidate arrays can exceed that cap, and the sampler does not validate malformed direct recipes.

## @evidence contracts/development/common.md#meaningful-documentation

States seed ownership, emission rate and duration, lifetime and initial and final sizes in metres, RGB appearance, opacity, metre-per-second transport and hard live-instance and LOD limits.
