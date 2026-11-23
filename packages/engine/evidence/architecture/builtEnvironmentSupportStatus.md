# src/architecture/builtEnvironmentSupportStatus.ts#builtEnvironmentSupportStatus

## @evidence contracts/development/implementation.md#principled-implementation

The bearing gap is `propSupportGap`, the prop kernel's two-sided footprint probe, over a support face that is either the surface's footprint and height rule or the top of the drawn part nearest the subject's underside among those it stands over; the premise is axis-aligned part boxes, and the result is a visual placement check, not a load analysis, which the documentation states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Body resolution is the shared `resolveBuiltPlacementBody`, the gap is the shared prop kernel, the footprint test is `builtFootprintsOverlap`, and the default slack is one named constant shared with the sweep, so this function owns only the relation verdict and the bearing-part choice.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no element, population or surface; an invalid tolerance is refused rather than replaced by the default, and the bearing part is chosen by geometry rather than by part order or name.

## @evidence contracts/development/common.md#meaningful-documentation

States the delegated probe, the suspension rule, the tolerance refusal and default, both bases and how to read an origin-point verdict, how each support kind yields its face, and the meaning of `gap` and `unresolved`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays each selected body's resolution cost, then an O(P) bearing-part scan for a P-part support body. A surface support instead adds its surface lookup, footprint construction and convex decomposition. The final `propSupportGap` call adds polygon containment and height-rule sampling costs for every retained probe; those costs are not bounded by the support's part count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Judges one authored relation per call and retains no staging. Subject and support element resolutions each stage independently; `builtEnvironmentSupportSweep` shares staging for its separate nearest-bounds classification and does not replace authored relation checks.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the resolved boxes and face only for the call; the caller owns the returned verdict.
