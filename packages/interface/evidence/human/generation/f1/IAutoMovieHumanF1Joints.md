# src/human/generation/f1/IAutoMovieHumanF1Joints.ts#IAutoMovieHumanF1Joints

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanF1Joints exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups TowardSegments. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanF1Joints; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the TowardSegments contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/f1/IAutoMovieHumanF1Joints.ts#IAutoMovieHumanF1Joints.TowardSegments

## @evidence contracts/development/common.md#meaningful-documentation

The point `length` millimetres past `from` along the mean of the unit directions of `segments`: where a limb's course runs on past its knuckles toward its digits.

## @evidence contracts/development/design.md#principled-representation

The point `length` millimetres past `from` along the mean of the unit directions of `segments`: where a limb's course runs on past its knuckles toward its digits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1Joints.TowardSegments is the canonical exchange used by AutoMovieHumanF1Joints.toward.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanF1Joints.toward for the point `length` millimetres past `from` along the mean of the unit directions of `segments`: where a limb's course runs on past its knuckles toward its digits.
