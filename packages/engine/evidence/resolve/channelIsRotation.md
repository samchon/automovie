# src/resolve/channelIsRotation.ts#channelIsRotation

## @evidence contracts/development/implementation.md#principled-implementation

Validate the channel discriminator/path/value type and classify node rotation or pointer quaternion channels for spherical rather than component-wise interpolation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Canonical interface channel types and shared allowed-value sets keep sampling classification distinct from address construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown kinds/paths/value types throw instead of defaulting to scalar interpolation; node identity and pointer syntax remain separate admission responsibilities.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give the LINEAR quaternion classification rule and the failure boundary, without claiming all track data is validated here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed discriminant/set lookups take O(1) work with no per-call collection allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Sampling reuses canonical supported-path/value-type sets; no classification cache is needed for this scalar check.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a boolean or caller-owned error escapes; no channel vector, scene map, handle or task is retained.
