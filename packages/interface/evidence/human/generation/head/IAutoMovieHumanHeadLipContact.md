# src/human/generation/head/IAutoMovieHumanHeadLipContact.ts#IAutoMovieHumanHeadLipContact

## @evidence contracts/development/common.md#meaningful-documentation

Describes original lip-parent contact readings and nullable physical lateral derivatives; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Original lip-parent contact readings and nullable physical lateral derivatives. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanHeadLipContact; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing HeadLipContact contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/head/IAutoMovieHumanHeadLipContact.ts#IAutoMovieHumanHeadLipContact.IReading

## @evidence contracts/development/common.md#meaningful-documentation

One original forward point and its optional physical lateral derivatives.

## @evidence contracts/development/design.md#principled-representation `point`: Actual point in world mm. `forwardJet`: First and second forward derivatives per lateral mm; absent at a singular inverse.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadLipContact.IReading is the canonical exchange used by AutoMovieHumanHeadLipContact.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `forwardJet`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadLipContact.ts#IAutoMovieHumanHeadLipContact.ISection

## @evidence contracts/development/common.md#meaningful-documentation

A section value is valid independently of availability of its frame2.

## @evidence contracts/development/design.md#principled-representation `frame`: Actual midpoint and oriented secant axes, with parallel lateral planes. `jet`: Analytic derivatives in physical lateral mm, null at a singular border/corner. `resting`: Same original parent resting point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadLipPart.cachedSection, AutoMovieHumanHeadLipPart.section.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `jet`, `resting`, `border`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadLipContact.ts#IAutoMovieHumanHeadLipContact.FrameJet

## @evidence contracts/development/common.md#meaningful-documentation

The actual axis owner's nullable analytic frame2 result.

## @evidence contracts/development/design.md#principled-representation

The actual axis owner's nullable analytic frame2 result. ReturnType< NonNullable<IAutoMovieViewAxis.IAxis["jet"]> > retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadLipContact.differentiate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadLipContact.differentiate for the actual axis owner's nullable analytic frame2 result.

# src/human/generation/head/IAutoMovieHumanHeadLipContact.ts#IAutoMovieHumanHeadLipContact.IContact

## @evidence contracts/development/common.md#meaningful-documentation

One full native parent source, with explicit units and chart ownership.

## @evidence contracts/development/design.md#principled-representation `parent`: Identical original material parent. `source`: Complete original signed supports, effective fullness and cap laws. `frame`: Actual source plane at stomion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadLipContact.create. A distinct fixed level can prepare a reader over the same admitted original parent without repeating its scalar source admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The frame and all three contact capabilities use the same original parent. Preparing a level retains its section geometry, with every lateral query evaluated directly.
