# src/production/sound/IAutoMovieProductionPhonemesToVisemes.ts#IAutoMovieProductionPhonemesToVisemes.IProps

## @evidence contracts/development/design.md#principled-representation

Chunk endpoints use mono source sample indices and the target uses [startFrame, endFrame) film frames. Ratios fit sample timing into that span; no sample rate is required because only relative source position matters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

productionPhonemesToVisemes lowers adopted speech chunks to vowel/rest intervals, preserving input chunk order and grouping multiple tokens when fewer frames are available.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nonpositive duration or sourceSamples returns no intervals; no tokens yields one full-span rest. Other numeric validity/order is a caller premise, and gaps between timed chunks are not automatically filled.

## @evidence contracts/development/common.md#meaningful-documentation

Adopted phoneme sample timing fitted to one film-frame dialogue span. Chunk endpoints use mono source sample indices and the target uses [startFrame, endFrame) film frames. Ratios fit sample timing into that span; no sample rate is required because only relative source position matters.
