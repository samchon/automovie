# src/film/propSupportFace.ts#propSupportFace

## @evidence contracts/development/implementation.md#principled-implementation

A patch keeps its authored footprint and surface record, so the face is the region the author drew; a stack-top is mapped through the composed affine matrix with `Matrix4.transformPoint`, hulled with Andrew's monotone chain, and given the plane through the transformed origin whose normal is the cross product of the images of local `+X` and `+Z`, the exact image of a planar top under an affine map; the edge-on test compares the normal's vertical component with its own length, so it does not depend on the staged size.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolver for both target kinds returning the shared `IAutoMoviePropSupportFace`, so `propSupportGap` measures a patch and a prop top the same way; the host's staged matrix comes from `setPieceMatrix` rather than a private restatement of its defaults.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No environment, prop or affordance is special-cased; the stated unresolved and degenerate cases answer null instead of a substituted face, but extreme affine/cross-product overflow is not gated and can produce non-finite coefficients, and first-match lookup is the rule shared with `propAnchorFrame`.

## @evidence contracts/development/common.md#meaningful-documentation

States what each target kind resolves to, every `null` case and why the edge-on top is one, the units, and the first-match lookup rule with the validator that refuses duplicates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear first-match scans of the cited environments, surfaces, props, set and affordances; a patch decomposes its footprint to prove area, and a stack-top pays O(c log c) to hull its c corners. Resolving R relations repeats these lookup and geometry costs R times; this helper imposes no small relation-count bound.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolves one relation per call and caches nothing; the caller measures the face immediately and drops it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; a patch face references the authored surface record as its height rule, and a prop face owns a fresh ring and plane rule, both released with the caller's measurement.
