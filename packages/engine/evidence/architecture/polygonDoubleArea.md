# src/architecture/polygonDoubleArea.ts#polygonDoubleArea

## @evidence contracts/development/implementation.md#principled-implementation

The shoelace formula, the sum of the cross products of consecutive corners, which equals twice the signed area of any simple ring and the winding-weighted sum for a self-crossing one, as documented.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One signed-area helper read by building validation, opening area and boundary-shell triangulation, so orientation and degeneracy are judged by one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ring or caller is special-cased; the empty ring yields the empty sum, and degeneracy decisions use the caller's tolerance on the computed sum rather than an exact-area claim.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the closure convention, units, orientation sign and axis convention, why the value is doubled, and the empty and self-crossing cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the n corners, O(n) time and O(1) space, which is the minimum for a sum over every edge.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure sum over one ring; validation, opening area and shell triangulation each compute it once per outline they hold.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps a running sum and a loop index and allocates nothing, so nothing outlives the call.
