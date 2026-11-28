# src/random/AutoMovieEngineRandom.ts#AutoMovieEngineRandom.createRandom

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the sixteen-digit seed, safe indexed reads, word and float outputs, stored lowercase seed and ordered child-stream IDs.

## @evidence contracts/development/implementation.md#principled-implementation

The two eight-digit seed halves supply the low and high key words. A nonnegative safe integer splits into its low 32 bits and the remaining counter bits, so every supported index addresses its own Philox block. The upper 27 and 26 bits of the first two words form a numerator below 2^53 for float.

## @evidence contracts/development/implementation.md#efficient-algorithms

The stream retains one seed and one key. Each block, uint32 or float read evaluates one fixed ten-round block at the requested index. Child streams derive a new key without advancing the parent.

# src/random/AutoMovieEngineRandom.ts#AutoMovieEngineRandom.deriveSeed

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies the ordered film and ID fields, UTF-8, the separator including after an empty field, and the sixteen-digit result.

## @evidence contracts/development/implementation.md#principled-implementation

The same FNV-1a byte hash processes the UTF-8 field order and one 0xff delimiter after each field. An internal chunk boundary moves before a high surrogate, so a supplementary code point keeps both units in one encoding call. The delimiter lies outside valid UTF-8 bytes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass encodes and hashes the supplied text in chunks of up to 4,096 UTF-16 code units. The encoding buffer is bounded per chunk and the FNV state retains two words. The generator yields each separator without a concatenated byte array.

# src/random/AutoMovieEngineRandom.ts#AutoMovieEngineRandom.hashFnv1a64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the byte iterable, low-eight-bit conversion, lowercase fixed-width digest and result for an empty iterable.

## @evidence contracts/development/implementation.md#principled-implementation

The hash starts at the FNV offset basis, XORs each masked byte into its low word and multiplies modulo 2^64 by the FNV prime. The low product with 0x1b3 is exact in a binary64 number. Carry and the prime's 2^40 term supply the high word.

## @evidence contracts/development/implementation.md#efficient-algorithms

The iterator is consumed once. The operation retains two state words and formats two fixed-width hexadecimal pieces at the end.

# src/random/AutoMovieEngineRandom.ts#AutoMovieEngineRandom.philox4x32

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies counter order, two key words, unsigned input conversion and four deterministic output words.

## @evidence contracts/development/implementation.md#principled-implementation

Ten rounds multiply two counter words by the Philox odd multipliers, retain high and low halves and mix with the remaining words and Weyl-advanced keys. Sixteen-bit product limbs keep each partial sum exact, and unsigned conversion applies the intended word size.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work is fixed at ten rounds for a fixed-size counter and key. Input words are copied into local scalars and the result is a new four-word tuple.
