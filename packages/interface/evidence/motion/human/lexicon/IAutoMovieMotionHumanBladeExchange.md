# src/motion/human/lexicon/IAutoMovieMotionHumanBladeExchange.ts#IAutoMovieMotionHumanBladeExchange

## @evidence contracts/development/common.md#meaningful-documentation

Documents the exchange, phase anchors, prop subjects, stage marks, authored lead in film seconds and optional reply.

## @evidence contracts/development/design.md#principled-representation

Marks are restricted to fixed points in the canonical target frame or named points on set props. The cast and its distinct prop ids are checked by composeHumanBladeExchange; the performance resolves marks and held props.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface owns the cue and mark data used by composeHumanBladeExchange. Chains, timing, grips and target resolution use the existing authoring contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The input reuses the canonical target kinds and lets the author choose both marks. It carries no pose constants or body-specific parameters.
