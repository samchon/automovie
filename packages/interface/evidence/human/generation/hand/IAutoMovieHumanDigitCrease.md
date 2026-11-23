# src/human/generation/hand/IAutoMovieHumanDigitCrease.ts#IAutoMovieHumanDigitCrease

## @evidence contracts/development/common.md#meaningful-documentation

Describes crease placement inputs and ordered joint-to-crease arclength tuples in millimetres; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Crease placement inputs and ordered joint-to-crease arclength tuples in millimetres. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanDigitCrease; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing DigitCrease contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

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
