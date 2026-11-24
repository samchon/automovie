# src/production/IAutoMovieProductionAacDescription.ts#IAutoMovieProductionAacDescription

## @evidence contracts/development/design.md#principled-representation

Holds the four facts an `mp4a` sample entry stores in its AudioSpecificConfig (ISO/IEC 14496-3 §1.6.2.1): the sample entry type, the audio object type, the declared sampling frequency in hertz and the channel configuration. Another codec is represented by its own entry type with the AAC fields 0, so one shape carries every observed file and the profile check names the codec it refuses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface package owns it; the CLI delivery probe fills it and `assertProductionAacProfile` reads it through `IAutoMovieProductionAudioProbe.sampleEntry`. It keeps only what the profile compares; bit rate, buffer size and other decoder-configuration fields are not facts the profile checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member serves only a test, and the codec string stays open because it records what the file holds rather than what the profile admits.

## @evidence contracts/development/common.md#meaningful-documentation

States the box and standard the facts come from, the unit of the rate, the meaning of object type 2 and channel configuration 2, the representation of a non-AAC entry and the separate acceptance check.
