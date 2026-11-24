# src/touch/touchSide.ts#touchSide

## @evidence contracts/development/common.md#meaningful-documentation

States the candidates, the held prop's rule, the measure, how feasibility ranks first, the pairing with `other`, the own-arm rule and the tie.

## @evidence contracts/development/implementation.md#principled-implementation

Target plus optimiser: the hand is the arm whose goal is reachable with the least joint strain, read by the elbow search's own measure, so no new score or constant enters; a hand cannot lie on its own arm, and a held prop's point is laid only by its holder.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The author's side, holder and original ordered hand/target goals feed their separate actual solve/strain sweeps, each admitting the borrowed entry's current raw trunk fields.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No row, region or partner is special-cased; a hand with a held goal is taken over one without before any strain is compared, and the tie keeps the law's previous default.

## @evidence contracts/development/implementation.md#efficient-algorithms

The original two hand costs, or four with other, retain both distinct solve and strain sweeps/refinements and their current chain/trunk preparation. No measured speedup is claimed for this selection path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Region, laid goal and bend owners remain shared, but a native entry can retain raw prior-plan posture fields/getters. Object identity cannot certify immutable root/heading, so every original solve and strain reads/admit its current source independently without a prepared-trunk or elbow-result snapshot.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only each actual goal and its independent temporary chain/sweep data live through this synchronous selector. They end on return or failure; the returned hand name retains no trunk context, reader, pose, rank or query history.
