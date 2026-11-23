# src/motion/composition/IAutoMovieComposition.ts#IAutoMovieComposition

## @evidence contracts/development/common.md#meaningful-documentation

Describes film-clock sequence, parallel and anchor-aligned placement and borrowed tree ownership.

## @evidence contracts/development/design.md#principled-representation

The kind discriminant separates leaf, ordered sequence, common-start group and anchor-relative placement; the scheduler admits references and timing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the tree consumed by AutoMovieComposition builders and resolveAutoMovieSchedule, while action vocabulary stays in intent producers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each node carries only its own branch's fields; the tree carries no renderer or production implementation.

# src/motion/composition/IAutoMovieComposition.ts#IAutoMovieComposition.IIntent

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the leaf that gives one authored intent to the schedule law.

## @evidence contracts/development/design.md#principled-representation

The intent kind selects a single intent with no sibling ordering or anchor-placement fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieComposition.of wraps raw intents; AutoMovieSchedulePlace reads the retained intent reference.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A leaf reuses IAutoMovieIntent instead of copying its capability, parameters and cut alternatives.

# src/motion/composition/IAutoMovieComposition.ts#IAutoMovieComposition.ISequence

## @evidence contracts/development/common.md#meaningful-documentation

States declaration-order placement and empty-sequence timing.

## @evidence contracts/development/design.md#principled-representation

A readonly list of children has sequential end-to-start semantics; the wrapper is not recursively frozen.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieComposition.sequence constructs this node and resolveAutoMovieSchedule advances its cursor through the children.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sequence branch cannot also supply parallel or anchor placement data.

# src/motion/composition/IAutoMovieComposition.ts#IAutoMovieComposition.IParallel

## @evidence contracts/development/common.md#meaningful-documentation

States common-start placement and latest-end duration, including empty groups.

## @evidence contracts/development/design.md#principled-representation

A readonly child list preserves declaration order for dependency lookup while sharing the inherited start time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieComposition.parallel constructs the node; the scheduler computes the maximum child end.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Parallelism is explicit in kind rather than inferred from equal numeric timestamps.

# src/motion/composition/IAutoMovieComposition.ts#IAutoMovieComposition.IAt

## @evidence contracts/development/common.md#meaningful-documentation

Documents anchor choice, signed second offset and default event occurrence and alignment behavior.

## @evidence contracts/development/design.md#principled-representation

The scheduler resolves only earlier anchors or law cue tracks; index without event and unresolved references throw, while offset finiteness remains caller-owned.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieComposition.at builds this placement; AutoMovieSchedulePlace and the optional align law determine its start.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

event, index and align refine placement; the remaining meaningless index-without-event combination is admitted by the type and rejected at runtime.

# src/motion/composition/IAutoMovieComposition.ts#IAutoMovieComposition.Part

## @evidence contracts/development/common.md#meaningful-documentation

Explains the three inputs accepted by composition builders and reference unwrapping.

## @evidence contracts/development/design.md#principled-representation

A union accepts an existing tree, raw intent or readonly node holder; of checks node before kind and otherwise wraps the intent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieComposition.of is the shared normalization used by composition builders and AutoMovieChain.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The node holder exposes only the tree, allowing chain implementations without coupling interface to a runtime class.
