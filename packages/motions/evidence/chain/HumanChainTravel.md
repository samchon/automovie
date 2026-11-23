# src/chain/HumanChainTravel.ts#HumanChainTravel

## @evidence contracts/development/common.md#meaningful-documentation

States the family and documents each method.

## @evidence contracts/development/design.md#principled-representation

One method per action of the family, each `act` under the action's name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The travel actions only; the other families extend it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every method takes its law's own parameter type.
