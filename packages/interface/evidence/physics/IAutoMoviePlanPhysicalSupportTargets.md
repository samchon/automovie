# src/physics/IAutoMoviePlanPhysicalSupportTargets.ts#IAutoMoviePlanPhysicalSupportTargets.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Specifies changed support goals, reach-derived lowering and bounded chain-fitting policy.

## @evidence contracts/development/design.md#principled-representation

World-metre transforms and endpoint goals use canonical profile/pattern topology; maximumRootDrop and tolerance are metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planPhysicalSupportTargets coordinates reach and chain fitting for the existing support controller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The original endpoint request remains authoritative even when unreachable; iterations bound work rather than certify contact.

# src/physics/IAutoMoviePlanPhysicalSupportTargets.ts#IAutoMoviePlanPhysicalSupportTargets.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Defines fitted motor poses, bounded lowering intent and remaining endpoint error.

## @evidence contracts/development/design.md#principled-representation

targets are world rigid transforms, rootDrop is nonnegative metres and residuals are metre norms keyed by endpoint bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support planner supplies these new motor-target records to tracking while leaving native body state unchanged.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Residuals can exceed tolerance at budget exhaustion; requesting a root drop does not teleport the body or establish support.
