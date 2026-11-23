# src/motion/human/lexicon/IAutoMovieMotionHumanDrillRegulation.ts#IAutoMovieMotionHumanDrillRegulation

## @evidence contracts/development/common.md#meaningful-documentation

States what a row holds and its units. Contracts used by regulated, HUMAN_DRILL_CADENCES.

## @evidence contracts/development/design.md#principled-representation

Times in steps a minute by name, the pace in metres for a soldier whose hip stands 0.93 m high, scaled by the body's hip height as the march scales its step. Closed choices "british1792", "french1791", "us2021" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two quantities the march reads. Runtime boundary references: lexicon/HumanGait.ts (regulated); lexicon/HUMAN_DRILL_CADENCES.ts (HUMAN_DRILL_CADENCES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A time is named by the regulation's own word, never a speed. The admitted literal values are declared here directly; runtime handling remains in regulated.

# src/motion/human/lexicon/IAutoMovieMotionHumanDrillRegulation.ts#IAutoMovieMotionHumanDrillRegulation.Name

## @evidence contracts/development/common.md#meaningful-documentation

The regulations.

## @evidence contracts/development/design.md#principled-representation

Closed choices "british1792", "french1791", "us2021" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HUMAN_DRILL_CADENCES.ts (HUMAN_DRILL_CADENCES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HUMAN_DRILL_CADENCES.
