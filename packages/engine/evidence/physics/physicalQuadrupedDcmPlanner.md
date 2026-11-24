# src/physics/physicalQuadrupedDcmPlanner.ts#physicalQuadrupedDcmPlanner

## @evidence contracts/development/common.md#meaningful-documentation

States the standing setpoint, the stepping plan, the transition's test, recomputation and handover, the step limit, the degenerate plans callers must not request, and the known non-ports around the planner.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `DCMPlanner.computeDcmSetpoints` (l.248-291). Standing takes the support frame's origin with the height (l.251-257, frame per QuadrupedBalanceManager l.106-111). Stepping runs `computeDcmTrajectory` (l.179-196) through the contact sequence, the piecewise-constant centre of pressure and the reverse DCM trajectory, then follows the transition while the time is at or before its last end, recomputing it first (l.264-271), and the plan otherwise. The transition's cubic is `YoPolynomial.setCubic`'s unique cubic through both ends' positions and rates (l.388-397), written in closed Hermite form and evaluated unclamped as `compute` does (l.622-641). The reference's final DCM and perfect pivot outputs feed only its swing speed-up, which is not ported, so they are not produced.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The standing branch, then replan, transition test and sample; replanning, transition recomputation and the cubic are helpers shared with `stepping`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The closed-form cubic replaces the reference's linear solve of the same constraints; both give the one cubic meeting them. A single-interval plan's transition is not a number where the reference reads a stale buffer entry, and a zero-length transition is not a number where its solve is singular; both are stated at the helpers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the considered steps, at most 8, and in the phases, at most five retained plus one per group of their 16 transitions.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the state, whose sequence is bounded by the contact sequence's capacity.

# src/physics/physicalQuadrupedDcmPlanner.ts#physicalQuadrupedDcmPlanner

## @evidence contracts/development/common.md#meaningful-documentation

Documents the state, transition, result, constants and entries.

## @evidence contracts/development/design.md#principled-representation

The reference's standing flag, contact sequence and transition with its start state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the integrator's quadruped phase reads the setpoint and its rate for the DCM controller and the step adjustment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedDcmPlanner.ts#physicalQuadrupedDcmPlanner.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents the standing flag, the sequence and the transition.

## @evidence contracts/development/design.md#principled-representation

`isStanding`, `timedContactSequence` and the transition trajectory with its start; a missing transition is null, as before the first stepping entry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `standing` and `stepping`, advanced by the update.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedDcmPlanner.ts#physicalQuadrupedDcmPlanner.ITransition

## @evidence contracts/development/common.md#meaningful-documentation

Documents the interval and both ends' DCM and rate with units.

## @evidence contracts/development/design.md#principled-representation

`timeAtStartOfState`, `dcmPositionAtStartOfState`, `dcmVelocityAtStartOfState` and the cubic's end constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept in the state and read by the cubic.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedDcmPlanner.ts#physicalQuadrupedDcmPlanner.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the state, setpoint and rate.

## @evidence contracts/development/design.md#principled-representation

`computeDcmSetpoints`' outputs with the state after the update.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the integrator's quadruped phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalQuadrupedDcmPlanner.ts#physicalQuadrupedDcmPlanner.standing

## @evidence contracts/development/common.md#meaningful-documentation

States what is cleared and kept.

## @evidence contracts/development/implementation.md#principled-implementation

`initializeForStanding` (l.151-157): the sequence cleared; the reference resets the trajectories' buffers and leaves the transition, which only stepping reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalQuadrupedDcmPlanner.ts#physicalQuadrupedDcmPlanner.stepping

## @evidence contracts/development/common.md#meaningful-documentation

States the validity test, the transition's start and end, and the no-step error.

## @evidence contracts/development/implementation.md#principled-implementation

`initializeForStepping` (l.159-177): valid while the last considered step has yet to land (l.165), then `computeDcmTrajectory` and `computeTransitionTrajectory` from the given setpoint, which the balance manager passes as its last desired DCM (QuadrupedBalanceManager l.289).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Test, replan, start the transition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The no-step error stands for the reference's failing index (l.165); an invalid plan only clears the standing flag, as the reference does.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the considered steps and the phases.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
