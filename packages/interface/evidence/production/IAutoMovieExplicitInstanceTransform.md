# src/production/IAutoMovieExplicitInstanceTransform.ts#IAutoMovieExplicitInstanceTransform

## @evidence contracts/development/design.md#principled-representation

A stable entry id and anchor-relative TRS determine one exact placement; unit quaternion and positive scale preserve the transform domain, while optional prototype, visibility, palette and declared traits override the set's ordinary choices.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Required placement coordinates are separate from optional per-entry differences, so an explicit set can reuse its prototype table and default palette without repeating them on every member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing explicit prototype ids throw. Declared trait names, finite overrides, palette encoding and unit rotation are caller premises; instanceSlot merges explicit traits without enforcing their declared names or finiteness. Building admission checks transform coordinates, positive scale and quaternion norm within 1e-6, not those appearance and identity premises.

## @evidence contracts/development/common.md#meaningful-documentation

Gives set-scoped identity, anchor-relative metre translation, glTF quaternion order, positive scale and omission semantics for prototype, visibility, palette and numeric traits.
