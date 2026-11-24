# src/geometry/construction/AutoMovieLoftSectionOriginal.ts#AutoMovieLoftSectionOriginal

## @evidence contracts/development/common.md#meaningful-documentation

States that admission and interval selection are shared by the direct source and the chain geometry.

## @evidence contracts/development/design.md#principled-representation

An original section's support is the half-open physical station interval `[domain[0], domain[1])` in mm, starting no earlier than the chain's first station and ending before its last; `fault` admits it and `active` selects it. That the three capabilities agree with the retained law at the protected last station remains the producer's responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two functions over `IAutoMovieLoftSectionConnect.IOriginal`, read by AutoMovieLoftSection, AutoMovieLoftPoint, AutoMovieLoftSectionConnect, AutoMovieLoftViewFullSource and AutoMovieViewLoft.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace holds no state and no alternate source; a malformed original is refused by `fault`, not repaired.

# src/geometry/construction/AutoMovieLoftSectionOriginal.ts#AutoMovieLoftSectionOriginal.fault

## @evidence contracts/development/implementation.md#principled-implementation

The new local law occupies an explicit bounded interval of an original direct source.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A malformed source refuses admission. Bounds and function presence do not prove geometry or derivative correctness.

## @evidence contracts/development/common.md#meaningful-documentation

States that the finite original prefix and its capability owners are checked. The refusal string and the null of an admitted source are left to the signature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate over the record's name, bounds and three capabilities, shared by the chain's admission, the full-source reader and the view loft.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns a string or null.

# src/geometry/construction/AutoMovieLoftSectionOriginal.ts#AutoMovieLoftSectionOriginal.active

## @evidence contracts/development/common.md#meaningful-documentation

States that the protected last station belongs to the retained distal law.

## @evidence contracts/development/implementation.md#principled-implementation

The original law owns the stations from its first bound up to, not including, its protected last bound, where the retained distal law takes over; an absent original owns no station.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One comparison shared by every reader that chooses between the original section and the retained law.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The comparisons are exact against the declared bounds; no tolerance widens the interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure comparison coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
