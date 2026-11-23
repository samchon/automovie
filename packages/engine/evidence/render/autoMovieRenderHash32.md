# src/render/autoMovieRenderHash32.ts#autoMovieRenderHash32

## @evidence contracts/development/implementation.md#principled-implementation

FNV-1a starts at 0x811c9dc5, XORs each UTF-8 byte and multiplies modulo 2^32 by 16777619 using shifts plus the original hash term. Palette probing, not hash collision freedom, establishes unique semantic colors.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fast palette-placement hash is separate from cryptographic render digests; utf8Bytes owns the shared string-to-byte convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The multiplier is the actual FNV prime for every string; the omitted original-hash addend was corrected, so rederived palette colors/digests change and consumers comparing current mask identity require new evidence. The verifier still checks a supplied mask's own complete payload rather than rederiving its colors.

## @evidence contracts/development/common.md#meaningful-documentation

Docs distinguish noncryptographic 32-bit palette placement from SHA identity; the test independently multiplies Buffer UTF-8 bytes with Math.imul.

## @evidence contracts/development/implementation.md#efficient-algorithms

B bytes require O(B) constant arithmetic and O(B) encoded temporary storage; no collision search occurs in this function.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Digest and palette owners share UTF-8 encoding, while the hash value is recomputed per semantic id without a persistent identity cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one number escapes; the encoded bytes become collectable and no palette registry or native resource is retained.
