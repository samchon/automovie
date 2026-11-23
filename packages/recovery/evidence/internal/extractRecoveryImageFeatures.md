# src/internal/extractRecoveryImageFeatures.ts#extractRecoveryImageFeatures

## @evidence contracts/development/implementation.md#principled-implementation

Harmonic Harris response and negative-definite quadratic refinement locate corners; robust ANMS spreads retained positions in the original chart. Average blurred-gradient orientation and a bounded gradient histogram permit local appearance comparison without matching sliding silhouettes. Detector scale and orientation are approximate under perspective distortion, and repeated or hidden texture remains unresolved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One image owns its Gaussian pyramid, candidate admission and spatial selection; the separate convolution owner supplies all derivatives with one boundary convention. A selected point with an unobservable descriptor is omitted explicitly rather than repaired or given a fabricated match.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No mask, object-specific region, manual point, learned descriptor or expected camera controls detection. Only actual gradient-window support is required; an unused intensity-patch descriptor does not gate this gradient method.

## @evidence contracts/development/common.md#meaningful-documentation

States published scale/orientation premises, experimental descriptor dimensions, original pixel chart, candidate and output populations and the limits of local features.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P pyramid pixels, C admitted candidates and F selected features, fixed-radius separable filters cost O(P), robust ANMS O(C^2), sorting O(C log C) and bounded histogram samples O(F). Explicit pixel/candidate/feature limits bound the intended small-image workload; no dense all-pixel descriptor table is retained.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each level's first derivatives supply both its Harris moments and selected gradient descriptors. Orientation derivatives and integrated moments are computed once per level; completed image features can be reused by the pair owner without rescanning RGB.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous call owns O(P+C+128F) arrays under admitted capture budgets. Only selected points and descriptors transfer to the pair owner; pyramid/moment/candidate arrays become unreachable on return or throw and no image, handle or cache persists globally.
