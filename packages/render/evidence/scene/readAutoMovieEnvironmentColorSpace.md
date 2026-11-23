# src/scene/readAutoMovieEnvironmentColorSpace.ts#readAutoMovieEnvironmentColorSpace

## @evidence contracts/development/implementation.md#principled-implementation

Selects sRGB image-light decoding for actual UnsignedByteType and linear-environment for other decoded component types, matching the existing scene binding and storage preflight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One component-driven environment decision remains distinct from a material data channel NoColorSpace and from explicit texture storage format.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The function does not inspect radiometric image content or validate every nonbyte component representation; supported decoder output is the premise for treating those components as linear radiance.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the component-type decoding convention, its producer premise and the separate native linear-environment tag without claiming radiometric or color-profile observation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One type comparison returns a fixed union without image traversal, decoding or allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Current component type is observed on every call; the helper has no memo that can conceal a later texture type change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The texture is borrowed and only a string tag escapes; no decoded image, GPU texture or ownership record is retained.
