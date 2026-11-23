# src/cinematics/AutoMovieInteractionEventKind.ts#AutoMovieInteractionEventKind

## @evidence contracts/development/design.md#principled-representation

Models the categories as a closed string union whose members are exactly the values the engine producers write, and `performShot` orders events by time, then by a fixed per-kind rank, then by id, so ties have one deterministic order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A bare literal union names what happened while the separate `AutoMovieInteractionEventSource` names who produced it, so a contact from the solver and one from sampled geometry share a kind and differ by source.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Paired handoff kinds are emitted as separate events at the same instant rather than merged, so a consumer never infers `attach` from `grab`; no producer writes a kind outside this union.

## @evidence contracts/development/common.md#meaningful-documentation

States what the events are for and, for every kind, which producer emits it and when.
