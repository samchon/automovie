# src/production/IAutoMovieShotStoryTime.ts#IAutoMovieShotStoryTime

## @evidence contracts/development/design.md#principled-representation

Story time is originSeconds plus local seconds times positive rate; finite admission and overflow checks let cross-shot events compare one physical story moment independently from edit order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two scalars express offset and rate without embedding the film timeline or copying a story clock into each event.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omitted rate explicitly means one, and no story pin is inferred from cut position; unpinned or non-finite operands cannot discharge a cross-shot synchronization claim.

## @evidence contracts/development/common.md#meaningful-documentation

Defines origin and rate units, default rate, affine formula and independence from finished-film ordering.
