# src/sport/baseballGroundBall.ts#baseballGroundBall

## @evidence contracts/development/common.md#meaningful-documentation

States what it builds from the plan's prepared values and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A fielder's ground ball: the crouch to the ball and both hands placed, the gloved left on the floor ahead of the shoulders open forward and up with the fingers down, the right over it; returned for the plan to push in the order it pushed them before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `baseball.plan`: its `groundBall`, built from what that plan prepared, apart from the plan's other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `baseball.plan`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called once per plan where `baseball.plan` built it before; its cost is the moved code's, and any reader it returns evaluates as it did.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the plan's prepared values instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what the returned value holds, for as long as the plan holds it.

# src/sport/baseballGroundBall.ts#baseballGroundBall.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the plan value it carries.

## @evidence contracts/development/design.md#principled-representation

The values `baseball.plan` prepared before its `groundBall`, each typed as that plan declares it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `baseballGroundBall.of` only; every type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Each member is one prepared value; no optional combination arises.

# src/sport/baseballGroundBall.ts#baseballGroundBall.IFK

## @evidence contracts/development/common.md#meaningful-documentation

Names a shape `baseball.plan` and its parts share.

## @evidence contracts/development/design.md#principled-representation

The alias `IFK` names the plan's own shape; its units and frames are those of the members it is built from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `baseball.plan` and the parts cut from it.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

An alias of existing types; it adds no shape of its own.
