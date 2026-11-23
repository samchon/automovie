# src/production/IAutoMovieResolveProductionLighting.ts#IAutoMovieResolveProductionLighting.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The production's lights at one story-clock instant. Member documentation states the supplied records, units and absence meanings used by resolveProductionLighting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record does not import shot-local or edit-clock assumptions into lighting; numeric admission and active-source semantics remain the lighting resolver's responsibility.

## @evidence contracts/development/design.md#principled-representation

lighting owns production sources and storySeconds selects the instant on the story clock; source-relative tracks are resolved from that common instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieResolveProductionLighting.IProps, used by resolveProductionLighting. Its lighting, storySeconds members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
