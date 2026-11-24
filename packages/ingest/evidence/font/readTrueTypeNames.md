# src/font/readTrueTypeNames.ts#readTrueTypeNames

## @evidence contracts/development/implementation.md#principled-implementation

Reads name IDs 1, 13 and 14 from the `name` table records (ISO/IEC 14496-22 section 5.2.6), decoding UTF-16BE for Windows Unicode and Unicode-platform records and ASCII-only Macintosh Roman, ranked US English Windows first.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns descriptive names only; licence comparison belongs to review.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A Mac Roman record with bytes above 0x7F is skipped rather than decoded as Latin-1, so a licence text is never misstated.

## @evidence contracts/development/common.md#meaningful-documentation

States the IDs read, the platform preference, the encoding rules and that nothing is judged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the name records and the bytes of the three selected IDs' strings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per decode.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns three owned strings or nulls; retains nothing.
