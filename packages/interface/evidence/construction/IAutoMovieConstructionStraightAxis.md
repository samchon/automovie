# src/construction/IAutoMovieConstructionStraightAxis.ts#IAutoMovieConstructionStraightAxis

## @evidence contracts/development/design.md#principled-representation

A part straight in its bone frame at its neutral pose has one plane moved along one direction, so every station's plane follows from the first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An origin and two axes fix the whole frame; the station direction is their product, not a third field that could disagree.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Non-unit or non-square axes are refused rather than normalised, since a silent fix would move every outline.

## @evidence contracts/development/common.md#meaningful-documentation

States the station direction, the metre origin and the axes' admission.
