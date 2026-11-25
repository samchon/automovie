# src/production/IAutoMoviePlantPerformShotStanceFeet.ts#IAutoMoviePlantPerformShotStanceFeet.IProps

## @evidence contracts/development/design.md#principled-representation

Plant positions cross between world and model metres using staged unit-scale yaw-only transforms; times stay on each shot-local motion clock. The stage result is an admitted-input premise.

## @evidence contracts/development/design.md#minimal-and-owned-surface

performShot calls plantPerformShotStanceFeet before coupling and motion validation; only motions entries with resulting plants are replaced, and returned world plants feed the next beat.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing rigs/nodes or clips with no recognized feet remain untouched. This mutation is not transactional: a later callback/solver exception can leave earlier actors' motion entries replaced.

## @evidence contracts/development/common.md#meaningful-documentation

Mutable motion table and borrowed rig context for world-aware stance planting. Plant positions cross between world and model metres using staged unit-scale yaw-only transforms; times stay on each shot-local motion clock. The stage result is an admitted-input premise.
