# src/production/IAutoMovieFormationReform.ts#IAutoMovieFormationReform

## @evidence contracts/development/design.md#principled-representation

Pairs the cue target with eased progress and optional previous completed layout; formationSlotPosition blends from that arrangement, or the design when absent, in local space before heading and terrain apply.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept beside the sampled motion state rather than inside the cue's `from` and `to` states, because a re-form belongs to the cue while both ends describe one unit in two places.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Holding progress at 1 after the cue is the sampler's documented retention rule so a re-formed unit does not snap back, not a correction aimed at any consumer.

## @evidence contracts/development/common.md#meaningful-documentation

States cue ownership, eased progress/retention and optional fromLayout's previous-completed-layout meaning; absence preserves the original design-to-target API.
