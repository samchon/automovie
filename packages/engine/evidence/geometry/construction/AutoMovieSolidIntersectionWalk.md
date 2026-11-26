# src/geometry/construction/AutoMovieSolidIntersectionWalk.ts#AutoMovieSolidIntersectionWalk.create

## @evidence contracts/development/implementation.md#principled-implementation

Uses tangent-plane pseudo-arclength continuation. The same-face chart predictor scales the observed secant by the ratio of the new requested chord to the previous accepted world chord. Resampling the accepted loop at uniform accumulated chord distances supplies the periodic guide for the final intersection solve. Arc approximates exact arclength. [Patrikalakis, Maekawa and Cho, Section 5.8.2.3](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node109.html) · [Allgower and Georg, Chapter 6](https://doi.org/10.1137/1.9780898719154.ch6).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation returns the reference law and original start preimages for parameterized tracing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The walk retains the existing tangent orientation, halving limits and branch-distance checks. The guide supplies parameter planes and the final outputs still solve the owned input surfaces in their declared domains.

## @evidence contracts/development/common.md#meaningful-documentation

States mm chords, guide density, fixed continuation limits and the role of the compatibility argument.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C targets, each requested walk direction permits walkSteps times C steps with bounded failed halvings. Ordered sampling traverses the accepted points and the walkPoints times C guide positions once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the accepted adaptive route for both its length and periodic guide positions. Each new predictor reuses the preceding accepted same-face preimage and its physical distance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Walk arrays and iterates are local; the returned law owns its prepared reference controls and the result owns one start tuple, with no global cache or task.
