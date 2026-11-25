# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.basis

## @evidence contracts/development/implementation.md#principled-implementation

The stations advance along `v x u` of a section's frame, so the signed product is the direction out of an end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three normalizations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A degenerate frame returns null; no default axis is substituted.

## @evidence contracts/development/common.md#meaningful-documentation

States the axes and the null case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record.

# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.cut

## @evidence contracts/development/implementation.md#principled-implementation

Each plane is carried from its named frame into kernel coordinates and the rail is the child's skin on their common kept region (`AutoMovieConstructionSkinCut`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Frame, planes, then the cut.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero normal and every refusal of the cut are returned with the child's name.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The cut's own cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One cut per child coordinates no shared work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the caller-owned cut.

# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.derive

## @evidence contracts/development/implementation.md#principled-implementation

Sections, composition, the ring's crossings with each seam plane by sign change and bisection, then the offset wedge's cut of each child.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four steps in the order their results are needed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a section not admitted in the plane, every refusal of the composition, a seam plane that does not cross the ring twice, forks that do not nest and every refusal of a rail; no phase is authored or snapped. Two ring crossings between two of the ring's samples are not seen.

## @evidence contracts/development/common.md#meaningful-documentation

States each step and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

One terminal ring preparation supplies eight point samples per band column. Per seam, test signed distances of those same points, bisect the two crossings and read the valley from the children's bounded cuts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The terminal ring samples serve each seam bracket and the outline-distance check. Each seam plane serves its host forks and both neighbours' rails. The valley's position queries read that cut's admitted intersection without the station curve's derivatives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the caller-owned record; the sections are released.

# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.section

## @evidence contracts/development/implementation.md#principled-implementation

Existing SkinCut supplies actual station jets to the original ComposedEnd section.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Derive may borrow the exact prepared section after checking source, plane and count.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Supplies no alternate ring, plane offset or synthetic arc ownership.

## @evidence contracts/development/common.md#meaningful-documentation

States that the cut is bound to the plane and wall the composed split consumes. The parameters and the refusal string are left to the signature.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One skin cut, then the composed end's section of it. The record keeps the child, plane and count beside them, which are what `derive` compares before borrowing.

## @evidence contracts/development/implementation.md#efficient-algorithms

One skin cut at `count` samples and one section reading of it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the caller-owned record, which holds the cut and the section for as long as the caller keeps it.

# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.plane

## @evidence contracts/development/common.md#meaningful-documentation

States the conversion from metres in the declared frame to kernel millimetres, the unit normal and the null of a zero normal.

## @evidence contracts/development/implementation.md#principled-implementation

A declared plane's point and normal are components on the frame's unit axes. The point is scaled by `AutoMovieConstructionViews.SCALE` to millimetres and offset by the frame's origin; the normal is carried without the origin and made unit. A null frame reads the components as tree coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One carry closure serves the point and the normal; `cut` and `derive` both resolve their planes through this function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero normal returns null; no default direction is substituted. The only constant is the kernel's metre-to-millimetre scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure conversion coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record.

# src/geometry/construction/AutoMovieConstructionSplitCompose.ts#AutoMovieConstructionSplitCompose.forks

## @evidence contracts/development/common.md#meaningful-documentation

Names the ordered divider planes, the parent ring and the two directed crossing phases returned for each seam.

## @evidence contracts/development/implementation.md#principled-implementation

Classifies sampled ring points by the signed distance from each ordered divider plane. Refines sampled sign transitions on the actual ring by bisection, then unwraps the falling and rising phases around the preceding seam.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Samples establish brackets, the ring reader resolves each crossing, and the unwrapped phases express the required nesting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses sampled topology with other than one falling and one rising crossing or with a nonnested pair. Sampling must expose the crossing brackets.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans the ring samples once per plane and performs at most 200 bisection steps on each detected sign transition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the supplied ring sample coordinates across planes. Only brackets that show a sign change read additional ring points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The phase pairs are fresh. Plane distances and bracket scratch belong to the call.
