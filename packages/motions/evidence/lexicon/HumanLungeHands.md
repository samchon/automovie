# src/lexicon/HumanLungeHands.ts#HumanLungeHands.plants

## @evidence contracts/development/common.md#meaningful-documentation

States the windows.

## @evidence contracts/development/implementation.md#principled-implementation

Each step's leading foot swings over its first swing and the other over its second; the windows are the complements.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh windows.

# src/lexicon/HumanLungeHands.ts#HumanLungeHands.whip

## @evidence contracts/development/common.md#meaningful-documentation

States where the hand goes and where the shaft points.

## @evidence contracts/development/implementation.md#principled-implementation

The hips' heading gives forward and out; the hand stands `WHIP` shares of the hip height out from the root, the shaft turned from forward toward the side and pitched down, the palm facing the body's middle across the shaft.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point, one axis, one normal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanLungeHands.ts#HumanLungeHands.verify

## @evidence contracts/development/common.md#meaningful-documentation

States the measure and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve the displayed posture, carry the body's measured palm (`HumanHand.offset`) by the wrist's world frame, and measure to the line's surface, as the lead overlay measures its hand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve, one measure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A miss refuses; nothing is snapped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One selected-bone resolve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the posture resolver and bone reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
