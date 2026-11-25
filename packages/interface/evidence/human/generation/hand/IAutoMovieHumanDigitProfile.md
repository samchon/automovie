# src/human/generation/hand/IAutoMovieHumanDigitProfile.ts#IAutoMovieHumanDigitProfile.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The digit's base section and its loci along the line, mm.

## @evidence contracts/development/design.md#principled-representation `base`: The digit's own section at an arc length along the line: half width, palmar and dorsal depths. `root`: Arc length of the digit's root, where its own sections start. `joints`: Arc lengths of the two distal joints (PIP and DIP, or the thumb's MCP and IP).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitProfile.windows, AutoMovieHumanDigitProfile.creasesOf, AutoMovieHumanDigitProfile.plateOf. Also types AutoMovieHumanHandDigitBones.profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `base`, `root`, `joints`, `length`, `cap`, `softness`, `thumb`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanDigitProfile.ts#IAutoMovieHumanDigitProfile.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

A relief's window along the line.

## @evidence contracts/development/design.md#principled-representation `at`: Arc length of the window's centre, mm. `half`: Half width of the window along the line, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanDigitProfile.windows. Read by AutoMovieHumanDigitStations.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `half`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanDigitProfile.ts#IAutoMovieHumanDigitProfile.SpanRoot

## @evidence contracts/development/common.md#meaningful-documentation

A finger's base section from the span law, scaled to its root section.

## @evidence contracts/development/design.md#principled-representation

A finger's base section from the span law, scaled to its root section. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitProfile.SpanRoot is the canonical exchange used by AutoMovieHumanDigitProfile.span.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanDigitProfile.span for a finger's base section from the span law, scaled to its root section.

# src/human/generation/hand/IAutoMovieHumanDigitProfile.ts#IAutoMovieHumanDigitProfile.SpanStations

## @evidence contracts/development/common.md#meaningful-documentation

A finger's base section from the span law, scaled to its root section.

## @evidence contracts/development/design.md#principled-representation

A finger's base section from the span law, scaled to its root section. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitProfile.SpanStations is the canonical exchange used by AutoMovieHumanDigitProfile.span.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanDigitProfile.span for a finger's base section from the span law, scaled to its root section.

# src/human/generation/hand/IAutoMovieHumanDigitProfile.ts#IAutoMovieHumanDigitProfile.SpanResult

## @evidence contracts/development/common.md#meaningful-documentation

A finger's base section from the span law, scaled to its root section.

## @evidence contracts/development/design.md#principled-representation

A finger's base section from the span law, scaled to its root section. The callable takes s and returns [number, number, number].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitProfile.SpanResult is the canonical exchange used by AutoMovieHumanDigitProfile.span.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanDigitProfile.span for a finger's base section from the span law, scaled to its root section.

# src/human/generation/hand/IAutoMovieHumanDigitProfile.ts#IAutoMovieHumanDigitProfile.INailResult

## @evidence contracts/development/common.md#meaningful-documentation

The nail plate's window along the line: its root, its free edge at the cap's start, and its width, the window the skin's nail part takes on the digit's chain.

## @evidence contracts/development/design.md#principled-representation `root`: Proximal nail-plate station along the digit's centre line, millimetres. `edge`: Free nail edge at the distal cap's start, millimetres along the digit's centre line. `width`: Nail plate's full transverse width, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitProfile.INailResult is the canonical exchange used by AutoMovieHumanDigitProfile.nail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `root`, `edge`, `width`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanDigitProfile.ts#IAutoMovieHumanDigitProfile.OfResult

## @evidence contracts/development/common.md#meaningful-documentation

The section shape at every arc length.

## @evidence contracts/development/design.md#principled-representation

The section shape at every arc length. The callable takes s and returns IAutoMovieHumanDigitSection.IShape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitProfile.OfResult is the canonical exchange used by AutoMovieHumanDigitProfile.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanDigitProfile.of for the section shape at every arc length.
