# src/production/sound/IAutoMovieDeriveInteriorAcousticResponse.ts#IAutoMovieDeriveInteriorAcousticResponse.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Derive a closed room-path receipt from explicit space bindings and an acoustic profile. Member documentation states the supplied records, units and absence meanings used by deriveAutoMovieInteriorAcousticResponse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nullable room/request evidence stays explicit; the profile selects an admitted response path instead of guessing a room or acoustic measurement.

## @evidence contracts/development/design.md#principled-representation

sourceSpace and listenerSpace use null for outdoors, inputRevision stamps the measured input, and request may be unavailable while profile states the chosen response source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieDeriveInteriorAcousticResponse.IProps, used by deriveAutoMovieInteriorAcousticResponse. Its sourceSpace, listenerSpace, inputRevision, request, profile members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
