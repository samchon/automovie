# src/production/IAutoMovieProductionOpusDescription.ts#IAutoMovieProductionOpusDescription

## @evidence contracts/development/design.md#principled-representation

productionOpusDescription validates serialized field widths and channel-mapping relations against the parsed MP4 audio entry, retaining observed pre-skip, informational input rate and signed fixed-point gain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates codec facts from profile acceptance so a structurally valid non-delivery Opus entry can be reported accurately before the host rejects its unsupported profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Family zero has implied mono or stereo order and null stream counts; nonzero families keep their explicit mapping and null unexpanded speaker order rather than guessing channel meaning.

## @evidence contracts/development/common.md#meaningful-documentation

Defines observed codec fields, sample units, informational input rate, signed Q7.8 gain and family-dependent mapping nulls and arrays.
