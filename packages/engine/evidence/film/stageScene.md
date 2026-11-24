# src/film/stageScene.ts#stageScene

## @evidence contracts/development/implementation.md#principled-implementation

Validates the whole write before composing; conversions use quaternion axis-angle, the level-horizon lookRotation basis and light lowering. The camera target table lays cameras down first so a repeated id resolves to the actor, matching scenePlacements.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The rung that owns scene composition delegates each field family to its staging validator and lowering helper, each camera's lens, aim and envelope checks to `validateStageCamera`, the space, fog, medium and environment gates to their shared validators, and set-piece placement to `setPieceTransform`, so the same rule is never stated twice and the function reads as the list of checks and conversions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cast member, model or camera is special-cased; geometry is not judged beyond what a later stage cannot use, and the fog omission is a stated byte-stability rule for every scene rather than a fixture exception.

## @evidence contracts/development/common.md#meaningful-documentation

States every reference and range check, every conversion with its axis and unit, how space, fog, medium and environment are validated and composed, and what the success and failure branches carry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Local joins visit cast, actor, set-piece, camera and light lists with maps/sets, plus delegated space, support, environment, fog, clearance and light-shape validation. Ordinary populated typed records are premises; throwing accessors and nonterminating conversion hooks are outside the located-finding guarantee.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares placement indexes and admitted camera directions between validation and composition during one unchanged staging write. The script and write may change between correction rounds, so nothing is kept across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The indexes, id set and collector are released on return; a success holds one node per actor and set piece, one camera and one light per placement, and the authored space, direct fog and environment objects by reference or a calibrated fog with its authored color, and a failure holds the violation list.
