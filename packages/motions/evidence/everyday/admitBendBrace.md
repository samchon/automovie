# src/everyday/admitBendBrace.ts#admitBendBrace

## @evidence contracts/development/common.md#meaningful-documentation

States the bracing condition, its bounds, the returned held posture and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Measures the displayed palm frame against the femur's axis from knee to hip: its normal must face the thigh and its station must lie a half hand inside each end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture read, one palm frame and one axis projection; planBendStrategy keeps the rest of the lowering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from planBendStrategy: no bound or branch changed; the half hand and the tangle allowance are the existing named quantities.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture and one world-bone resolution at the deepest second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned posture is the one the hold reuses, so the deepest second is solved once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the bones are call-local.
