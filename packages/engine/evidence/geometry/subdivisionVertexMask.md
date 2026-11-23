# src/geometry/subdivisionVertexMask.ts#subdivisionVertexMask

## @evidence contracts/development/implementation.md#principled-implementation

The smooth rule is Catmull and Clark (1978), the crease and corner rules are those of Hoppe et al. as used by DeRose, Kass and Truong (1998), and the transition weight is that paper's fractional-sharpness interpolation in OpenSubdiv's form; a smooth rule only arises at interior vertices, where edges and faces are equal in number.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rule selection and blending depend on sharpness alone, so one function serves the refinement of every level and the local ring iteration of the limit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No valence or geometry special case; a dart deliberately takes the smooth rule as the published rules prescribe.

## @evidence contracts/development/common.md#meaningful-documentation

States each rule with its weights, how the rule is chosen, the transition blend and its weight, and the sources.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the vertex valence: two passes over the sharpness to classify and at most two masks built and blended.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; callers keep the mask for every attribute of one vertex.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh mask and retains nothing.
