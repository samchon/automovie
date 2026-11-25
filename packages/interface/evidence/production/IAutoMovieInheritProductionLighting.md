# src/production/IAutoMovieInheritProductionLighting.ts#IAutoMovieInheritProductionLighting.IProps

## @evidence contracts/development/common.md#meaningful-documentation

One shot's lights at one shot-local instant, with the production's sources inherited at the story moment the shot's pin places that instant at. Member documentation states the supplied records, units and absence meanings used by inheritProductionLighting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unpinned shots retain their staged sources; this input does not imply that the production assembly's opening snapshot is a continuously sampled light track.

## @evidence contracts/development/design.md#principled-representation

lighting and pin explicitly permit null; seconds is shot-local and maps through the pin to the story clock before light-id merging.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieInheritProductionLighting.IProps, used by inheritProductionLighting. Its lighting, lights, pin, seconds members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
