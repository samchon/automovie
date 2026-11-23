# src/render/delivery/IAutoMovieProductionOpusProfile.ts#IAutoMovieProductionOpusProfile

## @evidence contracts/development/design.md#principled-representation

AUTOMOVIE_PRODUCTION_OPUS_PROFILE supplies these fixed literals to assertProductionOpusProfile; observed preSkip remains in IAutoMovieProductionOpusDescription and is deliberately absent here.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AUTOMOVIE_PRODUCTION_OPUS_PROFILE exchanges kind, version, outputChannelCount, inputSampleRate, outputGainQ7_8, channelMapping; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No wider parsed channel configuration is admitted by this required profile.

## @evidence contracts/development/common.md#meaningful-documentation

Required deterministic Opus-in-MP4 profile. The prose and members document how AUTOMOVIE_PRODUCTION_OPUS_PROFILE interprets and admits these values.
