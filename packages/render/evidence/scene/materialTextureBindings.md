# src/scene/materialTextureBindings.ts#materialTextureBindings

## @evidence contracts/development/implementation.md#principled-implementation

Projects existing material slots, the thickness and anisotropy maps, then ordered overlay colour/normal bindings and drops only null/undefined absent bindings.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One enumeration serves texture admission/loading without duplicating full material building or changing sampler/colour-space references.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Duplicate actual bindings preserve their positions and are not silently merged by asset text; a binding list does not certify texture bytes or decoded appearance.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation identifies ordinary slot order, overlay order and absence filtering.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight ordinary slots plus two slots per L overlays are scanned once, costing O(L) time and result references without decoding images.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Loading/cache owners decide equivalent assets and variants; this pure ordered projection does not reuse or coalesce texture effects itself.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned binding references borrow the material document and retain no decoded image or GPU wrapper; loaders/cache owners acquire and retire those resources.
