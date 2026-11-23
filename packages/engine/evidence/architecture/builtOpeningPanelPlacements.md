# src/architecture/builtOpeningPanelPlacements.ts#builtOpeningPanelPlacements

## @evidence contracts/development/implementation.md#principled-implementation

Reads the shared world matrix and decomposes it with a normalized rotation. Finite, unsheared TRS representability is a premise beyond an acyclic parent tree: `validateBuiltEnvironment` checks named configurations, but this query does not validate input and decomposition does not preserve arbitrary shear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The query owns only the state check and the per-panel answer; staging under a state lives in `builtEnvironmentWorldMatrices` and the opening lookup in `requireBuiltOpening`, replacing a private copy of each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no opening, state or element; an unknown state and a missing panel element are refused by name rather than answered at rest.

## @evidence contracts/development/common.md#meaningful-documentation

States what an omitted state means, that a named state applies building-wide, the entry order and content, the empty answer for an inoperable opening, and each thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One opening lookup and requested-state scan, the shared world staging cost O(E + O + S + M + V) for elements, opening/connector records, scanned states, moving members and selected values, then one constant-size decomposition per panel.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one opening and state per call from the caller's mutable record, so no staging is cached across calls; within a call the one staging serves every panel.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the staged matrix map only for the call and returns new placement records; nothing is retained.
