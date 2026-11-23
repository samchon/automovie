# src/lexicon/crutchHeldLeg.ts#crutchHeldLeg

## @evidence contracts/development/common.md#meaningful-documentation

States the clearing rise, the fold, the ankle's share and the goal-less case.

## @evidence contracts/development/implementation.md#principled-implementation

A foot breaks contact vertically before it travels, then a minimum-jerk joint blend (Flash and Hogan 1985) from the angles reached; the ankle's compensation is the shank's sagittal tilt, the knee's flexion less the hip's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two phases, each a closed form of the second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fold starts from the resolved angles of the rise's end, so the two phases join.

## @evidence contracts/development/implementation.md#efficient-algorithms

The standing posture and the fold's start are read once per plan; every other read is constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The crutch walk's and the crutch stair climb's injured legs share this writer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the standing posture and the fold's start angles for the plan's life.
