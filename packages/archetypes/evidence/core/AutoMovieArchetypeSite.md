# src/core/AutoMovieArchetypeSite.ts#AutoMovieArchetypeSite

## @evidence contracts/development/common.md#meaningful-documentation

States each kind's coordinates, the site's frame and the single site of a point contact.

## @evidence contracts/development/design.md#principled-representation

Normalised coordinates over the extent the kind's own fields give, so a site is stated without knowing the archetype's size and stays on the affordance for every seed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function; the choice among sites belongs to the motion grammar's site axis (#3357).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No site is named after an archetype's part; a coordinate outside 0 to 1 is refused instead of clamped onto the edge.

# src/core/AutoMovieArchetypeSite.ts#AutoMovieArchetypeSite.at

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinates' range and default and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A point of the kind's extent in the frame's own coordinates, carried to the frame's space; a rim site turns the frame about its `+Y` and takes the bar convention there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the coordinates, then one branch per kind.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent dimension leaves the coordinate at the frame, as the kind's doc says an affordance without that field has no extent there.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieArchetypeFrame`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
