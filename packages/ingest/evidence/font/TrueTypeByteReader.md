# src/font/TrueTypeByteReader.ts#TrueTypeByteReader

## @evidence contracts/development/design.md#principled-representation

Represents one borrowed font byte array with big-endian typed reads, the representation ISO/IEC 14496-22 fixes for every field; the invariant that a read stays inside the bytes is enforced at runtime by each method, since offsets come from the untrusted bytes themselves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ingest font decoder owns it and its table readers consume it; it exposes only the integer widths and the tag those readers use, plus the explicit span check for tables and arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No unchecked read, clamped offset or default value hides a malformed span; the class serves every table reader rather than one table.

## @evidence contracts/development/common.md#meaningful-documentation

States the byte order, the borrowed ownership, and that every refusal names the table it served.

# src/font/TrueTypeByteReader.ts#TrueTypeByteReader.prototype.require

## @evidence contracts/development/implementation.md#principled-implementation

Compares the span with the byte length using safe-integer arithmetic, so no read proceeds past the buffer and a span from an untrusted offset is refused naming its table.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounds check and one DataView read; table meaning stays with the table readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-range span throws instead of returning a default or a truncated value.

## @evidence contracts/development/common.md#meaningful-documentation

States the field type read, its byte order and the refusal naming the table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; no copy of the bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single field read leaves nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the returned number or short string; the reader keeps only its borrowed view.

# src/font/TrueTypeByteReader.ts#TrueTypeByteReader.prototype.u8

## @evidence contracts/development/implementation.md#principled-implementation

Checks the one-byte span, then reads it through the DataView as the format's uint8.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounds check and one DataView read; table meaning stays with the table readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-range span throws instead of returning a default or a truncated value.

## @evidence contracts/development/common.md#meaningful-documentation

States the field type read, its byte order and the refusal naming the table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; no copy of the bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single field read leaves nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the returned number or short string; the reader keeps only its borrowed view.

# src/font/TrueTypeByteReader.ts#TrueTypeByteReader.prototype.i8

## @evidence contracts/development/implementation.md#principled-implementation

Checks the one-byte span, then reads it through the DataView as the format's int8, used by short composite offsets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounds check and one DataView read; table meaning stays with the table readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-range span throws instead of returning a default or a truncated value.

## @evidence contracts/development/common.md#meaningful-documentation

States the field type read, its byte order and the refusal naming the table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; no copy of the bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single field read leaves nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the returned number or short string; the reader keeps only its borrowed view.

# src/font/TrueTypeByteReader.ts#TrueTypeByteReader.prototype.u16

## @evidence contracts/development/implementation.md#principled-implementation

Checks the two-byte span, then reads big-endian uint16 as every OFF table stores it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounds check and one DataView read; table meaning stays with the table readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-range span throws instead of returning a default or a truncated value.

## @evidence contracts/development/common.md#meaningful-documentation

States the field type read, its byte order and the refusal naming the table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; no copy of the bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single field read leaves nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the returned number or short string; the reader keeps only its borrowed view.

# src/font/TrueTypeByteReader.ts#TrueTypeByteReader.prototype.i16

## @evidence contracts/development/implementation.md#principled-implementation

Checks the two-byte span, then reads big-endian int16, the FWORD and coordinate type.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounds check and one DataView read; table meaning stays with the table readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-range span throws instead of returning a default or a truncated value.

## @evidence contracts/development/common.md#meaningful-documentation

States the field type read, its byte order and the refusal naming the table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; no copy of the bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single field read leaves nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the returned number or short string; the reader keeps only its borrowed view.

# src/font/TrueTypeByteReader.ts#TrueTypeByteReader.prototype.u32

## @evidence contracts/development/implementation.md#principled-implementation

Checks the four-byte span, then reads big-endian uint32, the Offset32 and version type.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounds check and one DataView read; table meaning stays with the table readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-range span throws instead of returning a default or a truncated value.

## @evidence contracts/development/common.md#meaningful-documentation

States the field type read, its byte order and the refusal naming the table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; no copy of the bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single field read leaves nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the returned number or short string; the reader keeps only its borrowed view.

# src/font/TrueTypeByteReader.ts#TrueTypeByteReader.prototype.tag

## @evidence contracts/development/implementation.md#principled-implementation

Checks the four-byte span, then reads the Tag as four ASCII bytes, the form of table names and sfnt version tags.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bounds check and one DataView read; table meaning stays with the table readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An out-of-range span throws instead of returning a default or a truncated value.

## @evidence contracts/development/common.md#meaningful-documentation

States the field type read, its byte order and the refusal naming the table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call; no copy of the bytes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single field read leaves nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing beyond the returned number or short string; the reader keeps only its borrowed view.
