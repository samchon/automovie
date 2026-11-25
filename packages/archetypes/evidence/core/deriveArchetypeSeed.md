# src/core/deriveArchetypeSeed.ts#deriveArchetypeSeed

## @evidence contracts/development/common.md#meaningful-documentation

States which parts it seeds, the hash it reads, why 52 bits, the ids' rule and the result's range.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's `deriveAutoMovieSeed`, the 64-bit FNV-1a hash (Fowler, Noll and Vo) of the parent seed's decimal text and the ids, each followed by a 0xff byte; its first 13 hexadecimal digits are its top 52 bits, parsed as an integer, which a double represents exactly. A parent seed is any finite number, whose decimal text is its one `String` form, so equal seeds give equal parts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression, shared by every producer that seeds a part under a parent (the environment's occurrences, a building's door leaves and the furnishing kits' pieces), so they derive alike.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant is tuned: 13 digits is the widest whole-digit read below 2^53, and the hash is the engine's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bytes of the seed text and ids, one hash and one parse per part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each part's seed is derived once by the producer that seeds it; nothing is shared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns a number.