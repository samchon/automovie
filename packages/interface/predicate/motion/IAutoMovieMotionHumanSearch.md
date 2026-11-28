# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.BagSearch

## @evidence contracts/development/common.md#meaningful-documentation

The type identifies the found-item request and the explicit authored miss.

## @evidence contracts/development/design.md#principled-representation

Only the found form requires an item, a grip and a lift distance. The shared bag and hand identify the same search action in both cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union retains the existing found-item request and adds a single outcome literal for a miss. The action chain owns subsequent choices, including a retry.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.ISearchBag

## @evidence contracts/development/common.md#meaningful-documentation

The record names the open bag, the item inside it, the item's grip, lift distance in metres and the default right hand.

## @evidence contracts/development/design.md#principled-representation

The target bag and pickup item have distinct scene identities. The pickup uses a named item grip and the bag's floor-to-opening height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record supplies the written pickup and reuses the action chain's hand selector. The motion owners resolve contact and custody during playback.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.INoFind

## @evidence contracts/development/common.md#meaningful-documentation

The record describes a completed search without pickup. The literal selects this outcome before playback.

## @evidence contracts/development/design.md#principled-representation

The miss reuses the bag and hand fields and carries no invented item, grip or lift target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The author selects a bag and optional hand exactly as for a found-item request. The chain can continue afterward from the returned touch.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.ISearchBag.bag

## @evidence contracts/development/common.md#meaningful-documentation

The subject identifies the open bag whose interior the hand will search.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.ISearchBag.item

## @evidence contracts/development/common.md#meaningful-documentation

The subject identifies the item staged inside the bag for pickup.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.ISearchBag.handle

## @evidence contracts/development/common.md#meaningful-documentation

The named affordance belongs to the item and selects its actual pickup grip.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.ISearchBag.depth

## @evidence contracts/development/common.md#meaningful-documentation

The floor-to-opening height is the pickup's lift distance, measured in metres.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.ISearchBag.hand

## @evidence contracts/development/common.md#meaningful-documentation

This hand performs both the floor search and pickup. The right hand is the default.

# src/motion/IAutoMovieMotionHumanSearch.ts#IAutoMovieMotionHumanSearch.INoFind.type

## @evidence contracts/development/common.md#meaningful-documentation

The literal selects a search that finishes after rummaging with no pickup action.
