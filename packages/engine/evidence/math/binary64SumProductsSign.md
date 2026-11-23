# src/math/binary64SumProductsSign.ts#binary64SumProductsSign

## @evidence contracts/development/common.md#meaningful-documentation

States the exact dyadic input interpretation, product/sum shape and nonfinite refusal marker.

## @evidence contracts/development/implementation.md#principled-implementation

Every finite binary64 is an integer significand times a power of two. BigInt products are aligned at their smallest exponent and summed without rounding, so overflow, underflow and cancellation cannot reverse a certificate's sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Decode factors, retain one exact product per term, align products and read the total's sign.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No floating tolerance, clamped product, physical bound or guessed sign is used. Nonfinite factors return no certificate.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F factors and T products, decoding is O(F); BigInt multiplication and shifts depend on significand lengths and the exponent span. Storage is O(T) exact products, with no trajectory retained.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One synchronous arithmetic query has no repeated external computation to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The eight-byte decoder and BigInt products belong to one call and no input, cache, handle or task escapes.
