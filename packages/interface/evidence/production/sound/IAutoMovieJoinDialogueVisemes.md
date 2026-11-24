# src/production/sound/IAutoMovieJoinDialogueVisemes.ts#IAutoMovieJoinDialogueVisemes

## @evidence contracts/development/common.md#meaningful-documentation

Names the inputs of the viseme join.

## @evidence contracts/development/design.md#principled-representation

A namespace of the join inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the contract engine's `joinAutoMovieDialogueVisemes` exposes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member is declared on the namespace itself.

# src/production/sound/IAutoMovieJoinDialogueVisemes.ts#IAutoMovieJoinDialogueVisemes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the placement formula, the outcomes and every refusal; each member states its role and unit.

## @evidence contracts/development/design.md#principled-representation

The line, the bindings, the timed visemes, the line's model-native rate and sample count, and the plan clock, which together put source samples on the frames the mix and the speech span use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the join; render's mouth plan and the tests supply them, the count and rate from the admitted receipt and the clock from the film.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The source count and the clock are explicit rather than inferred from the line span, which is rounded up to a whole frame; the clock reuses the sound plan's own members.
