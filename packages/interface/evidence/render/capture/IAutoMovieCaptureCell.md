# src/render/capture/IAutoMovieCaptureCell.ts#IAutoMovieCaptureCell

## @evidence contracts/development/design.md#principled-representation

The four values that fix a still, plus the complete inspection request they resolve to, so the draw function needs no other input and a later round pairs cells by the same values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The view stays the request's view text, read by the inspection core's view grammar; the request is the inspection core's own type. `index`, `name`, `label` and `caption` are read by the sheet and the record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `request.shade` equals `pass` and `request.parts` equals `selection.parts`, kept equal by the planner; the cell names no subject kind.

## @evidence contracts/development/common.md#meaningful-documentation

States what fixes the cell, who reads it and how its members relate.
