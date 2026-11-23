# src/production/IAutoMovieEffectParticle.ts#IAutoMovieEffectParticle

## @evidence contracts/development/design.md#principled-representation

Every field is a pure function of the compiled effect seed, the spawn index and the sampled time through a seeded hash, so the particle is reproducible on any host without carried simulation state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds exactly what a billboard renderer draws: a stable index for keying, a world position, a sampled size, an opacity and the age ratio, with no velocity or history fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fields are recomputed rather than integrated frame to frame, so no accumulated drift is corrected after the fact and no renderer is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the index numbering of burst and regular spawns, the motion terms that move the position, the size evolution in metres, the opacity fade law, and the half-open range of the age ratio.
