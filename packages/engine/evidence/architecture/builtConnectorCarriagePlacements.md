# src/architecture/builtConnectorCarriagePlacements.ts#builtConnectorCarriagePlacements

## @evidence contracts/development/implementation.md#principled-implementation

Reads shared world staging and decomposes it to translation, normalized rotation and per-axis scale. This represents an unsheared finite TRS matrix within binary64 error; `validateBuiltEnvironment` checks named configurations for representability, but this query does not validate its input and decomposition cannot preserve arbitrary shear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the state check, the carriage iteration and the pairing with `serves`; staging lives in `builtEnvironmentWorldMatrices` and the connector lookup in `requireBuiltConnector`, which other queries share.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no connector, carriage or state; an unknown state and a missing carriage element are refused by name rather than answered at rest, and other members follow the shared staging rule.

## @evidence contracts/development/common.md#meaningful-documentation

States what omitting or naming a state does, how other members respond to a named state, why `serves` travels with the pose, the order, the empty answer for a static connector, the null `serves`, and every throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

One connector lookup and state scan, the shared world staging cost, and an O(V + C) selected-value index and carriage loop for V values and C carriages; each decomposition and served-space lookup is constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One staging pass is shared by every carriage of the run within the call; nothing is kept between calls because the state and the record are inputs that may differ.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The staged matrices are dropped on return; the caller owns the returned placements, one per carriage.
