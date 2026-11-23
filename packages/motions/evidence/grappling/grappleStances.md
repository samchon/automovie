# src/grappling/grappleStances.ts#grappleStances.seconds

## @evidence contracts/development/common.md#meaningful-documentation

Explains what the numeric row means and its units.

## @evidence contracts/development/implementation.md#principled-implementation

One lookup by the requested kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the only scalar from that row used to set the clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses each authored kind's own duration.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant table lookup.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

No intermediate computation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure numeric lookup.

# src/grappling/grappleStances.ts#grappleStances.regions

## @evidence contracts/development/common.md#meaningful-documentation

Each returned key is the acting hand and its value is the partner's region.

## @evidence contracts/development/implementation.md#principled-implementation

The clinch owner supplies collar and sleeve. Other rows map the same mirrored hand keys to their sport's named regions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the scene's grip family, then the sites that the selected lead uses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg grip uses a leg region; the Greco-Roman shoulder grip has no leg target.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant lookups.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses clinch regions for the collar-and-sleeve family.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns at most two region strings.

# src/grappling/grappleStances.ts#grappleStances.keys

## @evidence contracts/development/common.md#meaningful-documentation

Returns five ordered stances, with a shared shoulder-exchange clock for the completed shoulder scene and the ordinary floor shares for other scenes.

## @evidence contracts/development/implementation.md#principled-implementation

The completed shoulder scene keeps the original foot bearings under its small turn and prepares the seat and back roll endpoints. The other entries step and either recover standing or add floor contacts. The staged shoulder-profile receiver carries free arms outward while the pair separates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Selects the stance family and creates the common entry, transfer, settle and release keys.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Floor fitting belongs to support. An interrupted scene has no fall or award event.

## @evidence contracts/development/implementation.md#efficient-algorithms

Five keys per role, independent of duration or the number of playback queries.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Floor shapes and standing recovery reuse lieDown and getUp.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No history is retained.
