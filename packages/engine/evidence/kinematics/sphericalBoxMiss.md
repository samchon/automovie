# src/kinematics/sphericalBoxMiss.ts#sphericalBoxMiss

## @evidence contracts/development/common.md#meaningful-documentation

States the rectangle's parameterisation, the distance in both cases, every input's meaning and unit and the zero inside.

## @evidence contracts/development/implementation.md#principled-implementation

The nearest point of a latitude band on a meridian is the point's own latitude clamped to the band, and off the band's longitudes it lies on a bounding meridian arc, where the cosine is a sinusoid of the middle angle maximised in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The band, the longitude test, then the two meridian arcs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact in closed form; nothing is sampled and no tolerance is applied here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two inverse functions inside the longitudes, four more on the meridians.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the end joint's miss and the mid segment's twist miss, which read two such rectangles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
