# src/motion/human/chain/IAutoMovieMotionHumanChainCore.ts#IAutoMovieMotionHumanChainCore

## @evidence contracts/development/common.md#meaningful-documentation

States what the class owns and how the vocabulary methods relate to `act`; each operator states its own rule. hit: A hit instead of a named instant (#3480): the `index`-th hit on the struck subject `on` (from 0), by the striking prop or anchored striker `by` when given. Its strikers are composed before the struck performer, so the hit is known when this action is placed (`HumanHitTrack`). event: Which instant of it: one of its events, or `start` or `end`. Absent, an action's decisive instant (its contact) or else its start; a cue track always needs one. index: Which occurrence of that event, from 0, where it repeats, as a track's beats do; 0 when absent.

## @evidence contracts/development/design.md#principled-representation

An immutable chain of one subject over the engine's composition, with the action name indexing its parameter type. hit: A hit instead of a named instant (#3480): the `index`-th hit on the struck subject `on` (from 0), by the striking prop or anchored striker `by` when given. Its strikers are composed before the struck performer, so the hit is known when this action is placed (`HumanHitTrack`). event: Which instant of it: one of its events, or `start` or `end`. Absent, an action's decisive instant (its contact) or else its start; a cue track always needs one. index: Which occurrence of that event, from 0, where it repeats, as a track's beats do; 0 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The subject, the typed append (`act`), the registered append (`registered`), the cut (`until`), the timing (`sync`), the overlay (`over`) and the derive hook. Runtime boundary references: chain/HumanChainCore.ts (HumanChainCore.over, build); ensemble/HumanEnsemble.ts (HumanEnsemble.chains, build); HumanChain.ts (HumanChain.mutual, cast); ensemble/HumanManoeuvre.ts (HumanManoeuvre.append).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No parameter is typed `object`: a name selects its law's parameter type. Shares the canonical IAutoMovieComposition, AutoMovieMotionHumanActionName, IAutoMovieMotionHumanActionParams, IAutoMovieMotionHumanHitTrack.IHit, IAutoMovieMotionHumanResponse.Latency identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/chain/IAutoMovieMotionHumanChainCore.ts#IAutoMovieMotionHumanChainCore.IConstructor

## @evidence contracts/development/common.md#meaningful-documentation

The callable constructor and static factories.

## @evidence contracts/development/design.md#principled-representation

Construction binds one subject id to one canonical composition and returns the corresponding chain capability; the runtime constructor stays in HumanChainCore.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the enclosing IAutoMovieMotionHumanChainCore contract's parameter and result relationships.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieComposition, IAutoMovieMotionHumanChainCore identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/chain/IAutoMovieMotionHumanChainCore.ts#IAutoMovieMotionHumanChainCore.Arguments

## @evidence contracts/development/common.md#meaningful-documentation

What follows the name in `act`: the action's parameters and an optional anchor. The parameters may be left out only when every one of them is optional.

## @evidence contracts/development/design.md#principled-representation

The action-name index selects its exact parameters; the argument tuple makes params optional only when an empty object satisfies that contract, while anchor remains independently optional.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainCore.ts (HumanChainCore.act, args).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanActionName, IAutoMovieMotionHumanActionParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/chain/IAutoMovieMotionHumanChainCore.ts#IAutoMovieMotionHumanChainCore.ISync

## @evidence contracts/development/common.md#meaningful-documentation

hit: A hit instead of a named instant (#3480): the `index`-th hit on the struck subject `on` (from 0), by the striking prop or anchored striker `by` when given. Its strikers are composed before the struck performer, so the hit is known when this action is placed (`HumanHitTrack`). event: Which instant of it: one of its events, or `start` or `end`. Absent, an action's decisive instant (its contact) or else its start; a cue track always needs one. index: Which occurrence of that event, from 0, where it repeats, as a track's beats do; 0 when absent.

## @evidence contracts/development/design.md#principled-representation

hit: A hit instead of a named instant (#3480): the `index`-th hit on the struck subject `on` (from 0), by the striking prop or anchored striker `by` when given. Its strikers are composed before the struck performer, so the hit is known when this action is placed (`HumanHitTrack`). event: Which instant of it: one of its events, or `start` or `end`. Absent, an action's decisive instant (its contact) or else its start; a cue track always needs one. index: Which occurrence of that event, from 0, where it repeats, as a track's beats do; 0 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainCore.ts (HumanChainCore.sync, sync).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHitTrack.IHit, IAutoMovieMotionHumanResponse.Latency identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
