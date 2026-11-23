# src/human/AutoMovieHumanActionUnit.ts#AutoMovieHumanActionUnit

## @evidence contracts/development/common.md#meaningful-documentation

A facial action unit of the Facial Action Coding System (FACS; Ekman and Friesen 1978), named by its action.

## @evidence contracts/development/design.md#principled-representation

Each string names one documented FACS muscle action; side and activation strength remain separate fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the vocabulary. ActionUnitActivation references this vocabulary; Expression carries those activations independently of clinical head pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Blink and wink use eyesClosed with side/timing; gross behavior and head/gaze pose are not invented facial-deformation alternatives.
