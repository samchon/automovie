# src/motion/human/next/IAutoMovieMotionHumanDress.ts#IAutoMovieMotionHumanDress

## @evidence contracts/development/design.md#principled-representation

One method per law of the Dress family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Dress laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

## @evidence contracts/development/common.md#meaningful-documentation

hand: The hand that holds it; the one the entry holds it in when absent, `right` if neither. point: Dressing contact point in world metres. surface: Hand surface placed on the item: palm for a hat, index tip for glasses.

# src/motion/human/next/IAutoMovieMotionHumanDress.ts#IAutoMovieMotionHumanDress.IDrawFromCarrier

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its default and what the staged pair holds.

## @evidence contracts/development/design.md#principled-representation

The staged record and the draw's own pull type, so the method reads the identities the staging derived and states none of its own.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, the ones `HumanSheath.draw` reads besides the chain and the anchor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member is optional or required as `HumanSheath.draw` takes it.

# src/motion/human/next/IAutoMovieMotionHumanDress.ts#IAutoMovieMotionHumanDress.IPutDownAperture

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its default.

## @evidence contracts/development/design.md#principled-representation

The staged record names the entry, the seat and the guide, so the return states no frame of its own.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, the ones `HumanSheath.sheathe` reads besides the chain and the anchor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the hand is optional as `HumanSheath.sheathe` takes it.

# src/motion/human/next/IAutoMovieMotionHumanDress.ts#IAutoMovieMotionHumanDress.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its default.

## @evidence contracts/development/design.md#principled-representation

A closed item, the held wearable, its hand and a manner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No hand place is typed.

# src/motion/human/next/IAutoMovieMotionHumanDress.ts#IAutoMovieMotionHumanDress.Item

## @evidence contracts/development/common.md#meaningful-documentation

A hand's place for an item on a posture, and the surface laid there. An item put on.

## @evidence contracts/development/design.md#principled-representation

Closed choices "hat", "glasses" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: dressing/dress.ts (dress.place, item); executable/cases/dressCases.ts (wearable, item); dressing/dress.ts (dress.WORN); dressing/dress.ts (dress.plan); executable/cases/dressCases.ts (WEAR).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in dress.place.

# src/motion/human/next/IAutoMovieMotionHumanDress.ts#IAutoMovieMotionHumanDress.IPlaceResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Dressing contact point in world metres. surface: Hand surface placed on the item: palm for a hat, index tip for glasses.

## @evidence contracts/development/design.md#principled-representation

point: Dressing contact point in world metres. surface: Hand surface placed on the item: palm for a hat, index tip for glasses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: dressing/dress.ts (dress.place, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanHand.Surface identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
