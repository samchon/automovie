# src/chain/HumanChainCore.ts#HumanChainCore

## @evidence contracts/development/common.md#meaningful-documentation

States what the class owns and how the vocabulary methods relate to `act`; each operator states its own rule.

## @evidence contracts/development/design.md#principled-representation

An immutable chain of one subject over the engine's composition, with the action name indexing its parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The subject, the typed append (`act`), the registered append (`registered`), the cut (`until`), the timing (`sync`), the overlay (`over`) and the derive hook.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No parameter is typed `object`: a name selects its law's parameter type.
