# src/motion/human/ensemble/IAutoMovieMotionHumanEnsemblePreset.ts#IAutoMovieMotionHumanEnsemblePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what a preset holds. Contracts used by HumanEnsembleMembers.resolve, HUMAN_ENSEMBLE_PRESETS.

## @evidence contracts/development/design.md#principled-representation

A distribution per attribute and one for proficiency. Closed choices "elite", "line", "militia", "rabble", "civilians" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record `HumanEnsemble.of` reads, and the preset names. Runtime boundary references: ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve); ensemble/HUMAN_ENSEMBLE_PRESETS.ts (HUMAN_ENSEMBLE_PRESETS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union of names, so an unknown preset is a type error. The admitted literal values are declared here directly; runtime handling remains in HumanEnsembleMembers.resolve.

# src/motion/human/ensemble/IAutoMovieMotionHumanEnsemblePreset.ts#IAutoMovieMotionHumanEnsemblePreset.Name

## @evidence contracts/development/common.md#meaningful-documentation

The preset names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "elite", "line", "militia", "rabble", "civilians" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HUMAN_ENSEMBLE_PRESETS.ts (HUMAN_ENSEMBLE_PRESETS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HUMAN_ENSEMBLE_PRESETS.
