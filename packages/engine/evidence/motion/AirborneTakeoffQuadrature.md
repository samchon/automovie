# src/motion/AirborneTakeoffQuadrature.ts#AirborneTakeoffQuadrature

## @evidence contracts/development/common.md#meaningful-documentation

States the nested Simpson rules, Richardson estimate, global criterion, failure and output-unit ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Uses adaptive Simpson with Richardson factor 15 and the triangle inequality. An explicitly separable nonnegative error measure admits component aggregates and current-weight maximum bounds; additional pairwise-sum roundoff is charged to that same output budget. Arbitrary callback measures retain the original full scan. Smoothness remains an estimator premise, not a continuous or final-flight certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One actual panel producer serves the original general measure loop or the explicitly decomposed aggregate loop. Both refine the actual current maximum using the same samples, midpoint and Simpson rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No frame grid, tolerance floor, guessed history or iteration cap replaces evaluation; a panel stops only where its error is below the floating-point resolution of the integral (Gander and Gautschi's test) or the budget is met, and an unresolved error at machine width throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

P leaves require 4P+1 actual integrand calls. Generic measures retain O(P squared times n) aggregation over refinement. A separable k-component measure updates O(D(n+k)) ancestor aggregates at tree depth D and selects by valid current-weight bounds, with O(Pk) worst-case search when bounds overlap. Actual end-to-end gain is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each child's endpoints and midpoint are the parent's actual samples, and its coarse Simpson value is the parent's computed half-panel value; no time quantization or cross-history memo is used.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only O(Pn) numeric leaf samples and estimates live during integration. They and the pure callback are released on return or throw; only the numeric result escapes, with no handle or global cache.
