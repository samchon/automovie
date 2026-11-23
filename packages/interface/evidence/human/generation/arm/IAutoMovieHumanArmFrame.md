# src/human/generation/arm/IAutoMovieHumanArmFrame.ts#IAutoMovieHumanArmFrame

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanArmFrame exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IInput, IOutput. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanArmFrame; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IInput, IOutput contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/arm/IAutoMovieHumanArmFrame.ts#IAutoMovieHumanArmFrame.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Original placement/control inputs; no completed source or neighbouring part is required.

## @evidence contracts/development/design.md#principled-representation `name`: Side-qualified original owner name. `bones`: Neutral GH, elbow and wrist datums in calibration mm. `knuckle`: Actual third metacarpal head, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmFrame.create. Also types AutoMovieHumanArmFrame.{ name, bones, knuckle, reach, sites, joints, gap, crease, radial, order, }.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `crease`: Optional palmar crease locus, calibration mm. `radial`: Optional signed across-hand direction defining the material roll.

# src/human/generation/arm/IAutoMovieHumanArmFrame.ts#IAutoMovieHumanArmFrame.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Common axis/site chart before any native girth solve, scalar curve or loft.

## @evidence contracts/development/design.md#principled-representation `source`: Pure jointed axis, site stations, source pole and original frame mapping. `run`: Proximal support distance inside the shoulder girdle, calibration mm. `humerus`: Actual rigid GH-to-elbow distance, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmFrame.create. Read by AutoMovieHumanArmHandControls.create. Also types AutoMovieHumanArmSources.frame, AutoMovieHumanArmSources.value.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `source`, `run`, `humerus`; callers supply the complete record.
