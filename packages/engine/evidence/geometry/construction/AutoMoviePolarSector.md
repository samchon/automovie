# src/geometry/construction/AutoMoviePolarSector.ts#AutoMoviePolarSector.radius

## @evidence contracts/development/implementation.md#principled-implementation

Wraps finite phi into one turn, binary-searches increasing guides and evaluates the selected quintic endpoint-jet interpolation plus its C2-zero fullness bump.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One guide search delegates only the fixed-size span polynomial to sector.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects too few guides, mismatched fullness and a nonpositive selected span; full angle order/finiteness/positive-radius admission remains the caller's responsibility.

## @evidence contracts/development/common.md#meaningful-documentation

Gives guide order, cyclic last sector and fullness indexing, with derivative convention in Jet.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log G) guide lookup plus constant polynomial work and a three-number result for G ordered guides.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One selected guide pair, width and basis-power evaluation serves radius and both angular derivatives; repeated calls are not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh jet and retains neither guide/fullness arrays nor span preparation.

# src/geometry/construction/AutoMoviePolarSector.ts#AutoMoviePolarSector.fullnessAt

## @evidence contracts/development/implementation.md#principled-implementation

At xi=1/2 the fullness basis equals one, so subtracting the zero-fullness radius gives the unique additive fullness for that midpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One base-sector reading and subtraction implement the inverse of the existing forward rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the requested middle radius without clamping fullness or claiming the resulting whole sector is convex or positive.

## @evidence contracts/development/common.md#meaningful-documentation

States the midpoint parameter and unit-height bump premise; width must be positive as for sector evaluation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant span-polynomial work; this path also computes the two unused derivative entries of its local sector result.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same forward sector basis instead of a second independent interpolation formula; no persistent prepared pair is owned.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The temporary jet is call-local and only a scalar fullness is returned.

# src/geometry/construction/AutoMoviePolarSector.ts#AutoMoviePolarSector.point

## @evidence contracts/development/implementation.md#principled-implementation

Applies the analytic product rule to rho(phi)*(cos(phi),sin(phi)) for the supplied finite radius jet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading returns Cartesian point and both derivatives in a fixed derivative-order array.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the given polar jet without finite differences, radius fitting or normalization.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the section X/Z chart and all three conversion equations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic, one sine/cosine pair and three two-component output arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the same sine, cosine and radius derivatives for the point and both derivative orders.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh outer array and three pairs; no guide or jet state is retained.
