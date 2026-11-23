# src/production/IAutoMovieShotReviewFrame.ts#IAutoMovieShotReviewFrame

## @evidence contracts/development/design.md#principled-representation

realizeShotContract adds these times to opening and closing camera samples, deduplicates and sorts them. In-shot frame-grid times and nonempty unique passes are caller premises; the production design/review/capture gate is retired and the numeric realization does not consume passes or prove a captured image was observed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A stable review id, time and pass list specify visual evidence without embedding PNG bytes or mixing the review request with a capture receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Declaring a frame does not prove capture or reviewer observation; exact current bundle identity and actual media checks remain required for its evidence.

## @evidence contracts/development/common.md#meaningful-documentation

Defines stable review-frame identity, shot-local second/frame-grid timing and the nonempty unique pass list.
