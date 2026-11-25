# src/human/generation/hand/IAutoMovieHumanDigitCrease.ts#IAutoMovieHumanDigitCrease.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A crease's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `at`: Arc length of the crease along the digit's line, mm. `palmar`: The palmar depth of the section there, mm. `radius`: The nearest joint's radius, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanDigitProfile.creasesOf. Read by AutoMovieHumanDigitCrease.depth. Also types AutoMovieHumanDigitProfile.creases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `at`, `palmar`, `radius`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanDigitCrease.ts#IAutoMovieHumanDigitCrease.LociJoints

## @evidence contracts/development/common.md#meaningful-documentation

Readonly MCP, PIP and DIP arclengths along the finger from its root, in millimetres. The crease law consumes the three anatomical joints in that order.

## @evidence contracts/development/design.md#principled-representation

Readonly MCP, PIP and DIP arclengths along the finger from its root, in millimetres. The crease law consumes the three anatomical joints in that order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitCrease.LociJoints is the canonical exchange used by AutoMovieHumanDigitCrease.loci.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanDigitCrease input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/hand/IAutoMovieHumanDigitCrease.ts#IAutoMovieHumanDigitCrease.LociResult

## @evidence contracts/development/common.md#meaningful-documentation

Four finger crease arclengths in millimetres, distal first, derived from the input joint stations by the documented Bridgman rule.

## @evidence contracts/development/design.md#principled-representation

Four finger crease arclengths in millimetres, distal first, derived from the input joint stations by the documented Bridgman rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanDigitCrease.LociResult is the canonical exchange used by AutoMovieHumanDigitCrease.loci.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanDigitCrease input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
