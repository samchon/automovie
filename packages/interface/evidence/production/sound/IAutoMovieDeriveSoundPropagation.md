# src/production/sound/IAutoMovieDeriveSoundPropagation.ts#IAutoMovieDeriveSoundPropagation.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Derive distance gain, one film-clock arrival and the selected segment/spectral outcome. Member documentation states the supplied records, units and absence meanings used by deriveAutoMovieSoundPropagation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Propagation policy is supplied as the canonical profile; segment and film limits remain explicit rather than a per-scene delay exception.

## @evidence contracts/development/design.md#principled-representation

distanceMeters is source-to-listener distance, fps converts the delay to film frames, and emissionFrame, segmentEndFrame and totalFrames use the finished-film clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieDeriveSoundPropagation.IProps, used by deriveAutoMovieSoundPropagation. Its distanceMeters, emissionFrame, segmentEndFrame, fps, totalFrames, profile members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
