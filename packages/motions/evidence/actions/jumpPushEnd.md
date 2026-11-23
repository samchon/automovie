# src/actions/jumpPushEnd.ts#jumpPushEnd

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the raw root and goals from subsequent lowering and canonical resolution, and states why carried entry terms are absent.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates jumpPush's terminal conditions: upright pelvis and heading, the push writer's pitch rule asked min(entry pitch, 0, -jumpPush.HEEL) (walkLeg.heelRise at the hip the planted leg stands from, jumpPush.standing; the asked pitch for an ankle horizontally beyond reach), the same metatarsal pivot and knee pole, and the reaching ankle at its body-frame tuck with a flat foot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the terminal hip and heel rule, construct the actual support placement, then return the same two goals used by the push writer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the actual ruled pitch, toes, support heading and plant/contact. No fake trajectory, epsilon, fixed flight angle or alternate range replaces the body rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

One ordinary heel-rule evaluation plus fixed-size frame operations per terminal read; the timed push retains its existing entry-rate calculations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both the raw push writer and flight endpoint preparation consume this same terminal producer; heelRise, hipJoints and HumanFoot keep their algorithm ownership. The optional synchronous source shares only exact hip FK dependencies with the caller's actual lowering/resolution.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records/vectors with borrowed immutable body geometry; neither its local lazy getter nor an optionally borrowed exact FK source enters the returned goals or retained plan.
