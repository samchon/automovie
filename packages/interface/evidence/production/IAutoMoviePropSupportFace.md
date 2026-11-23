# src/production/IAutoMoviePropSupportFace.ts#IAutoMoviePropSupportFace

## @evidence contracts/development/design.md#principled-representation

A face is a plan region plus a height function over it, which is exactly what a resting test needs: `propSupportGap` probes points inside the region with `footprintContains`, including its holes, and reads each probe's height through `surfaceHeightAt`; a tilted stack-top becomes a plane rule from the cross product of the transformed local axes, and a face standing edge-on to the ground is never produced because its height is not a function of `(x, z)`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields shared by three producers, so the gap measurement exists once for patches, prop tops and built parts instead of once per support kind; the height reuses the structural `IAutoMovieHeightSurface` so a patch passes its own surface record without conversion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The polygon keeps a patch's holes rather than its convex hull, so a prop over an atrium void is measured against no face instead of a floored hull, and no producer substitutes a default height for a face it cannot measure: it returns `null` instead.

## @evidence contracts/development/common.md#meaningful-documentation

States the three producers and how each derives the region and the height, why a stack-top travels through the full staged transform, the single consumer, and for each field its plane, its hole semantics and the reader of its height rule.

# src/production/IAutoMoviePropSupportFace.ts#IAutoMoviePropSupportFace.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The face one `on-support` relation resolves to, or `null` when the record states none. Member documentation states the supplied records, units and absence meanings used by builtEnvironmentSupportStatus, propSupportFace, propSupportGap, validatePropPlacementGeometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Space and other target kinds are excluded by the union; unresolved, unmeasurable or edge-on support faces remain null instead of receiving invented footprints or heights.

## @evidence contracts/development/design.md#principled-representation

target is restricted to a support patch or prop affordance; environments and optional prop/staging registries resolve its rest-world face in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMoviePropSupportFace.IProps, used by builtEnvironmentSupportStatus, propSupportFace, propSupportGap, validatePropPlacementGeometry. Its target, environments, props, set members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
