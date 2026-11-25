# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.ISource

## @evidence contracts/development/design.md#principled-representation

Native curve records own geometry while cardinal derivative tables depend only on increasing interpolation coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Coordinates, native curves and two derivative tables completely describe the candidate without identity registration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Equal-value structured/JSON copies preserve geometry; inputs and prepared records must remain immutable after preparation.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its coordinate, physical length or derivative meaning.

# src/construction/IAutoMovieLoftPhaseSource.ts#IAutoMovieLoftPhaseSource.IStation

## @evidence contracts/development/design.md#principled-representation

Three weight rows evaluate value and first/second chosen-coordinate derivatives of the same interpolant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One source reference and three numeric rows separate reusable station preparation from phase evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A supplied finite change of coordinate reexpresses both derivative orders; no finite singular-pole derivative is fabricated.

## @evidence contracts/development/common.md#meaningful-documentation

Rows specify derivative order and source/physical-coordinate units.
