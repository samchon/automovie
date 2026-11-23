# src/posture/HumanQuadraticRow.ts#HumanQuadraticRow

## @evidence contracts/development/implementation.md#principled-implementation

Accumulates the symmetric weighted row outer product in the stored upper band, including all cross products of duplicate variable indices.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one weighted scatter and exceptional original-zero path for Band.factor/polish; Preparation owns admission and FactorOrder owns optional stable factor-only positions, leaving all row dot products unchanged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves accumulation order, (w*coef[a])*coef[b] association and unsorted fallback; Admission already checks every original index and span, so assembly does not repeat band admission per pair. Overflowing first products restore original zero b terms rather than hiding nonfinite propagation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Finite rows cost O(k squared) worst-case with O(1) local storage; original or factor-only ordered positions avoid visiting lower pairs. Metadata is prepared once per topology, while exceptional weighted products may restore/scan H original b entries, bounded by O(H squared).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses exact singleton/column-order metadata tied to admitted original CSR topology, including stable duplicate order; every current weighted product recomputes, and exceptional coefficients borrow only the owning unchanged raw layout.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Normal calls allocate nothing and mutate only the owned system; exceptional restoration belongs to its one-shot wrapper or fixed-model owner, without entering prepared core, body state or public iterates.

## @evidence contracts/development/common.md#meaningful-documentation

Defines both system consumers, weighted products, per-cell duplicate/order equivalence, admitted-band premise and original exceptional traversal.
