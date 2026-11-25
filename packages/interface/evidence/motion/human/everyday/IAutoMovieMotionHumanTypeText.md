# src/motion/human/everyday/IAutoMovieMotionHumanTypeText.ts#IAutoMovieMotionHumanTypeText.IParams

## @evidence contracts/development/common.md#meaningful-documentation

keyboard: The keyboard's prop subject: its `homeRow` affordance is the home row's middle and its `keys` the key field, the typist on its `+Z` side (`createKeyboard`'s contacts). text: The text, of keys the layout has (letters and spaces).

## @evidence contracts/development/design.md#principled-representation

keyboard: The keyboard's prop subject: its `homeRow` affordance is the home row's middle and its `keys` the key field, the typist on its `+Z` side (`createKeyboard`'s contacts). text: The text, of keys the layout has (letters and spaces).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.typeText, params); everyday/typeText.ts (typeText.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanChainManual.typeText.

# src/motion/human/everyday/IAutoMovieMotionHumanTypeText.ts#IAutoMovieMotionHumanTypeText.IBoard

## @evidence contracts/development/common.md#meaningful-documentation

at: The home row's middle, world metres. yaw: The heading the typist faces, degrees about +Y.

## @evidence contracts/development/design.md#principled-representation

at: The home row's middle, world metres. yaw: The heading the typist faces, degrees about +Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/typeText.ts (typeText.board, return); everyday/typeText.ts (typeText.plan); executable/cases/everydayTypeCases.ts (everydayTypeCases); handling/manipulate.ts (typed).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/everyday/IAutoMovieMotionHumanTypeText.ts#IAutoMovieMotionHumanTypeText.IKeyResult

## @evidence contracts/development/common.md#meaningful-documentation

at: Key centre in keyboard-local metres: +X toward the user's left, +Z away, home-row middle at the origin.

## @evidence contracts/development/design.md#principled-representation

at: Key centre in keyboard-local metres: +X toward the user's left, +Z away, home-row middle at the origin.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/typeText.ts (typeText.key, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
