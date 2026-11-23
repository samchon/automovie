# src/geometry/construction/AutoMovieConstructionSkinCut.ts#AutoMovieConstructionSkinCut

## @evidence contracts/development/common.md#meaningful-documentation

States the region, the smooth minimum with its bound and derivatives, the residual and the rail's jets.

## @evidence contracts/development/design.md#principled-representation

One generating curve for a shared boundary: the skin's own intersection with a declared surface, exact with its jets, which the rail cycle, the band's edge and the crossing between them all read (construction.md, Connections: Ownership).

## @evidence contracts/development/design.md#minimal-and-owned-surface

The plane record, the input, the built cut with one reader and its station bounds, and one builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A phase without a crossing, already past the surface or tangent to it is refused with its phase; nothing is clamped to the face's end or refitted.

# src/geometry/construction/AutoMovieConstructionSkinCut.ts#AutoMovieConstructionSkinCut.create

## @evidence contracts/development/implementation.md#principled-implementation

The curve is the zero set of the planes' minimum, or smooth minimum, on the skin; its station is a root of a residual that rises into the kept side, and its derivatives are the implicit function theorem's on the skin's 2-jet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Residual, bracketed root, admitted table, then one reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a phase with no crossing in the domain, a phase already inside at the facing end and a tangent crossing; no station is clamped and no derivative differenced. A second crossing between two of the face's stations is not searched for.

## @evidence contracts/development/common.md#meaningful-documentation

States the bracketing, the reader's start and fallback, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Building reads `samples` phases over the stations plus one bisection each; a reading takes a few Newton steps, one skin jet each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The admitted roots start every later reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the planes, the stations and `samples` roots; no reading is cached.
