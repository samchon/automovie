# src/animals/QuadrupedPelvis.ts#QuadrupedPelvis.IHip

## @evidence contracts/development/common.md#meaningful-documentation

Model space, metres, before the root translation.

## @evidence contracts/development/design.md#principled-representation

The pelvis's joint with this hip, the hind's ankle goal and its radial reach.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `high` and `turn` read for each hind.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedPelvis.ts#QuadrupedPelvis.high

## @evidence contracts/development/common.md#meaningful-documentation

States the bound and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

Each hind's highest root at a turn is its goal's height less the turned hip's plus the vertical leg of its reach over the remaining horizontal offset; the lowest over the hinds is concave in the turn on the range, so its maximum is found by a golden-section search, an out-of-reach hind counted by its horizontal excess so the search climbs back toward reach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search over one angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No reach is padded; an unreachable set is negative infinity.

## @evidence contracts/development/implementation.md#efficient-algorithms `STEPS` evaluations of two closed forms.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the scapula's arc.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/QuadrupedPelvis.ts#QuadrupedPelvis.turn

## @evidence contracts/development/common.md#meaningful-documentation

States the choice, the unit and the unreachable case.

## @evidence contracts/development/implementation.md#principled-implementation

The set of turns admitting the root is an interval about the best turn, the joint bound being concave; bisect between rest and the best turn for its end nearest rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rest, the best turn, one bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turn never leaves the cited range.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two `STEPS` searches.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the bound's closed forms.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
