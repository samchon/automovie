# src/human/generation/head/IAutoMovieHumanHeadMassPart.ts#IAutoMovieHumanHeadMassPart

## @evidence contracts/development/common.md#meaningful-documentation

A constructed sagittal cervical point expressed as forward position and height in millimetres. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only CervicalResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

CervicalResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanHeadMassPart exchanges the named CervicalResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/head/IAutoMovieHumanHeadMassPart.ts#IAutoMovieHumanHeadMassPart.CervicalResult

## @evidence contracts/development/common.md#meaningful-documentation

Clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1.

## @evidence contracts/development/design.md#principled-representation

Clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadMassPart.CervicalResult is the canonical exchange used by AutoMovieHumanHeadMassPart.cervical.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadMassPart.cervical for clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1.
